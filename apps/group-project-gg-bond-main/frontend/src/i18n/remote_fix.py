#!/usr/bin/env python3
"""Fix all i18n locale file syntax errors and add missing keys."""
import re, sys

BASE = '/home/destiny/apps/group-project-gg-bond-main/frontend/src/i18n/locales'

# ─── FIX EN.JS ────────────────────────────────────────────────────────────────
en_path = f'{BASE}/en.js'
en = open(en_path).read()

# Fix leaderboard.myRank - invalid JS string concatenation
en = en.replace(
    "'leaderboard.myRank':         '🐾 My Rank — #' + CURRENT_USER_RANK + ' ',", 
    "'leaderboard.myRank':         '🐾 My Rank — #{n}',"
)

# Fix health.total - invalid concatenation
en = en.replace("'health.total':              'Total ' + {n} + ' records',",
                 "'health.total':              'Total {n} records',")

# Fix health.lastCheckup - malformed
en = en.replace("'health.lastCheckup':        'Last checkup: ' + {date}\\", 
                 "'health.lastCheckup':        'Last checkup: {date}',")

# Fix adopt.results
en = en.replace("'adopt.results':              'Found ' + {n} + ' pets',",
                 "'adopt.results':              'Found {n} pets',")

# Fix adopt.helped
en = en.replace("'adopt.helped':              'helped ' + {n} + ' pets find homes',",
                 "'adopt.helped':              'helped {n} pets find homes',")

# Fix adopt.modal.confirm
en = en.replace("'adopt.modal.confirm':        'Confirm adoption of ' + {name} + '?',",
                 "'adopt.modal.confirm':        'Confirm adoption of {name}?',")

# Add missing adopt.modal keys (insert before adopt.success.title)
adopt_modal_block = """
  'adopt.modal.personality':     'Personality',
  'adopt.modal.intro':           'Introduction',
  'adopt.modal.status':          'Current Status',
  'adopt.modal.status.health':   '❤️ Health',
  'adopt.modal.status.energy':   '⚡ Energy',
  'adopt.modal.status.appetite': '🍖 Appetite',
  'adopt.modal.feeIncludes':     'Fee includes',
  'adopt.modal.feeIncludesDetail': 'Annual vaccines, microchip, desexing',
  'adopt.modal.applyAdopt':      '🏠 Apply to adopt {name}',
  'adopt.modal.thinkAgain':      'Think again',
  'adopt.modal.confirmBody':     'Before adopting, please ensure you have enough time and energy to care for your pet. After adoption, the pet will be added to your account.',
  'adopt.success.submsg':        '{name} is waiting for you! Check your profile to see your new companion.',"""

if "'adopt.modal.personality'" not in en:
    en = en.replace("  'adopt.modal.petInfo':        'Pet info',\n  'adopt.success.title':",
                     "  'adopt.modal.petInfo':        'Pet info',\n" + adopt_modal_block + "\n  'adopt.success.title':")

with open(en_path, 'w') as f:
    f.write(en)
print("✓ en.js fixed")

# ─── FIX ZH.JS — fix inventory.* bare keys and duplicate rewards ────────────────
zh_path = f'{BASE}/zh.js'
zh = open(zh_path).read()

# Fix inventory.* bare keys (lines like: inventory.title: '背包',)
# Pattern: key: value, where key has no quotes
zh = re.sub(r'\binventory\.title:\s*([^,\n]+),', r"'inventory.title': \1',", zh)
zh = re.sub(r'\binventory\.tab\.all:\s*([^,\n]+),', r"'inventory.tab.all': \1',", zh)
zh = re.sub(r'\binventory\.tab\.food:\s*([^,\n]+),', r"'inventory.tab.food': \1',", zh)
zh = re.sub(r'\binventory\.tab\.toy:\s*([^,\n]+),', r"'inventory.tab.toy': \1',", zh)
zh = re.sub(r'\binventory\.tab\.medicine:\s*([^,\n]+),', r"'inventory.tab.medicine': \1',", zh)
zh = re.sub(r'\binventory\.tab\.accessory:\s*([^,\n]+),', r"'inventory.tab.accessory': \1',", zh)
zh = re.sub(r'\binventory\.empty\.title:\s*([^,\n]+),', r"'inventory.empty.title': \1',", zh)
zh = re.sub(r'\binventory\.empty\.hint:\s*([^,\n]+),', r"'inventory.empty.hint': \1',", zh)
zh = re.sub(r'\binventory\.item\.use:\s*([^,\n]+),', r"'inventory.item.use': \1',", zh)
zh = re.sub(r'\binventory\.item\.equipped:\s*([^,\n]+),', r"'inventory.item.equipped': \1',", zh)
zh = re.sub(r'\binventory\.item\.empty:\s*([^,\n]+),', r"'inventory.item.empty': \1',", zh)
zh = re.sub(r'\binventory\.modal\.use:\s*([^,\n]+),', r"'inventory.modal.use': \1',", zh)
zh = re.sub(r'\binventory\.modal\.confirm:\s*([^,\n]+),', r"'inventory.modal.confirm': \1',", zh)
zh = re.sub(r'\binventory\.modal\.cancel:\s*([^,\n]+),', r"'inventory.modal.cancel': \1',", zh)
zh = re.sub(r'\binventory\.stat\.appetite:\s*([^,\n]+),', r"'inventory.stat.appetite': \1',", zh)
zh = re.sub(r'\binventory\.stat\.hydration:\s*([^,\n]+),', r"'inventory.stat.hydration': \1',", zh)
zh = re.sub(r'\binventory\.stat\.health:\s*([^,\n]+),', r"'inventory.stat.health': \1',", zh)
zh = re.sub(r'\binventory\.stat\.mood:\s*([^,\n]+),', r"'inventory.stat.mood': \1',", zh)
zh = re.sub(r'\binventory\.stat\.social:\s*([^,\n]+),', r"'inventory.stat.social': \1',", zh)
zh = re.sub(r'\binventory\.pet\.noPet:\s*([^,\n]+),', r"'inventory.pet.noPet': \1',", zh)
zh = re.sub(r'\binventory\.pet\.unadopted:\s*([^,\n]+),', r"'inventory.pet.unadopted': \1',", zh)
zh = re.sub(r'\binventory\.pet\.current:\s*([^,\n]+),', r"'inventory.pet.current': \1',", zh)
zh = re.sub(r'\binventory\.pet\.afterAdopt:\s*([^,\n]+),', r"'inventory.pet.afterAdopt': \1',", zh)
zh = re.sub(r'\binventory\.stats\.total:\s*([^,\n]+),', r"'inventory.stats.total': \1',", zh)
zh = re.sub(r'\binventory\.stats\.usable:\s*([^,\n]+),', r"'inventory.stats.usable': \1',", zh)
zh = re.sub(r'\binventory\.stats\.pets:\s*([^,\n]+),', r"'inventory.stats.pets': \1',", zh)
zh = re.sub(r'\binventory\.decor\.label:\s*([^,\n]+),', r"'inventory.decor.label': \1',", zh)
zh = re.sub(r'\binventory\.empty\.category:\s*([^,\n]+),', r"'inventory.empty.category': \1',", zh)

# Fix duplicate rewards.sevenDayNote — remove the orphaned one
# Find and remove the second (trailing) rewards.sevenDayNote
lines = zh.split('\n')
seen_7day = False
clean_lines = []
for line in lines:
    stripped = line.strip()
    if stripped == "'rewards.sevenDayNote':   '连续签到7天可获得大礼包！重新开始签到',":
        if seen_7day:
            continue  # skip duplicate
        seen_7day = True
    clean_lines.append(line)
zh = '\n'.join(clean_lines)

with open(zh_path, 'w') as f:
    f.write(zh)
print("✓ zh.js fixed")

# ─── FIX JA.JS — same inventory.* bare keys ──────────────────────────────────
ja_path = f'{BASE}/ja.js'
ja = open(ja_path).read()

# Fix inventory.* bare keys
ja = re.sub(r'\binventory\.title:\s*([^,\n]+),', r"'inventory.title': \1',", ja)
ja = re.sub(r'\binventory\.tab\.all:\s*([^,\n]+),', r"'inventory.tab.all': \1',", ja)
ja = re.sub(r'\binventory\.tab\.food:\s*([^,\n]+),', r"'inventory.tab.food': \1',", ja)
ja = re.sub(r'\binventory\.tab\.toy:\s*([^,\n]+),', r"'inventory.tab.toy': \1',", ja)
ja = re.sub(r'\binventory\.tab\.medicine:\s*([^,\n]+),', r"'inventory.tab.medicine': \1',", ja)
ja = re.sub(r'\binventory\.tab\.accessory:\s*([^,\n]+),', r"'inventory.tab.accessory': \1',", ja)
ja = re.sub(r'\binventory\.empty\.title:\s*([^,\n]+),', r"'inventory.empty.title': \1',", ja)
ja = re.sub(r'\binventory\.empty\.hint:\s*([^,\n]+),', r"'inventory.empty.hint': \1',", ja)
ja = re.sub(r'\binventory\.item\.use:\s*([^,\n]+),', r"'inventory.item.use': \1',", ja)
ja = re.sub(r'\binventory\.item\.equipped:\s*([^,\n]+),', r"'inventory.item.equipped': \1',", ja)
ja = re.sub(r'\binventory\.item\.empty:\s*([^,\n]+),', r"'inventory.item.empty': \1',", ja)
ja = re.sub(r'\binventory\.modal\.use:\s*([^,\n]+),', r"'inventory.modal.use': \1',", ja)
ja = re.sub(r'\binventory\.modal\.confirm:\s*([^,\n]+),', r"'inventory.modal.confirm': \1',", ja)
ja = re.sub(r'\binventory\.modal\.cancel:\s*([^,\n]+),', r"'inventory.modal.cancel': \1',", ja)
ja = re.sub(r'\binventory\.stat\.appetite:\s*([^,\n]+),', r"'inventory.stat.appetite': \1',", ja)
ja = re.sub(r'\binventory\.stat\.hydration:\s*([^,\n]+),', r"'inventory.stat.hydration': \1',", ja)
ja = re.sub(r'\binventory\.stat\.health:\s*([^,\n]+),', r"'inventory.stat.health': \1',", ja)
ja = re.sub(r'\binventory\.stat\.mood:\s*([^,\n]+),', r"'inventory.stat.mood': \1',", ja)
ja = re.sub(r'\binventory\.stat\.social:\s*([^,\n]+),', r"'inventory.stat.social': \1',", ja)
ja = re.sub(r'\binventory\.pet\.noPet:\s*([^,\n]+),', r"'inventory.pet.noPet': \1',", ja)
ja = re.sub(r'\binventory\.pet\.unadopted:\s*([^,\n]+),', r"'inventory.pet.unadopted': \1',", ja)
ja = re.sub(r'\binventory\.pet\.current:\s*([^,\n]+),', r"'inventory.pet.current': \1',", ja)
ja = re.sub(r'\binventory\.pet\.afterAdopt:\s*([^,\n]+),', r"'inventory.pet.afterAdopt': \1',", ja)
ja = re.sub(r'\binventory\.stats\.total:\s*([^,\n]+),', r"'inventory.stats.total': \1',", ja)
ja = re.sub(r'\binventory\.stats\.usable:\s*([^,\n]+),', r"'inventory.stats.usable': \1',", ja)
ja = re.sub(r'\binventory\.stats\.pets:\s*([^,\n]+),', r"'inventory.stats.pets': \1',", ja)
ja = re.sub(r'\binventory\.decor\.label:\s*([^,\n]+),', r"'inventory.decor.label': \1',", ja)
ja = re.sub(r'\binventory\.empty\.category:\s*([^,\n]+),', r"'inventory.empty.category': \1',", ja)

# Fix orphaned adopt.modal.confirmBody (has no key prefix, appears after adopt.success.btn with wrong placement)
ja = ja.replace(
    "'adopt.success.btn':        '素晴らしい！見る 🏠',\n};\n  'adopt.modal.confirmBody':",
    "'adopt.success.btn':        '素晴らしい！見る 🏠',\n  'adopt.modal.confirmBody':"
)

# Fix duplicate rewards.sevenDayNote
lines = ja.split('\n')
seen_7day = False
clean_lines = []
for line in lines:
    stripped = line.strip()
    if 'rewards.sevenDayNote' in stripped:
        if seen_7day:
            continue
        seen_7day = True
    clean_lines.append(line)
ja = '\n'.join(clean_lines)

with open(ja_path, 'w') as f:
    f.write(ja)
print("✓ ja.js fixed")

# ─── FIX MI.JS — same inventory.* bare keys ─────────────────────────────────
mi_path = f'{BASE}/mi.js'
mi = open(mi_path).read()

# Fix inventory.* bare keys
mi = re.sub(r'\binventory\.title:\s*([^,\n]+),', r"'inventory.title': \1',", mi)
mi = re.sub(r'\binventory\.tab\.all:\s*([^,\n]+),', r"'inventory.tab.all': \1',", mi)
mi = re.sub(r'\binventory\.tab\.food:\s*([^,\n]+),', r"'inventory.tab.food': \1',", mi)
mi = re.sub(r'\binventory\.tab\.toy:\s*([^,\n]+),', r"'inventory.tab.toy': \1',", mi)
mi = re.sub(r'\binventory\.tab\.medicine:\s*([^,\n]+),', r"'inventory.tab.medicine': \1',", mi)
mi = re.sub(r'\binventory\.tab\.accessory:\s*([^,\n]+),', r"'inventory.tab.accessory': \1',", mi)
mi = re.sub(r'\binventory\.empty\.title:\s*([^,\n]+),', r"'inventory.empty.title': \1',", mi)
mi = re.sub(r'\binventory\.empty\.hint:\s*([^,\n]+),', r"'inventory.empty.hint': \1',", mi)
mi = re.sub(r'\binventory\.item\.use:\s*([^,\n]+),', r"'inventory.item.use': \1',", mi)
mi = re.sub(r'\binventory\.item\.equipped:\s*([^,\n]+),', r"'inventory.item.equipped': \1',", mi)
mi = re.sub(r'\binventory\.item\.empty:\s*([^,\n]+),', r"'inventory.item.empty': \1',", mi)
mi = re.sub(r'\binventory\.modal\.use:\s*([^,\n]+),', r"'inventory.modal.use': \1',", mi)
mi = re.sub(r'\binventory\.modal\.confirm:\s*([^,\n]+),', r"'inventory.modal.confirm': \1',", mi)
mi = re.sub(r'\binventory\.modal\.cancel:\s*([^,\n]+),', r"'inventory.modal.cancel': \1',", mi)
mi = re.sub(r'\binventory\.stat\.appetite:\s*([^,\n]+),', r"'inventory.stat.appetite': \1',", mi)
mi = re.sub(r'\binventory\.stat\.hydration:\s*([^,\n]+),', r"'inventory.stat.hydration': \1',", mi)
mi = re.sub(r'\binventory\.stat\.health:\s*([^,\n]+),', r"'inventory.stat.health': \1',", mi)
mi = re.sub(r'\binventory\.stat\.mood:\s*([^,\n]+),', r"'inventory.stat.mood': \1',", mi)
mi = re.sub(r'\binventory\.stat\.social:\s*([^,\n]+),', r"'inventory.stat.social': \1',", mi)
mi = re.sub(r'\binventory\.pet\.noPet:\s*([^,\n]+),', r"'inventory.pet.noPet': \1',", mi)
mi = re.sub(r'\binventory\.pet\.unadopted:\s*([^,\n]+),', r"'inventory.pet.unadopted': \1',", mi)
mi = re.sub(r'\binventory\.pet\.current:\s*([^,\n]+),', r"'inventory.pet.current': \1',", mi)
mi = re.sub(r'\binventory\.pet\.afterAdopt:\s*([^,\n]+),', r"'inventory.pet.afterAdopt': \1',", mi)
mi = re.sub(r'\binventory\.stats\.total:\s*([^,\n]+),', r"'inventory.stats.total': \1',", mi)
mi = re.sub(r'\binventory\.stats\.usable:\s*([^,\n]+),', r"'inventory.stats.usable': \1',", mi)
mi = re.sub(r'\binventory\.stats\.pets:\s*([^,\n]+),', r"'inventory.stats.pets': \1',", mi)
mi = re.sub(r'\binventory\.decor\.label:\s*([^,\n]+),', r"'inventory.decor.label': \1',", mi)
mi = re.sub(r'\binventory\.empty\.category:\s*([^,\n]+),', r"'inventory.empty.category': \1',", mi)

# Fix orphaned adopt.modal.confirmBody
mi = mi.replace(
    "'adopt.success.btn':        'Kōrero! Tirohia 🏠',\n};\n  'adopt.modal.confirmBody':",
    "'adopt.success.btn':        'Kōrero! Tirohia 🏠',\n  'adopt.modal.confirmBody':"
)

# Fix duplicate rewards.sevenDayNote
lines = mi.split('\n')
seen_7day = False
clean_lines = []
for line in lines:
    stripped = line.strip()
    if 'rewards.sevenDayNote' in stripped:
        if seen_7day:
            continue
        seen_7day = True
    clean_lines.append(line)
mi = '\n'.join(clean_lines)

with open(mi_path, 'w') as f:
    f.write(mi)
print("✓ mi.js fixed")

print("\n✅ All locale files fixed!")
