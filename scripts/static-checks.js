const assert = require('assert');
const fs = require('fs');

const files = {
  index: fs.readFileSync('index.html', 'utf8'),
  report: fs.readFileSync('report.html', 'utf8'),
  readme: fs.readFileSync('README.md', 'utf8'),
  netlifyFunction: fs.readFileSync('netlify/functions/deepseek.js', 'utf8'),
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
  assert(files.readme.includes('DeepSeek') && files.readme.includes('测试得分'), 'README must disclose scores are sent to DeepSeek');
});

test('report uses Netlify Function instead of direct DeepSeek browser calls', () => {
  assert(files.report.includes("const DEEP_ANALYSIS_ENDPOINT = '/.netlify/functions/deepseek'"), 'report.html must call the Netlify proxy endpoint');
  assert(!files.report.includes('API_KEY_ENC'), 'report.html must not include an encoded API key');
  assert(!files.report.includes('Authorization'), 'report.html must not send AI credentials from the browser');
  assert(files.report.includes("connect-src 'self'"), 'CSP should only allow same-origin function calls');
  assert(files.report.includes('controller.abort(), 55000'), 'report.html must keep the Netlify-safe AI timeout');
  assert(files.report.includes("model: 'deepseek-v4-flash'"), 'report.html must use the requested DeepSeek model');
  assert(files.report.includes('max_tokens: 2048'), 'report.html must keep response size bounded for Netlify');
});

test('Netlify Function proxies DeepSeek with server-side API key', () => {
  assert(files.netlifyFunction.includes('process.env.DEEPSEEK_API_KEY'), 'function must read DEEPSEEK_API_KEY');
  assert(files.netlifyFunction.includes('https://api.deepseek.com/chat/completions'), 'function must call DeepSeek API');
  assert(files.netlifyFunction.includes('Authorization: `Bearer ${apiKey}`'), 'function must send server-side authorization header');
  assert(files.netlifyFunction.includes("event.httpMethod === 'OPTIONS'"), 'function must handle CORS preflight');
});
