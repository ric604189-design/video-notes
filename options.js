var VN_OPTIONS = (() => {
  const COPY = {
    'zh-CN': {
      heading: '连接你的学习工具', lede: '字幕由 Supadata 获取，AI 功能由你选择的服务提供。密钥仅保存在当前 Chrome 个人资料。',
      transcriptProvider: '字幕服务', supadataLink: '获取 Supadata 密钥', aiProvider: 'AI 服务', baseLabel: 'API 基础地址',
      baseHelp: '使用支持 /chat/completions 的 HTTPS 接口。保留服务所需的 /v1 等路径，不要填写完整接口路径。', modelLabel: '模型 ID',
      keyHelp: '修改服务域名后请重新填写该服务的密钥。留空也可只使用字幕功能。', compatibility: '接口兼容选项',
      compatibilityHelp: '如果服务拒绝 JSON 模式、temperature 或 token 参数，请按服务文档调整。并非所有模型都支持 Chat Completions。',
      jsonLabel: '请求 JSON 输出（response_format）', temperatureLabel: '发送 temperature 参数', tokenLabel: '输出长度参数',
      privacy: '点击保存时，Chrome 会请求你填写域名的访问权限。调用 AI 时字幕及视频标题会发送给该服务，请确认地址属于你信任的服务。',
      save: '保存并授权服务域名', localData: '本地数据', dataHelp: '学习笔记会自动保存。清除缓存不会删除已完成的笔记；重置前请先导出需要保留的内容。',
      clearCache: '清除缓存', reset: '重置所有数据', saved: '已保存。重新打开侧栏以使用新设置。', denied: '未获得服务域名权限，设置未保存。',
      originChanged: '服务域名已改变，请填写该服务的密钥。', failed: '保存失败，请检查地址和模型设置。',
      preview: '当前为界面预览。请在 Chrome 中加载扩展后保存设置。', cleared: '已清除缓存，已完成的学习笔记仍保留。',
      confirmReset: '删除密钥、缓存、学习笔记和已保存片段？请先导出需要保留的笔记。', resetDone: '所有本地数据已重置。',
    },
    en: {
      heading: 'Connect your learning tools', lede: 'Supadata retrieves captions. Your chosen AI service handles AI features. Keys stay in this Chrome profile.',
      transcriptProvider: 'Transcript provider', supadataLink: 'Get a Supadata key', aiProvider: 'AI provider', baseLabel: 'API base URL',
      baseHelp: 'Use an HTTPS Chat Completions API. Include its /v1 path if needed; omit /chat/completions.', modelLabel: 'Model ID',
      keyHelp: 'Enter a new key when changing service domains. Leave blank for transcript-only use.', compatibility: 'API compatibility',
      compatibilityHelp: 'If your service rejects JSON mode, temperature or token parameters, adjust these according to its documentation. Not every model supports Chat Completions.',
      jsonLabel: 'Request JSON output (response_format)', temperatureLabel: 'Send temperature parameter', tokenLabel: 'Output token parameter',
      privacy: 'Saving requests Chrome access only to your chosen service domain. AI features send captions and video context to that service. Use a service you trust.',
      save: 'Save and authorize service domain', localData: 'Local data', dataHelp: 'Study notes save automatically. Clearing cache preserves completed notes. Export anything you want to keep before resetting.',
      clearCache: 'Clear cache', reset: 'Reset all data', saved: 'Saved. Reopen the side panel to use the new settings.', denied: 'Service permission was denied. Settings were not saved.',
      originChanged: 'Service domain changed. Enter the key for this service.', failed: 'Could not save. Check the URL and model settings.',
      preview: 'Interface preview only. Load the extension in Chrome to save settings.', cleared: 'Cache cleared. Completed study notes were preserved.',
      confirmReset: 'Delete keys, cache, study notes and saved clips? Export notes you want to keep first.', resetDone: 'All local data was reset.',
    },
  };
  const normalizeLanguage = language => language === 'en' ? 'en' : 'zh-CN';
  const translate = (language, key) => COPY[normalizeLanguage(language)][key] || key;
  function changedOrigin(before, after) { return new URL(before).origin !== new URL(after).origin; }
  function initialize(root = globalThis) {
    const doc = root.document, api = root.chrome, settingsApi = root.YTD_SETTINGS;
    if (!doc || !settingsApi) return;
    const el = id => doc.getElementById(id);
    let language = 'zh-CN', loaded = settingsApi.normalize();
    const t = key => translate(language, key);
    function applyLanguage(value) {
      language = normalizeLanguage(value); doc.documentElement.lang = language;
      doc.title = language === 'en' ? 'Video Notes Settings' : 'Video Notes 设置';
      doc.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
      doc.querySelectorAll('[data-language]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.language === language)));
    }
    function display(settings) {
      for (const key of ['aiBaseUrl', 'aiModel', 'aiApiKey', 'supadataApiKey', 'tokenParameter']) el(key).value = settings[key];
      for (const key of ['jsonMode', 'sendTemperature']) el(key).checked = settings[key];
    }
    async function load() {
      if (api?.storage?.local) {
        const stored = await api.storage.local.get([settingsApi.STORAGE_KEY, 'vn_options_language']);
        loaded = settingsApi.normalize(stored[settingsApi.STORAGE_KEY]);
        applyLanguage(stored.vn_options_language); display(loaded);
      } else { applyLanguage(language); display(loaded); el('saveStatus').textContent = t('preview'); }
    }
    doc.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => {
      applyLanguage(button.dataset.language);
      void api?.storage?.local?.set({ vn_options_language: language });
    }));
    el('aiBaseUrl').addEventListener('change', () => {
      try {
        if (changedOrigin(loaded.aiBaseUrl, settingsApi.normalizeBaseUrl(el('aiBaseUrl').value))) {
          el('aiApiKey').value = ''; el('saveStatus').textContent = t('originChanged');
        }
      } catch { el('saveStatus').textContent = t('failed'); }
    });
    el('settingsForm').addEventListener('submit', async event => {
      event.preventDefault();
      if (!api?.storage?.local || !api?.permissions) { el('saveStatus').textContent = t('preview'); return; }
      try {
        const settings = settingsApi.normalize({ ...Object.fromEntries(['aiBaseUrl', 'aiModel', 'aiApiKey', 'supadataApiKey', 'tokenParameter'].map(key => [key, el(key).value])), jsonMode: el('jsonMode').checked, sendTemperature: el('sendTemperature').checked });
        // Call request synchronously from the submit gesture, before any await.
        const permission = api.permissions.request({ origins: [settingsApi.permissionOrigin(settings.aiBaseUrl)] });
        if (!await permission) { el('saveStatus').textContent = t('denied'); return; }
        await api.storage.local.set({ [settingsApi.STORAGE_KEY]: settings });
        // Clear derived AI caches when configuration changes; preserve source captions and saved notes.
        const all = await api.storage.local.get(null);
        if (JSON.stringify(loaded) !== JSON.stringify(settings)) {
          const derived = Object.keys(all).filter(k => k.startsWith('digest_') || k.startsWith('vn_partial_'));
          if (derived.length) await api.storage.local.remove(derived);
        }
        loaded = settings; el('saveStatus').textContent = t('saved');
      } catch { el('saveStatus').textContent = t('failed'); }
    });
    el('clearCacheBtn').addEventListener('click', async () => {
      if (!api?.storage?.local) return;
      const all = await api.storage.local.get(null);
      const keys = Object.keys(all).filter(k => k.startsWith('digest_') || k.startsWith('vn_partial_'));
      if (keys.length) await api.storage.local.remove(keys);
      el('dataStatus').textContent = t('cleared');
    });
    el('resetBtn').addEventListener('click', async () => {
      if (!api?.storage?.local || !root.confirm(t('confirmReset'))) return;
      await api.storage.local.clear(); await load(); el('dataStatus').textContent = t('resetDone');
    });
    void load().catch(() => { el('saveStatus').textContent = t('failed'); });
  }
  return { COPY, normalizeLanguage, translate, changedOrigin, initialize };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = VN_OPTIONS;
if (typeof document !== 'undefined') VN_OPTIONS.initialize();
