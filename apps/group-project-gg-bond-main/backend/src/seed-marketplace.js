/**
 * Seed marketplace listings to Firestore
 * Run: cd backend && node src/seed-marketplace.js
 */
require('dotenv').config();
const { admin, db } = require('./services/firebaseAdmin');

const MOCK_SALES = [
  {
    title: '柯基弟弟 — 屁股扭扭找新家',
    description: '6个月柯基弟弟，疫苗齐全，身体健康。性格活泼粘人，屁股扭扭是它的标志技能。已学会定点上厕所，送狗粮、狗窝、玩具。要求领养人有时间陪伴。',
    category: 'dog', breed: '柯基', price: 800, location: 'Mount Eden',
    images: [
      'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=600&q=80',
      'https://images.unsplash.com/photo-1612536057832-3cdb8e01c3c1?w=600&q=80',
    ],
    sellerName: '阿Leo', sellerEmail: 'aleo@example.com', sellerId: 'mock_seller_6',
    status: 'active', listingType: 'sale',
  },
  {
    title: '英短蓝猫 — 安静乖巧适合公寓',
    description: '1岁英短蓝猫弟弟，健康已绝育。性格安静不爱叫，不破坏家具，非常适合公寓或单居室。已打疫苗，体内外驱虫，耳朵干净。要求领养人稳定住所。',
    category: 'cat', breed: '英国短毛猫', price: 600, location: 'New Lynn',
    images: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80'],
    sellerName: '小雪', sellerEmail: 'xiaoxue@example.com', sellerId: 'mock_seller_7',
    status: 'active', listingType: 'sale',
  },
  {
    title: '柴犬妹妹 — 表情包本包',
    description: '8个月柴犬妹妹，疫苗齐全，已绝育。行走的表情包，表情极其丰富。性格独立但粘人，爱干净会自己清理毛发。送全套狗具，接受上门看狗。',
    category: 'dog', breed: '柴犬', price: 1200, location: 'Epsom',
    images: ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80'],
    sellerName: '铲屎官老张', sellerEmail: 'laozhang@example.com', sellerId: 'mock_seller_8',
    status: 'active', listingType: 'sale',
  },
  {
    title: '仓鼠一家 — 萌萌哒小团子',
    description: '2个月大的仓鼠宝宝，一共5只，金丝熊品种。毛色干净健康，性格温顺会亲人，已断奶可以独立吃鼠粮和辅食。需要整套笼子+跑轮+木屑一起带走。',
    category: 'other', breed: '金丝熊仓鼠', price: 150, location: 'Pukekohe',
    images: ['https://images.unsplash.com/photo-1425082661705-1834bfd2d326?w=600&q=80'],
    sellerName: '学生小王', sellerEmail: 'xiaowang@example.com', sellerId: 'mock_seller_9',
    status: 'active', listingType: 'sale',
  },
  {
    title: '拉布拉多 — 导盲犬血统找爱家',
    description: '1岁拉布拉多，祖辈有导盲犬血统，身体非常健康，体型标准。性格温和无攻击性，对小孩和老人特别友好。已完成基础服从训练，包括等待、召回、坐下。',
    category: 'dog', breed: '拉布拉多猎犬', price: 1500, location: 'Orewa',
    images: ['https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&q=80'],
    sellerName: '导盲犬训练员May', sellerEmail: 'may@example.com', sellerId: 'mock_seller_10',
    status: 'active', listingType: 'sale',
  },
];

const MOCK_ADOPTIONS = [
  {
    title: '萨摩耶 MM — 微笑天使找新家',
    description: '2岁萨摩耶弟弟，疫苗齐全，驱虫已做。性格非常温柔，从不咬人，喜欢和小朋友玩。因主人移民无法继续抚养，希望找一个有爱心的新主人。可以上门看狗，必须签署领养协议。',
    category: 'dog', breed: '萨摩耶', price: 0, location: '奥克兰中区',
    images: [
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80',
      'https://images.unsplash.com/photo-1596727147705-61a532a659bd?w=600&q=80',
    ],
    sellerName: '小美', sellerEmail: 'xiaomei@example.com', sellerId: 'mock_seller_1',
    status: 'active', listingType: 'adoption',
  },
  {
    title: '金毛弟弟 — 暖男找靠谱人家',
    description: '1岁半金毛猎犬，健康活泼，已绝育。三针疫苗+狂犬疫苗全打完，体内外驱虫完成。喜欢玩球和游泳，对小孩和其他宠物都很友好。希望领养家庭有稳定住所，能给予足够运动和陪伴。',
    category: 'dog', breed: '金毛猎犬', price: 0, location: '北岸 North Shore',
    images: [
      'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=600&q=80',
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&q=80',
    ],
    sellerName: '阿Ben', sellerEmail: 'aben@example.com', sellerId: 'mock_seller_2',
    status: 'active', listingType: 'adoption',
  },
  {
    title: '布偶猫 — 温柔小公主等领养',
    description: '2岁布偶猫妹妹，健康状况良好，已绝育。性格超级温顺，爱撒娇，最爱被人抱着。会用猫砂盆，不抓沙发，非常适合公寓饲养。要求领养人有稳定收入，给她一个温暖的家。',
    category: 'cat', breed: '布偶猫', price: 0, location: 'Mount Albert',
    images: ['https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&q=80'],
    sellerName: '猫奴小李', sellerEmail: 'lili@example.com', sellerId: 'mock_seller_3',
    status: 'active', listingType: 'adoption',
  },
  {
    title: '田园猫三兄妹 — 一起领养优先',
    description: '3个月大的三花田园猫宝宝，两母一公，健康活泼。猫妈妈是只很乖的流浪猫，宝宝们都很黏人社会化训练良好。领养需接受上门回访，领养成功后一起打疫苗。',
    category: 'cat', breed: '中华田园猫', price: 0, location: 'Epsom',
    images: ['https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600&q=80'],
    sellerName: '救助人阿花', sellerEmail: 'ahua@example.com', sellerId: 'mock_seller_4',
    status: 'active', listingType: 'adoption',
  },
  {
    title: '边牧女孩 — 超级聪明找运动家庭',
    description: '3岁边境牧羊犬妹妹，智商排名第一，非常聪明，学东西极快。已完成基础服从训练，会握手、等食、翻滚。因主人工作调动需离开纽西兰，寻找有时间陪伴和训练它的家庭。',
    category: 'dog', breed: '边境牧羊犬', price: 0, location: 'Parnell',
    images: ['https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=600&q=80'],
    sellerName: 'David W', sellerEmail: 'david@example.com', sellerId: 'mock_seller_5',
    status: 'active', listingType: 'adoption',
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
