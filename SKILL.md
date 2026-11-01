---
name: agy-upgrade-kit
description: Antigravity 一键全自动升级补丁套件。当 Antigravity 官方更新覆盖后，或当用户输入 /agy-upgrade-kit、要求“更新汉化”、“安装气泡”、“保留自带时间线”、“一键汉化和气泡”、“修复汉化与气泡”、“升级Antigravity补丁”时触发。自动从 GitHub (qqxpee/antigravity2-cn) 拉取最新汉化字典与引擎执行汉化，保留并增强 Antigravity 官方原生对话时间线导航，并注入带有原生技能胶囊徽章的快捷气泡工具栏与实时配额面板，实现一键全套复原。
---

# agy-upgrade-kit：Antigravity 一键汉化与 UI 增强全自动升级套件

当 Google Antigravity 客户端发生版本更新（覆盖了 `resources/app.asar`）后，通过本技能可**一键实现全套环境恢复**：
1. **GitHub 动态同步**：自动联网检查并拉取 `qqxpee/antigravity2-cn` 官方最新汉化包与字典（网络不可用时自动降级使用本地最新版）；
2. **深度完整汉化**：自动执行 `localization_engine.js`，汉化软件主界面、顶部菜单、托盘与设置项（保留英文品牌标题 Antigravity）；
3. **纯净保留 Antigravity 官方原生时间线**：保留并优化 Antigravity 2.0 官方原生自带的对话时间线（`Conversation Navigator`）及官方悬浮卡片；完全移除任何冗余的自定义 Tooltip，彻底杜绝悬浮卡片重叠问题，使用官方底层状态机驱动轮次跳转，避免第三方时间线轮次跳变、概要丢失；
4. **UI 增强层注入**：
   - **底部快捷气泡工具栏**：`📦 技能`、`✨ 提示词`、`🔌 MCP`、`📚 知识库`、`● 配额`；
   - **原生技能胶囊徽章**：点击气泡菜单中的技能项，自动在输入框中渲染为与手动敲击 `/` 选择完全一致的原生 `[ <> ] 技能名` 胶囊（BeautifulMention Pill Node），支持退格一键删除；
   - **长提示词附件化**：超长提示词以 `.md` 芯片附件形式插入；
   - **实时多模型配额面板**：实时读取底层 Fiber 状态，展示各模型实时剩余百分比与重置倒计时（支持一键 `/compact` 压缩上下文）。
5. **运行中热更新**：若客户端正在运行，自动通过 CDP 协议无缝触发多窗口刷新，无需重启即刻生效。

---

## 一键执行入口

### 方式 1：Agent 自动化执行（推荐）
直接运行 Python 自动化脚本：
```powershell
python "E:\82-CherryStudio\ALL-Agent-Skills\agy-upgrade-kit\scripts\apply_upgrade.py"
```

### 方式 2：双击批处理脚本（离线/独立运行）
* **一键安装/更新**：双击 `一键更新汉化与增强套件.bat`
* **一键恢复官方英文原版**：双击 `一键恢复官方英文原版.bat`

---

## 执行步骤与核心逻辑

脚本内部自动按顺序执行以下 4 个阶段：

```
[Phase 1: GitHub 检查与拉取]
  自动检查 qqxpee/antigravity2-cn 远程更新，拉取最新字典与引擎
       │
       ▼
[Phase 2: Antigravity 官方汉化]
  node localization_engine.js --no-kill --brand-title english
       │
       ▼
[Phase 3: 注入气泡胶囊增强层并保留原生时间线]
  python enhancer/install_enhancer.py
       │
       ▼
[Phase 4: 热通知刷新]
  通过 CDP 调试端口向所有活动窗口发送 Page.reload 自动无缝刷新
```

---

## 验证与验收标准

1. **界面汉化**：顶部系统菜单（文件、编辑、查看、帮助）及设置面板已汉化为中文，品牌名保留为英文 `Antigravity`。
2. **官方原生时间线**：对话左侧/边缘呈现 Antigravity 自带的原生多轮时间线（Conversation Navigator），悬浮时仅展示原厂官方原生对话卡片（无任何多余或重叠弹窗），点击跳转精准流畅。
3. **底部气泡工具栏**：输入框底部显示 `📦 技能`、`✨ 提示词`、`🔌 MCP`、`📚 知识库` 等按钮。
4. **胶囊效果**：点击 `📦 技能` 选择任意技能，输入框中呈现出与手动敲击 `/` 选择完全一致的原生 `[ <> ] 技能名` 胶囊徽章。
5. **配额面板**：点击底部工具栏配额胶囊，弹窗中各模型百分比进度条与倒计时正常展示。
