const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const files = {
  index: fs.readFileSync('index.html', 'utf8'),
  report: fs.readFileSync('report.html', 'utf8'),
  readme: fs.readFileSync('README.md', 'utf8'),
};

function inlineScript(html) {
  return html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i)?.[1] || '';
}

function loadReportContext() {
  const script = inlineScript(files.report).replace(/\bmain\(\);\s*$/, '');
  const configScript = fs.readFileSync('dsi-config.js', 'utf8');
  const context = {
    atob: value => Buffer.from(value, 'base64').toString('utf8'),
    console,
    setTimeout,
    clearTimeout,
    AbortController: global.AbortController,
    fetch: global.fetch,
    document: {
      getElementById: () => ({ addEventListener() {}, style: {}, textContent: '' }),
      body: {}
    },
    window: {
      print() {}
    }
  };
  vm.runInNewContext(configScript, context);
  vm.runInNewContext(`${script}
this.markdownToHtml = markdownToHtml;
this.validateScores = typeof validateScores === 'function' ? validateScores : undefined;
this.getOverallHealthScore = typeof getOverallHealthScore === 'function' ? getOverallHealthScore : undefined;
this.getOverallLevel = typeof getOverallLevel === 'function' ? getOverallLevel : undefined;
`, context);
  return context;
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.message);
    process.exitCode = 1;
  }
}

test('pages do not use inline onclick handlers', () => {
  assert(!/\sonclick=/.test(files.index), 'index.html still has inline onclick handlers');
  assert(!/\sonclick=/.test(files.report), 'report.html still has inline onclick handlers');
});

test('quiz section toggle is bound only to the section header area', () => {
  assert(files.index.includes('class="section-header"'), 'index.html must wrap each clickable section header');
  assert(!files.index.includes("querySelectorAll('.section-card')"), 'section cards must not be click toggle targets');
  assert(files.index.includes("querySelectorAll('.section-header')"), 'section headers must be click toggle targets');
});

test('README discloses AI data collection and consent by use', () => {
  assert(files.readme.includes('使用即视为同意'), 'README must state use implies consent');
  assert(files.readme.includes('Moonshot') && files.readme.includes('测试得分'), 'README must disclose scores are sent to Moonshot/Kimi');
});

test('Chart.js is protected with SRI and cross-origin metadata', () => {
  const chartTag = files.report.match(/<script[^>]+chart\.umd\.min\.js[^>]*>/i)?.[0] || '';
  assert(chartTag.includes('integrity='), 'Chart.js tag must include integrity');
  assert(chartTag.includes('crossorigin='), 'Chart.js tag must include crossorigin');
});

test('report declares a Content Security Policy', () => {
  assert(/Content-Security-Policy/i.test(files.report), 'report.html must include a CSP meta tag');
});

test('markdownToHtml escapes raw HTML before rendering markdown', () => {
  const context = loadReportContext();
  const html = context.markdownToHtml('<img src=x onerror=alert(1)>\n**bold**');
  assert(!html.includes('<img'), 'raw HTML tag should not survive markdown conversion');
  assert(html.includes('&lt;img'), 'raw HTML should be escaped');
  assert(html.includes('<strong>bold</strong>'), 'basic bold markdown should still render');
});

test('score validation rejects malformed localStorage data', () => {
  const context = loadReportContext();
  assert.equal(typeof context.validateScores, 'function', 'validateScores must exist');
  const valid = context.validateScores([
    { title: '测验1 · 情绪反应', score: 10, count: 10 },
    { title: '测验2 · 情感切断', score: 12, count: 12 },
    { title: '测验3 · 核心自我', score: 60, count: 10 },
    { title: '测验4 · 人际融合', score: 9, count: 9 },
  ]);
  assert(Array.isArray(valid), 'valid scores should be accepted');
  assert.equal(context.validateScores([{ score: '<img>', count: 10 }]), null, 'wrong shape should be rejected');
  assert.equal(context.validateScores([
    { score: 61, count: 10 },
    { score: 12, count: 12 },
    { score: 60, count: 10 },
    { score: 9, count: 9 },
  ]), null, 'out-of-range scores should be rejected');
});

test('overall level uses normalized health score instead of raw total score', () => {
  const context = loadReportContext();
  assert.equal(typeof context.getOverallHealthScore, 'function', 'getOverallHealthScore must exist');
  assert.equal(typeof context.getOverallLevel, 'function', 'getOverallLevel must exist');
  assert.equal(context.getOverallHealthScore([{ score: 10 }, { score: 12 }, { score: 60 }, { score: 9 }]), 100);
  assert.equal(context.getOverallLevel(100), '自我分化水平较好');
  assert.equal(context.getOverallHealthScore([{ score: 60 }, { score: 72 }, { score: 10 }, { score: 54 }]), 0);
  assert.equal(context.getOverallLevel(0), '自我分化水平待提升');
});

test('radar chart note accurately describes normalization', () => {
  assert(files.report.includes('ER / EC / FO 已反向处理，IP 保持正向'), 'radar note should describe ER/EC/FO reversal and IP positive direction');
});
