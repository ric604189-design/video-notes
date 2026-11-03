const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const study = require('../study.js');
const settings = require('../settings.js');
function environment(send) {
  const nodes = new Map();
  const element = id => {
    if (!nodes.has(id)) nodes.set(id, { value: '', disabled: false, textContent: '', addEventListener() {} });
    return nodes.get(id);
  };
  element('studyTemplate').value = 'course';
  const db = { ytd_settings: settings.normalize({ aiApiKey: 'test-key' }) };
  const sandbox = {
    currentVideoId: 'ydTeb_I0b94', currentVideoTitle: '课程笔记', currentChannelName: '频道',
    currentTranscriptTimestamped: Array.from({ length: 180 }, (_, i) => `[${i}:00] ${'source '.repeat(30)}`).join('\n'),
    VN_STUDY: study, YTD_SETTINGS: settings, Date, JSON, setTimeout, clearTimeout, confirm: () => true,
    document: { getElementById: element },
    chrome: { storage: { local: {
      get: async key => ({ [key]: db[key] }),
      set: async value => Object.assign(db, structuredClone(value)),
      remove: async key => { delete db[key]; },
    } } },
    sendTranslationMessage: async message => send(message, sandbox),
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../study-panel.js'), 'utf8') + '\nglobalThis.hooks = { generateStudyNotes, refreshStudyNotes };', sandbox);
  return { sandbox, db, element };
}
function result(message) {
  const m = message.transcriptText.match(/\[(\d+):(\d{2})\]/);
  return { success: true, notes: { summary: '概览', sections: [{ title: '课程', points: [{ text: '关键解释', seconds: Number(m[1]) * 60 + Number(m[2]) }] }] } };
}
test('study pipeline generates and stores a complete editable document without credentials', async () => {
  let calls = 0;
  const env = environment(message => { calls++; return result(message); });
  await env.sandbox.hooks.generateStudyNotes();
  assert.equal(calls, study.chunks(env.sandbox.currentTranscriptTimestamped).length);
  const note = env.db.vn_study_ydTeb_I0b94_course;
  assert.ok(note.markdown.includes('# 课程笔记'));
  assert.ok(note.markdown.includes('第 2 部分'));
  assert.ok(!JSON.stringify(note).includes('test-key'));
  assert.equal(env.element('studyEditor').value, note.markdown);
  assert.equal(env.element('exportStudyBtn').disabled, false);
});
test('retry resumes after completed chunks and only commits a finished document', async () => {
  let calls = 0, fail = true;
  const env = environment(message => {
    calls++;
    if (fail && calls === 2) return { success: false, error: 'retry' };
    return result(message);
  });
  await env.sandbox.hooks.generateStudyNotes();
  assert.equal(env.db.vn_study_ydTeb_I0b94_course, undefined);
  assert.equal(env.db.vn_partial_ydTeb_I0b94_course.results.length, 1);
  fail = false;
  await env.sandbox.hooks.generateStudyNotes();
  assert.equal(calls, study.chunks(env.sandbox.currentTranscriptTimestamped).length + 1);
  assert.ok(env.db.vn_study_ydTeb_I0b94_course.markdown);
  assert.equal(env.db.vn_partial_ydTeb_I0b94_course, undefined);
});
test('navigating to another video never saves the old response as the new video notes', async () => {
  const env = environment((message, sandbox) => {
    sandbox.currentVideoId = 'different01';
    return result(message);
  });
  await env.sandbox.hooks.generateStudyNotes();
  assert.equal(env.db.vn_study_different01_course, undefined);
  assert.equal(env.db.vn_study_ydTeb_I0b94_course, undefined);
  assert.ok(env.db.vn_partial_ydTeb_I0b94_course);
});
test('double clicking generate never starts a second pipeline', async () => {
  let calls = 0;
  const env = environment(message => { calls++; return result(message); });
  await Promise.all([env.sandbox.hooks.generateStudyNotes(), env.sandbox.hooks.generateStudyNotes()]);
  assert.equal(calls, study.chunks(env.sandbox.currentTranscriptTimestamped).length);
});
