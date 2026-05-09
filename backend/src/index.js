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

// Marketplace listings (mock data for demo)
const MOCK_LISTINGS = [
  { id: 1, title: '可爱的小狗', description: '三个月大的金毛寻回犬', location: '北京市朝阳区', price: 2000, image: 'https://placekitten.com/300/200' },
  { id: 2, title: '进口猫粮', description: '天然无谷物配方，适合所有年龄段猫咪', location: '上海市浦东新区', price: 350, image: 'https://placekitten.com/301/200' },
  { id: 3, title: '宠物牵引绳', description: '加厚防爆冲遛狗绳子', location: '广州市天河区', price: 89, image: 'https://placekitten.com/302/200' },
  { id: 4, title: '皇家牧羊犬宝宝', description: '纯种德国牧羊犬，性格温顺聪明', location: '深圳市南山区', price: 5000, image: 'https://placekitten.com/303/200' },
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
