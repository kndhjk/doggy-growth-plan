/**
 * Seed marketplace listings to Firestore
 * Run: cd backend && node src/seed-marketplace.js
 */
require('dotenv').config();
const { admin, db } = require('./services/firebaseAdmin');

const MOCK_SALES = [
  {
    title: '进口成犬粮 12kg — 鸡肉配方',
    description: '全新未开封，大袋装成犬粮，适合中大型犬。因为家里狗狗换品牌低价出。',
    category: 'dog', price: 800, location: 'Mount Eden',
    images: [
      'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=600&q=80',
      'https://images.unsplash.com/photo-1612536057832-3cdb8e01c3c1?w=600&q=80',
    ],
    sellerName: '阿Leo', sellerEmail: 'aleo@example.com', sellerId: 'mock_seller_6',
    status: 'active', listingType: 'sale',
  },
  {
    title: '猫粮大包 10kg — 室内成猫配方',
    description: '适合室内成猫，颗粒小、适口性好。刚买不久，因猫咪医生建议换肠胃处方粮，所以转卖。',
    category: 'cat', price: 600, location: 'New Lynn',
    images: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80'],
    sellerName: '小雪', sellerEmail: 'xiaoxue@example.com', sellerId: 'mock_seller_7',
    status: 'active', listingType: 'sale',
  },
  {
    title: '低敏狗粮 6kg — 小型犬专用',
    description: '适合肠胃敏感的小型犬，剩最后两袋，全新未拆。可一起带走也可单买。',
    category: 'dog', price: 1200, location: 'Epsom',
    images: ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80'],
    sellerName: '铲屎官老张', sellerEmail: 'laozhang@example.com', sellerId: 'mock_seller_8',
    status: 'active', listingType: 'sale',
  },
  {
    title: '宠物用品清仓：自动喂食器 + 储粮桶',
    description: '适合猫狗家庭，自动喂食器功能正常，附带储粮桶和密封夹。搬家前一起出售。',
    category: 'pet', price: 150, location: 'Pukekohe',
    images: ['https://images.unsplash.com/photo-1425082661705-1834bfd2d326?w=600&q=80'],
    sellerName: '学生小王', sellerEmail: 'xiaowang@example.com', sellerId: 'mock_seller_9',
    status: 'active', listingType: 'sale',
  },
  {
    title: '高蛋白猫零食礼盒',
    description: '包含冻干、猫条和化毛膏，适合想给猫咪囤零食的人。礼盒装，送人也可以。',
    category: 'cat', price: 1500, location: 'Orewa',
    images: ['https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&q=80'],
    sellerName: '导盲犬训练员May', sellerEmail: 'may@example.com', sellerId: 'mock_seller_10',
    status: 'active', listingType: 'sale',
  },
];

const MOCK_ADOPTIONS = [
  {
    title: '免费转让：未开封幼犬粮 8kg',
    description: '家里狗狗换了处方粮，这袋幼犬粮还没开封。适合中小型犬，保质期到明年，奥克兰中区自取。',
    category: 'dog', price: 0, location: '奥克兰中区',
    images: [
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80',
      'https://images.unsplash.com/photo-1596727147705-61a532a659bd?w=600&q=80',
    ],
    sellerName: '小美', sellerEmail: 'xiaomei@example.com', sellerId: 'mock_seller_1',
    status: 'active', listingType: 'free',
  },
  {
    title: '免费分享：冻干狗零食大礼包',
    description: '买太多了吃不完，里面有鸡胸冻干、牛肉粒和磨牙棒，适合训练奖励。希望一次带走。',
    category: 'dog', price: 0, location: '北岸 North Shore',
    images: [
      'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=600&q=80',
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&q=80',
    ],
    sellerName: '阿Ben', sellerEmail: 'aben@example.com', sellerId: 'mock_seller_2',
    status: 'active', listingType: 'free',
  },
  {
    title: '免费送：成猫主食罐头 24 罐',
    description: '猫咪挑食换品牌后剩下的主食罐，口味是鸡肉和金枪鱼，日期新鲜，适合多猫家庭。',
    category: 'cat', price: 0, location: 'Mount Albert',
    images: ['https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&q=80'],
    sellerName: '猫奴小李', sellerEmail: 'lili@example.com', sellerId: 'mock_seller_3',
    status: 'active', listingType: 'free',
  },
  {
    title: '免费转让：宠物用品组合包',
    description: '包含饮水机、食盆、储粮桶和未开封除臭垫，适合刚养宠物的人直接带走。',
    category: 'pet', price: 0, location: 'Epsom',
    images: ['https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600&q=80'],
    sellerName: '救助人阿花', sellerEmail: 'ahua@example.com', sellerId: 'mock_seller_4',
    status: 'active', listingType: 'free',
  },
  {
    title: '免费送：猫抓板和逗猫玩具',
    description: '猫抓板还有 80% 新，附带一包逗猫棒和替换羽毛，适合猫粮买家顺便一起带。',
    category: 'cat', price: 0, location: 'Parnell',
    images: ['https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=600&q=80'],
    sellerName: 'David W', sellerEmail: 'david@example.com', sellerId: 'mock_seller_5',
    status: 'active', listingType: 'free',
  },
];

async function seed() {
  console.log('🌱 Seeding marketplace data...');
  const allItems = [...MOCK_SALES, ...MOCK_ADOPTIONS];
  const col = db.collection('marketplace');

  for (const item of allItems) {
    const docRef = await col.add({
      ...item,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  ✅ [${item.listingType}] ${item.title}`);
    console.log(`     → ${docRef.id}`);
  }

  console.log(`\n✅ Done! ${allItems.length} listings seeded to Firestore.`);
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
