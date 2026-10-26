/* --- AGY UI ENHANCER IPC START --- */
try {
    const _fsSync = require('fs');
    const _pathMod = require('path');
    const _osMod = require('os');

    function _agyGetPromptsDir() {
        const candidates = [
            'E:/82-CherryStudio/ALL-Agent-Skills/_prompts',
            'D:/82-CherryStudio/ALL-Agent-Skills/_prompts',
            _pathMod.join(_osMod.homedir(), '.gemini', 'antigravity', '_prompts')
        ];
        for (const c of candidates) {
            const parentDir = _pathMod.dirname(c);
            if (_fsSync.existsSync(parentDir)) {
                if (!_fsSync.existsSync(c)) {
                    try { _fsSync.mkdirSync(c, { recursive: true }); } catch (e) {}
                }
                if (_fsSync.existsSync(c)) return c;
            }
        }
        const fallback = _pathMod.join(_osMod.homedir(), '.gemini', 'antigravity', '_prompts');
        try { _fsSync.mkdirSync(fallback, { recursive: true }); } catch (e) {}
        return fallback;
    }

    function _agyParseFrontmatter(mdText) {
        const res = {};
        if (!mdText || !mdText.startsWith('---')) return res;
        const endIdx = mdText.indexOf('\n---', 3);
        if (endIdx === -1) return res;
        const lines = mdText.slice(3, endIdx).split(/\r?\n/);
        for (const line of lines) {
            const m = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.+)$/);
            if (m) {
                res[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
            }
        }
        return res;
    }

    function _agyScanSkills() {
        const home = _osMod.homedir();
        const skillRoots = [];
        try {
            const cfgPath = _pathMod.join(home, '.gemini', 'config', 'skills.json');
            if (_fsSync.existsSync(cfgPath)) {
                const cfg = JSON.parse(_fsSync.readFileSync(cfgPath, 'utf-8'));
                const list = Array.isArray(cfg) ? cfg : (cfg.paths || cfg.skills || cfg.directories || []);
                for (const item of list) {
                    const p = typeof item === 'string' ? item : item?.path;
                    if (p && _fsSync.existsSync(p)) skillRoots.push({ path: p, source: '共享主库' });
                }
            }
        } catch (e) {}

        for (const fixed of ['E:/82-CherryStudio/ALL-Agent-Skills', 'D:/82-CherryStudio/ALL-Agent-Skills']) {
            if (_fsSync.existsSync(fixed) && !skillRoots.some(r => _pathMod.resolve(r.path) === _pathMod.resolve(fixed))) {
                skillRoots.push({ path: fixed, source: '共享主库' });
            }
        }

        const builtinRoot = _pathMod.join(home, '.gemini', 'antigravity', 'builtin', 'skills');
        if (_fsSync.existsSync(builtinRoot)) {
            skillRoots.push({ path: builtinRoot, source: '内置技能' });
        }

        const seen = new Set();
        const skills = [];
        const skipDirs = new Set(['_backup', '_prompts', '_agy-enhancer', 'fbs-bookwriter', '.git', 'node_modules']);

        for (const root of skillRoots) {
            try {
                const entries = _fsSync.readdirSync(root.path, { withFileTypes: true });
                for (const ent of entries) {
                    if (!ent.isDirectory() || skipDirs.has(ent.name) || ent.name.startsWith('_') || ent.name.startsWith('.')) continue;
                    const skillMd = _pathMod.join(root.path, ent.name, 'SKILL.md');
                    if (!_fsSync.existsSync(skillMd)) continue;
                    const raw = _fsSync.readFileSync(skillMd, 'utf-8');
                    const fm = _agyParseFrontmatter(raw);
                    const cmdName = (fm.name || ent.name).replace(/_/g, '-');
                    if (seen.has(cmdName)) continue;
                    seen.add(cmdName);
                    const title = fm.display_name || fm.name || ent.name;
                    const desc = (fm.description_zh || fm.description || '').slice(0, 140);
                    skills.push({
                        cmd: '/' + cmdName,
                        name: title,
                        desc: desc,
                        source: root.source,
                        path: skillMd.replace(/\\/g, '/')
                    });
                }
            } catch (e) {}
        }
        return skills;
    }

    function _agyScanPrompts() {
        const dir = _agyGetPromptsDir();
        const prompts = [];
        try {
            if (!_fsSync.existsSync(dir)) return prompts;
            const entries = _fsSync.readdirSync(dir, { withFileTypes: true });
            for (const ent of entries) {
                if (!ent.isFile() || !ent.name.toLowerCase().endsWith('.md')) continue;
                const fullPath = _pathMod.join(dir, ent.name);
                const raw = _fsSync.readFileSync(fullPath, 'utf-8');
                const stat = _fsSync.statSync(fullPath);
                const lines = raw.split(/\r?\n/);
                const kb = Math.max(0.1, stat.size / 1024).toFixed(1) + ' KB · ' + lines.length + '行';
                let tag = '提示词附件';
                if (ent.name.includes('系主任')) tag = '案例样本';
                else if (ent.name.includes('GrillMe') || ent.name.includes('追问')) tag = '架构追问';
                else if (ent.name.includes('WordCraft') || ent.name.includes('公文')) tag = '公文排版';
                else if (ent.name.includes('重构') || ent.name.includes('安全')) tag = '代码工程';

                const bodyPreview = lines
                    .filter(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('---'))
                    .slice(0, 2)
                    .join(' ')
                    .replace(/[*`>_]/g, '')
                    .slice(0, 110);

                prompts.push({
                    title: ent.name,
                    tag: tag,
                    size: kb,
                    path: fullPath.replace(/\\/g, '/'),
                    summary: bodyPreview || lines[0] || ent.name,
                    content: raw
                });
            }
        } catch (e) {}
        return prompts;
    }

    function _agyScanMcp() {
        const home = _osMod.homedir();
        const mcpRoot = _pathMod.join(home, '.gemini', 'antigravity', 'mcp');
        const tools = [];
        try {
            if (!_fsSync.existsSync(mcpRoot)) return tools;
            const entries = _fsSync.readdirSync(mcpRoot, { withFileTypes: true });
            for (const ent of entries) {
                if (!ent.isDirectory()) continue;
                const serverName = ent.name;
                const srvDir = _pathMod.join(mcpRoot, serverName);
                const files = _fsSync.readdirSync(srvDir);
                for (const f of files) {
                    if (!f.endsWith('.json')) continue;
                    try {
                        const schema = JSON.parse(_fsSync.readFileSync(_pathMod.join(srvDir, f), 'utf-8'));
                        const tName = schema.name || f.replace(/\.json$/, '');
                        const tDesc = (schema.description || '').slice(0, 120);
                        tools.push({
                            server: serverName,
                            tool: tName,
                            desc: tDesc || (serverName + ' 子工具')
                        });
                    } catch (e) {}
                }
            }
        } catch (e) {}
        return tools;
    }

    function _agyScanKnowledgeBase() {
        const home = _osMod.homedir();
        const kbDirs = [
            { path: 'e:/83-Antigravity/1-工作空间/1-电脑日常', label: '当前工作区' },
            { path: 'E:/82-CherryStudio/1-工作空间/1-全能助手/1-知识库/wiki', label: '1-知识库/wiki' },
            { path: 'E:/82-CherryStudio/1-工作空间/1-全能助手/1-知识库', label: '1-知识库' },
            { path: 'E:/82-CherryStudio/ALL-Agent-Skills', label: 'ALL-Agent-Skills' },
            { path: _pathMod.join(home, '.gemini', 'config'), label: '.gemini/config' }
        ];
        const docs = [];
        const seenPaths = new Set();
        const exts = new Set(['.md', '.txt', '.json', '.docx', '.pdf']);

        for (const kd of kbDirs) {
            try {
                if (!_fsSync.existsSync(kd.path)) continue;
                const walk = (dir, depth) => {
                    if (depth > 2 || docs.length >= 60) return;
                    const items = _fsSync.readdirSync(dir, { withFileTypes: true });
                    for (const it of items) {
                        if (docs.length >= 60) break;
                        if (it.name.startsWith('.') || it.name === 'node_modules' || it.name === '_backup' || it.name === '_agy-enhancer') continue;
                        const fp = _pathMod.join(dir, it.name);
                        const norm = fp.replace(/\\/g, '/');
                        if (it.isDirectory()) {
                            walk(fp, depth + 1);
                        } else if (it.isFile()) {
                            const ext = _pathMod.extname(it.name).toLowerCase();
                            if (!exts.has(ext) || seenPaths.has(norm)) continue;
                            seenPaths.add(norm);
                            const st = _fsSync.statSync(fp);
                            docs.push({
                                name: it.name,
                                folder: kd.label,
                                path: norm,
                                size: Math.max(0.1, st.size / 1024).toFixed(1) + ' KB'
                            });
                        }
                    }
                };
                walk(kd.path, 0);
            } catch (e) {}
        }
        return docs;
    }

    function _agyScanConversationTurns(conversationId) {
        const turns = [];
        if (!conversationId) return turns;
        try {
            const home = _osMod.homedir();
            const transcriptPath = _pathMod.join(home, '.gemini', 'antigravity', 'brain', conversationId, '.system_generated', 'logs', 'transcript.jsonl');
            if (!_fsSync.existsSync(transcriptPath)) return turns;
            const rawLines = _fsSync.readFileSync(transcriptPath, 'utf-8').split(/\r?\n/);
            let turnNum = 0;
            for (const line of rawLines) {
                if (!line.trim()) continue;
                try {
                    const obj = JSON.parse(line);
                    if (obj.type === 'USER_INPUT' && obj.content) {
                        turnNum++;
                        let text = obj.content;
                        const m = text.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
                        if (m) text = m[1].trim();
                        turns.push({
                            turnNumber: turnNum,
                            stepIndex: obj.step_index,
                            text: text.slice(0, 180),
                            createdAt: obj.created_at || ''
                        });
                    }
                } catch (e) {}
            }
        } catch (e) {}
        return turns;
    }

    try { electron_1.ipcMain.removeHandler('agy-enhancer:get-data'); } catch (e) {}
    electron_1.ipcMain.handle('agy-enhancer:get-data', async (_event, payload) => {
        const convoId = payload?.conversationId || '';
        return {
            promptsDir: _agyGetPromptsDir().replace(/\\/g, '/'),
            skills: _agyScanSkills(),
            prompts: _agyScanPrompts(),
            mcp: _agyScanMcp(),
            kb: _agyScanKnowledgeBase(),
            turns: _agyScanConversationTurns(convoId)
        };
    });

    try { electron_1.ipcMain.removeHandler('agy-enhancer:save-prompt'); } catch (e) {}
    electron_1.ipcMain.handle('agy-enhancer:save-prompt', async (_event, payload) => {
        const dir = _agyGetPromptsDir();
        let fname = (payload?.filename || '自定义提示词.md').trim().replace(/[\\/:*?"<>|]/g, '-');
        if (!fname.toLowerCase().endsWith('.md')) fname += '.md';
        const fullPath = _pathMod.join(dir, fname);
        const content = payload?.content || '# 提示词\n';
        _fsSync.writeFileSync(fullPath, content, 'utf-8');
        return { ok: true, path: fullPath.replace(/\\/g, '/'), prompts: _agyScanPrompts() };
    });

    try { electron_1.ipcMain.removeHandler('agy-enhancer:delete-prompt'); } catch (e) {}
    electron_1.ipcMain.handle('agy-enhancer:delete-prompt', async (_event, payload) => {
        const dir = _agyGetPromptsDir();
        const fname = _pathMod.basename(payload?.filename || '');
        if (fname) {
            const fullPath = _pathMod.join(dir, fname);
            if (_fsSync.existsSync(fullPath)) _fsSync.unlinkSync(fullPath);
        }
        return { ok: true, prompts: _agyScanPrompts() };
    });

    try { electron_1.ipcMain.removeHandler('agy-enhancer:read-file'); } catch (e) {}
    electron_1.ipcMain.handle('agy-enhancer:read-file', async (_event, payload) => {
        const fp = payload?.filePath || '';
        if (!fp || !_fsSync.existsSync(fp)) return { ok: false };
        const st = _fsSync.statSync(fp);
        if (st.size > 2 * 1024 * 1024) return { ok: false, reason: 'too_large' };
        const content = _fsSync.readFileSync(fp, 'utf-8');
        return { ok: true, name: _pathMod.basename(fp), content };
    });
} catch (err) {
    console.error('[AGY Enhancer IPC Error]', err);
}
/* --- AGY UI ENHANCER IPC END --- */
