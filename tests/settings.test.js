const test = require('node:test');
const assert = require('node:assert/strict');
const settings = require('../settings.js');
test('custom provider settings survive normalization and preserve base paths', () => {
  const value = settings.normalize({ aiBaseUrl: ' https://example.test/v1/ ', aiModel: ' custom-model ', aiApiKey: ' key ', supadataApiKey: ' caption-key ', jsonMode: false });
  assert.equal(value.provider, 'custom'); assert.equal(value.aiModel, 'custom-model'); assert.equal(value.aiApiKey, 'key'); assert.equal(value.jsonMode, false);
  assert.equal(settings.chatCompletionsUrl(value.aiBaseUrl), 'https://example.test/v1/chat/completions');
  assert.equal(settings.permissionOrigin(value.aiBaseUrl), 'https://example.test/*');
});
test('credentials and ambiguous URL components cannot be embedded in an endpoint', () => {
  for (const url of ['http://example.test', 'https://user:pass@example.test', 'https://example.test?key=secret', 'https://example.test/#key', 'https://example.test/v1/chat/completions', 'https://example.test:8443']) assert.throws(() => settings.normalizeBaseUrl(url));
});
test('DeepSeek detection is based on hostname rather than a saved provider label', () => {
  assert.equal(settings.normalize().provider, 'deepseek');
  assert.equal(settings.normalize({ provider: 'deepseek', aiBaseUrl: 'https://api.deepseek.com.evil.test' }).provider, 'custom');
  assert.equal(settings.normalize({ provider: 'custom', aiBaseUrl: 'https://api.deepseek.com' }).provider, 'deepseek');
});
test('canonical video URLs reject markup', () => {
  assert.equal(settings.canonicalYouTubeUrl('ydTeb_I0b94'), 'https://www.youtube.com/watch?v=ydTeb_I0b94');
  assert.throws(() => settings.canonicalYouTubeUrl('\"><script>'));
});
