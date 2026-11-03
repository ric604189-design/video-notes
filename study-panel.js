/* Study UI shares the existing panel's current video and transcript state. */
let studyContext = null;
let studyBusy = false;
let studyCancelled = false;
let studySaveTimer;
let studyWrite = Promise.resolve();
const studyElement = id => document.getElementById(id);
const studyKey = (id, preset) => `vn_study_${id}_${preset}`;

function setupStudyNotes() {
  studyElement('studyTemplate').addEventListener('change', () => void refreshStudyNotes());
  studyElement('generateStudyBtn').addEventListener('click', () => void generateStudyNotes().catch(() => { studyBusy = false; setStudyControls(); studyElement('studyStatus').textContent = '无法读取设置，请检查扩展存储后重试。'; }));
  studyElement('cancelStudyBtn').addEventListener('click', () => {
    studyCancelled = true;
    studyElement('studyStatus').textContent = '正在停止，当前请求完成后不会发送下一段。';
  });
  studyElement('studyEditor').addEventListener('input', scheduleStudySave);
  studyElement('highlightStudyBtn').addEventListener('click', () => {
    const editor = studyElement('studyEditor');
    const start = editor.selectionStart, end = editor.selectionEnd;
    if (start === end) { studyElement('studyStatus').textContent = '请先选中要标记的文字。'; return; }
    editor.setRangeText(`==${editor.value.slice(start, end)}==`, start, end, 'select');
    scheduleStudySave(); editor.focus();
  });
  studyElement('copyStudyBtn').addEventListener('click', async () => {
    const ok = await copyToClipboard(studyElement('studyEditor').value);
    studyElement('studyStatus').textContent = ok ? '笔记已复制。' : '复制失败，请直接选择并复制笔记文本。';
  });
  studyElement('exportStudyBtn').addEventListener('click', () => {
    if (!studyContext) return;
    downloadTextFile(studyElement('studyEditor').value, `${VN_STUDY.filename(studyContext.title)}-${studyContext.template}.md`);
  });
}
function scheduleStudySave() {
  clearTimeout(studySaveTimer);
  const context = studyContext;
  const markdown = studyElement('studyEditor').value;
  if (!context) return;
  const write = () => {
    studyWrite = studyWrite.catch(() => {}).then(() => chrome.storage.local.set({ [context.key]: { ...context, markdown } }));
    void studyWrite.then(() => { if (studyContext?.key === context.key) studyElement('studyStatus').textContent = '笔记已自动保存。'; }).catch(() => { studyElement('studyStatus').textContent = '本地存储不足，请导出笔记后清除缓存。'; });
  };
  // Save immediately to survive panel close and template/video navigation.
  write();
}
function setStudyControls() {
  const hasText = !!studyElement('studyEditor').value;
  for (const id of ['highlightStudyBtn', 'copyStudyBtn', 'exportStudyBtn']) studyElement(id).disabled = !hasText || studyBusy;
  studyElement('generateStudyBtn').disabled = studyBusy;
  studyElement('cancelStudyBtn').disabled = !studyBusy;
  studyElement('studyTemplate').disabled = studyBusy;
  studyElement('studyEditor').disabled = !hasText || studyBusy;
}
async function refreshStudyNotes() {
  if (!studyElement('studyEditor')) return;
  const id = currentVideoId;
  const preset = studyElement('studyTemplate').value;
  const key = studyKey(id, preset);
  if (studyBusy) {
    if (studyContext?.videoId !== id) studyCancelled = true;
    return;
  }
  if (studyContext?.key === key) return;
  await studyWrite.catch(() => {});
  const saved = await chrome.storage.local.get(key);
  if (id !== currentVideoId || preset !== studyElement('studyTemplate').value) return;
  studyContext = saved[key] || { key, videoId: id, template: preset };
  studyElement('studyEditor').value = saved[key]?.markdown || '';
  studyElement('studyStatus').textContent = saved[key]?.markdown ? '已恢复本视频的笔记，可继续编辑或导出。' : '点击生成，将字幕发送给你配置的 AI 服务。';
  setStudyControls();
}
async function generateStudyNotes() {
  if (studyBusy) return;
  if (!currentVideoId || !currentTranscriptTimestamped) { studyElement('studyStatus').textContent = '请先获取视频字幕。'; return; }
  if (studyElement('studyEditor').value && !confirm('重新生成会覆盖当前模板的笔记和编辑。是否继续？')) return;
  const id = currentVideoId, preset = studyElement('studyTemplate').value;
  let parts;
  try { parts = VN_STUDY.chunks(currentTranscriptTimestamped); } catch (error) { studyElement('studyStatus').textContent = error.message; return; }
  const stored = await chrome.storage.local.get(YTD_SETTINGS.STORAGE_KEY);
  const settings = YTD_SETTINGS.normalize(stored[YTD_SETTINGS.STORAGE_KEY]);
  if (!settings.aiApiKey) { studyElement('studyStatus').textContent = '请先在 Settings 中保存 AI API 密钥。'; return; }
  const context = { key: studyKey(id, preset), videoId: id, template: preset, title: currentVideoTitle, channel: currentChannelName, model: settings.aiModel, created: new Date().toISOString() };
  studyContext = context;
  studyBusy = true; studyCancelled = false; setStudyControls();
  const results = [];
  const partialKey = `vn_partial_${id}_${preset}`;
  try {
    // Do not persist credentials; compare source and non-secret provider settings only.
    const signature = JSON.stringify({ source: currentTranscriptTimestamped, preset, base: settings.aiBaseUrl, model: settings.aiModel, json: settings.jsonMode, tokens: settings.tokenParameter, temperature: settings.sendTemperature });
    const previous = (await chrome.storage.local.get(partialKey))[partialKey];
    if (previous?.signature === signature && Array.isArray(previous.results) && previous.results.length <= parts.length) results.push(...previous.results.map((r, i) => VN_STUDY.normalize(r, parts[i])));
    for (let index = results.length; index < parts.length; index++) {
      if (studyCancelled || id !== currentVideoId) throw new Error('已停止，成功分段已保存。再次生成可从中断处继续。');
      studyElement('studyStatus').textContent = `正在整理 ${index + 1} / ${parts.length} 段；长视频按顺序处理。`;
      const now = (await chrome.storage.local.get(YTD_SETTINGS.STORAGE_KEY))[YTD_SETTINGS.STORAGE_KEY];
      if (JSON.stringify(YTD_SETTINGS.normalize(now)) !== JSON.stringify(settings)) throw new Error('AI 设置已变更，请重新生成以免混用模型。');
      const reply = await sendTranslationMessage({ action: 'generateStudyNotes', template: preset, videoTitle: context.title, transcriptText: parts[index] });
      if (!reply?.success) throw new Error(reply?.error || 'AI 请求失败，请检查服务设置。');
      results.push(VN_STUDY.normalize(reply.notes, parts[index]));
      await chrome.storage.local.set({ [partialKey]: { signature, results } });
    }
    if (studyCancelled || id !== currentVideoId) throw new Error('已停止，成功分段已保存，可稍后继续。');
    const markdown = VN_STUDY.markdown(results, context);
    await studyWrite.catch(() => {});
    await chrome.storage.local.set({ [context.key]: { ...context, markdown } });
    await chrome.storage.local.remove(partialKey);
    studyElement('studyEditor').value = markdown;
    studyElement('studyStatus').textContent = `已完成 ${parts.length} 段并保存。可编辑、标记重点或导出。`;
  } catch (error) {
    studyElement('studyStatus').textContent = error.message || '生成失败，请重试。';
  } finally {
    studyBusy = false; setStudyControls();
    if (id !== currentVideoId) { studyContext = null; void refreshStudyNotes(); }
  }
}
