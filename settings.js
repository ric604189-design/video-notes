/** Non-secret defaults shared by the options page and worker. */
var YTD_SETTINGS = (() => {
  const STORAGE_KEY = "ytd_settings";
  const DEFAULTS = Object.freeze({
    provider: "deepseek", aiApiKey: "", supadataApiKey: "",
    aiBaseUrl: "https://api.deepseek.com", aiModel: "deepseek-v4-flash",
    jsonMode: true, tokenParameter: "max_tokens", sendTemperature: true,
  });
  function normalizeBaseUrl(value) {
    const url = new URL(String(value || DEFAULTS.aiBaseUrl).trim());
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.port) {
      throw new Error("API 地址必须使用 HTTPS，且不含账号、端口、查询参数或片段。");
    }
    if (url.pathname.replace(/\/+$/, "").endsWith("/chat/completions")) {
      throw new Error("请输入基础地址（例如 https://api.example.com/v1），不要包含 /chat/completions。");
    }
    return url.href.replace(/\/+$/, "");
  }
  function normalize(input = {}) {
    input = input || {};
    const aiBaseUrl = normalizeBaseUrl(input.aiBaseUrl);
    const aiModel = String(input.aiModel || DEFAULTS.aiModel).trim();
    if (!aiModel || aiModel.length > 200 || /[\r\n]/.test(aiModel)) throw new Error("请填写有效的模型 ID。");
    return {
      provider: new URL(aiBaseUrl).hostname === "api.deepseek.com" ? "deepseek" : "custom",
      aiApiKey: typeof input.aiApiKey === "string" ? input.aiApiKey.trim() : "",
      supadataApiKey: typeof input.supadataApiKey === "string" ? input.supadataApiKey.trim() : "",
      aiBaseUrl, aiModel,
      jsonMode: input.jsonMode !== false,
      tokenParameter: input.tokenParameter === "max_completion_tokens" ? "max_completion_tokens" : "max_tokens",
      sendTemperature: input.sendTemperature !== false,
    };
  }
  function chatCompletionsUrl(baseUrl = DEFAULTS.aiBaseUrl) {
    return `${normalizeBaseUrl(baseUrl)}/chat/completions`;
  }
  function permissionOrigin(baseUrl) { return `${new URL(normalizeBaseUrl(baseUrl)).origin}/*`; }
  function canonicalYouTubeUrl(videoId) {
    const normalized = String(videoId || "").trim();
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(normalized)) throw new Error("Invalid YouTube video ID.");
    return `https://www.youtube.com/watch?v=${normalized}`;
  }
  return { STORAGE_KEY, DEFAULTS, normalize, normalizeBaseUrl, chatCompletionsUrl, permissionOrigin, canonicalYouTubeUrl };
})();
if (typeof module !== "undefined" && module.exports) module.exports = YTD_SETTINGS;
