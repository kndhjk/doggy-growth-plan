#!/usr/bin/env python3
"""Fix ja.js and mi.js locale files:
1. Change 'const en' to 'const ja' / 'const mi'
2. Localize all values that are currently English
"""

def fix_locale(path, lang_code):
    content = open(path).read()
    
    # Change variable name
    content = content.replace('const en = {', f'const {lang_code} = {{')
    content = content.replace('export default en;', f'export default {lang_code};')
    
    # Japanese translations
    translations_ja = {
        # Navigation
        'nav.home':      'ホーム',
        'nav.ai':        'AIアドバイザー',
        'nav.map':       'マップ',
        'nav.marketplace': 'マーケットプレイス',
        'nav.community': 'コミュニティ',
        'nav.profile':   'プロフィール',
        'nav.adopt':     '飼う',
        'nav.achievements': '実績',
        'nav.inventory':  'インベントリ',
        'nav.leaderboard': 'リーダーボード',
        'nav.rewards':    '報酬',
        'nav.training':   'トレーニング',
        'nav.health':    '健康',
        # Leaderboard
        'leaderboard.tab.total':      '総合',
        'leaderboard.tab.active':     'アクティブ',
        'leaderboard.tab.newcomer':   '新人',
        'leaderboard.col.rank':       '#',
        'leaderboard.col.pet':        'ペット',
        'leaderboard.col.level':      'レベル',
        'leaderboard.col.happiness':  '幸福度',
        'leaderboard.col.activity':   'アクティブ度',
        # Health
        'health.tab.vaccine':       'ワクチン',
        'health.tab.checkup':       '健康診断',
        'health.tab.medicine':      'おくすり',
        'health.type.vaccine':      'ワクチン',
        'health.type.dewormer':     '虫下し',
        'health.type.checkup':      '健康診断',
        'health.type.medicine':     'おくすり',
        # Inventory
        'inventory.tab.all':       'すべて',
        'inventory.tab.food':      'エサ',
        'inventory.tab.toy':       'おもちゃ',
        'inventory.tab.medicine':   'くすり',
        'inventory.tab.accessory':  'アクセ',
        # Common
        'common.loading':    '読み込み中…',
        'common.error':      'エラー',
        'common.success':    '成功',
        'common.cancel':     'キャンセル',
        'common.confirm':    '確認',
        'common.save':       '保存',
        'common.delete':     '削除',
        'common.edit':       '編集',
        'common.close':      '閉じる',
    }
    
    # Māori translations
    translations_mi = {
        # Navigation
        'nav.home':      'Kāinga',
        'nav.ai':        'Kaiwhiriwhiri AI',
        'nav.map':       'Mahere',
        'nav.marketplace': ' Mākete',
        'nav.community': 'Hapori',
        'nav.profile':   'Pūkenga',
        'nav.adopt':     'Ka hao',
        'nav.achievements': 'Hua',
        'nav.inventory':  'Tōpūtin',
        'nav.leaderboard': 'Rārangi taumata',
        'nav.rewards':    'Uara',
        'nav.training':   'Whakangungu',
        'nav.health':     'Hauora',
        # Leaderboard
        'leaderboard.tab.total':      'Taponga',
        'leaderboard.tab.active':     'Whakahaere',
        'leaderboard.tab.newcomer':   'Mahi hou',
        'leaderboard.col.rank':       '#',
        'leaderboard.col.pet':        'Peti',
        'leaderboard.col.level':      'Taumata',
        'leaderboard.col.happiness':   'Hūtia',
        'leaderboard.col.activity':   'Whakahaere',
        # Health
        'health.tab.vaccine':       'Whakatau',
        'health.tab.checkup':       'Arotake',
        'health.tab.medicine':      'Rongoā',
        'health.type.vaccine':      'Whakatau',
        'health.type.dewormer':     'Whakakore',
        'health.type.checkup':      'Arotake',
        'health.type.medicine':     'Rongoā',
        # Inventory
        'inventory.tab.all':       'Katoa',
        'inventory.tab.food':       'Kai',
        'inventory.tab.toy':        'Mīkini',
        'inventory.tab.medicine':   'Rongoā',
        'inventory.tab.accessory':  'Tāpiri',
        # Common
        'common.loading':    'Tatari ana…',
        'common.error':     'Hapa',
        'common.success':   'Mānuka',
        'common.cancel':    'Whakakore',
        'common.confirm':   'Whakaū',
        'common.save':      'Tiaki',
        'common.delete':    'Mukua',
        'common.edit':      'Whakatika',
        'common.close':     'Katia',
    }
    
    translations = translations_ja if lang_code == 'ja' else translations_mi
    
    for key, val in translations.items():
        # Match the pattern: 'key':      'value', or similar
        # Replace English value with localized value
        import re
        # Pattern: quotes around key, colon, spaces, any value in single quotes
        pattern = rf"('{re.escape(key)}':\s*)'[^']*'"
        replacement = rf"\1'{val}'"
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            print(f"  {key}: '{content[content.find(key)-2:content.find(key)+len(key)+30]}' → '{val}'")
        content = new_content
    
    with open(path, 'w') as f:
        f.write(content)
    print(f"Fixed: {path}")

if __name__ == '__main__':
    import sys
    fix_locale(sys.argv[1], sys.argv[2])