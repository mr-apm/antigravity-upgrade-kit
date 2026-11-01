# 🚀 Antigravity Upgrade Kit (一键汉化与 UI 增强全自动套件)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-0078D6.svg)](https://microsoft.com)
[![Antigravity](https://img.shields.io/badge/Antigravity-2.0+-green.svg)](https://antigravity.google)

> **为 Google Antigravity 打造的全自动一键升级补丁套件**。  
> 当官方客户端更新覆盖 `app.asar` 后，只需一键即可全自动恢复：**GitHub 最新官方中文汉化** + **保留 Antigravity 官方原生时间线** + **底部快捷气泡工具栏** + **原生技能胶囊徽章** + **实时多模型配额**。

---

## ✨ 核心特性

| 功能模块 | 说明 |
| :--- | :--- |
| 🌐 **GitHub 动态汉化** | 自动联网检查并拉取 `qqxpee/antigravity2-cn` 官方最新汉化包与字典，深度汉化菜单、设置与界面（保留英文品牌标题 Antigravity）。 |
| ⏱️ **保留官方原生时间线** | 自动保留并强化 Antigravity 官方原生自带的 `Conversation Navigator`（多轮提问导航轨），由官方底层 React 状态机驱动，避免任何轮次跳变或切片丢失。 |
| 💊 **原生技能胶囊徽章** | 突破 Lexical 协议层，气泡中的技能点击后直接在输入框生成官方原生 `[ <> ] 技能名` 胶囊（BeautifulMention Pill Node），支持一键退格删除。 |
| 📦 **快捷气泡工具栏** | 底部快速调出 `📦 技能`、`✨ 提示词`、`🔌 MCP`、`📚 知识库`，支持模糊搜索与快速插入。 |
| 📊 **实时多模型配额** | 实时读取各模型（Gemini 4 Argon、Gemini 3.8、Claude & GPT）的剩余百分比、进度条与重置倒计时（如 `⏱ 4天后重置`）。 |
| ⚡ **运行中无缝热更新** | 通过 CDP 调试协议通知运行中的客户端自动刷新，无需重启软件即刻生效。 |
| 🔄 **一键无损卸载** | 内置还原脚本，一键剥离增强组件与汉化补丁，秒级复原官方干净英文原版。 |

---

## 🛠️ 安装与使用方法

### 方式 1：双击批处理脚本（最简推荐）
1. 克隆或下载本仓库到本地任意目录：
   ```bash
   git clone https://github.com/mr-apm/antigravity-upgrade-kit.git
   cd antigravity-upgrade-kit
   ```
2. 双击运行：
   👉 **`一键更新汉化与增强套件.bat`**
3. 脚本会自动检查 GitHub 最新汉化包、解包编译 `app.asar` 并热更新当前窗口，完毕后即可尽情使用！

### 方式 2：Python 命令行执行
```powershell
python scripts/apply_upgrade.py
```

### 方式 3：作为 Agent 技能直接调用
如果您使用 Antigravity、CherryStudio 或 WorkBuddy，本套件已内置标准 `SKILL.md`，直接在聊天框输入：
```
/agy-upgrade-kit
```
即可触发 Agent 自动完成升级与注入。

---

## ↩️ 一键恢复官方英文原版

如需还原为官方原版英文环境，双击运行：
👉 **`一键恢复官方英文原版.bat`**  
或在命令行运行：
```powershell
python scripts/restore_official.py
```

---

## 📁 目录结构

```
antigravity-upgrade-kit/
├── SKILL.md                          # Agent 技能定义规范
├── README.md                         # 本说明文档
├── 一键更新汉化与增强套件.bat        # Windows 一键执行批处理
├── 一键恢复官方英文原版.bat          # 官方英文原版恢复脚本
├── 一键推送到GitHub.bat              # 推送备份脚本
├── scripts/
│   ├── apply_upgrade.py              # 核心全自动升级流驱动
│   └── restore_official.py           # 原版还原驱动
└── enhancer/
    ├── enhancer_ui_core.js           # 前端 UI 增强层核心逻辑 (气泡、胶囊与原生时间线保留)
    ├── enhancer_main_ipc.js          # Electron IPC 文件与状态桥接
    ├── install_enhancer.py           # ASAR 解包注入与打包引擎
    └── restore_original.py           # 增强层代码块精准剔除引擎
```

---

## 🤝 致谢与开源说明
* 汉化字典与引擎基于社区优秀开源项目 [qqxpee/antigravity2-cn](https://github.com/qqxpee/antigravity2-cn)。
* 本项目仅供学习研究与个人效率提升，遵循 MIT 开源协议。
