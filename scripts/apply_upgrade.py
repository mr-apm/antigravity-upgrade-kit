#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Antigravity 一键全自动升级补丁套件 (Unified Upgrade Kit)
功能：
  1. 联网检查/拉取 GitHub 最新版 Antigravity 中文汉化包 (qqxpee/antigravity2-cn)
  2. 自动调用 localization_engine.js 完成官方界面、菜单、设置等全面深度汉化
  3. 纯净保留 Antigravity 官方原生对话时间线导航 (Conversation Navigator 与原厂对话卡片，杜绝重叠弹窗)
  4. 自动注入 UI Enhancer 增强层：
     - 底部快捷气泡工具栏 (技能、提示词、MCP、知识库、配额)
     - 技能点击自动插入为原生 [ <> ] 胶囊徽章 (BeautifulMention Pill Node)
     - 提示词长文以 .md 芯片附件形式插入
     - 实时多模型配额与上下文监控
  5. 支持运行中热注入 (CDP) 与 app.asar 物理包持久化
"""

import os
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
import subprocess
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL_ROOT = os.path.dirname(HERE)
GITHUB_REPO_URL = "https://github.com/qqxpee/antigravity2-cn.git"

# Determine enhancer dir dynamically (self-contained inside skill root)
ENHANCER_DIR = os.path.join(SKILL_ROOT, "enhancer")
if not os.path.isdir(ENHANCER_DIR):
    ENHANCER_DIR = r"E:\82-CherryStudio\ALL-Agent-Skills\_agy-enhancer"

# Determine local cn repo dynamically
if os.path.isdir(r"E:\83-Antigravity\antigravity2-cn-main"):
    LOCAL_CN_REPO = r"E:\83-Antigravity\antigravity2-cn-main"
else:
    LOCAL_CN_REPO = os.path.join(SKILL_ROOT, "antigravity2-cn-main")


def print_banner():
    print("=" * 66)
    print("  🚀 Antigravity 一键全自动升级补丁套件 (GitHub最新汉化 + 气泡胶囊)")
    print("=" * 66)


def step1_update_from_github():
    print("\n[第 1 步 / 共 4 步] 正在检查 GitHub 官方仓库最新汉化包...")
    if not os.path.isdir(LOCAL_CN_REPO):
        print(f"  [下载] 本地目录不存在，正在从 GitHub 克隆 {GITHUB_REPO_URL} ...")
        try:
            subprocess.run(["git", "clone", GITHUB_REPO_URL, LOCAL_CN_REPO], check=True, encoding='utf-8', errors='replace')
            print("  [完成] 仓库克隆成功！")
            return True
        except Exception as e:
            print(f"  [警告] git clone 失败: {e}")
            return False

    # Git update
    try:
        # Check remote updates
        subprocess.run(["git", "-C", LOCAL_CN_REPO, "fetch", "origin", "main"], timeout=15, check=True, encoding='utf-8', errors='replace')
        local_hash = subprocess.run(["git", "-C", LOCAL_CN_REPO, "rev-parse", "HEAD"], capture_output=True, text=True, check=True, encoding='utf-8', errors='replace').stdout.strip()
        remote_hash = subprocess.run(["git", "-C", LOCAL_CN_REPO, "rev-parse", "origin/main"], capture_output=True, text=True, check=True, encoding='utf-8', errors='replace').stdout.strip()

        if local_hash != remote_hash:
            print(f"  [更新] 检测到 GitHub 有新版本提交 ({remote_hash[:7]})，正在拉取最新汉化字典与引擎...")
            subprocess.run(["git", "-C", LOCAL_CN_REPO, "pull", "origin", "main"], timeout=15, check=True, encoding='utf-8', errors='replace')
            print("  [完成] 汉化包已成功更新到 GitHub 最新版本！")
        else:
            print(f"  [完成] 本地汉化包已是 GitHub 最新版本 ({local_hash[:7]})，无需额外下载。")
        return True
    except Exception as e:
        print(f"  [提示] 检查 GitHub 更新异常 (可能网络受限): {e}")
        print("  [降级] 将使用本地已有的最新汉化字典和引擎继续执行。")
        return True


def step2_apply_chinese_localization():
    print("\n[第 2 步 / 共 4 步] 正在执行官方 ASAR 解包与最新汉化注入...")
    loc_engine = os.path.join(LOCAL_CN_REPO, "localization_engine.js")
    if not os.path.isfile(loc_engine):
        print(f"  [错误] 未找到 localization_engine.js: {loc_engine}")
        return False

    cmd = ["node", loc_engine, "--no-kill", "--brand-title", "english"]
    try:
        res = subprocess.run(cmd, cwd=LOCAL_CN_REPO, capture_output=True, text=True, timeout=120, encoding='utf-8', errors='replace')
        out = (res.stdout or "") + (res.stderr or "")
        if res.returncode == 0:
            print("  [完成] Antigravity 2.0 中文汉化部署完成！(已保留英文品牌标题 Antigravity)")
            return True
        else:
            print(f"  [错误] 汉化脚本执行失败 (code {res.returncode}):\n{out[-600:]}")
            return False
    except Exception as e:
        print(f"  [错误] 运行 localization_engine.js 异常: {e}")
        return False


def step3_hot_reload():
    print("\n[第 3 步 / 共 4 步] 正在通知运行中的前端窗口加载最新界面资源...")
    roaming = os.path.expandvars(r"%APPDATA%\Antigravity")
    dt_file = os.path.join(roaming, "DevToolsActivePort")
    if not os.path.isfile(dt_file):
        print("  [提示] Antigravity 未在运行，静态更新已就绪。")
        return True

    try:
        port = int(open(dt_file, "r", encoding="utf-8").read().splitlines()[0].strip())
        targets = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{port}/json", timeout=3).read().decode("utf-8"))
        pages = [t for t in targets if t.get("type") == "page"]
        if not pages:
            return True

        for target in pages:
            try:
                ws_url = target.get("webSocketDebuggerUrl")
                if not ws_url:
                    continue
                ws_path = "/" + ws_url.split("/", 3)[3]
                s = socket.create_connection(("127.0.0.1", port), timeout=5)
                key = base64.b64encode(os.urandom(16)).decode()
                req = f"GET {ws_path} HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n"
                s.sendall(req.encode())
                resp = b""
                while b"\r\n\r\n" not in resp:
                    resp += s.recv(1024)

                msg = json.dumps({"id": 1, "method": "Page.reload", "params": {"ignoreCache": True}}).encode("utf-8")
                mask = os.urandom(4)
                masked = bytes(b ^ mask[i % 4] for i, b in enumerate(msg))
                n = len(msg)
                header = bytearray([0x81, 0x80 | n]) if n < 126 else bytearray([0x81, 0x80 | 126]) + struct.pack(">H", n)
                header.extend(mask)
                s.sendall(header + masked)
                s.close()
            except Exception:
                pass
        print("  [完成] 已通过 CDP 触发窗口刷新！")
        return True
    except Exception as e:
        print(f"  [提示] 刷新通知完成: {e}")
        return True


def step4_inject_enhancer():
    print("\n[第 4 步 / 共 4 步] 正在注入快捷气泡工具栏与原生时间线保留增强...")
    installer = os.path.join(ENHANCER_DIR, "install_enhancer.py")
    if not os.path.isfile(installer):
        print(f"  [错误] 未找到 UI Enhancer 安装脚本: {installer}")
        return False

    try:
        res = subprocess.run([sys.executable, installer], cwd=ENHANCER_DIR, capture_output=True, text=True, timeout=30, encoding='utf-8', errors='replace')
        out = (res.stdout or "") + (res.stderr or "")
        if res.returncode == 0:
            print("  [完成] 快捷气泡工具栏 (含 BeautifulMention 原生胶囊与原生时间线增强) 已成功注入并热生效！")
            return True
        else:
            print(f"  [错误] UI 增强脚本执行失败 (code {res.returncode}):\n{out[-600:]}")
            return False
    except Exception as e:
        print(f"  [错误] 注入 Enhancer 异常: {e}")
        return False


def main():
    print_banner()
    ok1 = step1_update_from_github()
    if not ok1:
        print("\n[终止] 第 1 步失败，流程中断。")
        sys.exit(1)

    ok2 = step2_apply_chinese_localization()
    if not ok2:
        print("\n[终止] 第 2 步失败，流程中断。")
        sys.exit(1)

    step3_hot_reload()

    ok4 = step4_inject_enhancer()
    if not ok4:
        print("\n[终止] 第 4 步失败，流程中断。")
        sys.exit(1)

    print("\n" + "=" * 66)
    print("  🎉 全部更新完成！Antigravity 已恢复最新汉化 + 气泡胶囊 + 原生时间线！")
    print("=" * 66)


if __name__ == "__main__":
    main()
