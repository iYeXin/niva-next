![Niva](logo/niva-title-logo-white.png)

# Niva

- （这里是[原 Niva 项目](https://github.com/bramblex/niva/)的维护 Fork，版本号为 0.9.91）

- [关于修改](#修改)

基于 Tauri WRY 跨端 Webview 库的超轻量极易用的跨端应用开发框架。

![screenshot](screenshots/screenshot1.png)

- V0.9.91 开发工具下载：[https://github.com/iYeXin/niva-next/releases](https://github.com/iYeXin/niva-next/releases)
- 原项目开发工具下载： [https://github.com/bramblex/niva/releases](https://github.com/bramblex/niva/releases)
- 文档： [packages/website/docs/api/](packages/website/docs/api/)
- 快速上手（参见原项目）： [https://bramblex.github.io/niva/docs/tutorial/new-project](https://bramblex.github.io/niva/docs/tutorial/new-project)

## 目标

- 超轻量
  - 构建的桌面应用最小只有 3MB，仅有 Electron 的 1/10。
  - Niva 仅依赖系统原生的 Webview，不依赖 Chromium 或者 Node.js，极致的轻量。
- 极易用
  - 仅使用前端技术，不需要学习复杂的 Node.js 和 Electron API 也不需要复杂的配置，即可构建出一个桌面应用。
  - 构建单可执行文件，无需安装，点击即用。
- 图形化
  - Niva 提供图形化界面的开发工具，一键点击构建桌面应用，无需复杂的命令行操作，也无需安装 Node 环境。
- 跨平台
  - 同时支持 Windows、macOS，无需额外的配置，即可构建出跨平台的桌面应用。

## 亮点

### 极低的上手难度

简单项目（没有使用 webpack 等构建工具的简单签单项目），还是常见的 Vue 项目或者 React 项目，无需额外配置，一键拖入，一键构建。

### 灵活的功能

支持单窗口、多窗口、浮窗、窗口后台运行等多种场景。

### 丰富的配置

丰富的配置，窗口大小、窗口标题、窗口图标、窗口菜单、窗口是否可缩放、窗口是否可拖动、窗口是否可关闭、窗口是否可最大化、窗口是否可最小化等等都可以配置。全局快捷键、系统托盘图标等等也可以进行配置。详细选项文档 [选项文档](https://bramblex.github.io/niva/docs/options/project) 。

### 完善的 API

Niva 提供了丰富的 API, 如 clipboard, dialog, extra, fs, http, monitor, os, process, resource, shortcut, tray, webview, window, window_extra 等 API。详见 [API 文档](packages/website/docs/api/)。

## Todo

- [ ] Niva 1.0

  - [ ] Niva API TypeScript 类型声明。
  - [ ] 应用程序签名
    - [ ] MacOS
    - [ ] Windows
  - [ ] 支持 Node.js 调用，作为 NodeJS 应用程序的 UI 窗口。
  - [ ] 支持系统通知 Notification。

- [ ] Niva 2.0
  - [ ] 对 Window10 低版本增加 [miniblink](https://github.com/weolar/miniblink49) 支持，解决低版本 Windows 对 Webview2 支持不完善的问题。

## 修改

这个 fork 中进行了下述修改：

- 修正了 windows-api 的部分文档错误
- 根据原项目的部分 issues 和个人使用体验做出了一些修复

1. 为 Niva.api.process.exec 添加了静默执行选项
2. 将原来的 http-api 重构为 Niva.api.http.fetch 增加了更多可选功能和对二进制数据的支持
3. 修改了一些事件 id 的数据类型，解决了原先超过部分调用功能超过 256 次后应用崩溃的情况
4. 明确了部分限制：窗口数量不能超过 8 个，每个窗口的项目支持（如托盘 快捷键）不能超过 8192 个

## Acknowledgments

[@wen-gang(晓港)](https://github.com/wen-gang) - 感谢晓港帮 Niva 设计了新的 Logo

## Contributors

![Contributors](https://contrib.rocks/image?repo=bramblex/niva)

## License

MIT
