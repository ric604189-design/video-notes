const test = require('node:test');
const assert = require('node:assert/strict');
const options = require('../options.js');
const settings = require('../settings.js');
const tick = () => new Promise(resolve => setImmediate(resolve));
function ui(grant) {
  const nodes = new Map(); const stored = { ytd_settings: settings.normalize({ aiApiKey: 'test-key' }) }; const requested = [];
  const node = id => { if (!nodes.has(id)) nodes.set(id, { value: '', checked: false, textContent: '', listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; } }); return nodes.get(id); };
  const root = { YTD_SETTINGS: settings, document: { documentElement: {}, getElementById: node, querySelectorAll: () => [] }, chrome: { permissions: { request: async value => { requested.push(value); return grant; } }, storage: { local: { get: async keys => keys === null ? stored : stored, set: async values => Object.assign(stored, values), remove: async keys => keys.forEach(k => delete stored[k]), clear: async () => {} } } } };
  options.initialize(root); return { node, stored, requested };
}
test('both settings languages contain all UI copy', () => {
  assert.deepEqual(Object.keys(options.COPY.en).sort(), Object.keys(options.COPY['zh-CN']).sort());
  assert.equal(options.normalizeLanguage('unknown'), 'zh-CN');
});
test('denying host access never persists new credentials', async () => {
  const page = ui(false); await tick();
  page.node('aiApiKey').value = 'replacement-key';
  await page.node('settingsForm').listeners.submit({ preventDefault() {} });
  assert.equal(page.stored.ytd_settings.aiApiKey, 'test-key');
});
test('saving grants only the selected origin, and changing origin clears the old key', async () => {
  const page = ui(true); await tick();
  page.node('aiBaseUrl').value = 'https://example.test/v1';
  page.node('aiBaseUrl').listeners.change();
  assert.equal(page.node('aiApiKey').value, '');
  page.node('aiApiKey').value = 'new-service-key';
  page.node('aiModel').value = 'my-model';
  await page.node('settingsForm').listeners.submit({ preventDefault() {} });
  assert.deepEqual(page.requested, [{ origins: ['https://example.test/*'] }]);
  assert.equal(page.stored.ytd_settings.aiBaseUrl, 'https://example.test/v1');
  assert.equal(page.stored.ytd_settings.aiApiKey, 'new-service-key');
});
