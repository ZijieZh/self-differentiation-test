const assert = require('assert');
const fs = require('fs');

const files = {
  index: fs.readFileSync('index.html', 'utf8'),
  report: fs.readFileSync('report.html', 'utf8'),
  readme: fs.readFileSync('README.md', 'utf8'),
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

test('report AI integration matches the pre-first-push implementation', () => {
  assert(!/Content-Security-Policy/i.test(files.report), 'report.html should not include the added CSP while restoring AI behavior');
  assert(!files.report.includes('dsi-config.js'), 'report.html should not depend on dsi-config.js after rollback');
  assert(files.report.includes('controller.abort(), 20000'), 'report.html should use the original 20 second API timeout');
  assert(files.report.includes("model: 'kimi-k2.6'"), 'report.html should keep the original Kimi model');
  assert(files.report.includes('stream: false'), 'report.html should keep the original non-streaming request');
});
