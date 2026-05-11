require('dotenv').config();
const express = require('express');
const cors = require('cors');
const aiRouter = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// AI routes (including translation)
app.use('/api/ai', aiRouter);

// Marketplace listings (mock data for demo) - dog food brands
const MOCK_LISTINGS = [
  { id: 1, title: 'Royal Canin 皇家金毛专用粮 10kg', brand: 'Royal Canin', description: '法国皇家针对金毛犬种配方，含 EPA/DHA 强化毛色，适合 15 个月以上成犬', location: 'Auckland CBD', price: 85, image: '/images/royal.jpg' },
  { id: 2, title: "Hill's Science Diet 希尔斯成犬均衡配方 12kg", brand: "Hill's Science Diet", description: '兽医推荐，临床验证营养配比，适合中型成犬日常喂养', location: 'Mount Eden', price: 110, image: '/images/hills.png' },
  { id: 3, title: 'Pro Plan 冠能高蛋白活力配方 15kg', brand: 'Pro Plan', description: '雀巢普瑞纳，30% 蛋白质，适合活跃成犬补能', location: 'Newmarket', price: 95, image: '/images/proplan.jpg' },
  { id: 4, title: 'Orijen 渴望无谷六鱼配方 11.4kg', brand: 'Orijen', description: '加拿大原产 85% 动物原料，无谷低敏，适合所有阶段犬只', location: 'Ponsonby', price: 145, image: '/images/orijen.jpg' },
  { id: 5, title: 'Acana 爱肯拿牧场鸡肉配方 11.4kg', brand: 'Acana', description: '加拿大放养鸡 + 火鸡蛋白，适合中大型成犬', location: 'Parnell', price: 98, image: '/images/acana.jpg' },
  { id: 6, title: 'Ziwi Peak 滋益巅峰风干羊肉配方 1kg', brand: 'Ziwi Peak', description: '新西兰本土高端品牌，96% 草饲羊肉 + 内脏 + 骨头，慢速风干工艺，适合所有阶段犬只', location: 'Botany Downs', price: 75, image: '/images/ziwi.jpg' },
  { id: 7, title: 'Black Hawk 黑鹰成犬羊肉米饭配方 10kg', brand: 'Black Hawk', description: '澳洲品牌，天然羊肉 + 糙米配方，适合中大型成犬日常喂养，NZ 超市常见', location: 'Mount Albert', price: 68, image: '/images/blackhawk.jpg' },
  { id: 8, title: 'K9 Natural 纯天然牛肉冻干 500g', brand: 'K9 Natural', description: '新西兰本土冻干生骨肉，90% 草饲牛肉 + 内脏，无谷低敏，适合所有阶段', location: 'North Shore', price: 58, image: '/images/k9.jpg' },
];

app.get('/api/marketplace', (req, res) => res.json(MOCK_LISTINGS));

// Health records (mock data)
const MOCK_HEALTH_RECORDS = [
  { id: 1, title: '年度疫苗接种', notes: '已完成狂犬疫苗和犬瘟热疫苗接种', date: '2024-03-15', vet: '张医生' },
  { id: 2, title: '体检报告', notes: '体重4.5公斤，各项指标正常', date: '2024-02-20', vet: '李医生' },
  { id: 3, title: '驱虫记录', notes: '已进行体内驱虫，无寄生虫', date: '2024-01-10', vet: '王医生' },
];

app.get('/api/health-records', (req, res) => res.json(MOCK_HEALTH_RECORDS));

// Inventory (mock data)
const MOCK_INVENTORY = [
  { id: 1, name: '宠物笼', description: '大型犬用航空箱，透气性好', quantity: 3, category: '用品' },
  { id: 2, name: '狗粮', description: '皇家牌成年犬粮，10公斤装', quantity: 5, category: '食品' },
  { id: 3, name: '玩具球', description: '发声球，耐咬安全材质', quantity: 10, category: '玩具' },
  { id: 4, name: '宠物床', description: '四季通用保暖窝，大号', quantity: 2, category: '用品' },
];

app.get('/api/inventory', (req, res) => res.json(MOCK_INVENTORY));

// Leaderboard (mock data)
const MOCK_RANKINGS = [
  { rank: 1, petName: '毛毛', owner: '王小明', score: 9850, breed: '金毛' },
  { rank: 2, petName: '豆豆', owner: '李小红', score: 9200, breed: '柯基' },
  { rank: 3, petName: '旺财', owner: '张大伟', score: 8750, breed: '哈士奇' },
  { rank: 4, petName: '小白', owner: '陈美丽', score: 8400, breed: '萨摩耶' },
  { rank: 5, petName: '黑黑', owner: '刘强', score: 7900, breed: '拉布拉多' },
];

app.get('/api/leaderboard', (req, res) => res.json(MOCK_RANKINGS));

app.listen(PORT, () => {
  console.log(`GG Bond backend running on port ${PORT}`);
});
