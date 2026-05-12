import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePet } from '../context/PetContext';
import { computeStatusesV2, STATUS_META } from './statusDecayV2';
import { useI18n } from '../i18n/I18nContext';
import { breedLabel } from '../data/breeds';
import toast from 'react-hot-toast';
import SceneDecor      from '../components/Pet/SceneDecor';
import DogCharacter    from '../components/Pet/DogCharacter';
import StatusRow       from '../components/Pet/StatusRow';
import ActionRing      from '../components/Pet/ActionRing';
import CreatePetModal  from '../components/Pet/CreatePetModal';
import PetReactions    from '../components/Pet/PetReactions';
import AchievementWatcher from '../components/Pet/AchievementWatcher';
import AgePreviewBar   from '../components/Pet/AgePreviewBar';

// ─── helpers ──────────────────────────────────────────────────────────────────
function useScreenSize() {
  const [w, setW] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h, { passive: true });
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

function timeAgo(ts, t) {
  if (!ts) return null;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return t('pet.justNow') || '刚刚';
  if (m < 60) return `${m}${t('pet.minutesAgo') || '分钟前'}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${t('pet.hoursAgo') || '小时前'}`;
  return `${Math.floor(h / 24)}${t('pet.daysAgo') || '天前'}`;
}

function getLastActivityTime(lastActivity, type) {
  const arr = lastActivity?.[type];
  if (!arr) return null;
  const last = Array.isArray(arr) ? arr[arr.length - 1] : arr;
  if (!last) return null;
  return last.toDate ? last.toDate() : new Date(last);
}

function getPetAge(birthday) {
  if (!birthday) return null;
  const b = new Date(birthday);
  const now = new Date();
  const totalMonths = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months}个月`;
  if (months === 0) return `${years}岁`;
  return `${years}岁${months}个月`;
}

function getDaysWithPet(createdAt) {
  if (!createdAt) return 0;
  const d = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

// ─── AI follow-up toast ───────────────────────────────────────────────────────
function offerAiFollowUp(nav, t, label) {
  setTimeout(() => {
    toast((ti) => (
      <span style={{ display:'flex', alignItems:'center', gap:10, fontSize:13 }}>
        <span style={{ color:'#9d174d' }}>{t('pet.toast.askAi', { action: label })}</span>
        <button
          onClick={() => { toast.dismiss(ti.id); nav(`/ai?q=${encodeURIComponent(t('ai.askAbout', { action: label }))}`); }}
          style={{ flexShrink:0, padding:'4px 12px', borderRadius:100, border:'none',
                   background:'linear-gradient(135deg,#f472b6,#fb7185)', color:'white',
                   fontWeight:700, fontSize:11, cursor:'pointer' }}>
          {t('pet.toast.askAiBtn')}
        </button>
      </span>
    ), { id:'pet-ai-suggest', duration:3500, position:'bottom-center', style:{ paddingRight:14, marginBottom:80 } });
  }, 700);
}

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusPill({ icon, label, value }) {
  const color = value > 60 ? '#10b981' : value > 30 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
                  background:'white', borderRadius:12, border:'1px solid #f5f3ff',
                  boxShadow:'0 1px 4px rgba(244,114,182,0.06)', flex:1, minWidth:0 }}>
      <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, marginBottom:2,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</div>
        <div style={{ height:4, background:'#f5f3ff', borderRadius:100, overflow:'hidden' }}>
          <div style={{ width:`${value}%`, height:'100%', background:color, borderRadius:100,
                        transition:'width 0.6s ease' }} />
        </div>
      </div>
      <span style={{ fontSize:13, fontWeight:800, color, flexShrink:0 }}>{value}</span>
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, title, value, sub, color='#f472b6' }) {
  return (
    <div style={{ background:'white', borderRadius:16, padding:'14px 16px',
                  boxShadow:'0 2px 12px rgba(244,114,182,0.08)',
                  border:'1px solid rgba(244,114,182,0.08)',
                  display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:32, height:32, borderRadius:10, background:`${color}20`, display:'flex',
                      alignItems:'center', justifyContent:'center', fontSize:16 }}>{icon}</div>
        <div>
          <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600 }}>{title}</div>
          <div style={{ fontSize:18, fontWeight:800, color:'#1f0933' }}>{value}</div>
        </div>
      </div>
      {sub && <div style={{ fontSize:11, color:'#9ca3af' }}>{sub}</div>}
    </div>
  );
}

// ─── Activity timeline item ─────────────────────────────────────────────────────
function TimelineItem({ icon, text, time, done }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0',
                  borderBottom:'1px solid #f9f5ff' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', background: done ? '#d1fae5' : '#fdf2f8',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
        {done ? '✓' : icon}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, color: done ? '#059669' : '#4b5563', fontWeight:600 }}>{text}</div>
        {time && <div style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>{time}</div>}
      </div>
    </div>
  );
}

// ─── Section card ──────────────────────────────────────────────────────────────
function Section({ title, icon, children, action }) {
  return (
    <div style={{ background:'white', borderRadius:20, padding:'18px 20px',
                  boxShadow:'0 4px 20px rgba(244,114,182,0.09)',
                  border:'1px solid rgba(244,114,182,0.07)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight:800, fontSize:14, color:'#1f0933' }}>
          <span style={{ fontSize:16 }}>{icon}</span> {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Quick action button ────────────────────────────────────────────────────────
function QuickBtn({ icon, label, color, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.button
      whileHover={{ y:-3, scale:1.03 }}
      whileTap={{ scale:0.97 }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ flex:1, minWidth:0, padding:'12px 8px', borderRadius:14, border:'none',
               background: hover ? color : `${color}18`,
               boxShadow: hover ? `0 8px 20px ${color}40` : '0 2px 8px rgba(244,114,182,0.08)',
               cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6,
               transition:'background 0.2s, box-shadow 0.2s' }}
    >
      <span style={{ fontSize:24 }}>{icon}</span>
      <span style={{ fontSize:12, fontWeight:700, color: hover ? 'white' : '#4a1942' }}>{label}</span>
    </motion.button>
  );
}

// ─── Floating particle (background decoration) ─────────────────────────────────
function Particle({ style }) {
  return (
    <div style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none', ...style }}>
      <motion.div
        animate={{ y:[-8, 8, -8], rotate:[0, 10, 0], opacity:[0.5, 0.9, 0.5] }}
        transition={{ duration:6 + Math.random()*4, repeat:Infinity, ease:'easeInOut' }}
        style={{ width:'100%', height:'100%', borderRadius:'50%' }}
      />
    </div>
  );
}

// ─── Achievement badge ─────────────────────────────────────────────────────────
function Badge({ icon, label, color, earned }) {
  if (!earned) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                  padding:'10px 6px', borderRadius:12, background:'white', flex:1, minWidth:0,
                  border:'1px solid #f5f3ff', boxShadow:'0 2px 8px rgba(244,114,182,0.06)' }}>
      <div style={{ width:36, height:36, borderRadius:'50%', background:`${color}25`, display:'flex',
                    alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
      <div style={{ fontSize:10, fontWeight:700, color:'#4a1942', textAlign:'center',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:56 }}>{label}</div>
    </div>
  );
}

// ─── Main Desktop Layout ───────────────────────────────────────────────────────
function DesktopPetPage({ pet, statuses, displayStatuses, previewAge, handlePreviewAgeChange,
  handleMain, handleSecondary, warning, stageLabel, avatarTick, lastAction,
  showCreate, setShowCreate, t, nav }) {

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const last = pet?.lastActivity || {};
  const daysWithPet = getDaysWithPet(pet?.createdAt);
  const petAge = getPetAge(pet?.birthday);

  const greeting = () => {
    const h = now.getHours();
    if (h < 6) return '🌙 夜深了';
    if (h < 12) return '☀️ 早上好';
    if (h < 14) return '🌤️ 中午好';
    if (h < 18) return '🌤️ 下午好';
    if (h < 22) return '🌙 晚上好';
    return '🌃 夜深了';
  };

  const dateStr = now.toLocaleDateString('zh-CN', { weekday:'long', month:'long', day:'numeric' });

  const overall = Math.round(statuses?.overall || 0);

  // Build care checklist from real last activity
  const careItems = [
    { icon:'🍖', label:t('pet.action.feed'), type:'feed', done:!!getLastActivityTime(last, 'feed') },
    { icon:'💧', label:t('pet.action.water'), type:'water', done:!!getLastActivityTime(last, 'water') },
    { icon:'🚶', label:t('pet.action.walk'), type:'walk', done:!!getLastActivityTime(last, 'walk') },
    { icon:'🤝', label:t('pet.action.play'), type:'play', done:!!getLastActivityTime(last, 'play') },
    { icon:'🛁', label:t('pet.action.bath'), type:'bath', done:!!getLastActivityTime(last, 'bath') },
    { icon:'💊', label:t('pet.action.medicine'), type:'medicine', done:!!getLastActivityTime(last, 'medicine') },
  ];

  const achievements = [
    { icon:'🌟', label:'首次喂食', color:'#f59e0b', earned:!!getLastActivityTime(last, 'feed') },
    { icon:'💧', label:'爱喝水', color:'#3b82f6', earned:!!getLastActivityTime(last, 'water') },
    { icon:'🚶', label:'散步达人', color:'#10b981', earned:!!getLastActivityTime(last, 'walk') },
    { icon:'🛁', label:'爱干净', color:'#8b5cf6', earned:!!getLastActivityTime(last, 'bath') },
    { icon:'🤝', label:'社交达人', color:'#ec4899', earned:!!getLastActivityTime(last, 'play') },
    { icon:'🏆', label:'坚持7天', color:'#f97316', earned:daysWithPet >= 7 },
  ];

  // Pet avatar placeholder based on breed or default
  const avatarText = pet?.breed ? pet.breed.slice(0,2) : '🐕';

  return (
    <div style={{
      flex:1, display:'flex', flexDirection:'column',
      background:'linear-gradient(160deg, #fdf2f8 0%, #fce7f3 40%, #f9a8d4 100%)',
      minHeight:'100vh', position:'relative', overflow:'hidden',
      fontFamily:"-apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif",
    }}>

      {/* ── Ambient background particles ── */}
      {[
        { w:120, h:120, x:'8%',  y:'15%', bg:'rgba(244,114,182,0.08)' },
        { w:80,  h:80,  x:'75%', y:'60%', bg:'rgba(251,113,133,0.07)' },
        { w:60,  h:60,  x:'60%', y:'10%', bg:'rgba(196,141,255,0.08)' },
        { w:100, h:100, x:'20%', y:'70%', bg:'rgba(253,224,71,0.06)' },
        { w:50,  h:50,  x:'88%', y:'30%', bg:'rgba(52,211,153,0.06)' },
        { w:70,  h:70,  x:'45%', y:'80%', bg:'rgba(244,114,182,0.05)' },
      ].map((p, i) => (
        <div key={i} style={{
          position:'absolute', left:p.x, top:p.y, width:p.w, height:p.h,
          borderRadius:'50%', background:p.bg, pointerEvents:'none',
        }}>
          <motion.div
            animate={{ y:[-6, 6, -6], x:[0, 4, 0], opacity:[0.6, 1, 0.6] }}
            transition={{ duration:5+i, repeat:Infinity, ease:'easeInOut',
                         delay: i * 0.7 }}
            style={{ width:'100%', height:'100%', borderRadius:'50%', background:p.bg }}
          />
        </div>
      ))}

      {/* ── Top Header Bar ── */}
      <header style={{
        display:'flex', alignItems:'center', gap:16,
        padding:'0 28px', height:68,
        background:'rgba(255,255,255,0.82)',
        backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(244,114,182,0.12)',
        position:'relative', zIndex:10, flexShrink:0,
      }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:8 }}>
          <div style={{ width:40, height:40, background:'linear-gradient(135deg,#f472b6,#fb7185)',
                        borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:20, boxShadow:'0 4px 12px rgba(244,114,182,0.4)' }}>🐾</div>
          <div>
            <div style={{ fontWeight:900, fontSize:16, color:'#9d174d', lineHeight:1.2 }}>GG Bond</div>
            <div style={{ fontSize:11, color:'#f472b6', fontWeight:600 }}>Virtual Pet</div>
          </div>
        </div>

        {/* Date greeting */}
        <div style={{ flex:1, textAlign:'center' }}>
          <div style={{ fontWeight:700, fontSize:15, color:'#1f0933' }}>{greeting()}</div>
          <div style={{ fontSize:12, color:'#9ca3af', marginTop:1 }}>{dateStr}</div>
        </div>

        {/* Overall health badge */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            padding:'8px 16px', borderRadius:100, background:'white',
            border:'2px solid #fce7f3', display:'flex', alignItems:'center', gap:8,
            boxShadow:'0 2px 10px rgba(244,114,182,0.12)',
          }}>
            <span style={{ fontSize:16 }}>❤️</span>
            <div>
              <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600 }}>健康指数</div>
              <div style={{ fontWeight:800, fontSize:14, color: overall>60?'#10b981':overall>30?'#f59e0b':'#ef4444' }}>
                {overall}%
              </div>
            </div>
          </div>

          {warning && (
            <div style={{ padding:'8px 14px', borderRadius:12, background:'#fef2f2',
                          border:'1px solid #fecaca', color:'#ef4444',
                          fontWeight:700, fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
              ⚠️ 需要关注
            </div>
          )}

          {/* User avatar */}
          <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#f472b6,#fb7185)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:16, fontWeight:800, color:'white', cursor:'pointer',
                        boxShadow:'0 4px 12px rgba(244,114,182,0.4)' }}>
            {avatarText}
          </div>
        </div>
      </header>

      {/* ── Three-Column Body ── */}
      <div style={{ display:'flex', flex:1, minHeight:0, position:'relative', zIndex:5, gap:0 }}>

        {/* ══ LEFT COLUMN (260px) ══ */}
        <aside style={{
          width:260, flexShrink:0,
          background:'rgba(255,255,255,0.65)',
          backdropFilter:'blur(16px)',
          borderRight:'1px solid rgba(244,114,182,0.1)',
          padding:'20px 16px', display:'flex', flexDirection:'column', gap:14,
          overflowY:'auto',
        }}>
          {/* Pet profile card */}
          <Section title="宠物档案" icon="🐕">
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:56, height:56, borderRadius:16,
                              background:'linear-gradient(135deg,#fcd34d,#fb923c)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:30, flexShrink:0,
                              boxShadow:'0 4px 14px rgba(251,146,60,0.4)' }}>
                  🐕
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:900, fontSize:20, color:'#1f0933',
                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {pet.name}
                  </div>
                  <div style={{ fontSize:12, color:'#9ca3af', fontWeight:600,
                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {breedLabel(pet.breed, t)}
                  </div>
                  <div style={{ display:'flex', gap:6, marginTop:3 }}>
                    <span style={{ fontSize:10, padding:'2px 7px', borderRadius:100, background:'#fdf2f8',
                                   color:'#9d174d', fontWeight:700, border:'1px solid #fce7f3' }}>
                      {stageLabel}
                    </span>
                    {petAge && (
                      <span style={{ fontSize:10, padding:'2px 7px', borderRadius:100, background:'#fdf2f8',
                                     color:'#7c3aed', fontWeight:700, border:'1px solid #ede9fe' }}>
                        {petAge}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div style={{ padding:'8px 10px', borderRadius:10, background:'#fdf2f8', textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:900, color:'#9d174d' }}>{daysWithPet || 1}</div>
                  <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600 }}>{t('pet.home.daysTogether')}</div>
                </div>
                <div style={{ padding:'8px 10px', borderRadius:10, background:'#fdf2f8', textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:900, color:'#7c3aed' }}>
                    {Object.values(last).flat?.()?.[0] ? Object.keys(last).length : 0}+
                  </div>
                  <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600 }}>{t('pet.home.activityTypes')}</div>
                </div>
              </div>
            </div>
          </Section>

          {/* Vitals */}
          <Section title={t('pet.home.todayStatus')} icon="📊">
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <StatusPill icon="💧" label={t('pet.status.hydration')} value={statuses?.hydration||0} />
              <StatusPill icon="🍖" label={t('pet.status.appetite')} value={statuses?.appetite||0} />
              <StatusPill icon="😊" label={t('pet.status.mood')} value={statuses?.mood||0} />
              <StatusPill icon="💚" label={t('pet.status.health')} value={statuses?.health||0} />
              <StatusPill icon="🐾" label={t('pet.status.social')} value={statuses?.social||0} />
            </div>
          </Section>

          {/* Quick actions */}
          <Section title="快捷操作" icon="⚡">
            <div style={{ display:'flex', gap:8 }}>
              <QuickBtn icon="🍖" label={t('pet.action.feed')} color="#f97316" onClick={() => handleMain('feed',t('pet.action.feed'))} />
              <QuickBtn icon="💧" label={t('pet.action.water')} color="#3b82f6" onClick={() => handleMain('water',t('pet.action.water'))} />
              <QuickBtn icon="🛁" label={t('pet.action.bath')} color="#8b5cf6" onClick={() => handleSecondary('bath',t('pet.action.bath'))} />
              <QuickBtn icon="🚶" label={t('pet.action.walk')} color="#10b981" onClick={() => handleSecondary('walk',t('pet.action.walk'))} />
            </div>
          </Section>

          {/* Today's care checklist */}
          <Section title={t('pet.home.todayCare')} icon="📋">
            <div style={{ display:'flex', flexDirection:'column' }}>
              {careItems.map(item => {
                const timeLabel = item.done ? timeAgo(getLastActivityTime(last, item.type), t) : null;
                return (
                  <div key={item.type} style={{
                    display:'flex', alignItems:'center', gap:10, padding:'9px 0',
                    borderBottom:'1px solid #f9f5ff',
                  }}>
                    <div style={{ width:28, height:28, borderRadius:'50%',
                                  background: item.done ? '#d1fae5' : '#f5f3ff',
                                  display:'flex', alignItems:'center', justifyContent:'center',
                                  fontSize:13, flexShrink:0 }}>
                      {item.done ? '✓' : item.icon}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700,
                                    color: item.done ? '#059669' : '#6b7280' }}>{item.label}</div>
                      {t && <div style={{ fontSize:11, color:'#9ca3af' }}>{t}</div>}
                    </div>
                    {item.done && (
                      <span style={{ fontSize:10, color:'#10b981', fontWeight:700, flexShrink:0 }}>已完成</span>
                    )}
                    {!item.done && (
                      <motion.button
                        whileTap={{ scale:0.95 }}
                        onClick={() => item.type==='feed'||item.type==='water'
                          ? handleMain(item.type, item.label)
                          : handleSecondary(item.type, item.label)}
                        style={{ padding:'4px 10px', borderRadius:100, border:'none',
                                 background:'linear-gradient(135deg,#f472b6,#fb7185)',
                                 color:'white', fontWeight:700, fontSize:11, cursor:'pointer', flexShrink:0 }}>
                        记录
                      </motion.button>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        </aside>

        {/* ══ CENTER COLUMN (flex 1) ══ */}
        <main style={{
          flex:1, minWidth:0, display:'flex', flexDirection:'column',
          padding:'16px 20px', gap:12, overflow:'auto', alignItems:'center',
        }}>
          {/* Age preview */}
          <div style={{ width:'100%', maxWidth:540 }}>
            <AgePreviewBar
              previewAge={previewAge !== null ? previewAge : (pet?.birthday
                ? (Date.now() - new Date(pet.birthday).getTime()) / (1000*60*60*24*365) : 2)}
              onChange={handlePreviewAgeChange}
              disabled={false}
            />
          </div>

          {/* Pet playground */}
          <div style={{
            width:'100%', maxWidth:540, flex:1, minHeight:320,
            background:'linear-gradient(180deg,#fef9c3 0%,#fde68a 35%,#fcd34d 50%,#d97706 50%,#b45309 100%)',
            borderRadius:24, border:'2px solid rgba(251,191,36,0.4)',
            boxShadow:'0 12px 48px rgba(217,119,6,0.18), inset 0 -4px 12px rgba(0,0,0,0.08)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            padding:'clamp(20px,4vh,40px) clamp(16px,4vw,28px)', gap:10,
            position:'relative', overflow:'visible',
          }}>
            {/* Scene decorations */}
            <SceneDecor />

            {/* Status row */}
            <StatusRow statuses={statuses} />

            {/* Dog character */}
            <div style={{ display:'flex', justifyContent:'center', position:'relative', zIndex:2 }}>
              <motion.div
                drag dragConstraints={{ left:-100, right:100, top:-60, bottom:60 }}
                dragElastic={0.4} dragTransition={{ bounceStiffness:300, bounceDamping:18 }}
                whileTap={{ scale:0.94 }}
                style={{ cursor:'grab' }}
              >
                <DogCharacter stage={displayStatuses.avatarStage} reactKey={avatarTick}
                  wilted={warning} lastActionType={lastAction.type}
                  size={Math.min(displayStatuses.avatarSize * 1.25, 210)}
                  draggable={false} />
                <PetReactions lastAction={lastAction} statuses={statuses} />
              </motion.div>
            </div>

            <AchievementWatcher pet={pet} statuses={statuses} />

            {/* Action ring */}
            <ActionRing onMain={handleMain} onSecondary={handleSecondary} />

            <p style={{ fontSize:12, color:'rgba(161,98,7,0.7)', marginTop:2, marginBottom:0, textAlign:'center' }}>
              {t('pet.hint')}
            </p>
          </div>

          {/* Bottom stats row */}
          <div style={{ width:'100%', maxWidth:540, display:'grid',
                        gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            <StatCard icon="💧" title="水分指数" value={`${statuses?.hydration||0}%`}
                      sub={timeAgo(getLastActivityTime(last,'water'), t) || t('pet.home.noRecord')} color="#3b82f6" />
            <StatCard icon="🍖" title="饱腹指数" value={`${statuses?.appetite||0}%`}
                      sub={timeAgo(getLastActivityTime(last,'feed'), t) || t('pet.home.noRecord')} color="#f97316" />
            <StatCard icon="😊" title="心情指数" value={`${statuses?.mood||0}%`}
                      sub={timeAgo(getLastActivityTime(last,'walk'), t) || t('pet.home.noRecord')} color="#ec4899" />
          </div>
        </main>

        {/* ══ RIGHT COLUMN (300px) ══ */}
        <aside style={{
          width:300, flexShrink:0,
          background:'rgba(255,255,255,0.65)',
          backdropFilter:'blur(16px)',
          borderLeft:'1px solid rgba(244,114,182,0.1)',
          padding:'20px 16px', display:'flex', flexDirection:'column', gap:14,
          overflowY:'auto',
        }}>
          {/* Growth progress */}
          <Section title="成长进度" icon="🏆">
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#4a1942' }}>总体成长</span>
                  <span style={{ fontSize:12, fontWeight:800, color:'#f472b6' }}>{overall}%</span>
                </div>
                <div style={{ height:8, background:'#f5f3ff', borderRadius:100, overflow:'hidden' }}>
                  <motion.div initial={{width:0}} animate={{width:`${overall}%`}}
                    transition={{duration:1,ease:'easeOut'}}
                    style={{ height:'100%', background:'linear-gradient(90deg,#f472b6,#fb7185)',
                             borderRadius:100 }} />
                </div>
              </div>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#4a1942' }}>本周活跃</span>
                  <span style={{ fontSize:12, fontWeight:800, color:'#8b5cf6' }}>72%</span>
                </div>
                <div style={{ height:8, background:'#f5f3ff', borderRadius:100, overflow:'hidden' }}>
                  <motion.div initial={{width:0}} animate={{width:'72%'}}
                    transition={{duration:1,ease:'easeOut',delay:0.1}}
                    style={{ height:'100%', background:'linear-gradient(90deg,#8b5cf6,#a78bfa)',
                             borderRadius:100 }} />
                </div>
              </div>
              <div style={{ padding:'10px 12px', borderRadius:12, background:'linear-gradient(135deg,#fdf2f8,#fce7f3)',
                            border:'1px solid #fce7f3', fontSize:12, color:'#9d174d', lineHeight:1.7 }}>
                🌟 {warning
                  ? '健康指数偏低！建议增加互动频率，关注饮食营养。'
                  : daysWithPet < 3
                    ? `和 ${pet.name} 刚刚认识，多互动建立感情吧～`
                    : `${pet.name} 成长良好！继续保持，升级指日可待！`}
              </div>
            </div>
          </Section>

          {/* Achievements */}
          <Section title="成就徽章" icon="🎖️">
            <div style={{ display:'flex', gap:6 }}>
              {achievements.map((a,i) => <Badge key={i} {...a} />)}
            </div>
          </Section>

          {/* Activity timeline */}
          <Section title={t('pet.home.activityRecord')} icon="🕒">
            <div style={{ display:'flex', flexDirection:'column', maxHeight:200, overflowY:'auto' }}>
              {['feed','water','walk','play','bath'].map(type => {
                const iconMap = { feed:'🍖', water:'💧', walk:'🚶', play:'🤝', bath:'🛁' };
                const labelMap = { feed:t('pet.action.feed'), water:t('pet.action.water'), walk:t('pet.action.walk'), play:t('pet.action.play'), bath:t('pet.action.bath') };
                const timeStr = timeAgo(getLastActivityTime(last, type), t);
                return timeStr ? (
                  <TimelineItem key={type} icon={iconMap[type]} text={labelMap[type]} time={timeStr} done />
                ) : null;
              }).filter(Boolean).slice(0,5)}
              {Object.keys(last).length === 0 && (
                <div style={{ fontSize:12, color:'#9ca3af', textAlign:'center', padding:'16px 0' }}>
                  {t('pet.home.noActivityYet')}
                </div>
              )}
            </div>
          </Section>

          {/* Weather + time widget */}
          <Section title={t('pet.home.todayWeather')} icon="🌤️">
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ fontSize:40 }}>🌤️</div>
              <div>
                <div style={{ fontWeight:800, fontSize:22, color:'#1f0933' }}>
                  {now.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}
                </div>
                <div style={{ fontSize:12, color:'#9ca3af' }}>
                  {now.toLocaleDateString('zh-CN',{month:'numeric',day:'numeric'})} ·
                  Auckland, NZ
                </div>
              </div>
            </div>
          </Section>

          {/* AI health insight */}
          <Section title={t('pet.home.aiInsight')} icon="🤖">
            <div style={{ padding:'12px 14px', borderRadius:14,
                          background:'linear-gradient(135deg,#fdf2f8,#ede9fe)',
                          border:'1px solid #ddd6fe', fontSize:12.5, color:'#5b21b6', lineHeight:1.8 }}>
              💡 {warning
                ? t('pet.home.ai.needCare', {name: pet.name})
                : statuses?.hydration < 50
                  ? t('pet.home.ai.drinkLess', {name: pet.name})
                  : statuses?.appetite < 50
                    ? t('pet.home.ai.hungry', {name: pet.name})
                    : t('pet.home.ai.allGood', {name: pet.name})}
            </div>
            <motion.button
              whileHover={{ scale:1.02 }}
              whileTap={{ scale:0.98 }}
              onClick={() => nav('/ai')}
              style={{ marginTop:10, width:'100%', padding:'10px', borderRadius:12, border:'none',
                       background:'linear-gradient(135deg,#f472b6,#fb7185)',
                       color:'white', fontWeight:700, fontSize:13, cursor:'pointer',
                       boxShadow:'0 4px 14px rgba(244,114,182,0.35)' }}
            >
              🤖 问问 AI 顾问
            </motion.button>
          </Section>

          {/* Quick links */}
          <Section title="快捷入口" icon="🔗">
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { icon:'🗺️', label:'附近公园', sub:'探索遛弯好去处', color:'#10b981' },
                { icon:'🐾', label:'宠物社区', sub:'分享成长点滴', color:'#ec4899' },
                { icon:'🎒', label:'道具背包', sub:'管理宠物道具', color:'#8b5cf6' },
              ].map(item => (
                <motion.div key={item.label}
                  whileHover={{ x:4 }}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                           borderRadius:12, background:'white', cursor:'pointer',
                           border:'1px solid #f5f3ff', boxShadow:'0 1px 4px rgba(244,114,182,0.05)',
                           transition:'box-shadow 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 12px rgba(244,114,182,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow='0 1px 4px rgba(244,114,182,0.05)'}
                >
                  <div style={{ width:32, height:32, borderRadius:10, background:`${item.color}18`,
                                display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
                                flexShrink:0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#1f0933' }}>{item.label}</div>
                    <div style={{ fontSize:11, color:'#9ca3af' }}>{item.sub}</div>
                  </div>
                  <span style={{ marginLeft:'auto', color:'#d1d5db', fontSize:16 }}>›</span>
                </motion.div>
              ))}
            </div>
          </Section>
        </aside>
      </div>

      <AnimatePresence>
        {showCreate && <CreatePetModal key="create" onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Tablet (2-col) ────────────────────────────────────────────────────────────
function TabletPetPage({ pet, statuses, displayStatuses, previewAge, handlePreviewAgeChange,
  handleMain, handleSecondary, warning, stageLabel, avatarTick, lastAction,
  showCreate, setShowCreate, t }) {
  const overall = Math.round(statuses?.overall || 0);
  const last = pet?.lastActivity || {};

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden',
                  background:'linear-gradient(135deg,#fdf2f8,#fce7f3)' }}>
      <div style={{ display:'flex', flex:1, minHeight:0, overflow:'hidden', gap:16, padding:'16px' }}>
        {/* Left */}
        <div style={{ width:220, flexShrink:0, background:'white', borderRadius:20, padding:18,
                      boxShadow:'0 4px 20px rgba(244,114,182,0.1)', display:'flex',
                      flexDirection:'column', gap:14, overflow:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:44, height:44, background:'linear-gradient(135deg,#fcd34d,#fb923c)',
                          borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:24 }}>🐕</div>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:'#1f0933' }}>{pet.name}</div>
              <div style={{ fontSize:12, color:'#9ca3af' }}>{stageLabel} · ❤️{overall}%</div>
            </div>
          </div>
          <StatusPill icon="💧" label={t('pet.status.hydration')} value={statuses?.hydration||0} />
          <StatusPill icon="🍖" label="饱腹" value={statuses?.appetite||0} />
          <StatusPill icon="😊" label={t('pet.status.mood')} value={statuses?.mood||0} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <QuickBtn icon="🍖" label={t('pet.action.feed')} color="#f97316" onClick={() => handleMain('feed',t('pet.action.feed'))} />
            <QuickBtn icon="💧" label="喝水" color="#3b82f6" onClick={() => handleMain('water','补水')} />
            <QuickBtn icon="🛁" label={t('pet.action.bath')} color="#8b5cf6" onClick={() => handleSecondary('bath',t('pet.action.bath'))} />
            <QuickBtn icon="🚶" label={t('pet.action.walk')} color="#10b981" onClick={() => handleSecondary('walk',t('pet.action.walk'))} />
          </div>
        </div>
        {/* Right */}
        <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:12, overflow:'auto' }}>
          <div style={{ background:'white', borderRadius:20, padding:'14px 18px', boxShadow:'0 4px 20px rgba(244,114,182,0.1)' }}>
            <StatusRow statuses={statuses} />
          </div>
          <div style={{ flex:1, minHeight:0 }}>
            <div className="v2-playground" style={{ minHeight:280 }}>
              <SceneDecor />
              <div style={{ display:'flex', justifyContent:'center', position:'relative', zIndex:2 }}>
                <motion.div drag dragConstraints={{left:-80,right:80,top:-40,bottom:40}}
                  dragElastic={0.4} whileTap={{scale:0.94}}>
                  <DogCharacter stage={displayStatuses.avatarStage} reactKey={avatarTick}
                    wilted={warning} lastActionType={lastAction.type}
                    size={displayStatuses.avatarSize} draggable={false} />
                  <PetReactions lastAction={lastAction} statuses={statuses} />
                </motion.div>
              </div>
              <AchievementWatcher pet={pet} statuses={statuses} />
              <ActionRing onMain={handleMain} onSecondary={handleSecondary} />
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>{showCreate && <CreatePetModal key="create" onClose={() => setShowCreate(false)} />}</AnimatePresence>
    </div>
  );
}

// ─── Mobile (unchanged but polished) ─────────────────────────────────────────
function MobilePetPage({ pet, statuses, displayStatuses, previewAge, handlePreviewAgeChange,
  clearPreview, handleMain, handleSecondary, warning, stageLabel, avatarTick, lastAction,
  showCreate, setShowCreate, t }) {
  return (
    <div style={{ minHeight:0, flex:1, background:'radial-gradient(ellipse,#fff0f6,#fdf2f8,#fbcfe8)',
                  display:'flex', flexDirection:'column', overflow:'hidden', maxWidth:480,
                  margin:'0 auto', boxShadow:'0 0 32px rgba(244,114,182,0.12)' }}>
      <div className="v2-topbar">
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#9d174d', margin:0 }}>{pet.name}</h1>
          <p style={{ color:'#f472b6', fontSize:13, margin:'2px 0 0' }}>
            {breedLabel(pet.breed,t)} · {stageLabel}
            {previewAge !== null && <span style={{ marginLeft:6, fontSize:11, color:'#fb923c' }}>（{t('pet.previewMode')}）</span>}
          </p>
        </div>
        <div style={{ padding:'10px 18px', borderRadius:100, background:'white', border:'2px solid #fce7f3',
                      color:'#be185d', fontWeight:700, fontSize:14, boxShadow:'0 2px 10px rgba(244,114,182,0.15)',
                      whiteSpace:'nowrap' }}>
          ❤️ {t('pet.healthIndex',{n:statuses.overall})}
          {warning && <span style={{marginLeft:6}}>{t('pet.needsYou')}</span>}
        </div>
      </div>
      <AgePreviewBar
        previewAge={previewAge !== null ? previewAge : (pet?.birthday ? (Date.now()-new Date(pet.birthday).getTime())/(1000*60*60*24*365) : 2)}
        onChange={handlePreviewAgeChange} disabled={false}
      />
      <div className="v2-stage">
        <div className="v2-playground">
          <SceneDecor />
          <StatusRow statuses={statuses} />
          <div style={{display:'flex',justifyContent:'center',position:'relative',zIndex:2}}>
            <motion.div drag dragConstraints={{left:-80,right:80,top:-40,bottom:40}} dragElastic={0.4}
              whileTap={{scale:0.96}}>
              <DogCharacter stage={displayStatuses.avatarStage} reactKey={avatarTick}
                wilted={warning} lastActionType={lastAction.type}
                size={displayStatuses.avatarSize} draggable={false} />
              <PetReactions lastAction={lastAction} statuses={statuses} />
            </motion.div>
          </div>
          <AchievementWatcher pet={pet} statuses={statuses} />
          <ActionRing onMain={handleMain} onSecondary={handleSecondary} />
          <p style={{fontSize:11,color:'#9ca3af',marginTop:8,marginBottom:16,textAlign:'center',position:'relative',zIndex:3}}>
            {t('pet.hint')}
          </p>
        </div>
      </div>
      <AnimatePresence>{showCreate && <CreatePetModal key="create" onClose={() => setShowCreate(false)} />}</AnimatePresence>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ t, setShowCreate }) {
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#fdf2f8,#fce7f3)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32}}>
      <div style={{fontSize:96,marginBottom:16,marginTop:24}}>🐾</div>
      <h1 style={{fontSize:24,fontWeight:800,color:'#9d174d',marginBottom:8}}>{t('pet.empty.heading')}</h1>
      <p style={{color:'#f472b6',fontSize:14,marginBottom:40,textAlign:'center',lineHeight:1.8}}>
        {t('pet.empty.line1')}<br/>{t('pet.empty.line2')}
      </p>
      <button
        onClick={() => setShowCreate(true)}
        style={{background:'linear-gradient(135deg,#f472b6,#fb7185)',color:'white',fontWeight:700,cursor:'pointer',fontSize:16,padding:'16px 40px',border:'none',borderRadius:16,boxShadow:'0 4px 15px rgba(244,114,182,0.4)'}}>
        {t('pet.empty.cta')}
      </button>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function PetPageV2() {
  const { pet, logActivity, setPetLocal } = usePet();
  const statuses = useMemo(() => computeStatusesV2(pet), [pet]);
  const { t } = useI18n();
  const nav = useNavigate();
  const screenWidth = useScreenSize();

  const [previewAge, setPreviewAge] = useState(null);
  const previewStatuses = useMemo(() => {
    if (previewAge === null) return null;
    const now = Date.now();
    const syntheticBirthday = new Date(now - previewAge * 365 * 24 * 60 * 60 * 1000);
    return computeStatusesV2({ ...pet, birthday: syntheticBirthday.toISOString() });
  }, [pet, previewAge]);
  const displayStatuses = previewStatuses || statuses;

  const handlePreviewAgeChange = useCallback((y) => setPreviewAge(y), []);
  const clearPreview = useCallback(() => setPreviewAge(null), []);

  const [showCreate, setShowCreate] = useState(false);
  const [avatarTick, setAvatarTick] = useState(0);
  const [lastAction, setLastAction] = useState({ type:null, tick:0 });

  const writeActivity = useCallback((type, minutesAgo=0) => {
    const tsDate = minutesAgo===0 ? new Date() : new Date(Date.now()-minutesAgo*60000);
    const ts = { toDate:() => tsDate };
    logActivity(type)?.catch(() => {});
    const prev = pet?.lastActivity?.[type];
    const prevArr = !prev ? [] : Array.isArray(prev) ? prev : [prev];
    const nextArr = [...prevArr, ts].slice(-5);
    setPetLocal({ ...(pet||{}), lastActivity:{ ...(pet?.lastActivity||{}), [type]:nextArr } });
    setAvatarTick(prev => prev+1);
    setLastAction({ type, tick:Date.now() });
  }, [pet, logActivity, setPetLocal]);

  const handleMain = useCallback((type, label, minutesAgo=0) => {
    writeActivity(type, minutesAgo);
    toast.success(minutesAgo ? t('pet.toast.loggedAgo',{label,n:minutesAgo}) : t('pet.toast.logged',{label}));
    offerAiFollowUp(nav, t, label);
  }, [writeActivity, t, nav]);

  const handleSecondary = useCallback((type, label) => {
    writeActivity(type);
    toast.success(t('pet.toast.logged',{label}));
    offerAiFollowUp(nav, t, label);
  }, [writeActivity, t, nav]);

  const warning = Object.entries(STATUS_META).some(([k]) => statuses[k] < 40);
  const stageLabel = t('pet.stage.'+(displayStatuses.avatarStage||'adult'));

  const sharedProps = { pet, statuses, displayStatuses, previewAge, handlePreviewAgeChange,
    handleMain, handleSecondary, warning, stageLabel, avatarTick, lastAction,
    showCreate, setShowCreate, t };

  if (!pet) {
    return (
      <>
        <EmptyState t={t} setShowCreate={setShowCreate} />
        <AnimatePresence>{showCreate && <CreatePetModal key="create" onClose={() => setShowCreate(false)} />}</AnimatePresence>
      </>
    );
  }
  if (screenWidth >= 1024) return <DesktopPetPage {...sharedProps} nav={nav} />;
  if (screenWidth >= 640)  return <TabletPetPage {...sharedProps} />;
  return <MobilePetPage {...sharedProps} clearPreview={clearPreview} />;
}

const btnPrimary = {
  flex:1, padding:'12px', borderRadius:16, border:'none',
  background:'linear-gradient(135deg,#f472b6,#fb7185)', color:'white',
  fontWeight:700, cursor:'pointer', fontSize:14,
  boxShadow:'0 4px 15px rgba(244,114,182,0.4)',
};

function GlobalStyles() {
  return (
    <style>{`
      .v2-topbar { display:flex; align-items:center; justify-content:space-between;
        padding:12px 16px; flex-wrap:wrap; gap:8px; flex-shrink:0; }
      .v2-stage { flex:1; min-height:0; display:flex; flex-direction:column;
        gap:12px; padding:0 12px 12px; overflow-y:auto; overflow-x:hidden; }
      .v2-playground { flex:1; min-height:0; position:relative;
        background:linear-gradient(180deg,#fef3ec 0%,#fde4d3 55%,#e8c59a 55%,#d4a574 100%);
        border-radius:24px; padding:clamp(20px,4vh,40px) clamp(16px,4vw,24px);
        border:1px solid #fce7f3; box-shadow:0 4px 20px rgba(244,114,182,0.08);
        overflow:visible; display:flex; flex-direction:column;
        align-items:center; justify-content:space-evenly; }
    `}</style>
  );
}
