# Security

Never commit API keys, transcripts or personal notes. Enter credentials only in the extension Settings page. The repository and release ZIP contain no credentials.

The AI adapter accepts HTTPS endpoints without embedded credentials/query parameters. It appends `/chat/completions`, uses Bearer authentication, rejects redirects and keeps DeepSeek-only fields restricted to the official DeepSeek hostname. Review the service domain before granting Chrome optional host access.

Extension-local storage is restricted to trusted extension contexts. Content-script messages cannot invoke caption retrieval, AI completion or study generation. Study results are schema-validated, unsupported timestamps lose links, model content is inserted as textarea text, and exports escape Markdown control characters. AI explanations are not guaranteed facts.

`npm run check` validates packaging references, syntax, tests and common credential patterns. This is a development check, not a security audit. Live provider behavior must be tested with the user's own account.

Do not post real keys or private notes in an issue. Report reproducible problems with placeholder credentials and synthetic captions.
