#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Antigravity UI Enhancer — 一键注入安装脚本 (支持跨电脑迁移 + 运行中热注入 + app.asar 持久化)
功能：
  1. 自动定位本机 Antigravity 的 resources/app.asar 并创建备份 app.asar.before-enhancer.bak
  2. 将 IPC 文件读写桥接注入 dist/ipcHandlers.js，将 UI 增强层注入 dist/preload.js（与汉化补丁完全兼容）
  3. 若检测到 Antigravity 正在运行 (DevToolsActivePort)，自动通过 CDP 热注入当前窗口，无需重启立即生效！
"""

import os
import re
import sys
if sys.stdout and sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass
import json
import shutil
import socket
import struct
import base64
import hashlib
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))

IPC_START = "/* --- AGY UI ENHANCER IPC START --- */"
IPC_END = "/* --- AGY UI ENHANCER IPC END --- */"
PRELOAD_START = "/* --- AGY UI ENHANCER START --- */"
PRELOAD_END = "/* --- AGY UI ENHANCER END --- */"


def find_app_asar():
    candidates = [
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\antigravity\resources\app.asar"),
        r"C:\Program Files\Antigravity\resources\app.asar",
        r"C:\Program Files (x86)\Antigravity\resources\app.asar",
        r"D:\Programs\antigravity\resources\app.asar",
        r"E:\Programs\antigravity\resources\app.asar",
    ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    raise FileNotFoundError("未找到 Antigravity 的 app.asar，请检查安装路径。")


def collect_bootstrap_data():
    """收集当前电脑上的技能、.md 提示词、MCP 工具与知识库列表作为热注入/离线初始数据"""
    home = os.path.expanduser("~")
    prompts_dir = os.path.normpath(os.path.join(HERE, "..", "_prompts"))
    if not os.path.isdir(prompts_dir):
        prompts_dir = os.path.join(home, ".gemini", "antigravity", "_prompts")
    os.makedirs(prompts_dir, exist_ok=True)

    prompts = []
    for fname in sorted(os.listdir(prompts_dir)):
        if not fname.lower().endswith(".md"):
            continue
        fpath = os.path.join(prompts_dir, fname)
        if not os.path.isfile(fpath):
            continue
        raw = open(fpath, "r", encoding="utf-8", errors="replace").read()
        lines = raw.splitlines()
        kb = f"{max(0.1, os.path.getsize(fpath) / 1024):.1f} KB · {len(lines)}行"
        tag = "提示词附件"
        if "系主任" in fname:
            tag = "案例样本"
        elif "GrillMe" in fname or "追问" in fname:
            tag = "架构追问"
        elif "WordCraft" in fname or "公文" in fname:
            tag = "公文排版"
        elif "重构" in fname or "安全" in fname:
            tag = "代码工程"
        body_lines = [l.strip() for l in lines if l.strip() and not l.strip().startswith("#") and not l.strip().startswith("---")]
        summary = re.sub(r"[*`>_]", "", " ".join(body_lines[:2]))[:110] or fname
        prompts.append({
            "title": fname,
            "tag": tag,
            "size": kb,
            "path": fpath.replace("\\", "/"),
            "summary": summary,
            "content": raw
        })

    # Scan skills
    skills = []
    seen_skills = set()
    skill_roots = [
        (os.path.normpath(os.path.join(HERE, "..")), "共享主库"),
        (os.path.join(home, ".gemini", "antigravity", "builtin", "skills"), "内置技能"),
    ]
    skip_dirs = {"_backup", "_prompts", "_agy-enhancer", "fbs-bookwriter", ".git", "node_modules"}
    for root_path, source_label in skill_roots:
        if not os.path.isdir(root_path):
            continue
        for ent in sorted(os.listdir(root_path)):
            if ent in skip_dirs or ent.startswith("_") or ent.startswith("."):
                continue
            skill_md = os.path.join(root_path, ent, "SKILL.md")
            if not os.path.isfile(skill_md):
                continue
            raw = open(skill_md, "r", encoding="utf-8", errors="replace").read()
            cmd_name = ent.replace("_", "-")
            if cmd_name in seen_skills:
                continue
            seen_skills.add(cmd_name)
            m_disp = re.search(r"^display_name\s*:\s*(.+)$", raw, re.M)
            m_desc = re.search(r"^(?:description_zh|description)\s*:\s*(.+)$", raw, re.M)
            title = m_disp.group(1).strip().strip("'\"") if m_disp else ent
            desc = m_desc.group(1).strip().strip("'\"")[:140] if m_desc else ""
            skills.append({
                "cmd": "/" + cmd_name,
                "name": title,
                "desc": desc,
                "source": source_label,
                "path": skill_md.replace("\\", "/")
            })

    # Scan MCP tools
    mcp_tools = []
    mcp_root = os.path.join(home, ".gemini", "antigravity", "mcp")
    if os.path.isdir(mcp_root):
        for srv in sorted(os.listdir(mcp_root)):
            srv_dir = os.path.join(mcp_root, srv)
            if not os.path.isdir(srv_dir):
                continue
            for fn in sorted(os.listdir(srv_dir)):
                if not fn.endswith(".json"):
                    continue
                try:
                    sc = json.loads(open(os.path.join(srv_dir, fn), "r", encoding="utf-8").read())
                    t_name = sc.get("name") or fn[:-5]
                    t_desc = (sc.get("description") or "")[:120]
                    mcp_tools.append({"server": srv, "tool": t_name, "desc": t_desc})
                except Exception:
                    pass

    # Scan Knowledge Base
    kb_docs = []
    kb_dirs = [
        (r"e:\83-Antigravity\1-工作空间\1-电脑日常", "当前工作区"),
        (r"E:\82-CherryStudio\1-工作空间\1-全能助手\1-知识库\wiki", "1-知识库/wiki"),
        (os.path.normpath(os.path.join(HERE, "..")), "ALL-Agent-Skills"),
        (os.path.join(home, ".gemini", "config"), ".gemini/config"),
    ]
    seen_kb = set()
    for kd, label in kb_dirs:
        if not os.path.isdir(kd):
            continue
        for root, dirs, files in os.walk(kd):
            dirs[:] = [d for d in dirs if not d.startswith(".") and not d.startswith("_") and d != "node_modules"]
            for f in files:
                if len(kb_docs) >= 50:
                    break
                ext = os.path.splitext(f)[1].lower()
                if ext not in {".md", ".txt", ".json", ".docx", ".pdf"}:
                    continue
                fp = os.path.join(root, f)
                norm = fp.replace("\\", "/")
                if norm in seen_kb:
                    continue
                seen_kb.add(norm)
                st_size = os.path.getsize(fp)
                content_str = ""
                if ext in {".md", ".txt", ".json"} and st_size < 120 * 1024:
                    try:
                        content_str = open(fp, "r", encoding="utf-8", errors="replace").read()
                    except Exception:
                        pass
                kb_docs.append({
                    "name": f,
                    "folder": label,
                    "path": norm,
                    "size": f"{max(0.1, st_size / 1024):.1f} KB",
                    "content": content_str
                })

    return {
        "promptsDir": prompts_dir.replace("\\", "/"),
        "skills": skills,
        "prompts": prompts,
        "mcp": mcp_tools,
        "kb": kb_docs,
        "turns": []
    }


def strip_block(text, start_marker, end_marker):
    pattern = re.compile(re.escape(start_marker) + r"[\s\S]*?" + re.escape(end_marker) + r"\s*", re.M)
    return pattern.sub("", text)


def build_preload_injection(ui_core_js, bootstrap_data):
    bootstrap_json = json.dumps(bootstrap_data, ensure_ascii=False)
    ui_with_bootstrap = f"window.__AGY_ENHANCER_BOOTSTRAP_DATA__ = {bootstrap_json};\n" + ui_core_js
    ui_b64 = base64.b64encode(ui_with_bootstrap.encode("utf-8")).decode("ascii")

    return f"""
{PRELOAD_START}
(() => {{
    try {{
        const enhancerAPI = {{
            getData: (payload) => electron_1.ipcRenderer.invoke('agy-enhancer:get-data', payload),
            savePrompt: (payload) => electron_1.ipcRenderer.invoke('agy-enhancer:save-prompt', payload),
            deletePrompt: (payload) => electron_1.ipcRenderer.invoke('agy-enhancer:delete-prompt', payload),
            readFile: (payload) => electron_1.ipcRenderer.invoke('agy-enhancer:read-file', payload),
        }};
        electron_1.contextBridge.exposeInMainWorld('__agyEnhancerIPC__', enhancerAPI);
    }} catch (e) {{}}

    const UI_CODE_B64 = "{ui_b64}";
    function injectEnhancerMainScript() {{
        try {{
            if (document.getElementById('__agy_enhancer_main_script__')) return;
            const target = document.head || document.documentElement;
            if (!target) return;
            const bin = Uint8Array.from(atob(UI_CODE_B64), c => c.charCodeAt(0));
            const code = new TextDecoder('utf-8').decode(bin);
            const s = document.createElement('script');
            s.id = '__agy_enhancer_main_script__';
            s.textContent = code;
            target.appendChild(s);
        }} catch (e) {{
            console.error('[AGY Enhancer Preload Inject Error]', e);
        }}
    }}

    if (document.readyState === 'loading') {{
        document.addEventListener('DOMContentLoaded', injectEnhancerMainScript);
    }} else {{
        injectEnhancerMainScript();
    }}
    window.addEventListener('load', injectEnhancerMainScript);
    setTimeout(injectEnhancerMainScript, 300);
    setTimeout(injectEnhancerMainScript, 1200);
    setTimeout(injectEnhancerMainScript, 3000);
}})();
{PRELOAD_END}
"""


def update_asar_archive(asar_path, replacements):
    """
    replacements: dict mapping ('dist', 'preload.js') -> new_bytes
    """
    with open(asar_path, "rb") as f:
        header_pre = f.read(16)
        _, header_size, _, json_size = struct.unpack("<4I", header_pre)
        header_json_bytes = f.read(json_size)
        header = json.loads(header_json_bytes.decode("utf-8"))
        data_offset = 8 + header_size
        f.seek(data_offset)
        old_payload = f.read()

    new_chunks = []
    current_offset = 0

    def walk_node(node, path_tuple=()):
        nonlocal current_offset
        if "files" in node:
            for k, child in node["files"].items():
                walk_node(child, path_tuple + (k,))
            return
        if node.get("unpacked"):
            return
        if "offset" in node and "size" in node:
            if path_tuple in replacements:
                content_bytes = replacements[path_tuple]
            else:
                old_off = int(node["offset"])
                old_sz = int(node["size"])
                content_bytes = old_payload[old_off : old_off + old_sz]

            node["offset"] = str(current_offset)
            node["size"] = len(content_bytes)
            if "integrity" in node:
                block_size = node["integrity"].get("blockSize", 4 * 1024 * 1024)
                blocks = [
                    hashlib.sha256(content_bytes[i : i + block_size]).hexdigest()
                    for i in range(0, len(content_bytes), block_size)
                ] or [hashlib.sha256(b"").hexdigest()]
                node["integrity"] = {
                    "algorithm": "SHA256",
                    "hash": hashlib.sha256(content_bytes).hexdigest(),
                    "blockSize": block_size,
                    "blocks": blocks,
                }
            new_chunks.append(content_bytes)
            current_offset += len(content_bytes)

    walk_node(header)

    new_json_bytes = json.dumps(header, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    json_len = len(new_json_bytes)
    pad_len = (4 - (json_len % 4)) % 4
    aligned_json_len = json_len + pad_len
    new_header_pre = struct.pack("<4I", 4, aligned_json_len + 8, aligned_json_len + 4, json_len)

    tmp_path = asar_path + ".tmp_enhancer"
    with open(tmp_path, "wb") as out:
        out.write(new_header_pre)
        out.write(new_json_bytes)
        if pad_len:
            out.write(b"\x00" * pad_len)
        for ch in new_chunks:
            out.write(ch)

    shutil.move(tmp_path, asar_path)


def read_asar_file(asar_path, path_tuple):
    with open(asar_path, "rb") as f:
        _, header_size, _, json_size = struct.unpack("<4I", f.read(16))
        header = json.loads(f.read(json_size).decode("utf-8"))
        data_offset = 8 + header_size
        cur = header
        for p in path_tuple:
            cur = cur["files"][p]
        f.seek(data_offset + int(cur["offset"]))
        return f.read(int(cur["size"])).decode("utf-8", errors="replace")


def hot_inject_via_cdp(ui_core_js, bootstrap_data):
    roaming = os.path.expandvars(r"%APPDATA%\Antigravity")
    dt_file = os.path.join(roaming, "DevToolsActivePort")
    if not os.path.isfile(dt_file):
        return False, "DevToolsActivePort 不存在（Antigravity 未运行或未开启调试端口）"

    try:
        port = int(open(dt_file, "r", encoding="utf-8").read().splitlines()[0].strip())
        targets = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{port}/json", timeout=3).read().decode("utf-8"))
        pages = [t for t in targets if t.get("type") == "page"]
        if not pages:
            return False, "未找到活动的 Antigravity 页面"

        page = pages[0]
        ws_url = page["webSocketDebuggerUrl"]
        # Extract current conversation turns from transcript if available
        m_convo = re.search(r"/c/([a-f0-9-]{20,})", page.get("url", ""), re.I)
        if m_convo:
            cid = m_convo.group(1)
            tr_path = os.path.join(os.path.expanduser("~"), ".gemini", "antigravity", "brain", cid, ".system_generated", "logs", "transcript.jsonl")
            if os.path.isfile(tr_path):
                turns = []
                t_num = 0
                for line in open(tr_path, "r", encoding="utf-8", errors="replace"):
                    if not line.strip():
                        continue
                    try:
                        obj = json.loads(line)
                        if obj.get("type") == "USER_INPUT" and obj.get("content"):
                            t_num += 1
                            txt = obj["content"]
                            m_req = re.search(r"<USER_REQUEST>([\s\S]*?)</USER_REQUEST>", txt)
                            if m_req:
                                txt = m_req.group(1).strip()
                            turns.append({
                                "turnNumber": t_num,
                                "stepIndex": obj.get("step_index", t_num),
                                "text": txt[:180],
                                "createdAt": obj.get("created_at", "")
                            })
                    except Exception:
                        pass
                bootstrap_data["turns"] = turns

        bootstrap_json = json.dumps(bootstrap_data, ensure_ascii=False)
        hot_js = f"""(() => {{
            window.__AGY_UI_ENHANCER_ACTIVE__ = false;
            ['agy-enhancer-toolbar', 'agy-enhancer-popover', 'agy-enhancer-timeline', 'agy-enhancer-attach-bar', '__agy_enhancer_styles__', '__agy_enhancer_main_script__'].forEach(id => {{
                const el = document.getElementById(id);
                if (el) el.remove();
            }});
            window.__AGY_ENHANCER_BOOTSTRAP_DATA__ = {bootstrap_json};
            {ui_core_js}
            return {{
                toolbarMounted: !!document.getElementById('agy-enhancer-toolbar'),
                                turnsCount: {len(bootstrap_data.get('turns', []))},
                promptsCount: {len(bootstrap_data.get('prompts', []))},
                skillsCount: {len(bootstrap_data.get('skills', []))}
            }};
        }})()"""

        ws_path = "/" + ws_url.split("/", 3)[3]
        s = socket.create_connection(("127.0.0.1", port), timeout=5)
        key = base64.b64encode(os.urandom(16)).decode()
        req = f"GET {ws_path} HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n"
        s.sendall(req.encode())
        resp = b""
        while b"\r\n\r\n" not in resp:
            resp += s.recv(1024)

        msg = json.dumps({"id": 1, "method": "Runtime.evaluate", "params": {"expression": hot_js, "returnByValue": True}}).encode("utf-8")
        mask = os.urandom(4)
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(msg))
        n = len(msg)
        header = bytearray([0x81])
        if n < 126:
            header.append(0x80 | n)
        elif n < 65536:
            header.append(0x80 | 126)
            header.extend(struct.pack(">H", n))
        else:
            header.append(0x80 | 127)
            header.extend(struct.pack(">Q", n))
        header.extend(mask)
        s.sendall(header + masked)

        b1, b2 = s.recv(2)
        length = b2 & 0x7F
        if length == 126:
            length = struct.unpack(">H", s.recv(2))[0]
        elif length == 127:
            length = struct.unpack(">Q", s.recv(8))[0]
        data = b""
        while len(data) < length:
            data += s.recv(length - len(data))
        s.close()
        res_obj = json.loads(data.decode("utf-8"))
        return True, res_obj.get("result", {}).get("result", {}).get("value", {})
    except Exception as e:
        return False, str(e)


def main():
    print("=" * 62)
    print("  Antigravity UI Enhancer — 一键注入安装程序")
    print("=" * 62)

    asar_path = find_app_asar()
    print(f"[1/4] 已定位 app.asar: {asar_path}")

    bak_path = asar_path + ".before-enhancer.bak"
    if not os.path.exists(bak_path):
        shutil.copy2(asar_path, bak_path)
        print(f"[2/4] 已创建原版备份: {bak_path}")
    else:
        print(f"[2/4] 原版备份已存在: {bak_path}")

    ipc_patch = open(os.path.join(HERE, "enhancer_main_ipc.js"), "r", encoding="utf-8").read()
    ui_core_js = open(os.path.join(HERE, "enhancer_ui_core.js"), "r", encoding="utf-8").read()
    bootstrap_data = collect_bootstrap_data()

    # Patch ipcHandlers.js
    ipc_orig = read_asar_file(asar_path, ("dist", "ipcHandlers.js"))
    ipc_clean = strip_block(ipc_orig, IPC_START, IPC_END)
    last_brace = ipc_clean.rfind("}")
    if last_brace != -1:
        ipc_new = ipc_clean[:last_brace] + "\n" + ipc_patch + "\n}\n"
    else:
        ipc_new = ipc_clean + "\n" + ipc_patch

    # Patch preload.js
    preload_orig = read_asar_file(asar_path, ("dist", "preload.js"))
    preload_clean = strip_block(preload_orig, PRELOAD_START, PRELOAD_END)
    preload_patch = build_preload_injection(ui_core_js, bootstrap_data)
    preload_new = preload_clean.rstrip() + "\n\n" + preload_patch + "\n"

    update_asar_archive(
        asar_path,
        {
            ("dist", "ipcHandlers.js"): ipc_new.encode("utf-8"),
            ("dist", "preload.js"): preload_new.encode("utf-8"),
        },
    )
    print("[3/4] 已将 IPC 桥接与 UI 增强层写入 app.asar (与中文汉化补丁完全共存)")

    ok, info = hot_inject_via_cdp(ui_core_js, bootstrap_data)
    if ok:
        print(f"[4/4] 已通过 CDP 热注入当前正在运行的 Antigravity 窗口，立即生效！状态: {info}")
    else:
        print(f"[4/4] 静态注入已完成 ({info})，重启 Antigravity 后即可生效。")

    print("=" * 62)
    print("  安装完成！")
    print("=" * 62)


if __name__ == "__main__":
    main()
