# Video Notes

A Chrome side-panel extension that turns captioned YouTube videos into editable Chinese study notes and Obsidian Markdown files. Bring your own Chat Completions endpoint, model and API keys.

[简体中文](README.zh-CN.md) · [Privacy](PRIVACY.md) · [Security](SECURITY.md)

## Features

- Original transcripts, aligned Chinese/bilingual reading, search and timestamp seeking.
- AI overview, selected-text explanations and saved timestamped clips from the upstream project.
- Three study templates: **Course**, **Interview**, and **AI / Product Research**.
- Structured Chinese notes: explanations, concepts, key points and information limits. No invented exercises or exam predictions.
- Editable Markdown with automatic local saves, `==highlight==` selection, copying and `.md` export for Obsidian. Chinese filenames are preserved.
- Export the displayed transcript as Markdown with video links.
- Long captions are processed in sequential chunks, with visible progress and resumable partial results. No silent source truncation. Maximum source size: 240,000 characters per video.
- Configurable HTTPS API base URL, model ID and key. Optional JSON mode, temperature and token-parameter settings accommodate differences between Chat Completions services.
- No hosted backend, analytics, account system or developer-provided API credits.

## Install

1. Download this repository using **Code → Download ZIP**, or clone it. Extract it into a permanent folder.
2. Open `chrome://extensions` in desktop Chrome (116 or later).
3. Enable **Developer mode**, choose **Load unpacked**, and select the folder containing `manifest.json`.
4. Open the extension's **Settings**. Enter your [Supadata key](https://dash.supadata.ai/auth/sign-up) for existing YouTube captions.
5. For AI features, enter your provider's HTTPS base URL, exact model ID and API key. For the inherited defaults, see [DeepSeek API keys](https://platform.deepseek.com/api_keys) and [DeepSeek documentation](https://api-docs.deepseek.com/).
6. Click **Save and authorize service domain**. Chrome asks for access to that specific domain. Keys stay in extension-local storage; enter them only in Settings.
7. Open a public, captioned YouTube watch page and click the extension icon or its **Digest** button.

Moving or deleting the source folder breaks the unpacked installation. It does not auto-update; replace the source, reload the extension card and refresh YouTube tabs after changes.

## Study workflow

Open **学习笔记**, select a template and click **生成笔记**. AI requests happen only after this action. For long videos, each caption chunk becomes a section of the resulting document. Partial results survive interruption; retrying the same video/template/settings resumes completed chunks. Stop prevents subsequent chunks after the current request finishes.

Edit the Markdown directly, select text and click **标记选中重点**, then export `.md` into your Obsidian vault. Completed notes are stored by video and template. Regenerating requires confirmation because it replaces edits. Clearing cache preserves completed notes; resetting extension data removes them.

Timestamp links use only markers found in the caption source. Missing or invalid model timestamps become unlinked text. A valid timestamp does not guarantee that a model's explanation is correct: verify against the original video.

## API compatibility and costs

The adapter calls `{base URL}/chat/completions` with Bearer authentication and expects `choices[0].message.content` text. The base URL must use HTTPS and contain no credentials, query string, fragment or nonstandard port. Include the service's path, such as `/v1`, but omit `/chat/completions`.

DeepSeek-specific `thinking` is sent only to the official DeepSeek hostname. Custom services receive standard fields. Disable JSON mode or temperature, or select `max_completion_tokens`, if required by your provider. Some models, native Anthropic/Gemini endpoints, Responses-only APIs and custom response schemas require a separate adapter and are not supported by this generic setting. Small-context models may not fit a caption chunk.

Supadata and AI service usage are billed separately by those providers. Check [Supadata pricing](https://supadata.ai/pricing) and your AI service's current rates. No universal free usage is promised. Transcript-only use does not require an AI key.

## Scope and verification

Supports standard desktop YouTube watch pages with a native caption track. It does **not** transcribe uncaptained audio or support local files, Bilibili, Shorts, private videos or live streams. Captions may omit slides, formulas or visual demonstrations.

Automated tests cover settings/permissions, provider requests, transcript interactions, study-note validation and Markdown exports. Live provider requests require user-supplied keys and have not been verified in this development environment. Chrome loading and real YouTube/API behavior must be checked after local installation.

```sh
npm test
npm run check
npm run package
```

No dependency installation or build step is needed. Node.js 22+, Bash and zip are needed only for development checks and packaging. The package is written to `dist/video-notes-v2.0.0.zip`. CI runs checks and uploads the extension ZIP as a workflow artifact.

## License

See [LICENSE](LICENSE).
