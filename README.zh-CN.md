# Video Notes

面向课程学习、访谈精读和 AI / 产品研究的 YouTube 学习扩展。把已有字幕整理为可编辑的中文笔记，并导出为 Obsidian Markdown。API 地址、模型和密钥均可配置。

[English](README.md) · [隐私说明](PRIVACY.md)

## 相比原项目增加了什么

| 功能 | 行为 |
| --- | --- |
| 课程学习模板 | 聚焦概念、机制、前提、易混淆点；不出习题、不预测考点 |
| 访谈精读模板 | 梳理论点、依据、分歧与适用边界 |
| AI / 产品研究模板 | 整理用户问题、产品机制、技术与商业约束、取舍和验证依据 |
| Obsidian 导出 | YAML 属性、原视频来源、模型记录、时间链接和中文文件名 |
| 可编辑笔记 | 自动本地保存；选中文字后添加 `==重点==`；复制或导出 `.md` |
| 长视频处理 | 顺序分段、显示进度、中断后重试可继续；字幕上限 240,000 字符，超限明确报错 |
| 自定义 AI | HTTPS Chat Completions 基础地址、模型 ID、密钥及兼容开关 |

保留原项目的字幕搜索、中英双语、时间跳转、AI 概览、选词解释和保存片段。逐字稿也可按当前显示语言导出 Markdown。

## 安装与设置

1. 在本仓库点击 **Code → Download ZIP**，解压到长期保留的文件夹。
2. Chrome 打开 `chrome://extensions`，启用开发者模式，点击「加载已解压的扩展程序」，选择含 `manifest.json` 的文件夹。
3. 在扩展 Settings 页面填写 [Supadata API 密钥](https://dash.supadata.ai/auth/sign-up)，用于获取已有字幕。
4. 填写 AI API 基础地址、模型 ID、对应服务的密钥。保留接口所需的 `/v1` 等路径，不要包含 `/chat/completions`。沿用默认配置时，请查看 [DeepSeek 密钥页面](https://platform.deepseek.com/api_keys)和[官方文档](https://api-docs.deepseek.com/)。
5. 点击「保存并授权服务域名」，允许 Chrome 访问你选择的服务域名。密钥只在 Settings 中填写，不要放进源码或聊天。
6. 打开有字幕的公开视频 watch 页面，点击扩展图标或视频旁的 Digest 按钮。

移动或删除源文件夹会使扩展失效。此扩展不会自动更新；更新后需在扩展管理页重新加载，并刷新 YouTube 页面。

## 学习流程

在「学习笔记」选择模板，点击「生成笔记」，完成后直接编辑 Markdown、标记重点并导出到 Obsidian。AI 生成只在主动点击时进行；长视频按段整理，所有分段都会出现在文档中。停止按钮会在当前请求完成后阻止后续分段；重试相同视频、模板和服务设置时可复用成功分段。

笔记按视频与模板保存。重新生成前会确认是否覆盖编辑。清除缓存保留已完成的学习笔记；重置会删除全部本地数据，请先导出。

模型返回的时间只在字幕中存在对应标记时才转换为链接，其余保留为无链接文字。时间有效不代表解释一定正确，请点击回看原文。

## 接口与成本

使用 Bearer 认证的 `/chat/completions` 接口，响应须包含 `choices[0].message.content`。只接受 HTTPS 基础地址，不接受账号密码、查询参数、片段和非标准端口。更换服务域名时需重新填写对应密钥。

可关闭 JSON 模式和 temperature 参数，或将输出参数切换为 `max_completion_tokens`。DeepSeek 专用参数仅发送到官方 DeepSeek 域名。原生 Anthropic/Gemini、仅支持 Responses 的服务及特殊响应格式需要额外适配；并非任意模型都能直接使用。上下文很小的模型也可能无法容纳一个字幕分段。

Supadata 和 AI 服务分别按各自规则计费，请查看 [Supadata 当前价格](https://supadata.ai/pricing)和所选模型服务价格。只阅读和导出字幕不需要 AI 密钥。

## 支持范围与验证边界

仅支持桌面 Chrome 116+ 的标准 YouTube watch 页面和已有字幕。不支持无字幕音频转写、B站、本地文件、Shorts、直播或私有视频。字幕不会完整包含视频里的图表、公式和演示画面。

自动检查覆盖配置、域名授权、API 请求格式、字幕交互、笔记结构和导出。开发环境未配置真实服务密钥，因此未完成真实 API 和 YouTube 视频联调；安装后仍需用自己的密钥验证。

```sh
npm test
npm run check
npm run package
```

无需安装依赖或构建。开发检查需 Node.js 22+、Bash 和 zip；安装扩展无需 Node。安装包输出为 `dist/video-notes-v2.0.0.zip`，CI 也会生成安装包。

## 来源与许可

本项目基于 [Zara Zhang 的 YouTube Digest 1.2.0](https://github.com/zarazhangrui/youtube-digest)，原有字幕阅读、双语、概览、保存片段及界面基础来自该项目；本衍生版本新增自定义 AI 服务与学习笔记工作流。与原作者官方发布相互独立。

遵循 MIT 许可证，保留 Zara Zhang 的版权声明，详见 [LICENSE](LICENSE)。
