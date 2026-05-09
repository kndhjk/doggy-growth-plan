import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { rp } from '../utils/responsive';
import { AchievementsAPI } from '../services/apiLayer';

const RARITY_PTS = { common: 10, uncommon: 25, rare: 50, legendary: 100 };
const LEVELS = [
  { name: '青铜',    min: 0,   max: 99,   color: '#cd7f32', bg: 'rgba(205,127,50,0.1)'  },
  { name: '白银',    min: 100, max: 249,  color: '#c0c0c0', bg: 'rgba(192,192,192,0.1)' },
  { name: '黄金',    min: 250, max: 499,  color: '#fcd34d', bg: 'rgba(252,211,77,0.12)' },
  { name: '铂金',    min: 500, max: 999,  color: '#94a3b8', bg: 'rgba(148,163,184,0.12)'},
  { name: '钻石',    min: 1000,max: 99999,color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
];

const ACHIEVEMENTS = [
  // 宠物相关
  { id:'a1',  title:'初次见面',       desc:'领养你的第一只宠物',               emoji:'🐾', category:'pet',     rarity:'common',    condition:{ type:'pet_owned' } },
  { id:'a2',  title:'铲屎官初体验',   desc:'喂养宠物 10 次',                   emoji:'🍖', category:'pet',     rarity:'common',    condition:{ type:'feed_count', count:10 } },
  { id:'a3',  title:'健身达人',       desc:'带宠物运动 20 次',                 emoji:'🏃', category:'pet',     rarity:'uncommon',  condition:{ type:'exercise_count', count:20 } },
  { id:'a4',  title:'宠物医师',       desc:'给宠物使用药品 15 次',             emoji:'💊', category:'pet',     rarity:'uncommon',  condition:{ type:'medicine_count', count:15 } },
  { id:'a5',  title:'快乐源泉',       desc:'宠物快乐值达到 100',               emoji:'😊', category:'pet',     rarity:'rare',      condition:{ type:'happiness_max' } },
  { id:'a6',  title:'全能宠物',       desc:'宠物等级达到 10 级',               emoji:'⭐', category:'pet',     rarity:'rare',      condition:{ type:'pet_level', level:10 } },
  // 社交相关
  { id:'a7',  title:'社交达人',       desc:'在社区发布 5 篇帖子',               emoji:'📝', category:'social',  rarity:'common',    condition:{ type:'post_count', count:5 } },
  { id:'a8',  title:'人缘王',         desc:'帖子获得 50 个点赞',               emoji:'❤️', category:'social',  rarity:'uncommon',  condition:{ type:'total_likes', count:50 } },
  { id:'a9',  title:'意见领袖',       desc:'帖子获得 200 个点赞',              emoji:'🏅', category:'social',  rarity:'rare',      condition:{ type:'total_likes', count:200 } },
  { id:'a10', title:'聊天达人',       desc:'发送 30 条私信',                   emoji:'💬', category:'social',  rarity:'common',    condition:{ type:'message_count', count:30 } },
  // 市场相关
  { id:'a11', title:'淘宝达人',       desc:'在市场购买 3 件商品',               emoji:'🛒', category:'market',  rarity:'common',    condition:{ type:'purchase_count', count:3 } },
  { id:'a12', title:'大卖家',         desc:'在市场成功售出 5 件商品',           emoji:'💰', category:'market',  rarity:'uncommon',  condition:{ type:'sell_count', count:5 } },
  { id:'a13', title:'收藏家',         desc:'背包道具数量达到 20 件',           emoji:'📦', category:'market',  rarity:'rare',      condition:{ type:'inventory_size', count:20 } },
  // 探索相关
  { id:'a14', title:'探险家',         desc:'探索地图 10 个地点',               emoji:'🗺️', category:'explore', rarity:'common',    condition:{ type:'map_visit', count:10 } },
  { id:'a15', title:'足迹遍布',       desc:'探索地图 50 个地点',               emoji:'✈️', category:'explore', rarity:'uncommon',  condition:{ type:'map_visit', count:50 } },
  { id:'a16', title:'AI 尝鲜者',     desc:'使用 AI 顾问功能 10 次',           emoji:'🤖', category:'explore', rarity:'common',    condition:{ type:'ai_use_count', count:10 } },
  // 成就系统
  { id:'a17', title:'成就猎手',       desc:'解锁 10 个成就',                   emoji:'🎯', category:'meta',    rarity:'uncommon',  condition:{ type:'achievements_unlocked', count:10 } },
  { id:'a18', title:'完美主义',       desc:'解锁全部成就',                     emoji:'👑', category:'meta',    rarity:'legendary',  condition:{ type:'all_achievements' } },
  { id:'a19', title:'坚持不懈',       desc:'连续登录 7 天',                   emoji:'🔥', category:'meta',    rarity:'uncommon',  condition:{ type:'login_streak', days:7 } },
  { id:'a20', title:'欧皇',           desc:'单次开箱获得稀有道具',             emoji:'🍀', category:'meta',    rarity:'rare',      condition:{ type:'rare_item_obtain' } },
];

const CATEGORIES = [
  { key:'all',        label:'全部',      emoji:'🏆' },
  { key:'pet',        label:'宠物',      emoji:'🐾' },
  { key:'social',     label:'社交',      emoji:'💬' },
  { key:'market',     label:'市场',      emoji:'🛒' },
  { key:'explore',    label:'探索',      emoji:'🗺️' },
  { key:'meta',       label:'成就',      emoji:'🎯' },
  { key:'unlocked',   label:'已解锁',    emoji:'⭐' },
  { key:'locked',     label:'进行中',    emoji:'🔒' },
];

const RARITY_COLORS = {
  common:    { border:'#d1d5db', bg:'linear-gradient(145deg,#f9fafb,#fff)',       glow:'#9ca3af', text:'#6b7280',       label:'普通' },
  uncommon:  { border:'#6ee7b7', bg:'linear-gradient(145deg,#ecfdf5,#fff)',        glow:'#10b981', text:'#065f46',       label:'稀有' },
  rare:      { border:'#93c5fd', bg:'linear-gradient(145deg,#eff6ff,#fff)',        glow:'#3b82f6', text:'#1e3a8a',       label:'珍稀' },
  legendary: { border:'#fcd34d', bg:'linear-gradient(145deg,#fffbeb,#fef3c7)',     glow:'#f59e0b', text:'#78350f',       label:'传奇' },
};

// ── Achievement progress helpers ─────────────────────────────────────────────────
function getProgress(ach, counters) {
  const { type } = ach.condition;
  const cats = { feed_count:'feed_count', exercise_count:'exercise_count', medicine_count:'medicine_count',
                 post_count:'post_count', total_likes:'total_likes', message_count:'message_count',
                 purchase_count:'purchase_count', sell_count:'sell_count', inventory_size:'inventory_size',
                 map_visit:'map_visit', ai_use_count:'ai_use_count',
                 achievements_unlocked:'achievements_unlocked', login_streak:'login_streak' };
  const key = cats[type];
  if (type === 'pet_owned')    return { current:1, target:1,  done:true  };
  if (type === 'happiness_max')return { current:85, target:100,done:false };
  if (type === 'pet_level')    return { current:3,  target:10, done:false };
  if (type === 'all_achievements') return { current:3, target:ACHIEVEMENTS.length, done:false };
  if (type === 'rare_item_obtain') return { current:0, target:1, done:false };
  const current = counters[key] || 0;
  const target = ach.condition.count || ach.condition.level || ach.condition.days || 1;
  return { current, target, done: current >= target };
}

function getTotalPoints(unlockedIds) {
  return ACHIEVEMENTS.filter(a => unlockedIds.has(a.id))
    .reduce((sum, a) => sum + (RARITY_PTS[a.rarity] || 10), 0);
}

function getLevel(pts) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (pts >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti({ onDone }) {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i, x: Math.random() * 100,
    delay: Math.random() * 0.8,
    color: ['#f472b6','#fb7185','#facc15','#4ade80','#60a5fa','#c084fc','#f97316','#fcd34d'][i % 8],
    size: 6 + Math.random() * 10,
    isCircle: Math.random() > 0.5,
    rot: Math.random() * 360,
  }));
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:9999 }}>
      {pieces.map(p => (
        <motion.div key={p.id}
          initial={{ top:-20, left:`${p.x}%`, opacity:1, rotate:0 }}
          animate={{ top:'110%', opacity:[1,1,0], rotate:p.rot + 720 }}
          transition={{ duration:2.5, delay:p.delay, ease:'easeIn' }}
          style={{ position:'absolute', width:p.size, height:p.size, background:p.color,
                   borderRadius:p.isCircle ? '50%' : 2 }} />
      ))}
    </div>
  );
}

// ── Achievement Detail Panel (desktop) / Modal (mobile) ────────────────────────
function AchievementDetail({ ach, isUnlocked, unlockDate, onClose, onSimulateUnlock, onAddProgress, counters }) {
  const { current, target, done } = getProgress(ach, counters);
  const colors = RARITY_COLORS[ach.rarity] || RARITY_COLORS.common;
  const pts = RARITY_PTS[ach.rarity] || 10;
  const pct = Math.min(100, Math.round((current / target) * 100));

  const share = () => {
    const txt = `🎉 我在 GG Bond 解锁了【${ach.title}】！已获得成就 ${ach.emoji} ${ach.desc}`;
    navigator.clipboard?.writeText(txt).then(() => toast.success('已复制到剪贴板！')).catch(() => toast('复制失败'));
  };

  const content = (
    <div style={{
      background:'white', borderRadius:24, padding:28, maxWidth:400, width:'100%',
      boxShadow:'0 24px 60px rgba(0,0,0,0.2)', position:'relative',
      border:`2px solid ${isUnlocked ? colors.glow : colors.border}`,
    }}>
      {/* Close */}
      <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'#f3f4f6', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>

      {/* Emoji hero */}
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:300, damping:15 }}
          style={{ fontSize:72, lineHeight:1, marginBottom:12, display:'inline-block' }}>
          {ach.emoji}
        </motion.div>
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:8 }}>
          <span style={{ background:colors.bg.includes('145deg') ? colors.bg : colors.border+'22', border:`1.5px solid ${colors.border}`, borderRadius:99, padding:'2px 10px', fontSize:12, fontWeight:700, color:colors.text }}>
            {colors.label}
          </span>
          <span style={{ background:'#fce7f3', borderRadius:99, padding:'2px 10px', fontSize:12, fontWeight:700, color:'#be185d' }}>
            +{pts} pts
          </span>
        </div>
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'#1e293b' }}>{ach.title}</h2>
        <p style={{ margin:'4px 0 0', fontSize:13, color:'#9ca3af' }}>{ach.desc}</p>
      </div>

      {/* Unlock date */}
      {isUnlocked && unlockDate && (
        <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:12, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#15803d' }}>
          ✅ 已解锁 · {unlockDate}
        </div>
      )}

      {/* Progress */}
      {!isUnlocked && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6b7280', marginBottom:6 }}>
            <span>解锁进度</span>
            <span style={{ fontWeight:700, color:colors.text }}>{current} / {target}</span>
          </div>
          <div style={{ height:8, background:'#f3f4f6', borderRadius:99 }}>
            <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.5 }}
              style={{ height:'100%', background:`linear-gradient(90deg,${colors.border},${colors.glow})`, borderRadius:99 }} />
          </div>
        </div>
      )}

      {/* Category + rarity */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[
          { label:'分类', value:{ pet:'🐾 宠物', social:'💬 社交', market:'🛒 市场', explore:'🗺️ 探索', meta:'🎯 成就' }[ach.category] },
          { label:'稀有度', value:colors.label },
        ].map(item => (
          <div key={item.label} style={{ flex:1, background:'#f9fafb', borderRadius:10, padding:'8px 10px' }}>
            <div style={{ fontSize:10, color:'#9ca3af', marginBottom:2 }}>{item.label}</div>
            <div style={{ fontSize:13, fontWeight:600, color:'#374151' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {!isUnlocked && (
          <>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => onAddProgress(ach, 1)}  style={{ flex:1, padding:'9px', background:'#fce7f3', border:'none', borderRadius:12, fontWeight:700, fontSize:13, color:'#be185d', cursor:'pointer' }}>+1 进度</button>
              <button onClick={() => onAddProgress(ach, 5)}  style={{ flex:1, padding:'9px', background:'#fce7f3', border:'none', borderRadius:12, fontWeight:700, fontSize:13, color:'#be185d', cursor:'pointer' }}>+5 进度</button>
              <button onClick={() => onAddProgress(ach, target - current)} style={{ flex:1, padding:'9px', background:'linear-gradient(135deg,#be185d,#ec4899)', border:'none', borderRadius:12, fontWeight:700, fontSize:13, color:'white', cursor:'pointer' }}>完成</button>
            </div>
            <button onClick={() => onSimulateUnlock(ach)} style={{ width:'100%', padding:'9px', background:'linear-gradient(135deg,#f59e0b,#f97316)', border:'none', borderRadius:12, fontWeight:700, fontSize:13, color:'white', cursor:'pointer' }}>
              🧪 模拟解锁（演示用）
            </button>
          </>
        )}
        {isUnlocked && (
          <button onClick={share} style={{ width:'100%', padding:'9px', background:'linear-gradient(135deg,#be185d,#ec4899)', border:'none', borderRadius:12, fontWeight:700, fontSize:13, color:'white', cursor:'pointer' }}>
            🎉 炫耀一下（复制到剪贴板）
          </button>
        )}
        <button onClick={onClose} style={{ width:'100%', padding:'9px', background:'white', border:'2px solid #e5e7eb', borderRadius:12, fontWeight:700, fontSize:13, color:'#6b7280', cursor:'pointer' }}>
          关闭
        </button>
      </div>
    </div>
  );

  return content;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const DEFAULT_COUNTERS = {
  feed_count:7, exercise_count:3, medicine_count:2, post_count:1, total_likes:12,
  message_count:5, purchase_count:1, sell_count:0, inventory_size:13, map_visit:4,
  ai_use_count:2, achievements_unlocked:3, login_streak:2,
};

export default function AchievementsPage() {
  const [counters, setCounters]     = useState(DEFAULT_COUNTERS);
  const [unlockedIds, setUnlockedIds] = useState(new Set());
  const [unlockDates, setUnlockDates] = useState({});
  const [filter, setFilter]         = useState('all');
  const [selected, setSelected]     = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [recentUnlocked, setRecentUnlocked] = useState([]);
  const [isDesktop, setIsDesktop]   = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [apiReady, setApiReady]     = useState(false);
  const panelRef = useRef(null);

  // Load from API (with localStorage fallback inside API layer)
  useEffect(() => {
    AchievementsAPI.get().then(data => {
      if (data) {
        setCounters(data.counters || DEFAULT_COUNTERS);
        setUnlockedIds(new Set(data.unlockedIds || []));
        setUnlockDates(data.unlockDates || {});
      }
      setApiReady(true);
    });
  }, []);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize, { passive:true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const recalc = useCallback((c) => {
    const unlocked = new Set();
    ACHIEVEMENTS.forEach(a => { if (getProgress(a, c).done) unlocked.add(a.id); });
    return unlocked;
  }, []);

  const handleAddProgress = useCallback((ach, delta) => {
    const { type } = ach.condition;
    const map = { feed_count:'feed_count', exercise_count:'exercise_count', medicine_count:'medicine_count',
                  post_count:'post_count', total_likes:'total_likes', message_count:'message_count',
                  purchase_count:'purchase_count', sell_count:'sell_count', inventory_size:'inventory_size',
                  map_visit:'map_visit', ai_use_count:'ai_use_count',
                  achievements_unlocked:'achievements_unlocked', login_streak:'login_streak' };
    const key = map[type];
    if (!key) return;
    // Optimistic update
    setCounters(prev => {
      const next = { ...prev, [key]: (prev[key] || 0) + delta };
      // Also save to localStorage as backup
      try { localStorage.setItem('gg_achievement_counters', JSON.stringify(next)); } catch {}
      return next;
    });
    // Fire to backend (non-blocking)
    AchievementsAPI.incrementCounter(key, delta);
  }, []);

  const handleSimulateUnlock = useCallback((ach) => {
    const { type, count, level, days } = ach.condition;
    const map = { feed_count:'feed_count', exercise_count:'exercise_count', medicine_count:'medicine_count',
                  post_count:'post_count', total_likes:'total_likes', message_count:'message_count',
                  purchase_count:'purchase_count', sell_count:'sell_count', inventory_size:'inventory_size',
                  map_visit:'map_visit', ai_use_count:'ai_use_count',
                  achievements_unlocked:'achievements_unlocked', login_streak:'login_streak' };
    const key = map[type];
    let delta;
    if (type === 'pet_owned') delta = 1;
    else if (type === 'happiness_max') delta = 100;
    else if (type === 'pet_level') delta = level;
    else if (type === 'all_achievements') delta = ACHIEVEMENTS.length;
    else if (type === 'rare_item_obtain') delta = 1;
    else delta = count || level || days || 999;

    // Optimistic local update
    setCounters(prev => {
      const next = { ...prev, [key]: (prev[key] || 0) + delta };
      try { localStorage.setItem('gg_achievement_counters', JSON.stringify(next)); } catch {}
      return next;
    });
    // Also unlock in Firestore
    AchievementsAPI.unlock(ach.id);
    setUnlockedIds(prev => {
      const next = new Set(prev);
      next.add(ach.id);
      try { localStorage.setItem('gg_achievement_unlock_dates', JSON.stringify({ ...unlockDates, [ach.id]: new Date().toLocaleDateString('zh-CN') })); } catch {}
      return next;
    });
    setUnlockDates(prev => {
      const next = { ...prev, [ach.id]: new Date().toLocaleDateString('zh-CN') };
      try { localStorage.setItem('gg_achievement_unlock_dates', JSON.stringify(next)); } catch {}
      return next;
    });
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  }, [unlockDates]);

  // Recalc unlocked IDs when counters change (auto-detect newly met conditions)
  useEffect(() => {
    if (!apiReady) return;
    const unlocked = recalc(counters);
    const newIds = [];
    unlocked.forEach(id => { if (!unlockedIds.has(id)) newIds.push(id); });
    if (newIds.length > 0) {
      setUnlockedIds(prev => { const n = new Set(prev); newIds.forEach(id => n.add(id)); return n; });
      setUnlockDates(prev => {
        const next = { ...prev };
        newIds.forEach(id => { next[id] = new Date().toLocaleDateString('zh-CN'); });
        return next;
      });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      toast.success(`🎉 解锁成就：${ACHIEVEMENTS.find(a=>a.id===newIds[0])?.title}`);
    }
  }, [counters, apiReady]);

  const totalPoints = getTotalPoints(unlockedIds);
  const level = getLevel(totalPoints);
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
  const levelPct = nextLevel
    ? Math.min(100, Math.round((totalPoints - level.min) / (nextLevel.min - level.min) * 100))
    : 100;

  const filtered = ACHIEVEMENTS.filter(a => {
    if (filter === 'unlocked') return unlockedIds.has(a.id);
    if (filter === 'locked')   return !unlockedIds.has(a.id);
    if (filter !== 'all')      return a.category === filter;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aU = unlockedIds.has(a.id) ? 1 : 0;
    const bU = unlockedIds.has(b.id) ? 1 : 0;
    if (aU !== bU) return bU - aU;
    const rarityOrder = { legendary:0, rare:1, uncommon:2, common:3 };
    return (rarityOrder[a.rarity] || 3) - (rarityOrder[b.rarity] || 3);
  });

  // Recently unlocked (last 3)
  const recentEntries = Object.entries(unlockDates)
    .sort(([,a],[,b]) => b.localeCompare(a))
    .slice(0, 3)
    .map(([id]) => ACHIEVEMENTS.find(a => a.id === id))
    .filter(Boolean);

  const categoryProgress = ['pet','social','market','explore','meta'].map(cat => {
    const all = ACHIEVEMENTS.filter(a => a.category === cat);
    const unlocked = all.filter(a => unlockedIds.has(a.id));
    return { cat, all: all.length, unlocked: unlocked.length,
             label: { pet:'🐾 宠物', social:'💬 社交', market:'🛒 市场', explore:'🗺️ 探索', meta:'🎯 成就' }[cat] };
  });

  return (
    <div style={{
      minHeight:'100vh', background:'linear-gradient(160deg, #fce7f3 0%, #fbcfe8 40%, #f9a8d4 100%)',
      fontFamily:"-apple-system,'PingFang SC','Helvetica Neue',sans-serif", paddingBottom:40,
    }}>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      {/* Desktop slide-in panel */}
      <AnimatePresence>
        {selected && isDesktop && (
          <motion.div
            initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
            transition={{ type:'spring', stiffness:300, damping:30 }}
            style={{ position:'fixed', right:0, top:0, height:'100vh', width:420, background:'rgba(255,255,255,0.95)', backdropFilter:'blur(20px)', zIndex:200, boxShadow:'-4px 0 40px rgba(0,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
            ref={panelRef}
          >
            <AchievementDetail
              ach={selected} isUnlocked={unlockedIds.has(selected.id)}
              unlockDate={unlockDates[selected.id]}
              onClose={() => setSelected(null)}
              onSimulateUnlock={handleSimulateUnlock}
              onAddProgress={handleAddProgress}
              counters={counters}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop overlay */}
      <AnimatePresence>
        {selected && isDesktop && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', zIndex:199 }}
            onClick={() => setSelected(null)} />
        )}
      </AnimatePresence>

      {/* Hero Banner */}
      <div style={{
        background:'linear-gradient(135deg, #ec4899, #be185d)',
        padding: rp.heroPadding(), position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-30, left:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ position:'absolute', bottom:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
        <div style={{ position:'absolute', top:10, right:40, width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
          <div style={{ fontSize:48, marginBottom:6 }}>🏆</div>
          <h1 style={{ color:'#fff', fontSize:28, fontWeight:800, margin:'0 0 8px', letterSpacing:'0.02em' }}>成就系统</h1>
          <p style={{ color:'rgba(255,255,255,0.85)', fontSize:14, margin:'0 0 16px' }}>Achievements & Milestones</p>

          {/* Level + points bar */}
          <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:16, padding:'12px 16px', marginBottom:10, backdropFilter:'blur(8px)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <span style={{ background:level.bg, border:`1.5px solid ${level.color}`, borderRadius:99, padding:'3px 12px', fontSize:12, fontWeight:700, color:level.color }}>
                {level.name}
              </span>
              <span style={{ color:'#fcd34d', fontSize:20 }}>⭐</span>
              <span style={{ color:'#fff', fontWeight:800, fontSize:18 }}>{totalPoints}</span>
              <span style={{ color:'rgba(255,255,255,0.7)', fontSize:13 }}>成就积分</span>
              {nextLevel && <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.6)', fontSize:12 }}>距{nextLevel.name}还差 {nextLevel.min - totalPoints} pts</span>}
            </div>
            <div style={{ height:6, background:'rgba(255,255,255,0.25)', borderRadius:99 }}>
              <motion.div initial={{ width:0 }} animate={{ width:`${levelPct}%` }} transition={{ duration:0.8, delay:0.3 }}
                style={{ height:'100%', background:`linear-gradient(90deg,${level.color},rgba(255,255,255,0.7))`, borderRadius:99 }} />
            </div>
          </div>

          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.2)', borderRadius:20, padding:'6px 16px' }}>
            <span style={{ color:'#fff', fontWeight:700, fontSize:16 }}>{unlockedIds.size} / {ACHIEVEMENTS.length}</span>
            <span style={{ color:'rgba(255,255,255,0.8)', fontSize:13 }}>已解锁</span>
          </div>
        </motion.div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 16px' }}>

        {/* Filter Tabs */}
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:8, marginBottom:20, scrollbarWidth:'none' }}>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setFilter(c.key)}
              style={{
                flexShrink:0, padding:'7px 14px', borderRadius:99, border:'none', cursor:'pointer',
                fontWeight:700, fontSize:12,
                background: filter === c.key ? 'linear-gradient(135deg,#be185d,#ec4899)' : 'rgba(255,255,255,0.7)',
                color: filter === c.key ? '#fff' : '#9ca3af',
                boxShadow: filter === c.key ? '0 4px 12px rgba(236,72,153,0.4)' : '0 2px 6px rgba(0,0,0,0.06)',
                whiteSpace:'nowrap',
              }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Category Progress Bars */}
        <div style={{ background:'rgba(255,255,255,0.75)', borderRadius:20, padding:'16px 20px', marginBottom:20, backdropFilter:'blur(12px)', border:'1px solid rgba(244,114,182,0.15)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#9d174d', marginBottom:12 }}>📊 分类完成度</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {categoryProgress.map(({ cat, all, unlocked, label }) => {
              const pct = Math.round((unlocked / all) * 100);
              const color = pct === 100 ? '#10b981' : pct > 50 ? '#f59e0b' : '#ec4899';
              return (
                <div key={cat}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6b7280', marginBottom:4 }}>
                    <span>{label}</span>
                    <span style={{ fontWeight:600, color }}>{unlocked}/{all} ({pct}%)</span>
                  </div>
                  <div style={{ height:6, background:'#f3f4f6', borderRadius:99 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}88)`, borderRadius:99, transition:'width 0.6s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recently Unlocked */}
        {recentEntries.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#9d174d', marginBottom:10, paddingLeft:4 }}>🆕 最近解锁</div>
            <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
              {recentEntries.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                  transition={{ delay:i * 0.1 }}
                  onClick={() => { if (isDesktop) setSelected(a); else setSelected(a); }}
                  style={{
                    flexShrink:0, background:'white', borderRadius:14, padding:'12px 14px', cursor:'pointer',
                    border:'1.5px solid #fcd34d', boxShadow:'0 4px 16px rgba(245,158,11,0.2)',
                    minWidth:120, textAlign:'center',
                    animation: i === 0 ? 'pulse-border 2s infinite' : undefined,
                  }}>
                  <div style={{ fontSize:28, marginBottom:4 }}>{a.emoji}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#92400e' }}>{a.title}</div>
                  <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>{unlockDates[a.id]}</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        {sorted.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
            <p style={{ fontSize:16 }}>该分类下暂无成就</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:14 }}>
            {sorted.map((ach, idx) => {
              const { done, current, target } = getProgress(ach, counters);
              const isUnlocked = unlockedIds.has(ach.id);
              const colors = RARITY_COLORS[ach.rarity] || RARITY_COLORS.common;
              const pct = Math.min(100, Math.round((current / target) * 100));

              return (
                <motion.div key={ach.id}
                  initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:idx * 0.03 }}
                  whileHover={{ y:-3, boxShadow:'0 12px 28px rgba(236,72,153,0.18)' }}
                  onClick={() => {
                    if (isDesktop) setSelected(ach);
                    else setSelected(ach);
                  }}
                  style={{
                    background: isUnlocked ? 'linear-gradient(145deg,#fffbeb,#fff)' : colors.bg,
                    borderRadius:18, padding:'16px 14px', cursor:'pointer',
                    border:`1.5px solid ${isUnlocked ? '#fcd34d' : colors.border}`,
                    boxShadow: isUnlocked ? '0 4px 20px rgba(245,158,11,0.2)' : '0 2px 10px rgba(0,0,0,0.06)',
                    display:'flex', flexDirection:'column', gap:8,
                    position:'relative', overflow:'hidden',
                  }}>
                  {/* Unlocked shimmer */}
                  {isUnlocked && (
                    <div style={{ position:'absolute', top:0, left:'-100%', width:'60%', height:'100%',
                      background:'linear-gradient(90deg,transparent,rgba(252,211,77,0.3),transparent)',
                      animation:'shimmer 3s infinite', pointerEvents:'none' }} />
                  )}

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <span style={{ fontSize:36, lineHeight:1 }}>{ach.emoji}</span>
                    {isUnlocked ? (
                      <span style={{ fontSize:16 }}>✅</span>
                    ) : (
                      <span style={{ fontSize:10, background:colors.border+'22', border:`1px solid ${colors.border}`, borderRadius:99, padding:'1px 6px', color:colors.text, fontWeight:600 }}>
                        {colors.label}
                      </span>
                    )}
                  </div>

                  <div>
                    <div style={{ fontWeight:800, fontSize:14, color:'#1e293b', lineHeight:1.2 }}>{ach.title}</div>
                    <div style={{ fontSize:11, color:'#9ca3af', marginTop:2, lineHeight:1.4 }}>{ach.desc}</div>
                  </div>

                  {!isUnlocked && (
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#9ca3af', marginBottom:3 }}>
                        <span>进度</span>
                        <span style={{ color:colors.text, fontWeight:600 }}>{current}/{target}</span>
                      </div>
                      <div style={{ height:5, background:'#e5e7eb', borderRadius:99 }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${colors.border},${colors.glow})`, borderRadius:99, transition:'width 0.4s' }} />
                      </div>
                    </div>
                  )}

                  {isUnlocked && (
                    <div style={{ fontSize:10, color:'#10b981', fontWeight:600 }}>
                      +{RARITY_PTS[ach.rarity] || 10} pts
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign:'center', marginTop:28, color:'rgba(190,24,93,0.5)', fontSize:12 }}>
          💡 点击成就查看详情 · 🧪 模拟解锁按钮仅供演示
        </div>
      </div>

      {/* Mobile Modal */}
      <AnimatePresence>
        {selected && !isDesktop && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:20 }}
            onClick={() => setSelected(null)}
          >
            <motion.div initial={{ scale:0.85, y:30 }} animate={{ scale:1, y:0 }} exit={{ scale:0.85 }}
              onClick={e => e.stopPropagation()}>
              <AchievementDetail
                ach={selected} isUnlocked={unlockedIds.has(selected.id)}
                unlockDate={unlockDates[selected.id]}
                onClose={() => setSelected(null)}
                onSimulateUnlock={handleSimulateUnlock}
                onAddProgress={handleAddProgress}
                counters={counters}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer { 0%{left:-100%} 100%{left:200%} }
        @keyframes pulse-border { 0%,100%{box-shadow:0 4px 16px rgba(245,158,11,0.2)} 50%{box-shadow:0 4px 24px rgba(245,158,11,0.5)} }
      `}</style>
    </div>
  );
}
