# Antigravity UI Enhancer（底部快捷工具栏 + 原生技能胶囊）

本目录为 **Antigravity UI 增强插件独立便携包**，支持在本机及任何其他 Windows 电脑上一键注入、热生效与一键恢复原版。

---

## 一、功能清单

1. **组件 1：输入框底部单行自适应快捷工具栏（`#agy-enhancer-toolbar`）**
   - 嵌入位置：Antigravity 输入框底部栏（模型选择框与右侧 `极速 (Turbo)` 按钮之间）。
   - 严格单行不换行，随窗口宽度 4 级自动折叠：
     - **宽屏 (`>=520px`)**：`[📦 技能] [✨ 提示词] [🔌 MCP] [📚 知识库] [🟢 N轮·Argon XX%]`
     - **中屏 (`440~519px`)**：自动隐藏 `📚 知识库`
     - **窄屏 (`370~439px`)**：自动隐藏 `🔌 MCP` + `📚 知识库`
     - **极窄窗口 (`<370px`)**：自动精简为 **`[📦]` + `[🟢 XX%]`** 两个紧凑按钮
   - 点击任意按钮均弹出 **5 合 1 悬浮面板（`📦 技能 | ✨ 提示词 | 🔌 MCP | 📚 知识库 | 📊 配额`）**，每个面板均内置 **实时搜索框 (`🔍`)** 与 **独立上下滚动条**。

2. **组件 2：原生技能胶囊徽章（BeautifulMention Pill Node）**
   - 突破 Lexical 协议层，气泡中的技能点击后直接在输入框生成官方原生 `[ <> ] 技能名` 胶囊徽章。
   - 与手动敲击 `/` 选择完全一致，支持退格一键整块删除。

3. **组件 3：`.md` 附件式提示词库 + 新建保存**
   - 长提示词以独立 `.md` 文件存放在 `_prompts` 目录（如 `E:\82-CherryStudio\ALL-Agent-Skills\_prompts\`，跨电脑无此目录时自动回退至 `~/.gemini/antigravity/_prompts/`）。
   - 点击任一提示词，通过原生 `<input type="file">` 挂载为 **`.md` 文档附件**，不会把几千字正文灌入输入框。
   - 支持点击 **`＋ 新建 .md`** 直接输入文件名、标签和正文并保存为 `.md` 文件。

4. **组件 4：实时模型配额胶囊与 3 组配额面板**
   - 底部胶囊采用**智能跟随当前选中模型**，直接从 Antigravity 内部 React Fiber 状态读取真实剩余配额百分比。
   - 点击打开 `📊 配额` 面板可查看 `Gemini 4 Argon`、`Gemini 3.8 模型`、`Claude & GPT` 全部配额进度条、重置倒计时、当前对话轮数，并提供 `/compact` 一键压缩上下文按钮。

---

## 二、一键注入指令与一键恢复指令

### 方式 A：双击批处理文件（最简单）
- **一键注入安装**：双击运行 `一键注入插件.bat`
- **一键恢复原版**：双击运行 `一键恢复原版.bat`

### 方式 B：PowerShell / 终端一键指令
- **一键注入指令**：
  ```powershell
  python install_enhancer.py
  ```
- **一键恢复原版指令**：
  ```powershell
  python restore_original.py
  ```

---

## 三、在其他电脑上迁移使用的步骤

1. 将整个 `ALL-Agent-Skills` 文件夹（或仅复制 `_agy-enhancer` 与 `_prompts` 两个子文件夹）拷到新电脑任意目录。
2. 确保新电脑已安装 Python 3（无需安装任何第三方 `pip` 库，脚本仅使用 Python 标准库）。
3. 双击运行 **`一键注入插件.bat`**（或执行 `python install_enhancer.py`）：
   - 脚本会自动查找新电脑上的 `%LOCALAPPDATA%\Programs\antigravity\resources\app.asar`。
   - 自动创建原版备份 `app.asar.before-enhancer.bak`。
   - 将增强组件写入 `app.asar`（若新电脑已有中文汉化补丁，会自动保留共存）。
   - 若新电脑的 Antigravity 正在运行，还会自动通过 `DevToolsActivePort` 热注入当前窗口，无需重启立即生效！
4. 如需卸载或升级 Antigravity 前恢复原版，只需双击 **`一键恢复原版.bat`**（或执行 `python restore_original.py`），即可 100% 还原 `app.asar.before-enhancer.bak` 并清理当前窗口。
