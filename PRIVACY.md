# Privacy and data flow

Video Notes is a local Chrome extension. It has no developer backend, analytics, advertising or account system.

- **Supadata** receives the canonical YouTube watch URL and your Supadata API key to retrieve native captions. It does not receive playlist/referral parameters from the active URL. Caption lookup may cost provider credits. No generated audio transcription fallback is used.
- **Your chosen AI service** receives its API key via Bearer authentication plus captions, video title and relevant context for requested AI features. Overview generation, translation, explanations, note cleanup and study-note generation use that service. Long study notes send successive caption chunks. Partial progress may be reused locally when retrying.
- **Chrome local extension storage** holds settings, API keys, recent captions/translations, saved clips, study drafts and partial study results. Keys are not encrypted with a separate vault password; protect your OS account and Chrome profile. The content script cannot read this storage (TRUSTED_CONTEXTS).
- **Markdown export** includes the video source, title/channel, template, model ID, creation date and note content. It excludes API keys and endpoint settings. Exported files are under your control.

Only YouTube and Supadata are mandatory host permissions. Saving AI settings requests optional access to the chosen HTTPS origin. Optional `https://*/*` in the manifest declares which origins may be requested; the extension requests one specific origin per save, not all websites. Previously granted origins can remain authorized until removed in Chrome's extension settings; they are not used unless configured. API requests reject HTTP redirects to avoid forwarding credentials to another endpoint.

Changing a service domain clears the key input and requires the new service's key. Derived caches are cleared on configuration changes; completed study notes and saved clips are retained. Provider settings and keys are not written to repository files. Native third-party provider policies and billing still apply.

Use Settings to clear caches or reset local data. Reset removes credentials, clips, cache, drafts and notes in this extension. Export needed notes first. Uninstalling also removes extension-local data. Exported files and provider-side records are not deleted by reset or uninstall.

The upstream transcript reader and translation features may perform AI requests when you choose those views or save a clip that needs cleanup. Study generation requires an explicit click. No data is uploaded to GitHub by using the extension.
