const assert = require('assert');
const fs = require('fs');

const files = {
  index: fs.readFileSync('index.html', 'utf8'),
  report: fs.readFileSync('report.html', 'utf8'),
  readme: fs.readFileSync('README.md', 'utf8'),
  netlifyFunction: fs.readFileSync('netlify/functions/kimi.js', 'utf8'),
};

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

test('quiz page does not use inline onclick handlers', () => {
  assert(!/\sonclick=/.test(files.index), 'index.html still has inline onclick handlers');
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

test('report uses Netlify Function instead of direct Moonshot browser calls', () => {
  assert(files.report.includes("const DEEP_ANALYSIS_ENDPOINT = '/.netlify/functions/kimi'"), 'report.html must call the Netlify proxy endpoint');
  assert(!files.report.includes('API_KEY_ENC'), 'report.html must not include an encoded API key');
  assert(!files.report.includes('Authorization'), 'report.html must not send Moonshot credentials from the browser');
  assert(files.report.includes("connect-src 'self'"), 'CSP should only allow same-origin function calls');
  assert(files.report.includes('controller.abort(), 55000'), 'report.html must keep the Netlify-safe AI timeout');
  assert(files.report.includes("model: 'moonshot-v1-8k'"), 'report.html must use the faster Netlify-safe Moonshot model');
  assert(files.report.includes('max_tokens: 2048'), 'report.html must keep response size bounded for Netlify');
});

test('Netlify Function proxies Moonshot with server-side API key', () => {
  assert(files.netlifyFunction.includes('process.env.MOONSHOT_API_KEY'), 'function must read MOONSHOT_API_KEY');
  assert(files.netlifyFunction.includes('https://api.moonshot.cn/v1/chat/completions'), 'function must call Moonshot API');
  assert(files.netlifyFunction.includes('Authorization: `Bearer ${apiKey}`'), 'function must send server-side authorization header');
  assert(files.netlifyFunction.includes("event.httpMethod === 'OPTIONS'"), 'function must handle CORS preflight');
});
