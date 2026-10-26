#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Antigravity UI Enhancer — 一键恢复原版脚本
功能：
  1. 优先从 app.asar.before-enhancer.bak 恢复注入前的原版 app.asar（若无备份文件，则自动精准剥离 IPC 与 Preload 中的增强代码块，保留原有汉化补丁）
  2. 若 Antigravity 正在运行 (DevToolsActivePort)，自动通过 CDP 即时移除当前窗口中的快捷工具栏与右侧时间线，无需重启立即恢复原样！
"""

import os
import json
import shutil
import socket
import struct
import base64
import urllib.request

from install_enhancer import (
    find_app_asar,
    read_asar_file,
    strip_block,
    update_asar_archive,
    IPC_START,
    IPC_END,
    PRELOAD_START,
    PRELOAD_END,
)


def hot_remove_via_cdp():
    roaming = os.path.expandvars(r"%APPDATA%\Antigravity")
    dt_file = os.path.join(roaming, "DevToolsActivePort")
    if not os.path.isfile(dt_file):
        return False, "DevToolsActivePort 不存在"
    try:
        port = int(open(dt_file, "r", encoding="utf-8").read().splitlines()[0].strip())
        targets = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{port}/json", timeout=3).read().decode("utf-8"))
        pages = [t for t in targets if t.get("type") == "page"]
        if not pages:
            return False, "未找到活动页面"
        ws_url = pages[0]["webSocketDebuggerUrl"]
        ws_path = "/" + ws_url.split("/", 3)[3]
        s = socket.create_connection(("127.0.0.1", port), timeout=5)
        key = base64.b64encode(os.urandom(16)).decode()
        req = f"GET {ws_path} HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n"
        s.sendall(req.encode())
        resp = b""
        while b"\r\n\r\n" not in resp:
            resp += s.recv(1024)

        cleanup_js = """(() => {
            window.__AGY_UI_ENHANCER_ACTIVE__ = false;
            ['agy-enhancer-toolbar', 'agy-enhancer-popover', 'agy-enhancer-timeline', 'agy-enhancer-attach-bar', '__agy_enhancer_styles__', '__agy_enhancer_main_script__'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });
            return { restored: true };
        })()"""
        msg = json.dumps({"id": 1, "method": "Runtime.evaluate", "params": {"expression": cleanup_js, "returnByValue": True}}).encode("utf-8")
        mask = os.urandom(4)
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(msg))
        n = len(msg)
        header = bytearray([0x81, 0x80 | n]) if n < 126 else bytearray([0x81, 0x80 | 126]) + struct.pack(">H", n)
        header.extend(mask)
        s.sendall(header + masked)
        s.close()
        return True, "已从当前运行窗口移除增强组件"
    except Exception as e:
        return False, str(e)


def main():
    print("=" * 62)
    print("  Antigravity UI Enhancer — 一键恢复原版程序")
    print("=" * 62)

    asar_path = find_app_asar()
    bak_path = asar_path + ".before-enhancer.bak"

    if os.path.isfile(bak_path):
        shutil.copy2(bak_path, asar_path)
        print(f"[1/2] 已从原版备份完整恢复: {bak_path} -> {asar_path}")
    else:
        ipc_orig = read_asar_file(asar_path, ("dist", "ipcHandlers.js"))
        preload_orig = read_asar_file(asar_path, ("dist", "preload.js"))
        ipc_clean = strip_block(ipc_orig, IPC_START, IPC_END)
        preload_clean = strip_block(preload_orig, PRELOAD_START, PRELOAD_END)
        update_asar_archive(
            asar_path,
            {
                ("dist", "ipcHandlers.js"): ipc_clean.encode("utf-8"),
                ("dist", "preload.js"): preload_clean.encode("utf-8"),
            },
        )
        print("[1/2] 已从 app.asar 精准剥离 UI 增强代码块（保留汉化补丁与原版逻辑）")

    ok, msg = hot_remove_via_cdp()
    print(f"[2/2] 运行时窗口清理状态: {msg}")
    print("=" * 62)
    print("  恢复原版完成！")
    print("=" * 62)


if __name__ == "__main__":
    main()
