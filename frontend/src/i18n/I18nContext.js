import React, { createContext, useContext, useState } from 'react';

const translations = {
  zh: {
    appName: 'GG Bond宠物平台',
    marketplace: '市集',
    healthRecords: '健康记录',
    leaderboard: '排行榜',
    inventory: '物品栏',
    map: '宠物地图',
    adopt: '领养',
    settings: '设置',
    language: '语言',
    // Marketplace
    listingTitle: '标题',
    description: '描述',
    location: '位置',
    price: '价格',
    buy: '购买',
    // Health
    recordTitle: '记录标题',
    notes: '备注',
    date: '日期',
    vet: '兽医',
    // Leaderboard
    rank: '排名',
    petName: '宠物名',
    owner: '主人',
    score: '积分',
    breed: '品种',
    // Inventory
    itemName: '物品名称',
    quantity: '数量',
    category: '分类',
    // Map
    checkIn: '签到',
    checkInNotes: '签到备注',
    placeInfo: '地点信息',
    // Adopt
    personality: '性格',
    age: '年龄',
    gender: '性别',
    adoptMe: '领养我',
    // Common
    loading: '加载中...',
    error: '加载失败',
    noData: '暂无数据',
    empty: '-',
    // Leaderboard column labels
    'leaderboard.col.happiness': '幸福',
    'leaderboard.col.activity': '活跃',
    'leaderboard.col.level': 'LV',
    ownerPrefix: '主人 ',
    // Health
    'health.total': '共 {n} 条记录',
    'health.lastCheckup': '上次检查: {date}',
  },
  en: {
    appName: 'GG Bond Pet Platform',
    marketplace: 'Marketplace',
    healthRecords: 'Health Records',
    leaderboard: 'Leaderboard',
    inventory: 'Inventory',
    map: 'Pet Map',
    adopt: 'Adopt',
    settings: 'Settings',
    language: 'Language',
    // Marketplace
    listingTitle: 'Title',
    description: 'Description',
    location: 'Location',
    price: 'Price',
    buy: 'Buy',
    // Health
    recordTitle: 'Record Title',
    notes: 'Notes',
    date: 'Date',
    vet: 'Vet',
    // Leaderboard
    rank: 'Rank',
    petName: 'Pet Name',
    owner: 'Owner',
    score: 'Score',
    breed: 'Breed',
    // Inventory
    itemName: 'Item Name',
    quantity: 'Qty',
    category: 'Category',
    // Map
    checkIn: 'Check In',
    checkInNotes: 'Check-in Notes',
    placeInfo: 'Place Info',
    // Adopt
    personality: 'Personality',
    age: 'Age',
    gender: 'Gender',
    adoptMe: 'Adopt Me',
    // Common
    loading: 'Loading...',
    error: 'Failed to load',
    noData: 'No data',
    empty: '-',
    // Leaderboard column labels
    'leaderboard.col.happiness': 'Happiness',
    'leaderboard.col.activity': 'Active',
    'leaderboard.col.level': 'LV',
    ownerPrefix: 'Owner ',
    // Health
    'health.total': '{n} records',
    'health.lastCheckup': 'Last checkup: {date}',
  },
  ja: {
    appName: 'GG Bondペットプラットフォーム',
    marketplace: 'マーケットプレイス',
    healthRecords: '健康記録',
    leaderboard: 'リーダーボード',
    inventory: 'インベントリ',
    map: 'ペットマップ',
    adopt: '里親募集',
    settings: '設定',
    language: '言語',
    // Marketplace
    listingTitle: 'タイトル',
    description: '説明',
    location: '場所',
    price: '価格',
    buy: '購入',
    // Health
    recordTitle: '記録タイトル',
    notes: 'メモ',
    date: '日付',
    vet: '獣医',
    // Leaderboard
    rank: '順位',
    petName: 'ペット名',
    owner: '飼い主',
    score: 'スコア',
    breed: '品種',
    // Inventory
    itemName: '物品名',
    quantity: '数量',
    category: 'カテゴリー',
    // Map
    checkIn: 'チェックイン',
    checkInNotes: 'チェックインノート',
    placeInfo: '場所情報',
    // Adopt
    personality: '性格',
    age: '年齢',
    gender: '性別',
    adoptMe: '里親になる',
    // Common
    loading: '読み込み中...',
    error: '読み込み失敗',
    noData: 'データなし',
    empty: '-',
    // Leaderboard column labels
    'leaderboard.col.happiness': '幸福',
    'leaderboard.col.activity': 'アクティブ',
    'leaderboard.col.level': 'LV',
    ownerPrefix: 'オーナー ',
    // Health
    'health.total': '{n}件の記録',
    'health.lastCheckup': '前回の検査: {date}',
  },
  mi: {
    appName: 'GG Bond Pet Platform',
    marketplace: ' Mākete',
    healthRecords: 'Rekōta Hauora',
    leaderboard: 'Rārangi Kaupapa',
    inventory: 'Kōpae',
    map: 'Mapa Peti',
    adopt: 'Ka tautoko',
    settings: 'Tautuhinga',
    language: 'Reo',
    // Marketplace
    listingTitle: 'Taitara',
    description: 'Whakaahuatanga',
    location: 'Wāhi',
    price: 'Te utu',
    buy: 'Whakaroha',
    // Health
    recordTitle: 'Ingoa Rekōta',
    notes: 'Kōrero',
    date: 'Rā',
    vet: 'Taote',
    // Leaderboard
    rank: 'Raupapa',
    petName: 'Ingoa Peti',
    owner: 'Tāngata pupuri',
    score: 'Rerekētanga',
    breed: 'Momo',
    // Inventory
    itemName: 'Ingoa taonga',
    quantity: 'Rahinga',
    category: 'Kōmaka',
    // Map
    checkIn: 'Whakauru',
    checkInNotes: 'Kōrero whakauru',
    placeInfo: 'Mōhiohio wāhi',
    // Adopt
    personality: 'Hurō',
    age: 'Pakeke',
    gender: 'Mokopuna',
    adoptMe: 'Tautoko mai',
    // Common
    loading: 'Kei te utu...',
    error: 'Kua horo',
    noData: 'Kāore he raraunga',
    empty: '-',
    // Leaderboard column labels
    'leaderboard.col.happiness': 'Hauora',
    'leaderboard.col.activity': 'Nekehia',
    'leaderboard.col.level': 'LV',
    ownerPrefix: 'Tāngata ',
    // Health
    'health.total': '{n} rekōta',
    'health.lastCheckup': 'Arotake whakamutunga: {date}',
  },
};

const I18nContext = createContext({
  lang: 'en',
  t: (key) => key,
  setLang: () => {},
  availableLangs: ['en', 'zh', 'ja', 'mi'],
});

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('en');

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, t, setLang, availableLangs: ['en', 'zh', 'ja', 'mi'] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export default I18nContext;
