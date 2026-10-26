#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Antigravity 一键恢复官方英文原版脚本
"""
import os, sys, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL_ROOT = os.path.dirname(HERE)

def main():
    print("=" * 66)
    print("  Antigravity 一键恢复官方英文原版 (剥离汉化与 UI 增强层)")
    print("=" * 66)

    # 1. First restore enhancer original
    restore_enhancer_py = os.path.join(SKILL_ROOT, "enhancer", "restore_original.py")
    if os.path.isfile(restore_enhancer_py):
        print("\n[1/2] 正在剥离 UI 增强组件...")
        subprocess.run([sys.executable, restore_enhancer_py], check=False)

    # 2. Restore english localization
    candidates = [
        r"E:\83-Antigravity\antigravity2-cn-main\localization_engine.js",
        os.path.join(SKILL_ROOT, "antigravity2-cn-main", "localization_engine.js"),
    ]
    loc_engine = None
    for c in candidates:
        if os.path.isfile(c):
            loc_engine = c
            break

    if loc_engine:
        print("\n[2/2] 正在恢复官方原版英文...")
        subprocess.run(["node", loc_engine, "--huifu", "--no-kill"], cwd=os.path.dirname(loc_engine), check=False)
    else:
        print("\n[2/2] 未找到 localization_engine.js，如果已有 app.asar.bak 请手动还原。")

    print("\n" + "=" * 66)
    print("  恢复完成！Antigravity 已恢复官方英文原版。")
    print("=" * 66)

if __name__ == "__main__":
    main()
