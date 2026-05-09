#!/usr/bin/env python3
"""Fix missing i18n keys in ja.js and mi.js locale files."""
import re

def fix_file(path):
    content = open(path).read()
    
    # leaderboard.tab - missing in ja and mi (en has them, zh has them)
    leaderboard_tab_en = {
        'leaderboard.tab.total':      'Total',
        'leaderboard.tab.active':     'Active',
        'leaderboard.tab.newcomer':   'Newcomer',
    }
    leaderboard_tab_zh = {
        'leaderboard.tab.total':      '总榜',
        'leaderboard.tab.active':     '活跃',
        'leaderboard.tab.newcomer':   '新人',
    }
    leaderboard_tab_ja = {
        'leaderboard.tab.total':      '総合',
        'leaderboard.tab.active':     'アクティブ',
        'leaderboard.tab.newcomer':   '新手',
    }
    leaderboard_tab_mi = {
        'leaderboard.tab.total':      'Taponga',
        'leaderboard.tab.active':     'Whakahaere',
        'leaderboard.tab.newcomer':   'Mahi hou',
    }
    
    # leaderboard.col - missing in ja and mi
    leaderboard_col_en = {
        'leaderboard.col.rank':       '#',
        'leaderboard.col.pet':        'Pet',
        'leaderboard.col.level':       'LV',
        'leaderboard.col.happiness':  'Happiness',
        'leaderboard.col.activity':   'Active',
    }
    leaderboard_col_zh = {
        'leaderboard.col.rank':       '#',
        'leaderboard.col.pet':        '宠物',
        'leaderboard.col.level':      '等级',
        'leaderboard.col.happiness':  '快乐值',
        'leaderboard.col.activity':   '活跃度',
    }
    leaderboard_col_ja = {
        'leaderboard.col.rank':       '#',
        'leaderboard.col.pet':        'ペット',
        'leaderboard.col.level':      'レベル',
        'leaderboard.col.happiness':  '幸福度',
        'leaderboard.col.activity':   'アクティブ',
    }
    leaderboard_col_mi = {
        'leaderboard.col.rank':       '#',
        'leaderboard.col.pet':        'Peti',
        'leaderboard.col.level':      'Taumata',
        'leaderboard.col.happiness':  'Hūtia',
        'leaderboard.col.activity':   'Whakahaere',
    }
    
    # health.tab - missing in ja and mi
    health_tab_en = {
        'health.tab.vaccine':        'Vaccine',
        'health.tab.checkup':        'Checkup',
        'health.tab.medicine':       'Medicine',
    }
    health_tab_zh = {
        'health.tab.vaccine':       '疫苗记录',
        'health.tab.checkup':       '体检记录',
        'health.tab.medicine':      '用药记录',
    }
    health_tab_ja = {
        'health.tab.vaccine':       'ワクチン',
        'health.tab.checkup':       '健康診断',
        'health.tab.medicine':      'おくすり',
    }
    health_tab_mi = {
        'health.tab.vaccine':       'Whakatau',
        'health.tab.checkup':       'Arotake',
        'health.tab.medicine':      'Rongoā',
    }
    
    # health.type - missing in ja and mi
    health_type_en = {
        'health.type.vaccine':       'Vaccine',
        'health.type.dewormer':      'Dewormer',
        'health.type.checkup':       'Checkup',
        'health.type.medicine':      'Medicine',
    }
    health_type_zh = {
        'health.type.vaccine':      '疫苗记录',
        'health.type.dewormer':     '驱虫记录',
        'health.type.checkup':      '体检记录',
        'health.type.medicine':     '用药记录',
    }
    health_type_ja = {
        'health.type.vaccine':      'ワクチン',
        'health.type.dewormer':     '虫下し',
        'health.type.checkup':      '健康診断',
        'health.type.medicine':     'おくすり',
    }
    health_type_mi = {
        'health.type.vaccine':      'Whakatau',
        'health.type.dewormer':     'Whakakore',
        'health.type.checkup':      'Arotake',
        'health.type.medicine':     'Rongoā',
    }
    
    # inventory.tab - missing in ja and mi
    inventory_tab_en = {
        'inventory.tab.all':         'All',
        'inventory.tab.food':        'Food',
        'inventory.tab.toy':         'Toy',
        'inventory.tab.medicine':    'Medicine',
        'inventory.tab.accessory':   'Accessory',
    }
    inventory_tab_zh = {
        'inventory.tab.all':       '全部',
        'inventory.tab.food':      '食物',
        'inventory.tab.toy':       '玩具',
        'inventory.tab.medicine':   '药品',
        'inventory.tab.accessory':  '配饰',
    }
    inventory_tab_ja = {
        'inventory.tab.all':       'すべて',
        'inventory.tab.food':      'エサ',
        'inventory.tab.toy':       'おもちゃ',
        'inventory.tab.medicine':   'くすり',
        'inventory.tab.accessory':  'アクセ',
    }
    inventory_tab_mi = {
        'inventory.tab.all':       'Katoa',
        'inventory.tab.food':       'Kai',
        'inventory.tab.toy':        'Mīkini',
        'inventory.tab.medicine':   'Rongoā',
        'inventory.tab.accessory':  'Tāpiri',
    }
    
    # Determine which lang this file is
    if 'ja' in path:
        lb_tab = leaderboard_tab_ja
        lb_col = leaderboard_col_ja
        ht_tab = health_tab_ja
        ht_typ = health_type_ja
        inv_tab = inventory_tab_ja
    elif 'mi' in path:
        lb_tab = leaderboard_tab_mi
        lb_col = leaderboard_col_mi
        ht_tab = health_tab_mi
        ht_typ = health_type_mi
        inv_tab = inventory_tab_mi
    else:
        return content
    
    # Add missing keys - insert before the closing };
    # We'll add them one by one to avoid ordering issues
    
    additions = []
    
    # leaderboard.tab.total
    if "'leaderboard.tab.total':" not in content:
        additions.append(("'leaderboard.tab.total':      '%s'," % lb_tab['leaderboard.tab.total'], 'leaderboard.tab'))
    # leaderboard.tab.active
    if "'leaderboard.tab.active':" not in content:
        additions.append(("'leaderboard.tab.active':     '%s'," % lb_tab['leaderboard.tab.active'], 'leaderboard.tab'))
    # leaderboard.tab.newcomer
    if "'leaderboard.tab.newcomer':" not in content:
        additions.append(("'leaderboard.tab.newcomer':   '%s'," % lb_tab['leaderboard.tab.newcomer'], 'leaderboard.tab'))
    
    # leaderboard.col.rank
    if "'leaderboard.col.rank':" not in content:
        additions.append(("'leaderboard.col.rank':       '%s'," % lb_col['leaderboard.col.rank'], 'leaderboard.col'))
    # leaderboard.col.pet
    if "'leaderboard.col.pet':" not in content:
        additions.append(("'leaderboard.col.pet':        '%s'," % lb_col['leaderboard.col.pet'], 'leaderboard.col'))
    # leaderboard.col.level
    if "'leaderboard.col.level':" not in content:
        additions.append(("'leaderboard.col.level':       '%s'," % lb_col['leaderboard.col.level'], 'leaderboard.col'))
    # leaderboard.col.happiness
    if "'leaderboard.col.happiness':" not in content:
        additions.append(("'leaderboard.col.happiness':  '%s'," % lb_col['leaderboard.col.happiness'], 'leaderboard.col'))
    # leaderboard.col.activity
    if "'leaderboard.col.activity':" not in content:
        additions.append(("'leaderboard.col.activity':   '%s'," % lb_col['leaderboard.col.activity'], 'leaderboard.col'))
    
    # health.tab.vaccine
    if "'health.tab.vaccine':" not in content:
        additions.append(("'health.tab.vaccine':        '%s'," % ht_tab['health.tab.vaccine'], 'health.tab'))
    # health.tab.checkup
    if "'health.tab.checkup':" not in content:
        additions.append(("'health.tab.checkup':        '%s'," % ht_tab['health.tab.checkup'], 'health.tab'))
    # health.tab.medicine
    if "'health.tab.medicine':" not in content:
        additions.append(("'health.tab.medicine':       '%s'," % ht_tab['health.tab.medicine'], 'health.tab'))
    
    # health.type.vaccine
    if "'health.type.vaccine':" not in content:
        additions.append(("'health.type.vaccine':       '%s'," % ht_typ['health.type.vaccine'], 'health.type'))
    # health.type.dewormer
    if "'health.type.dewormer':" not in content:
        additions.append(("'health.type.dewormer':      '%s'," % ht_typ['health.type.dewormer'], 'health.type'))
    # health.type.checkup
    if "'health.type.checkup':" not in content:
        additions.append(("'health.type.checkup':       '%s'," % ht_typ['health.type.checkup'], 'health.type'))
    # health.type.medicine
    if "'health.type.medicine':" not in content:
        additions.append(("'health.type.medicine':      '%s'," % ht_typ['health.type.medicine'], 'health.type'))
    
    # inventory.tab.all
    if "'inventory.tab.all':" not in content:
        additions.append(("'inventory.tab.all':         '%s'," % inv_tab['inventory.tab.all'], 'inventory.tab'))
    # inventory.tab.food
    if "'inventory.tab.food':" not in content:
        additions.append(("'inventory.tab.food':        '%s'," % inv_tab['inventory.tab.food'], 'inventory.tab'))
    # inventory.tab.toy
    if "'inventory.tab.toy':" not in content:
        additions.append(("'inventory.tab.toy':         '%s'," % inv_tab['inventory.tab.toy'], 'inventory.tab'))
    # inventory.tab.medicine
    if "'inventory.tab.medicine':" not in content:
        additions.append(("'inventory.tab.medicine':     '%s'," % inv_tab['inventory.tab.medicine'], 'inventory.tab'))
    # inventory.tab.accessory
    if "'inventory.tab.accessory':" not in content:
        additions.append(("'inventory.tab.accessory':   '%s'," % inv_tab['inventory.tab.accessory'], 'inventory.tab'))
    
    if not additions:
        print(f"  {path}: no missing keys found")
        return content
    
    # Group by prefix for ordered insertion
    groups = {}
    for line, prefix in additions:
        if prefix not in groups:
            groups[prefix] = []
        groups[prefix].append(line)
    
    # Insert each group before a suitable anchor line
    for prefix in ['leaderboard.tab', 'leaderboard.col', 'health.tab', 'health.type', 'inventory.tab']:
        if prefix not in groups:
            continue
        lines_to_add = groups[prefix]
        # Find anchor: next key after this group
        # e.g., for leaderboard.tab, insert before leaderboard.col
        # for leaderboard.col, insert before health.
        anchors = {
            'leaderboard.tab': "'leaderboard.col.",
            'leaderboard.col': "'health.",
            'health.tab': "'health.type.",
            'health.type': "'inventory.",
            'inventory.tab': "'achieve.",
        }
        anchor = anchors.get(prefix, '// end')
        anchor_idx = None
        for i, line in enumerate(content.split('\n')):
            if anchor in line and not line.strip().startswith('//'):
                anchor_idx = i
                break
        if anchor_idx is not None:
            lines_str = '\n  ' + '\n  '.join(lines_to_add) + '\n'
            lines = content.split('\n')
            lines.insert(anchor_idx, lines_str)
            content = '\n'.join(lines)
            print(f"  {path}: added {len(lines_to_add)} keys for {prefix}")
    
    return content

import sys
for path in sys.argv[1:]:
    content = fix_file(path)
    with open(path, 'w') as f:
        f.write(content)
    print(f"Fixed: {path}")