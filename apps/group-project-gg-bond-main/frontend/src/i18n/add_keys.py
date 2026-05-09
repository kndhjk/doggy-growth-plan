#!/usr/bin/env python3
"""Add missing locale keys to all 4 locale files."""
import re

files = {
    'en': '/home/destiny/apps/group-project-gg-bond-main/frontend/src/i18n/locales/en.js',
    'zh': '/home/destiny/apps/group-project-gg-bond-main/frontend/src/i18n/locales/zh.js',
    'ja': '/home/destiny/apps/group-project-gg-bond-main/frontend/src/i18n/locales/ja.js',
    'mi': '/home/destiny/apps/group-project-gg-bond-main/frontend/src/i18n/locales/mi.js',
}

translations = {
    'en': {
        'leaderboard.ownerPrefix': "Owner ",
    },
    'zh': {
        'leaderboard.ownerPrefix': "主人 ",
    },
    'ja': {
        'leaderboard.ownerPrefix': "オーナー ",
    },
    'mi': {
        'leaderboard.ownerPrefix': "Tāngata ",
    },
}

for lang, path in files.items():
    content = open(path).read()
    
    if f"'leaderboard.ownerPrefix'" in content:
        print(f"{lang}: already has key")
        continue
    
    # Insert before 'leaderboard.myRank'
    key = f"'leaderboard.ownerPrefix':     '{translations[lang]['leaderboard.ownerPrefix']}',"
    content = content.replace(
        "'leaderboard.myRank':",
        key + "\n  'leaderboard.myRank':"
    )
    
    with open(path, 'w') as f:
        f.write(content)
    print(f"{lang}: added ownerPrefix key")

# Verify
for lang, path in files.items():
    content = open(path).read()
    has = "'leaderboard.ownerPrefix'" in content
    print(f"  verify {lang}: {'OK' if has else 'MISSING'}")