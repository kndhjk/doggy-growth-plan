import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { usePet } from '../context/PetContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { translateContent } from '../utils/translate';
import { rp, isMobile } from '../utils/responsive';
import { InventoryAPI } from '../services/apiLayer';

// ─── 道具分类 ────────────────────────────────────────────────────────────────
const CATEGORIES_KEYS = [
  { key: 'all',       emoji: '🎒' },
  { key: 'food',      emoji: '🍖' },
  { key: 'toy',       emoji: '🎾' },
  { key: 'medicine',  emoji: '💊' },
  { key: 'accessory', emoji: '🎀' },
];

// ─── 初始道具库（对应 Firestore items 表）──────────────────────────────────
const ITEM_DEFINITIONS = [
  { id: 'i1',  name: 'Premium dog food can', category: 'food',     emoji: '🥫', desc: 'Appetite +30',            appetite:30, mood:5,  health:0, hydration:0, quantity:3, usable:true },
  { id: 'i2',  name: 'Nutritious milk cake',   category: 'food',     emoji: '🧀', desc: 'Appetite +15, Mood +8', appetite:15, mood:8,  health:2, hydration:5, quantity:5, usable:true },
  { id: 'i3',  name: 'Dried chicken bites',    category: 'food',     emoji: '🍗', desc: 'Appetite +10, Mood +5', appetite:10, mood:5,  health:0, hydration:0, quantity:10,usable:true },
  { id: 'i4',  name: 'Fresh bone chew',    category: 'food',     emoji: '🦴', desc: 'Appetite +25, Social +5', appetite:25, mood:5,  health:0, hydration:0, quantity:2, usable:true },
  { id: 'i5',  name: 'Pet yogurt',  category: 'food',     emoji: '🥛', desc: 'Appetite +12, Hydration +15',appetite:12, mood:3,  health:0, hydration:15,quantity:4, usable:true },
  { id: 'i6',  name: 'Frisbee',      category: 'toy',      emoji: '🥏', desc: 'Mood +20, Appetite +5', appetite:5,  mood:20, health:0, hydration:0, quantity:2, usable:true },
  { id: 'i7',  name: 'Tennis ball',      category: 'toy',      emoji: '🎾', desc: 'Mood +15',          appetite:0,  mood:15, health:0, hydration:0, quantity:1, usable:true },
  { id: 'i8',  name: 'Squeaky chicken',    category: 'toy',      emoji: '🐔', desc: 'Mood +25 (very noisy)',  appetite:0,  mood:25, health:0, hydration:0, quantity:1, usable:true },
  { id: 'i9',  name: 'Treat ball',    category: 'toy',      emoji: '⚽', desc: 'Mood +12, Appetite +8', appetite:8,  mood:12, health:0, hydration:0, quantity:1, usable:true },
  { id: 'i10', name: 'Feather teaser',    category: 'toy',      emoji: '🪶', desc: 'Mood +18, Hydration +3', appetite:0,  mood:18, health:0, hydration:3, quantity:2, usable:true },
  { id: 'i11', name: 'Cold relief',    category: 'medicine', emoji: '💊', desc: 'Health +20',          appetite:0,  mood:0,  health:20, hydration:0, quantity:2, usable:true },
  { id: 'i12', name: 'Dewormer',    category: 'medicine', emoji: '💉', desc: 'Health +15',          appetite:0,  mood:0,  health:15, hydration:0, quantity:3, usable:true },
  { id: 'i13', name: 'Vitamin tablets',  category: 'medicine', emoji: '💊', desc: 'Health +5, Mood +5',  appetite:0,  mood:5,  health:5,  hydration:0, quantity:4, usable:true },
  { id: 'i14', name: 'Eye drops',    category: 'medicine', emoji: '👁️', desc: 'Health +10, Social +5', appetite:0,  mood:5,  health:10, hydration:0, quantity:2, usable:true },
  { id: 'i15', name: 'Bow tie',    category: 'accessory', emoji: '🎀', desc: 'Social +15 (extra charming)',appetite:0, mood:15, health:0, hydration:0, quantity:1, usable:false },
  { id: 'i16', name: 'Tiny sunglasses',    category: 'accessory', emoji: '🕶️', desc: 'Social +10, stylish pet essential',appetite:0, mood:10, health:0, hydration:0, quantity:1, usable:false },
  { id: 'i17', name: 'Winter sweater',  category: 'accessory', emoji: '🧥', desc: 'Social +8, Health +3',  appetite:0,  mood:8,  health:3,  hydration:0, quantity:1, usable:false },
];

// ─── 状态颜色 ────────────────────────────────────────────────────────────────
const STAT_COLORS = {
  appetite:  '#f59e0b',
  hydration: '#0ea5e9',
  health:    '#10b981',
  mood:      '#ec4899',
  social:    '#8b5cf6',
};

// ─── 统计条 ──────────────────────────────────────────────────────────────────
function StatBar({ label, value, color }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748b', marginBottom:3 }}>
        <span>{label}</span><span style={{ color, fontWeight:600 }}>{value}</span>
      </div>
      <div style={{ height:6, background:'#e2e8f0', borderRadius:99 }}>
        <div style={{ width:`${pct}%`, height:'100%', background:`linear-gradient(90deg,${color},${color}aa)`, borderRadius:99, transition:'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ─── 道具卡片 ────────────────────────────────────────────────────────────────
function ItemCard({ item, onUse, t }) {
  const isUsable = item.usable && item.quantity > 0;
  return (
    <motion.div
      initial={{ opacity:0, y:20 }}
      animate={{ opacity:1, y:0 }}
      whileHover={isUsable ? { y:-4, boxShadow:'0 12px 32px rgba(236,72,153,0.2)' } : {}}
      style={{
        background:'white', borderRadius:20, padding:16,
        boxShadow:'0 2px 12px rgba(0,0,0,0.08)',
        border:'1.5px solid #fce7f3',
        display:'flex', flexDirection:'column', gap:8,
        opacity: item.quantity === 0 ? 0.5 : 1,
      }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <span style={{ fontSize:36 }}>{item.emoji}</span>
        <span style={{
          background: item.quantity > 0 ? '#fce7f3' : '#e2e8f0',
          color: item.quantity > 0 ? '#be185d' : '#94a3b8',
          borderRadius:99, padding:'2px 10px', fontSize:12, fontWeight:700,
        }}>x{item.quantity}</span>
      </div>
      <div>
        <div style={{ fontWeight:700, fontSize:14, color:'#1e293b' }}>{item.name}</div>
        <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{item.desc}</div>
      </div>
      {item.usable && item.quantity > 0 && (
        <button
          onClick={() => onUse(item)}
          style={{
            marginTop:4, background:'linear-gradient(135deg,#ec4899,#be185d)',
            color:'white', border:'none', borderRadius:12, padding:'8px 0',
            fontWeight:700, fontSize:13, cursor:'pointer', width:'100%',
          }}
        >{t('inventory.item.use')}</button>
      )}
      {item.quantity === 0 && (
        <div style={{ textAlign:'center', fontSize:12, color:'#94a3b8', padding:'6px 0' }}>{t('inventory.item.empty')}</div>
      )}
      {!item.usable && item.quantity > 0 && (
        <div style={{ textAlign:'center', fontSize:11, color:'#a78bfa', padding:'4px 0', fontWeight:600 }}>{t('inventory.decor.label')}</div>
      )}
    </motion.div>
  );
}

// ─── 使用确认弹窗 ─────────────────────────────────────────────────────────────
function UseEffectModal({ item, onConfirm, onClose, t }) {
  if (!item) return null;
  const effects = [
    { k:'appetite',  val:item.appetite },
    { k:'hydration', val:item.hydration },
    { k:'health',   val:item.health },
    { k:'mood',     val:item.mood },
    { k:'social',   val:item.social },
  ].filter(s => s.val > 0);

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale:0.8, y:40 }} animate={{ scale:1, y:0 }} exit={{ scale:0.8 }}
        onClick={e => e.stopPropagation()}
        style={{ background:'white', borderRadius:24, padding:28, maxWidth:360, width:'100%' }}
      >
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:56, marginBottom:8 }}>{item.emoji}</div>
          <div style={{ fontWeight:800, fontSize:18, color:'#1e293b' }}>{t('inventory.modal.use')} {item.name}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
          {effects.map(s => (
            <div key={s.k} style={{ background:'#f8fafc', borderRadius:12, padding:'10px 14px' }}>
              <div style={{ fontSize:11, color:'#64748b' }}>{t(`inventory.stat.${s.k}`)}</div>
              <div style={{ fontWeight:800, fontSize:18, color:STAT_COLORS[s.k] }}>+{s.val}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', border:'2px solid #e2e8f0', borderRadius:12, background:'white', fontWeight:700, cursor:'pointer' }}>{t('inventory.modal.cancel')}</button>
          <button onClick={onConfirm} style={{ flex:1, padding:'10px', background:'linear-gradient(135deg,#ec4899,#be185d)', color:'white', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer' }}>{t('inventory.modal.confirm')}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── 主页面 ───────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { t, lang } = useI18n();
  const { pet, statuses } = usePet();
  const { currentUser } = useAuth();
  const [cat, setCat] = useState('all');
  const [inventory, setInventory] = useState(() => ITEM_DEFINITIONS.map(i => ({ ...i })));
  const [displayItems, setDisplayItems] = useState(() => ITEM_DEFINITIONS.map(i => ({ ...i })));
  const [selectedItem, setSelectedItem] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Translate inventory items when language changes
  useEffect(() => {
    if (!inventory || inventory.length === 0) return;
    let cancelled = false;
    Promise.all(inventory.map(item =>
      Promise.all([
        translateContent(item.name || '', lang),
        translateContent(item.desc || '', lang),
      ]).then(([name, desc]) => ({ ...item, name, desc }))
    )).then(data => {
      if (!cancelled) setDisplayItems(data);
    });
    return () => { cancelled = true; };
  }, [lang, inventory]);

  // Build STAT_LABELS from i18n
  const STAT_LABELS = {
    appetite:  `🍖 ${t('inventory.stat.appetite')}`,
    hydration: `💧 ${t('inventory.stat.hydration')}`,
    health:    `❤️ ${t('inventory.stat.health')}`,
    mood:      `😊 ${t('inventory.stat.mood')}`,
    social:    `🐾 ${t('inventory.stat.social')}`,
  };

  // Build CATEGORIES with i18n labels
  const CATEGORIES = CATEGORIES_KEYS.map(c => ({
    ...c,
    label: t(`inventory.tab.${c.key}`),
  }));

  useEffect(() => {
    if (!currentUser?.uid) { setLoaded(true); return; }
    InventoryAPI.list(currentUser.uid).then(backendItems => {
      const merged = ITEM_DEFINITIONS.map(def => {
        const backend = (backendItems || []).find(b => b.id === def.id);
        return backend ? { ...def, quantity: backend.quantity ?? def.quantity } : { ...def, quantity: 0 };
      });
      setInventory(merged);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [currentUser?.uid]);

  const refreshPet = useCallback(() => setAnimKey(k => k + 1), []);

  const filtered = cat === 'all' ? displayItems : displayItems.filter(i => i.category === cat);

  const handleUse = (item) => {
    if (!pet) { toast.error(t('inventory.pet.afterAdopt')); return; }
    setSelectedItem(item);
  };

  const confirmUse = async () => {
    const item = selectedItem;
    setInventory(prev => {
      const next = prev.map(it => it.id === item.id ? { ...it, quantity: Math.max(0, it.quantity - 1) } : it);
      setDisplayItems(next.map(it => {
        const display = displayItems.find(d => d.id === it.id);
        return { ...it, name: display?.name || it.name, desc: display?.desc || it.desc };
      }));
      return next;
    });

    if (currentUser?.uid) {
      try {
        await InventoryAPI.use(currentUser.uid, item);
      } catch (e) {
        console.warn('Inventory API error (non-fatal):', e.message);
      }
    }

    toast.success(`${item.emoji} ${t('inventory.item.use')} ${item.name}`);
    setSelectedItem(null);
    refreshPet();
  };

  const totalItems = inventory.reduce((s, i) => s + i.quantity, 0);
  const usableCount = inventory.filter(i => i.usable && i.quantity > 0).length;

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#fdf2f8,#fce7f3)', padding:'0 0 40px' }}>
      <div style={{ background:'linear-gradient(135deg,#be185d,#ec4899)', padding: rp.heroPadding(), borderRadius:'0 0 32px 32px' }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'white' }}>{t('inventory.title')}</h1>
        <p style={{ margin:'6px 0 0', color:'rgba(255,255,255,0.85)', fontSize:13 }}>{t('inventory.pet.afterAdopt')}</p>
      </div>

      <div style={{ padding:'0 16px', marginTop:-24 }}>
        <div style={{ background:'white', borderRadius:20, padding:20, boxShadow:'0 4px 20px rgba(236,72,153,0.15)', marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:'#1e293b' }}>{pet?.name || t('inventory.pet.noPet')}</div>
              <div style={{ fontSize:12, color:'#64748b' }}>{pet?.breed || t('inventory.pet.unadopted')}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:28 }}>{pet ? '🐶' : '❓'}</div>
              <div style={{ fontSize:11, color:'#64748b' }}>{t('inventory.pet.current')}</div>
            </div>
          </div>
          {pet && statuses && (
            <div key={animKey}>
              <StatBar label={STAT_LABELS.appetite}  value={statuses.appetite  || 0} color={STAT_COLORS.appetite}  />
              <StatBar label={STAT_LABELS.hydration} value={statuses.hydration || 0} color={STAT_COLORS.hydration} />
              <StatBar label={STAT_LABELS.health}    value={statuses.health    || 0} color={STAT_COLORS.health}    />
              <StatBar label={STAT_LABELS.mood}      value={statuses.mood      || 0} color={STAT_COLORS.mood}      />
              <StatBar label={STAT_LABELS.social}     value={statuses.social    || 0} color={STAT_COLORS.social}    />
            </div>
          )}
          {!pet && (
            <div style={{ textAlign:'center', color:'#94a3b8', padding:'12px 0', fontSize:13 }}>
              {t('inventory.pet.afterAdopt')}
            </div>
          )}
        </div>

        <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:20 }}>
          {[
            { label: t('inventory.stats.total'),  value:totalItems, emoji:'📦' },
            { label: t('inventory.stats.usable'), value:usableCount, emoji:'✨' },
            { label: t('inventory.stats.pets'),  value:pet ? 1 : 0, emoji:'🐾' },
          ].map(s => (
            <div key={s.label} style={{ flex: isMobile() ? '1 0 calc(33.33% - 8px)' : '1', background:'white', borderRadius:16, padding:'14px 10px', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:22 }}>{s.emoji}</div>
              <div style={{ fontWeight:800, fontSize:18, color:'#1e293b', marginTop:2 }}>{s.value}</div>
              <div style={{ fontSize:11, color:'#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, marginBottom:16, WebkitOverflowScrolling:'touch' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              style={{
                flexShrink:0, padding:'8px 16px', borderRadius:99,
                border:'none', cursor:'pointer', fontWeight:700, fontSize:13,
                background: cat === c.key ? 'linear-gradient(135deg,#be185d,#ec4899)' : 'white',
                color: cat === c.key ? 'white' : '#64748b',
                boxShadow: cat === c.key ? '0 4px 12px rgba(236,72,153,0.4)' : '0 2px 6px rgba(0,0,0,0.06)',
                transition:'all 0.2s',
              }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns: rp.gridCols(130), gap:12 }}>
          <AnimatePresence mode='popLayout'>
            {filtered.map(item => (
              <motion.div key={item.id} layout exit={{ opacity:0, scale:0.8 }}>
                <ItemCard item={item} onUse={handleUse} t={t} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#94a3b8' }}>
            <div style={{ fontSize:48, marginBottom:8 }}>🎒</div>
            <div>{t('inventory.empty.category')}</div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <UseEffectModal
            item={selectedItem}
            onConfirm={confirmUse}
            onClose={() => setSelectedItem(null)}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
}