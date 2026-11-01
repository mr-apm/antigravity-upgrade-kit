(() => {
    if (window.__AGY_UI_ENHANCER_TIMER__) {
        try { clearInterval(window.__AGY_UI_ENHANCER_TIMER__); } catch (e) {}
        window.__AGY_UI_ENHANCER_TIMER__ = null;
    }
    window.__AGY_UI_ENHANCER_ACTIVE__ = true;
    try {
        const _oldTl = document.getElementById('agy-enhancer-timeline');
        if (_oldTl) _oldTl.remove();
        const oldTip = document.getElementById('agy-native-turn-tooltip');
        if (oldTip) oldTip.remove();
    } catch (e) {}

    // Default fallback data (used if IPC is not yet active before app restart)
    const FALLBACK_DATA = window.__AGY_ENHANCER_BOOTSTRAP_DATA__ || {
        promptsDir: 'E:/82-CherryStudio/ALL-Agent-Skills/_prompts',
        skills: [
            { cmd: '/wordcraft', name: 'WordCraft 文档处理', desc: '调用本机 WordCraft MCP 创建、编辑、排版、检查或转换文档 (.docx/.pdf/.md)', source: '共享主库' },
            { cmd: '/transfer-skills', name: '跨 Agent 技能同步', desc: '把技能共享同步到 Antigravity、WorkBuddy、CherryStudio 三个 Agent', source: '共享主库' },
            { cmd: '/grill-me', name: '深度追问式方案审查', desc: '逐层拆解设计决策树，持续追问直到达成共识', source: '共享主库' },
            { cmd: '/delivery-no-pseudoblock', name: 'AI交付前全自动自检', desc: 'D1–D12 交付前伪阻断与缓干闸门终检', source: '共享主库' },
            { cmd: '/enhance-prompt', name: 'UI 提示词打磨增强', desc: '将模糊的 UI 想法转化为结构化提示词', source: '共享主库' },
            { cmd: '/prompt-engineering-patterns', name: '提示词工程高级模式', desc: '思维链、少样本、结构化提示词模板优化', source: '共享主库' },
            { cmd: '/agy-customizations', name: 'Antigravity 定制指南', desc: '配置技能、规则、插件、Hooks 与 MCP 服务', source: '内置技能' },
            { cmd: '/antigravity-guide', name: 'Antigravity 全景指南', desc: 'CLI、IDE、快捷键、SDK 与系统配置参考', source: '内置技能' },
            { cmd: '/automation', name: '自动化定时任务', desc: '设计并创建后台定时自动化任务', source: '内置技能' },
            { cmd: '/generative_ui', name: '交互式组件生成', desc: '在对话中内嵌渲染可交互 HTML 可视化组件', source: '内置技能' }
        ],
        prompts: [],
        mcp: [
            { server: 'wordcraft', tool: 'new_document', desc: '新建空白或基于模板的 Word 文档' },
            { server: 'wordcraft', tool: 'open_document', desc: '打开本地 .docx / .pdf / .md 等格式文档' },
            { server: 'wordcraft', tool: 'save_document', desc: '保存或另存转换文档为指定格式' },
            { server: 'wordcraft', tool: 'inspect_document', desc: '检查文档结构、段落样式、页眉页脚与统计信息' },
            { server: 'wordcraft', tool: 'type_text', desc: '在当前光标或选区插入排版文本' },
            { server: 'wordcraft', tool: 'select_text', desc: '按文本内容、段落或正则选中文档区域' },
            { server: 'wordcraft', tool: 'get_text', desc: '读取文档全文或指定段落范围的文本内容' },
            { server: 'wordcraft', tool: 'execute', desc: '执行单条排版或样式修改命令' },
            { server: 'wordcraft', tool: 'batch', desc: '批量执行多条文档编辑与格式排版指令' },
            { server: 'wordcraft', tool: 'list_commands', desc: '列出所有支持的文档操作命令及参数说明' },
            { server: 'wordcraft', tool: 'render_page', desc: '将文档页面渲染为高清预览图以供视觉检查' },
            { server: 'wordcraft', tool: 'parity', desc: '对比源文档与目标文档的排版一致性' },
            { server: 'wordcraft', tool: 'screenshot', desc: '截取当前文档窗口视图' },
            { server: 'wordcraft', tool: 'click', desc: '点击文档界面指定坐标或控件' },
            { server: 'wordcraft', tool: 'key', desc: '发送快捷键指令到文档窗口' },
            { server: 'wordcraft', tool: 'ui_inspect', desc: '检查文档界面 UI 控件树结构' }
        ],
        kb: [
            { name: 'GEMINI.md (工作区长期记忆)', folder: '1-电脑日常', path: 'e:/83-Antigravity/1-工作空间/1-电脑日常/GEMINI.md', size: '1.2 KB' },
            { name: '06-Skills-and-Capability-Packs.md', folder: '1-知识库/wiki', path: 'E:/82-CherryStudio/1-工作空间/1-全能助手/1-知识库/wiki/06-Skills-and-Capability-Packs.md', size: '4.5 KB' },
            { name: 'transfer-skills/SKILL.md', folder: 'ALL-Agent-Skills', path: 'E:/82-CherryStudio/ALL-Agent-Skills/transfer-skills/SKILL.md', size: '6.8 KB' },
            { name: 'wordcraft/SKILL.md', folder: 'ALL-Agent-Skills', path: 'E:/82-CherryStudio/ALL-Agent-Skills/wordcraft/SKILL.md', size: '3.4 KB' },
            { name: 'delivery-no-pseudoblock/SKILL.md', folder: 'ALL-Agent-Skills', path: 'E:/82-CherryStudio/ALL-Agent-Skills/delivery-no-pseudoblock/SKILL.md', size: '8.1 KB' },
            { name: 'skills.json (Antigravity 技能注册表)', folder: '.gemini/config', path: 'C:/Users/Mr-wang/.gemini/config/skills.json', size: '0.3 KB' },
            { name: 'mcp_config.json (MCP 配置文件)', folder: '.gemini/antigravity', path: 'C:/Users/Mr-wang/.gemini/antigravity/mcp/mcp_config.json', size: '0.4 KB' }
        ],
        turns: []
    };

    const state = {
        data: JSON.parse(JSON.stringify(FALLBACK_DATA)),
        popoverOpen: false,
        activeTab: 'skills',
        searchQuery: '',
        addingPrompt: false,
        attachedChips: [],
        lastConvoId: '',
        widthTier: 1 // 1: full, 2: hide kb, 3: hide mcp+kb, 4: compact 2 buttons
    };

    // Load local custom prompts saved in localStorage if any
    try {
        const savedLocal = JSON.parse(localStorage.getItem('__agy_enhancer_local_prompts__') || '[]');
        if (Array.isArray(savedLocal) && savedLocal.length > 0) {
            const existingNames = new Set(state.data.prompts.map(p => p.title));
            for (const sp of savedLocal) {
                if (!existingNames.has(sp.title)) state.data.prompts.unshift(sp);
            }
        }
    } catch (e) {}

    function injectStyles() {
        try {
            const _oldTl = document.getElementById('agy-enhancer-timeline');
            if (_oldTl) _oldTl.remove();
        } catch (e) {}
        if (document.getElementById('__agy_enhancer_styles__')) return;
        const style = document.createElement('style');
        style.id = '__agy_enhancer_styles__';
        style.textContent = `
            #agy-enhancer-toolbar {
                display: inline-flex;
                align-items: center;
                gap: 3px;
                padding: 1px 4px;
                margin-left: 4px;
                border-radius: 9999px;
                border: 1px solid rgba(128, 128, 128, 0.22);
                background: rgba(128, 128, 128, 0.06);
                flex-wrap: nowrap !important;
                white-space: nowrap !important;
                flex-shrink: 0;
                user-select: none;
                font-size: 12px;
                line-height: 1.2;
                z-index: 20;
            }
            .agy-tb-btn {
                display: inline-flex;
                align-items: center;
                gap: 3px;
                height: 24px;
                padding: 0 7px;
                border-radius: 9999px;
                border: none;
                background: transparent;
                color: inherit;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                white-space: nowrap !important;
                flex-shrink: 0;
                transition: background 0.15s, color 0.15s;
            }
            .agy-tb-btn:hover, .agy-tb-btn.active {
                background: rgba(16, 185, 129, 0.14);
                color: #10b981;
            }
            .agy-tb-quota {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                height: 22px;
                padding: 0 8px;
                border-radius: 9999px;
                border: 1px solid rgba(128, 128, 128, 0.25);
                background: rgba(128, 128, 128, 0.08);
                color: inherit;
                font-size: 11px;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                cursor: pointer;
                white-space: nowrap !important;
                flex-shrink: 0;
                transition: border-color 0.15s, background 0.15s;
            }
            .agy-tb-quota:hover, .agy-tb-quota.active {
                border-color: #10b981;
                background: rgba(16, 185, 129, 0.12);
            }
            .agy-dot {
                width: 6px;
                height: 6px;
                border-radius: 9999px;
                display: inline-block;
                flex-shrink: 0;
            }
            #agy-enhancer-attach-bar {
                display: flex;
                align-items: center;
                gap: 6px;
                flex-wrap: wrap;
                padding: 4px 8px 0 8px;
            }
            #agy-enhancer-attach-bar:empty {
                display: none;
            }
            .agy-attach-chip {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 2px 8px;
                border-radius: 6px;
                font-size: 11.5px;
                background: rgba(16, 185, 129, 0.12);
                border: 1px solid rgba(16, 185, 129, 0.4);
                color: inherit;
                max-width: 100%;
            }
            .agy-attach-chip button {
                border: none;
                background: transparent;
                color: inherit;
                opacity: 0.65;
                cursor: pointer;
                font-weight: bold;
                padding: 0 2px;
            }
            .agy-attach-chip button:hover {
                opacity: 1;
                color: #ef4444;
            }
            #agy-enhancer-popover {
                position: fixed;
                z-index: 99999;
                width: min(560px, calc(100vw - 28px));
                border-radius: 14px;
                border: 1px solid rgba(128, 128, 128, 0.28);
                background: var(--card, #1e1e1e);
                color: var(--foreground, #f3f4f6);
                box-shadow: 0 14px 36px rgba(0, 0, 0, 0.32);
                padding: 10px 12px;
                font-size: 12px;
                user-select: none;
                backdrop-filter: blur(12px);
            }
            .agy-pop-nav {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 4px;
                padding-bottom: 8px;
                margin-bottom: 8px;
                border-bottom: 1px solid rgba(128, 128, 128, 0.2);
                overflow-x: auto;
                white-space: nowrap;
            }
            .agy-pop-tab {
                padding: 4px 9px;
                border-radius: 7px;
                border: none;
                background: transparent;
                color: inherit;
                opacity: 0.75;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s;
            }
            .agy-pop-tab:hover {
                opacity: 1;
                background: rgba(128, 128, 128, 0.12);
            }
            .agy-pop-tab.active {
                opacity: 1;
                background: #10b981;
                color: #ffffff;
                font-weight: 600;
            }
            .agy-search-row {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 8px;
            }
            .agy-search-box {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                border-radius: 8px;
                border: 1px solid rgba(128, 128, 128, 0.28);
                background: rgba(128, 128, 128, 0.06);
            }
            .agy-search-box:focus-within {
                border-color: #10b981;
            }
            .agy-search-box input {
                width: 100%;
                border: none;
                outline: none;
                background: transparent;
                color: inherit;
                font-size: 12px;
            }
            .agy-scroll-list {
                max-height: 210px;
                overflow-y: auto;
                padding-right: 4px;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .agy-scroll-list::-webkit-scrollbar {
                width: 6px;
            }
            .agy-scroll-list::-webkit-scrollbar-track {
                background: rgba(128, 128, 128, 0.1);
                border-radius: 9999px;
            }
            .agy-scroll-list::-webkit-scrollbar-thumb {
                background: rgba(128, 128, 128, 0.42);
                border-radius: 9999px;
            }
            .agy-scroll-list::-webkit-scrollbar-thumb:hover {
                background: #10b981;
            }
            .agy-item-card {
                padding: 7px 9px;
                border-radius: 8px;
                border: 1px solid rgba(128, 128, 128, 0.2);
                background: rgba(128, 128, 128, 0.04);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                transition: border-color 0.15s, background 0.15s;
            }
            .agy-item-card:hover {
                border-color: #10b981;
                background: rgba(16, 185, 129, 0.08);
            }
            .agy-btn-primary {
                padding: 4px 10px;
                border-radius: 7px;
                border: none;
                background: #10b981;
                color: #ffffff;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                white-space: nowrap;
            }
            .agy-btn-primary:hover {
                opacity: 0.92;
            }

            /* Antigravity 官方原生对话时间线导航保留与增强 */
            [data-testid="conversation-navigator"] {
                visibility: visible !important;
                pointer-events: auto !important;
            }
            [data-testid="conversation-navigator"] ol {
                pointer-events: auto !important;
                opacity: 0.75;
                transition: opacity 0.2s ease, transform 0.2s ease;
            }
            [data-testid="conversation-navigator"]:hover ol,
            [data-testid="conversation-navigator"] ol:hover {
                opacity: 1 !important;
            }
            [data-testid="conversation-navigator-turn"] {
                cursor: pointer !important;
            }
            [data-testid="conversation-navigator-turn"]:hover span {
                background-color: #10b981 !important;
                transform: scale(1.35) !important;
            }
            
        `;
        document.head.appendChild(style);
    }

    function getConversationId() {
        const m = (window.location.pathname || '').match(/\/c\/([a-f0-9-]{20,})/i);
        return m ? m[1] : '';
    }

    async function syncBackendData() {
        const convoId = getConversationId();
        if (window.__agyEnhancerIPC__ && typeof window.__agyEnhancerIPC__.getData === 'function') {
            try {
                const res = await window.__agyEnhancerIPC__.getData({ conversationId: convoId });
                if (res && typeof res === 'object') {
                    if (Array.isArray(res.skills) && res.skills.length) state.data.skills = res.skills;
                    if (Array.isArray(res.prompts) && res.prompts.length) state.data.prompts = res.prompts;
                    if (Array.isArray(res.mcp) && res.mcp.length) state.data.mcp = res.mcp;
                    if (Array.isArray(res.kb) && res.kb.length) state.data.kb = res.kb;
                    if (Array.isArray(res.turns) && res.turns.length) state.data.turns = res.turns;
                    if (res.promptsDir) state.data.promptsDir = res.promptsDir;
                }
            } catch (e) {}
        }
        updateQuotaBadge();
    }

    // Read real-time model quotas from Antigravity's React Fiber on [data-testid="model-selector-trigger"]
    function readLiveModelQuotas() {
        const result = {
            selectedLabel: 'Argon',
            selectedPct: 73,
            models: [
                { family: 'Gemini 4 Argon', label: 'Weekly Limit', pct: 50, resetText: '' },
                { family: 'Gemini 3.8 模型', label: '5h / Weekly', pct: 97, resetText: '' },
                { family: 'Claude & GPT', label: '5h / Weekly', pct: 43, resetText: '' }
            ]
        };
        try {
            const btn = document.querySelector('[data-testid="model-selector-trigger"]');
            if (!btn) return result;
            const btnText = (btn.innerText || '').trim();
            const fk = Object.keys(btn).find(k => k.startsWith('__reactFiber$'));
            let cur = fk ? btn[fk] : null;
            let ctxVal = null;
            for (let i = 0; i < 32 && cur; i++) {
                const v = cur.memoizedProps?.value;
                if (v && typeof v === 'object' && 'selectedModel' in v) {
                    ctxVal = v;
                    break;
                }
                cur = cur.return;
            }
            if (ctxVal) {
                const sel = ctxVal.selectedModel;
                if (sel) {
                    const lbl = sel.label || btnText || 'Model';
                    let shortName = 'Model';
                    if (/Argon/i.test(lbl)) shortName = 'Argon';
                    else if (/Claude/i.test(lbl)) shortName = 'Claude';
                    else if (/Gemini/i.test(lbl)) shortName = 'Gemini';
                    else if (/GPT/i.test(lbl)) shortName = 'GPT';
                    const rem = sel.quotaInfo?.remainingFraction;
                    const pct = typeof rem === 'number' ? Math.round(rem * 100) : 100;
                    result.selectedLabel = shortName;
                    result.selectedPct = pct;
                }

                const cfgs = ctxVal.userStatus?.cascadeModelConfigData?.clientModelConfigs || ctxVal.modelOptions || [];
                if (Array.isArray(cfgs) && cfgs.length > 0) {
                    const findFamily = (regex, fallbackPct) => {
                        const item = cfgs.find(c => regex.test(c.label || ''));
                        if (!item || !item.quotaInfo) return { pct: fallbackPct, resetText: '' };
                        const pct = typeof item.quotaInfo.remainingFraction === 'number'
                            ? Math.round(item.quotaInfo.remainingFraction * 100)
                            : fallbackPct;
                        let resetText = '';
                        const sec = Number(item.quotaInfo.resetTime?.seconds || 0);
                        if (sec > 0) {
                            const diffHrs = Math.max(0, (sec * 1000 - Date.now()) / 3600000);
                            resetText = diffHrs >= 24 ? `${Math.round(diffHrs / 24)}天后重置` : `${diffHrs.toFixed(1)}h后重置`;
                        }
                        return { pct, resetText };
                    };
                    const argonQ = findFamily(/Argon/i, 50);
                    const geminiQ = findFamily(/Gemini 3/i, 97);
                    const claudeQ = findFamily(/Claude/i, 43);
                    result.models = [
                        { family: 'Gemini 4 Argon', label: 'Weekly Limit', pct: argonQ.pct, resetText: argonQ.resetText },
                        { family: 'Gemini 3.8 模型', label: '5h / Weekly', pct: geminiQ.pct, resetText: geminiQ.resetText },
                        { family: 'Claude & GPT', label: '5h / Weekly', pct: claudeQ.pct, resetText: claudeQ.resetText }
                    ];
                }
            }
        } catch (e) {}
        return result;
    }

    function insertSkillIntoComposer(cmdOrName) {
        const editor = document.querySelector('[data-lexical-editor="true"]') ||
                       document.querySelector('[contenteditable="true"][aria-label="Message input"]');
        if (!editor) return;
        editor.focus();

        const cleanName = cmdOrName.replace(/^\/+/, '').trim();
        if (!cleanName) return;

        if (editor.__lexicalEditor) {
            try {
                const lex = editor.__lexicalEditor;
                const ScopeKlass = lex._nodes.get('contextScopeItemMention')?.klass;
                const MentionKlass = lex._nodes.get('beautifulMention')?.klass;
                const TextKlass = lex._nodes.get('text')?.klass;
                const ParaKlass = lex._nodes.get('paragraph')?.klass;

                if (ScopeKlass && TextKlass && ParaKlass) {
                    const builtins = ['compact', 'goal', 'schedule', 'browser', 'plan', 'grill-me', 'teamwork-preview', 'learn', 'boost'];
                    const isSkill = !builtins.includes(cleanName);
                    const protoJson = JSON.stringify({
                        slashCommand: {
                            info: {
                                name: cleanName,
                                type: isSkill ? 2 : 1
                            }
                        }
                    });

                    lex.update(() => {
                        const root = lex.getEditorState()._nodeMap.get('root').getWritable();
                        const children = root.getChildren();
                        let p = children.length > 0 ? children[children.length - 1] : null;
                        if (!p || p.getType() !== 'paragraph') {
                            p = new ParaKlass();
                            root.append(p);
                        } else {
                            p = p.getWritable();
                        }
                        const node = new ScopeKlass({ data: protoJson });
                        const space = new TextKlass(' ');
                        p.append(node, space);
                        space.selectEnd();
                    }, { discrete: true });
                    editor.focus();
                    return;
                } else if (MentionKlass && TextKlass && ParaKlass) {
                    lex.update(() => {
                        const root = lex.getEditorState()._nodeMap.get('root').getWritable();
                        const children = root.getChildren();
                        let p = children.length > 0 ? children[children.length - 1] : null;
                        if (!p || p.getType() !== 'paragraph') {
                            p = new ParaKlass();
                            root.append(p);
                        } else {
                            p = p.getWritable();
                        }
                        const node = new MentionKlass('/', cleanName);
                        const space = new TextKlass(' ');
                        p.append(node, space);
                        space.selectEnd();
                    }, { discrete: true });
                    editor.focus();
                    return;
                }
            } catch (e) {
                console.warn('[Enhancer] Failed to insert native pill, fallback to text:', e);
            }
        }

        insertTextIntoComposer('/' + cleanName + ' ');
    }

    function insertTextIntoComposer(text) {
        const editor = document.querySelector('[data-lexical-editor="true"]') ||
                       document.querySelector('[contenteditable="true"][aria-label="Message input"]');
        if (!editor) return;
        editor.focus();
        try {
            const sel = window.getSelection();
            if (sel && editor.firstChild) {
                const range = document.createRange();
                range.selectNodeContents(editor);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
            const ok = document.execCommand('insertText', false, text);
            if (!ok) {
                const ev = new InputEvent('beforeinput', {
                    inputType: 'insertText',
                    data: text,
                    bubbles: true,
                    cancelable: true
                });
                editor.dispatchEvent(ev);
            }
        } catch (e) {}
    }

    async function attachMarkdownFileToComposer(title, content, filePath) {
        let mdBody = content || '';
        if (!mdBody && filePath && window.__agyEnhancerIPC__?.readFile) {
            try {
                const res = await window.__agyEnhancerIPC__.readFile({ filePath });
                if (res?.ok && res.content) mdBody = res.content;
            } catch (e) {}
        }

        // Try native Antigravity <input type="file"> attachment first!
        let nativeAttached = false;
        try {
            const box = document.getElementById('antigravity.agentSidePanelInputBox') ||
                        document.querySelector('[data-testid="agent-input-box"]');
            const fileInput = box ? box.querySelector('input[type="file"]') : document.querySelector('input[type="file"]');
            if (fileInput && mdBody) {
                const cleanName = title.endsWith('.md') ? title : (title + '.md');
                const fileObj = new File([mdBody], cleanName, { type: 'text/markdown', lastModified: Date.now() });
                const dt = new DataTransfer();
                dt.items.add(fileObj);
                fileInput.files = dt.files;
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                nativeAttached = true;
            }
        } catch (e) {}

        // Also record in our visual attachment chip bar if native input didn't render its own chip or for path reference
        if (!nativeAttached && filePath) {
            insertTextIntoComposer(`请参考文档 @${filePath} `);
        }
        if (!state.attachedChips.some(c => c.title === title)) {
            state.attachedChips.push({
                title,
                size: mdBody ? `${Math.max(0.1, mdBody.length / 1024).toFixed(1)} KB` : '已挂载',
                nativeAttached
            });
            renderAttachmentBar();
        }
        closePopover();
    }

    function renderAttachmentBar() {
        const box = document.getElementById('antigravity.agentSidePanelInputBox') ||
                    document.querySelector('[data-testid="agent-input-box"]');
        if (!box) return;
        let bar = document.getElementById('agy-enhancer-attach-bar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'agy-enhancer-attach-bar';
            box.insertBefore(bar, box.firstChild);
        }
        if (state.attachedChips.length === 0) {
            bar.innerHTML = '';
            return;
        }
        bar.innerHTML = state.attachedChips.map((c, idx) => `
            <div class="agy-attach-chip">
                <span>📄</span>
                <span style="font-weight:600;">${c.title}</span>
                <span style="opacity:0.7;">(${c.size} · .md附件已挂载)</span>
                <button data-rm-idx="${idx}" title="移除标记">×</button>
            </div>
        `).join('');
        bar.querySelectorAll('button[data-rm-idx]').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const i = Number(btn.getAttribute('data-rm-idx'));
                state.attachedChips.splice(i, 1);
                renderAttachmentBar();
            };
        });
    }

    function getLiveTurnCount() {
        try {
            const vp = document.querySelector('[data-testid="autoscroll-viewport"]');
            if (vp) {
                const fk = Object.keys(vp).find(k => k.startsWith('__reactFiber$'));
                let cur = fk ? vp[fk] : null;
                for (let i = 0; i < 35 && cur; i++) {
                    if (cur.memoizedProps?.turns && Array.isArray(cur.memoizedProps.turns)) {
                        return cur.memoizedProps.turns.length;
                    }
                    cur = cur.return;
                }
            }
        } catch (e) {}
        if (Array.isArray(state.data.turns) && state.data.turns.length > 0) {
            return state.data.turns.length;
        }
        return 1;
    }

    function updateQuotaBadge() {
        const q = readLiveModelQuotas();
        const dot = document.getElementById('agy-tb-quota-dot');
        const txt = document.getElementById('agy-tb-quota-txt');
        if (!dot || !txt) return;
        const pct = q.selectedPct;
        const dotColor = pct >= 60 ? '#10b981' : (pct >= 25 ? '#f59e0b' : '#ef4444');
        if (dot.style.background !== dotColor) dot.style.background = dotColor;

        const turnsCount = Math.max(getLiveTurnCount(), 1);

        let nextText = '';
        if (state.widthTier >= 4) {
            nextText = `${pct}%`;
        } else if (state.widthTier === 1) {
            nextText = `${turnsCount}轮·${q.selectedLabel} ${pct}%`;
        } else {
            nextText = `${q.selectedLabel} ${pct}%`;
        }
        if (txt.textContent !== nextText) {
            txt.textContent = nextText;
        }
    }

    function applyResponsiveTier(footerWidth) {
        let tier = 1;
        if (footerWidth < 370) tier = 4;
        else if (footerWidth < 440) tier = 3;
        else if (footerWidth < 520) tier = 2;
        else tier = 1;

        state.widthTier = tier;
        const btnSkills = document.getElementById('agy-btn-skills');
        const btnPrompts = document.getElementById('agy-btn-prompts');
        const btnMcp = document.getElementById('agy-btn-mcp');
        const btnKb = document.getElementById('agy-btn-kb');
        if (!btnSkills || !btnPrompts || !btnMcp || !btnKb) return;

        btnKb.style.display = tier <= 1 ? 'inline-flex' : 'none';
        btnMcp.style.display = tier <= 2 ? 'inline-flex' : 'none';
        btnPrompts.style.display = tier <= 3 ? 'inline-flex' : 'none';

        const skillsLbl = btnSkills.querySelector('.agy-lbl');
        if (skillsLbl) skillsLbl.style.display = tier <= 3 ? 'inline' : 'none';

        updateQuotaBadge();
    }

    let resizeObs = null;
    function ensureToolbarMounted() {
        injectStyles();
        const modelBtn = document.querySelector('[data-testid="model-selector-trigger"]');
        if (!modelBtn) return;
        const footerRow = modelBtn.closest('.\\@container\\/input-footer') || modelBtn.parentElement?.parentElement?.parentElement?.parentElement;
        const leftGroup = modelBtn.closest('.flex.min-w-0.flex-1.items-center') || modelBtn.parentElement;
        if (!leftGroup) return;

        let tb = document.getElementById('agy-enhancer-toolbar');
        if (!tb) {
            tb = document.createElement('div');
            tb.id = 'agy-enhancer-toolbar';
            tb.innerHTML = `
                <button type="button" class="agy-tb-btn" id="agy-btn-skills" title="打开技能库 (Skills)">
                    <span>📦</span><span class="agy-lbl">技能</span>
                </button>
                <button type="button" class="agy-tb-btn" id="agy-btn-prompts" title="打开 .md 提示词附件库">
                    <span>✨</span><span class="agy-lbl">提示词</span>
                </button>
                <button type="button" class="agy-tb-btn" id="agy-btn-mcp" title="打开 MCP 工具库">
                    <span>🔌</span><span class="agy-lbl">MCP</span>
                </button>
                <button type="button" class="agy-tb-btn" id="agy-btn-kb" title="打开知识库文档">
                    <span>📚</span><span class="agy-lbl">知识库</span>
                </button>
                <button type="button" class="agy-tb-quota" id="agy-btn-quota" title="查看全模型配额与对话轮次">
                    <span class="agy-dot" id="agy-tb-quota-dot" style="background:#10b981;"></span>
                    <span id="agy-tb-quota-txt">Argon 50%</span>
                </button>
            `;
            leftGroup.appendChild(tb);

            tb.querySelector('#agy-btn-skills').onclick = (e) => { e.stopPropagation(); togglePopover('skills'); };
            tb.querySelector('#agy-btn-prompts').onclick = (e) => { e.stopPropagation(); togglePopover('prompts'); };
            tb.querySelector('#agy-btn-mcp').onclick = (e) => { e.stopPropagation(); togglePopover('mcp'); };
            tb.querySelector('#agy-btn-kb').onclick = (e) => { e.stopPropagation(); togglePopover('kb'); };
            tb.querySelector('#agy-btn-quota').onclick = (e) => { e.stopPropagation(); togglePopover('quota'); };

            if (footerRow && window.ResizeObserver) {
                if (resizeObs) resizeObs.disconnect();
                resizeObs = new ResizeObserver(entries => {
                    for (const ent of entries) {
                        applyResponsiveTier(ent.contentRect.width);
                    }
                });
                resizeObs.observe(footerRow);
                applyResponsiveTier(footerRow.getBoundingClientRect().width);
            } else {
                applyResponsiveTier(window.innerWidth);
            }
            updateQuotaBadge();
        }
    }

    function closePopover() {
        state.popoverOpen = false;
        const pop = document.getElementById('agy-enhancer-popover');
        if (pop) pop.remove();
        document.querySelectorAll('#agy-enhancer-toolbar .active').forEach(el => el.classList.remove('active'));
    }

    function togglePopover(tab) {
        if (state.popoverOpen && state.activeTab === tab) {
            closePopover();
            return;
        }
        state.popoverOpen = true;
        if (state.activeTab !== tab) {
            state.searchQuery = '';
            state.addingPrompt = false;
        }
        state.activeTab = tab;
        syncBackendData();
        renderPopover();
    }

    function renderPopover() {
        if (!state.popoverOpen) return;
        let pop = document.getElementById('agy-enhancer-popover');
        if (!pop) {
            pop = document.createElement('div');
            pop.id = 'agy-enhancer-popover';
            pop.onclick = (e) => e.stopPropagation();
            document.body.appendChild(pop);
        }

        // Position right above the input box
        const box = document.getElementById('antigravity.agentSidePanelInputBox') ||
                    document.querySelector('[data-testid="agent-input-box"]') ||
                    document.getElementById('agy-enhancer-toolbar');
        if (box) {
            const rect = box.getBoundingClientRect();
            const bottomPx = Math.max(12, window.innerHeight - rect.top + 8);
            const leftPx = Math.max(12, Math.min(rect.left, window.innerWidth - 575));
            pop.style.bottom = `${bottomPx}px`;
            pop.style.left = `${leftPx}px`;
            pop.style.width = `${Math.min(560, Math.max(320, rect.width))}px`;
        }

        const tabs = [
            { id: 'skills', label: `📦 技能(${state.data.skills.length})` },
            { id: 'prompts', label: `✨ 提示词(${state.data.prompts.length})` },
            { id: 'mcp', label: `🔌 MCP(${state.data.mcp.length})` },
            { id: 'kb', label: `📚 知识库(${state.data.kb.length})` },
            { id: 'quota', label: `📊 配额` }
        ];

        const placeholders = {
            skills: '🔍 搜索技能名称、/命令或描述 (如 wordcraft、审查)...',
            prompts: '🔍 搜索 .md 提示词标题、标签或内容 (支持滚轮上下滚动)...',
            mcp: '🔍 搜索 MCP 服务或子工具名 (如 document、render)...',
            kb: '🔍 搜索知识库文档名或目录 (如 GEMINI、wiki)...'
        };

        const showSearch = state.activeTab !== 'quota' && !state.addingPrompt;

        pop.innerHTML = `
            <div class="agy-pop-nav">
                <div style="display:flex;align-items:center;gap:4px;">
                    ${tabs.map(t => `
                        <button type="button" class="agy-pop-tab ${t.id === state.activeTab ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>
                    `).join('')}
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="opacity:0.6;font-size:11px;">↕ 可滚动</span>
                    <button type="button" id="agy-pop-close" style="border:none;background:transparent;color:inherit;opacity:0.65;cursor:pointer;font-size:14px;">✕</button>
                </div>
            </div>
            ${showSearch ? `
                <div class="agy-search-row">
                    <div class="agy-search-box">
                        <input type="text" id="agy-pop-search" value="${state.searchQuery.replace(/"/g, '&quot;')}" placeholder="${placeholders[state.activeTab] || '🔍 搜索...'}" />
                        <button type="button" id="agy-pop-clear-search" style="border:none;background:transparent;color:inherit;opacity:0.6;cursor:pointer;">×</button>
                    </div>
                    ${state.activeTab === 'prompts' ? `<button type="button" class="agy-btn-primary" id="agy-btn-new-prompt">＋ 新建 .md</button>` : ''}
                </div>
            ` : ''}
            <div id="agy-pop-body"></div>
        `;

        pop.querySelectorAll('.agy-pop-tab').forEach(btn => {
            btn.onclick = () => {
                state.activeTab = btn.getAttribute('data-tab');
                state.searchQuery = '';
                state.addingPrompt = false;
                renderPopover();
            };
        });
        const closeBtn = pop.querySelector('#agy-pop-close');
        if (closeBtn) closeBtn.onclick = closePopover;

        const searchInp = pop.querySelector('#agy-pop-search');
        if (searchInp) {
            searchInp.oninput = () => {
                state.searchQuery = searchInp.value;
                renderPopoverBody();
            };
            setTimeout(() => searchInp.focus(), 10);
        }
        const clearBtn = pop.querySelector('#agy-pop-clear-search');
        if (clearBtn && searchInp) {
            clearBtn.onclick = () => {
                searchInp.value = '';
                state.searchQuery = '';
                renderPopoverBody();
                searchInp.focus();
            };
        }
        const newPromptBtn = pop.querySelector('#agy-btn-new-prompt');
        if (newPromptBtn) {
            newPromptBtn.onclick = () => {
                state.addingPrompt = true;
                renderPopover();
            };
        }

        renderPopoverBody();
    }

    function renderPopoverBody() {
        const body = document.getElementById('agy-pop-body');
        if (!body) return;
        const q = (state.searchQuery || '').trim().toLowerCase();

        if (state.activeTab === 'skills') {
            const list = state.data.skills.filter(s =>
                !q || s.cmd.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.desc || '').toLowerCase().includes(q)
            );
            body.innerHTML = `
                <div class="agy-scroll-list">
                    ${list.length === 0 ? `<div style="padding:18px;text-align:center;opacity:0.6;">未找到匹配的技能</div>` : list.map((s, i) => `
                        <div class="agy-item-card" data-skill-idx="${i}">
                            <div style="min-width:0;flex:1;">
                                <div style="display:flex;align-items:center;gap:6px;">
                                    <span style="font-family:monospace;font-weight:700;color:#10b981;">${s.cmd}</span>
                                    <span style="font-weight:600;">${s.name}</span>
                                    <span style="font-size:10px;padding:1px 5px;border-radius:4px;background:rgba(128,128,128,0.15);opacity:0.8;">${s.source}</span>
                                </div>
                                <div style="opacity:0.7;font-size:11px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.desc || ''}</div>
                            </div>
                            <span style="padding:3px 8px;border-radius:5px;background:rgba(16,185,129,0.14);color:#10b981;font-weight:600;flex-shrink:0;">填入 /命令</span>
                        </div>
                    `).join('')}
                </div>
            `;
            body.querySelectorAll('[data-skill-idx]').forEach(el => {
                el.onclick = () => {
                    const item = list[Number(el.getAttribute('data-skill-idx'))];
                    if (item) {
                        insertSkillIntoComposer(item.cmd);
                        closePopover();
                    }
                };
            });
        } else if (state.activeTab === 'prompts') {
            if (state.addingPrompt) {
                body.innerHTML = `
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span style="font-weight:600;">➕ 新建 .md 提示词附件 (保存至 ${state.data.promptsDir})</span>
                            <button type="button" id="agy-back-prompts" style="border:none;background:transparent;color:inherit;opacity:0.75;cursor:pointer;">← 返回列表</button>
                        </div>
                        <div style="display:flex;gap:6px;">
                            <input id="agy-np-title" type="text" placeholder="文件名 (如：课程达成度评价方案.md)" style="flex:1;padding:5px 8px;border-radius:6px;border:1px solid rgba(128,128,128,0.3);background:transparent;color:inherit;outline:none;" />
                            <input id="agy-np-tag" type="text" placeholder="标签 (如：模板)" style="width:100px;padding:5px 8px;border-radius:6px;border:1px solid rgba(128,128,128,0.3);background:transparent;color:inherit;outline:none;" />
                        </div>
                        <textarea id="agy-np-content" rows="4" placeholder="在此粘贴长篇 Markdown 提示词正文，保存后生成独立 .md 文件，点击即作为附件挂载到输入框..." style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid rgba(128,128,128,0.3);background:transparent;color:inherit;outline:none;resize:vertical;"></textarea>
                        <div style="display:flex;justify-content:flex-end;gap:6px;">
                            <button type="button" class="agy-btn-primary" id="agy-save-prompt-btn">💾 保存为 .md 文件并挂载</button>
                        </div>
                    </div>
                `;
                body.querySelector('#agy-back-prompts').onclick = () => {
                    state.addingPrompt = false;
                    renderPopover();
                };
                body.querySelector('#agy-save-prompt-btn').onclick = async () => {
                    let fname = (body.querySelector('#agy-np-title').value || '自定义提示词.md').trim();
                    if (!fname.toLowerCase().endsWith('.md')) fname += '.md';
                    const tag = (body.querySelector('#agy-np-tag').value || '自定义').trim();
                    const content = body.querySelector('#agy-np-content').value || '# 提示词\n';
                    const newEntry = {
                        title: fname,
                        tag,
                        size: `${Math.max(0.1, content.length / 1024).toFixed(1)} KB · ${content.split(/\r?\n/).length}行`,
                        path: `${state.data.promptsDir}/${fname}`,
                        summary: content.replace(/[#*`>_]/g, '').trim().slice(0, 100),
                        content
                    };
                    if (window.__agyEnhancerIPC__?.savePrompt) {
                        try {
                            const r = await window.__agyEnhancerIPC__.savePrompt({ filename: fname, tag, content });
                            if (r?.prompts) state.data.prompts = r.prompts;
                        } catch (e) {}
                    } else {
                        state.data.prompts.unshift(newEntry);
                        try {
                            const savedLocal = JSON.parse(localStorage.getItem('__agy_enhancer_local_prompts__') || '[]');
                            savedLocal.unshift(newEntry);
                            localStorage.setItem('__agy_enhancer_local_prompts__', JSON.stringify(savedLocal));
                        } catch (e) {}
                    }
                    state.addingPrompt = false;
                    await attachMarkdownFileToComposer(newEntry.title, newEntry.content, newEntry.path);
                };
                return;
            }

            const list = state.data.prompts.filter(p =>
                !q || p.title.toLowerCase().includes(q) || (p.tag || '').toLowerCase().includes(q) || (p.summary || '').toLowerCase().includes(q)
            );
            body.innerHTML = `
                <div class="agy-scroll-list">
                    ${list.length === 0 ? `<div style="padding:18px;text-align:center;opacity:0.6;">未找到匹配的 .md 提示词</div>` : list.map((p, i) => `
                        <div class="agy-item-card" data-prompt-idx="${i}">
                            <div style="min-width:0;flex:1;">
                                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                                    <span>📄</span>
                                    <span style="font-weight:600;">${p.title}</span>
                                    <span style="font-size:10.5px;padding:1px 6px;border-radius:4px;background:rgba(16,185,129,0.15);color:#10b981;font-weight:600;">${p.tag || '提示词'}</span>
                                    <span style="font-size:11px;opacity:0.65;font-family:monospace;">${p.size || ''}</span>
                                </div>
                                <div style="opacity:0.7;font-size:11px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.summary || ''}</div>
                            </div>
                            <span style="padding:3px 8px;border-radius:5px;background:rgba(16,185,129,0.14);color:#10b981;font-weight:600;flex-shrink:0;">📎 挂载 .md 附件</span>
                        </div>
                    `).join('')}
                </div>
            `;
            body.querySelectorAll('[data-prompt-idx]').forEach(el => {
                el.onclick = () => {
                    const item = list[Number(el.getAttribute('data-prompt-idx'))];
                    if (item) attachMarkdownFileToComposer(item.title, item.content, item.path);
                };
            });
        } else if (state.activeTab === 'mcp') {
            const list = state.data.mcp.filter(m =>
                !q || m.tool.toLowerCase().includes(q) || m.server.toLowerCase().includes(q) || (m.desc || '').toLowerCase().includes(q)
            );
            body.innerHTML = `
                <div class="agy-scroll-list">
                    ${list.length === 0 ? `<div style="padding:18px;text-align:center;opacity:0.6;">未找到匹配的 MCP 工具</div>` : list.map((m, i) => `
                        <div class="agy-item-card" data-mcp-idx="${i}">
                            <div style="min-width:0;flex:1;">
                                <span style="font-family:monospace;font-weight:700;color:#10b981;">${m.server}.${m.tool}</span>
                                <span style="opacity:0.75;margin-left:6px;">${m.desc || ''}</span>
                            </div>
                            <span style="padding:2px 7px;border-radius:5px;background:rgba(128,128,128,0.14);flex-shrink:0;">填入指令</span>
                        </div>
                    `).join('')}
                </div>
            `;
            body.querySelectorAll('[data-mcp-idx]').forEach(el => {
                el.onclick = () => {
                    const item = list[Number(el.getAttribute('data-mcp-idx'))];
                    if (item) {
                        insertTextIntoComposer(`请调用 ${item.server} MCP 的 ${item.tool} 工具：`);
                        closePopover();
                    }
                };
            });
        } else if (state.activeTab === 'kb') {
            const list = state.data.kb.filter(k =>
                !q || k.name.toLowerCase().includes(q) || (k.folder || '').toLowerCase().includes(q) || (k.path || '').toLowerCase().includes(q)
            );
            body.innerHTML = `
                <div class="agy-scroll-list">
                    ${list.length === 0 ? `<div style="padding:18px;text-align:center;opacity:0.6;">未找到匹配的知识库文档</div>` : list.map((k, i) => `
                        <div class="agy-item-card" data-kb-idx="${i}">
                            <div style="min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                <span>📘</span>
                                <span style="font-weight:600;margin-left:4px;">${k.name}</span>
                                <span style="opacity:0.65;margin-left:6px;">[${k.folder}]</span>
                            </div>
                            <span style="padding:2px 7px;border-radius:5px;background:rgba(16,185,129,0.14);color:#10b981;font-weight:600;flex-shrink:0;">📎 挂载引用</span>
                        </div>
                    `).join('')}
                </div>
            `;
            body.querySelectorAll('[data-kb-idx]').forEach(el => {
                el.onclick = () => {
                    const item = list[Number(el.getAttribute('data-kb-idx'))];
                    if (item) attachMarkdownFileToComposer(item.name, item.content || '', item.path);
                };
            });
        } else if (state.activeTab === 'quota') {
            const qInfo = readLiveModelQuotas();
            const turnsCount = Math.max(getLiveTurnCount(), 1);
            body.innerHTML = `
                <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;">
                    ${qInfo.models.map(m => {
                        const color = m.pct >= 60 ? '#10b981' : (m.pct >= 25 ? '#f59e0b' : '#ef4444');
                        return `
                            <div style="padding:8px 10px;border-radius:8px;border:1px solid rgba(128,128,128,0.22);background:rgba(128,128,128,0.04);">
                                <div style="font-weight:600;opacity:0.85;">${m.family}</div>
                                <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:4px;">
                                    <span style="opacity:0.65;font-size:11px;">${m.label}</span>
                                    <span style="font-family:monospace;font-size:14px;font-weight:700;color:${color};">${m.pct}%</span>
                                </div>
                                <div style="width:100%;height:4px;border-radius:9999px;background:rgba(128,128,128,0.2);margin-top:5px;overflow:hidden;">
                                    <div style="width:${m.pct}%;height:100%;background:${color};"></div>
                                </div>
                                ${m.resetText ? `<div style="font-size:10.5px;opacity:0.6;margin-top:4px;">⏱ ${m.resetText}</div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(128,128,128,0.2);display:flex;justify-content:space-between;align-items:center;">
                    <span style="opacity:0.75;">当前对话已进行 <b>${turnsCount}</b> 轮用户提问 · 当前选中模型剩余 <b>${qInfo.selectedPct}%</b></span>
                    <button type="button" class="agy-btn-primary" id="agy-btn-compact">/compact 压缩上下文</button>
                </div>
            `;
            const compactBtn = body.querySelector('#agy-btn-compact');
            if (compactBtn) {
                compactBtn.onclick = () => {
                    insertSkillIntoComposer('/compact');
                    closePopover();
                };
            }
        }
    }



    document.addEventListener('click', (e) => {
        if (state.popoverOpen) {
            const pop = document.getElementById('agy-enhancer-popover');
            const tb = document.getElementById('agy-enhancer-toolbar');
            if (pop && !pop.contains(e.target) && (!tb || !tb.contains(e.target))) {
                closePopover();
            }
        }
    });

    function tick() {
        ensureToolbarMounted();
        const cid = getConversationId();
        if (cid && cid !== state.lastConvoId) {
            state.lastConvoId = cid;
            state.data.turns = [];
            syncBackendData();
        } else {
            updateQuotaBadge();
        }
    }

    window.__AGY_UI_ENHANCER_REFRESH__ = () => {
        syncBackendData();
        tick();
    };

    window.__AGY_UI_ENHANCER_TIMER__ = setInterval(tick, 1200);
    setTimeout(() => {
        syncBackendData();
        tick();
    }, 150);
})();
