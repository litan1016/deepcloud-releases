## DeepCloud Desktop v0.2.20 (Windows x64)

### 🚀 核心更新与自愈特性 (Changelog)

#### 1. 旗舰影音 PotPlayer 风格虚拟聚合长片时间轴与防黑屏渲染
- **PotPlayer 风格虚拟聚合长片时间轴**：落地多剧集/多片段虚拟无缝拼接时间轴，支持首帧 GPU 渲染防黑屏架构闭环与全集离线下载画质自选（台账 #209, #210）；
- **影视流媒体选集与进度自愈**：在影视选集浮层与提示卡片中加入流媒体合成进度与状态提示，模块化播放控制菜单，规范海阔 URL 标准化链路；
- **Demuxer 解封装代理优化**：通过本地网关媒体代理消除伪装图片头流媒体引起的 Demuxer Stall 播放停滞；

#### 2. 海阔视界 (Hiker) 小程序容器与剪贴板自愈增强
- **交互与渲染体验优化**：彻底消除小程序加载过渡抖动与按钮拉伸缺陷；
- **全局剪贴板口令监听**：全局挂载剪贴板口令监听弹窗（`ClipboardRuleDetector`），支持全局自动识别分享口令并秒级唤起导入确认；

#### 3. 全架构工程高内聚模块化演进 (Phase 44 ~ Phase 54)
- **多媒体与阅读画布模块化**：深度重构解耦 WysiwygBottomBarCanvas，拆分为拖拽、缩放、顶栏、自定义器与模拟器独立模块；
- **智能体三维宇宙视图解耦**：模块化 CosmicUniverseView，拆分相机控制器、三维投影、星空节点与预设状态机；
- **网络存储与驱动管理器解耦**：模块化网络挂载页面，提取文件打开器、操作面板与驱动管理 Hooks；
- **内置浏览器与窗口控制微组件**：模块化内置浏览器页面，抽离多标签页、流媒体嗅探器与扩展管理器；
- **全局音频引擎驱动重组**：模块化 GlobalAudioEngine，拆分自愈中枢、mpv 驱动与 html5 驱动适配器；

#### 4. 内核安全加固与生产级交付
- **V8 字节码保护全面覆盖**：全量 151 个核心 JavaScript 模块全面采用 V8 原生字节码编译加固（Bytenode），彻底擦除明文源码；
- **自动化构建与哈希验证**：一键生成 NSIS 安装包、增量 ASAR 补丁与 Sidecar 守护进程资产。

---

### 📥 发行资产哈希基线 (SHA256 Checksums)

- `deepcloud-ui Setup 0.2.20.exe`: `9efc3eee3c47f665b56ee75127a65bc13d53c77caf061b51c661d1c75df37644`
- `deepcloud-ui.Setup.0.2.20.exe`: `9efc3eee3c47f665b56ee75127a65bc13d53c77caf061b51c661d1c75df37644`
- `deepcloud-update-v0.2.20.asar`: `d0239f6ca73eb9d5aeda2fd27bf4a49255d94b22d05303f048d7863d3a2ecb8d`
- `app.asar`: `d0239f6ca73eb9d5aeda2fd27bf4a49255d94b22d05303f048d7863d3a2ecb8d`
- `hub-windows-amd64.zip`: `2e5ed4d0f27abb9c46d1296a157c71c20957b6e76dc237921923e89e055dd9c1`
- `hub.exe`: `4cc5bcae06d333da8f0b0f4f617d62157e001aa4e8f6c48c1915da1091958f68`
