import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { rp } from '../utils/responsive';
import { TrainingAPI } from '../services/apiLayer';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../context/AuthContext';

const SKILLS_KEY = 'gg_pet_skills';
const POINTS_KEY = 'gg_training_points';
const HISTORY_KEY = 'gg_training_history';
const STREAK_KEY = 'gg_training_streak';
const SESSIONS_TO_MASTER = 4;
const BASE_SUCCESS_RATE = 0.7;

const SKILL_CATEGORIES = [
  {
    category: 'basic', categoryEn: 'Basic', emoji: '🐕',
    skills: [
      { id: 'sit',       emoji: '🐕', nameKey: 'training.skill.sit.name',      descKey: 'training.skill.sit.desc',      cost: 3, comboBonus: false },
      { id: 'shake',     emoji: '🐕', nameKey: 'training.skill.shake.name',    descKey: 'training.skill.shake.desc',    cost: 3, comboBonus: false },
      { id: 'lie_down',  emoji: '🐕', nameKey: 'training.skill.lie_down.name', descKey: 'training.skill.lie_down.desc', cost: 5, comboBonus: false },
      { id: 'stay',      emoji: '🐕', nameKey: 'training.skill.stay.name',     descKey: 'training.skill.stay.desc',    cost: 5, comboBonus: false },
    ],
  },
  {
    category: 'social', categoryEn: 'Social', emoji: '🐾',
    skills: [
      { id: 'come',      emoji: '🐾', nameKey: 'training.skill.come.name',     descKey: 'training.skill.come.desc',     cost: 4, comboBonus: true  },
      { id: 'roll_over', emoji: '🐾', nameKey: 'training.skill.roll_over.name',descKey: 'training.skill.roll_over.desc',cost: 4, comboBonus: true  },
      { id: 'play_dead', emoji: '🐾', nameKey: 'training.skill.play_dead.name', descKey: 'training.skill.play_dead.desc', cost: 6, comboBonus: true  },
    ],
  },
  {
    category: 'advanced', categoryEn: 'Advanced', emoji: '⭐',
    skills: [
      { id: 'math',    emoji: '⭐', nameKey: 'training.skill.math.name',    descKey: 'training.skill.math.desc',    cost: 10, comboBonus: true },
      { id: 'fetch',   emoji: '⭐', nameKey: 'training.skill.fetch.name',   descKey: 'training.skill.fetch.desc',   cost: 8,  comboBonus: true },
    ],
  },
];

const SKILL_ANIMATIONS_BASE = {
  sit:       { emoji: '🐕', verbKey: 'training.skill.sit.name',      frame: ['🐕', '🐶', '🐕'] },
  shake:     { emoji: '🐾', verbKey: 'training.skill.shake.name',     frame: ['🐾', '✋', '🐾'] },
  lie_down:  { emoji: '🐕', verbKey: 'training.skill.lie_down.name', frame: ['🐕', '💤', '🐕'] },
  stay:      { emoji: '🐕', verbKey: 'training.skill.stay.name',     frame: ['🐕', '⏳', '🐕'] },
  come:      { emoji: '🐾', verbKey: 'training.skill.come.name',     frame: ['🐾', '⚡', '🐾'] },
  roll_over: { emoji: '🐾', verbKey: 'training.skill.roll_over.name',frame: ['🐾', '🔄', '🐾'] },
  play_dead: { emoji: '🐾', verbKey: 'training.skill.play_dead.name',frame: ['🐾', '💀', '🐾'] },
  math:      { emoji: '⭐', verbKey: 'training.skill.math.name',     frame: ['🧮', '💡', '⭐'] },
  fetch:     { emoji: '⭐', verbKey: 'training.skill.fetch.name',    frame: ['🎾', '🏃', '⭐'] },
};

function loadSkills() {
  try {
    const raw = localStorage.getItem(SKILLS_KEY);
    if (!raw) {
      const init = {};
      SKILL_CATEGORIES.forEach(cat => cat.skills.forEach(s => {
        init[s.id] = { unlocked: false, progress: 0, mastered: false };
      }));
      return init;
    }
    return JSON.parse(raw);
  } catch { return {}; }
}

function saveSkills(s) { localStorage.setItem(SKILLS_KEY, JSON.stringify(s)); }
function loadPoints() { try { return parseInt(localStorage.getItem(POINTS_KEY) || '5', 10); } catch { return 5; } }
function savePoints(p) { localStorage.setItem(POINTS_KEY, String(p)); }
function loadHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; } }
function saveHistory(h) { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 19))); }
function loadStreak() { try { return JSON.parse(localStorage.getItem(STREAK_KEY) || '{"last":"","days":0}'); } catch { return { last: '', days: 0 }; } }
function saveStreak(s) { localStorage.setItem(STREAK_KEY, JSON.stringify(s)); }

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i, x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#f472b6','#fb7185','#facc15','#4ade80','#60a5fa','#c084fc','#f97316'][i % 7],
    size: 7 + Math.random() * 9,
    isCircle: Math.random() > 0.5,
  }));
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }}>
      {pieces.map(p => (
        <motion.div key={p.id}
          initial={{ top: -20, left: `${p.x}%`, opacity: 1, rotate: 0 }}
          animate={{ top: '110%', opacity: 0, rotate: 720 }}
          transition={{ duration: 2.2, delay: p.delay, ease: 'easeOut' }}
          style={{ position: 'absolute', width: p.size, height: p.size, background: p.color, borderRadius: p.isCircle ? '50%' : 2 }} />
      ))}
    </div>
  );
}

function MiniConfetti() {
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i, x: 30 + Math.random() * 40,
    delay: Math.random() * 0.3,
    color: ['#f472b6','#fb7185','#facc15','#4ade80'][i % 4],
    size: 5 + Math.random() * 5,
  }));
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 16 }}>
      {pieces.map(p => (
        <motion.div key={p.id}
          initial={{ top: '50%', left: `${p.x}%`, opacity: 1 }}
          animate={{ top: '-10%', opacity: 0 }}
          transition={{ duration: 1.0, delay: p.delay, ease: 'easeOut' }}
          style={{ position: 'absolute', width: p.size, height: p.size, background: p.color, borderRadius: '50%' }} />
      ))}
    </div>
  );
}

function ProgressBar({ progress, total, color = '#f472b6', animated = true }) {
  const pct = Math.min((progress / total) * 100, 100);
  return (
    <div style={{ width: '100%', height: 7, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
      <motion.div
        initial={animated ? { width: 0 } : false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ height: '100%', background: color, borderRadius: 4 }} />
    </div>
  );
}

function TrainingArena({ skill, result, progress, comboCount, t }) {
  const anim = SKILL_ANIMATIONS_BASE[skill.id] || { emoji: '⭐', verbKey: 'training.arena.training', frame: ['🐾', '⭐', '🐾'] };
  const [frameIdx, setFrameIdx] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (result) { setShowResult(true); return; }
    setShowResult(false);
    setFrameIdx(0);
    intervalRef.current = setInterval(() => {
      setFrameIdx(f => (f + 1) % anim.frame.length);
    }, 400);
    return () => clearInterval(intervalRef.current);
  }, [result, skill.id]);

  const success = result === 'success';
  const fail = result === 'fail';
  const skillName = t(skill.nameKey);
  const verb = t(anim.verbKey);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
      borderRadius: 20, padding: '24px 20px', marginBottom: 24,
      border: `2px solid ${success ? '#86efac' : fail ? '#fca5a5' : 'rgba(244,114,182,0.3)'}`,
      position: 'relative', overflow: 'hidden',
      boxShadow: success ? '0 8px 32px rgba(52,211,153,0.3)' : fail ? '0 8px 32px rgba(239,68,68,0.2)' : '0 4px 20px rgba(244,114,182,0.2)',
    }}>
      {success && <MiniConfetti />}

      {/* Pet avatar */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <motion.div
          animate={result ? (success ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : { x: [-8, 8, -8, 8, 0] }) : { y: [0, -12, 0] }}
          transition={{ duration: success ? 0.6 : 0.4 }}
          style={{ fontSize: 72, lineHeight: 1, display: 'inline-block', filter: fail && !success ? 'grayscale(0.5)' : 'none' }}
        >
          {showResult ? (success ? '🎉' : '😅') : anim.frame[frameIdx]}
        </motion.div>
        <div style={{ marginTop: 8, fontSize: 16, fontWeight: 700, color: '#9d174d' }}>
          {showResult ? (success ? t('training.arena.success', { name: skillName }) : t('training.arena.fail', { name: skillName })) : `${t('training.arena.training', { verb })}`}
        </div>
        {comboCount > 1 && !result && (
          <div style={{ marginTop: 4, fontSize: 12, color: '#f472b6', fontWeight: 600 }}>
            🔥 {t('training.combo.bonus', { n: comboCount, bonus: Math.min(comboCount * 5, 25) })}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
          <span>{t('training.arena.progress')}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <ProgressBar progress={progress} total={100}
          color={success ? '#22c55e' : fail ? '#ef4444' : '#f472b6'} />
      </div>

      {/* Result */}
      {showResult && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center', padding: '8px 0',
            color: success ? '#16a34a' : '#dc2626',
            fontWeight: 700, fontSize: 14,
          }}>
          {success ? t('training.arena.resultSuccess', { name: skillName }) : t('training.arena.resultFail')}
        </motion.div>
      )}

      {/* Success rate */}
      {!result && (
        <div style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
          {t('training.arena.successRate', { n: Math.round((BASE_SUCCESS_RATE + Math.min(comboCount * 0.05, 0.25)) * 100) })}
        </div>
      )}
    </div>
  );
}

function HistoryPanel({ history, t }) {
  const labels = { success: '✅', fail: '❌', master: '🎓' };
  return (
    <div style={{
      background: 'rgba(255,255,255,0.75)',
      borderRadius: 16, padding: '14px 16px', marginBottom: 20,
      border: '1px solid rgba(244,114,182,0.15)',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#9d174d', marginBottom: 10 }}>
        {t('training.history.title')}
      </div>
      {history.length === 0 ? (
        <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>{t('training.history.empty')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {history.slice(0, 5).map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b7280' }}>
              <span style={{ fontSize: 14 }}>{labels[h.type] || '📝'}</span>
              <span style={{ flex: 1, color: '#374151', fontWeight: 500 }}>{h.skillName}</span>
              <span style={{ color: '#9ca3af', fontSize: 11 }}>{h.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MasteredShowcase({ skills, t }) {
  const masteredEntries = Object.entries(skills).filter(([, v]) => v.mastered);
  if (masteredEntries.length === 0) return null;

  const findSkill = (id) => {
    for (const cat of SKILL_CATEGORIES) {
      const s = cat.skills.find(sk => sk.id === id);
      if (s) return s;
    }
    return null;
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.8)',
      borderRadius: 16, padding: '14px 16px', marginBottom: 20,
      border: '1px solid #86efac',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', marginBottom: 10 }}>
        {t('training.showcase.title', { n: masteredEntries.length })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {masteredEntries.map(([id]) => {
          const s = findSkill(id);
          return s ? (
            <div key={id} style={{
              background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
              borderRadius: 12, padding: '6px 12px',
              display: 'flex', alignItems: 'center', gap: 4,
              border: '1px solid #86efac',
            }}>
              <span style={{ fontSize: 16 }}>{s.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>{t(s.nameKey)}</span>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}

function StreakBanner({ streak, t }) {
  return (
    <div style={{
      background: streak.days > 0
        ? 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))'
        : 'rgba(255,255,255,0.6)',
      borderRadius: 12, padding: '8px 14px', marginBottom: 16,
      border: `1px solid ${streak.days > 0 ? '#fcd34d' : 'rgba(244,114,182,0.1)'}`,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ fontSize: 18 }}>{streak.days > 0 ? '🔥' : '⭕'}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: streak.days > 0 ? '#92400e' : '#9ca3af' }}>
        {streak.days > 0 ? t('training.streak.active', { n: streak.days }) : t('training.streak.inactive')}
      </span>
      {streak.days > 0 && (
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>
          {t('training.streak.bonus', { n: streak.days })}
        </span>
      )}
    </div>
  );
}

export default function PetTrainingPage() {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const [skills, setSkills] = useState({});
  const [points, setPoints] = useState(5);
  const [history, setHistory] = useState([]);
  const [streak, setStreak] = useState({ last: null, days: 0 });
  const [trainingSkillId, setTrainingSkillId] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingResult, setTrainingResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [justMastered, setJustMastered] = useState(null);
  const [activeTab, setActiveTab] = useState('training');
  const [apiReady, setApiReady] = useState(false);
  const comboRef = useRef(0);

  useEffect(() => {
    if (!currentUser?.uid) return;
    TrainingAPI.get(currentUser.uid).then(data => {
      const mergedSkills = {};
      SKILL_CATEGORIES.forEach(cat => cat.skills.forEach(s => {
        mergedSkills[s.id] = data?.skills?.[s.id] || { unlocked: false, progress: 0, mastered: false };
      }));
      setSkills(mergedSkills);
      setPoints(data?.trainingPoints ?? 5);
      setHistory(data?.history || []);
      setStreak(data?.streak || { last: null, days: 0 });
      setApiReady(true);
    });
    TrainingAPI.updateStreak(currentUser.uid);
  }, [currentUser?.uid]);

  const addHistory = useCallback((type, skillName) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const entry = { type, skillName, time };
    setHistory(prev => [entry, ...prev].slice(0, 20));
    if (currentUser?.uid) TrainingAPI.addHistory(currentUser.uid, type, null, skillName);
  }, [currentUser?.uid]);

  const unlockSkill = useCallback((skillId) => {
    setSkills(prev => ({ ...prev, [skillId]: { ...prev[skillId] || {}, unlocked: true, progress: prev[skillId]?.progress || 0, mastered: prev[skillId]?.mastered || false } }));
  }, []);

  const handleStartTraining = useCallback((skill) => {
    if (points < 1) { toast.error(t('training.toast.noPoints')); return; }
    if (skills[skill.id]?.mastered) return;
    if (trainingSkillId !== null) return;

    if (!skills[skill.id]?.unlocked) unlockSkill(skill.id);

    const newPts = Math.max(0, points - 1);
    setPoints(newPts);
    if (currentUser?.uid) TrainingAPI.deductPoint(currentUser.uid);

    setTrainingSkillId(skill.id);
    setTrainingProgress(0);
    setTrainingResult(null);

    const comboCount = comboRef.current;
    const successRate = Math.min(BASE_SUCCESS_RATE + comboCount * 0.05, 0.95);
    const skillName = t(skill.nameKey);

    let start = null;
    const duration = 3000;
    function step(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setTrainingProgress(pct);
      if (elapsed < duration) { requestAnimationFrame(step); return; }
      const success = Math.random() < successRate;
      setTrainingResult(success ? 'success' : 'fail');

      if (success) {
        comboRef.current += 1;
        setSkills(prev => {
          const st = prev[skill.id] || { unlocked: true, progress: 0, mastered: false };
          const newProg = st.progress + 1;
          const mastered = newProg >= SESSIONS_TO_MASTER;
          const next = { ...prev, [skill.id]: { ...st, progress: newProg, mastered } };
          if (currentUser?.uid) TrainingAPI.updateSkill(currentUser.uid, skill.id, 'progress', 1);
          if (mastered && currentUser?.uid) TrainingAPI.updateSkill(currentUser.uid, skill.id, 'master', 0);
          return next;
        });
        addHistory('success', skillName);
        setTimeout(() => {
          const wouldMaster = (skills[skill.id]?.progress || 0) + 1 >= SESSIONS_TO_MASTER;
          if (wouldMaster) {
            setJustMastered(skill);
            setShowConfetti(true);
            addHistory('master', skillName);
            toast.success(t('training.toast.mastered', { name: skillName }));
            setTimeout(() => { setShowConfetti(false); setJustMastered(null); }, 2800);
          } else {
            toast.success(t('training.toast.success', { name: skillName }));
          }
        }, 300);
      } else {
        comboRef.current = 0;
        addHistory('fail', skillName);
        toast(t('training.arena.resultFail'), { icon: '💪', style: { background: '#fce7f3', color: '#9d174d' } });
      }

      setTimeout(() => {
        setTrainingSkillId(null);
        setTrainingProgress(0);
        setTrainingResult(null);
      }, 1800);
    }
    requestAnimationFrame(step);
  }, [points, skills, trainingSkillId, unlockSkill, addHistory, t]);

  const masteredCount = Object.values(skills).filter(s => s.mastered).length;
  const totalSkills = SKILL_CATEGORIES.reduce((a, c) => a + c.skills.length, 0);
  const activeSkill = trainingSkillId
    ? SKILL_CATEGORIES.flatMap(c => c.skills).find(s => s.id === trainingSkillId)
    : null;
  const comboCount = comboRef.current;

  const tabs = [
    { key: 'training', label: t('training.tab.training'), emoji: '🎯' },
    { key: 'showcase',  label: t('training.tab.showcase'), emoji: '🌟' },
    { key: 'history',   label: t('training.tab.history'),  emoji: '📜' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f9a8d4 100%)',
      fontFamily: "-apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif",
      paddingBottom: 40,
    }}>
      {showConfetti && <Confetti />}

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #ec4899, #be185d)',
        padding: rp.heroPadding(), position: 'relative', overflow: 'hidden',
      }}>
        {[{ top:-20,left:-20,w:100,h:100 }, { bottom:-15,right:-15,w:80,h:80 }, { top:10,right:50,w:40,h:40 }].map((p, i) => (
          <div key={i} style={{ position:'absolute', top:p.top, left:p.left, bottom:p.bottom, right:p.right, width:p.w, height:p.h, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
        ))}
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
          <div style={{ fontSize:44, marginBottom:6 }}>🎓</div>
          <h1 style={{ color:'#fff', fontSize:26, fontWeight:800, margin:'0 0 6px', letterSpacing:'0.02em' }}>{t('training.hero.title')}</h1>
          <p style={{ color:'rgba(255,255,255,0.85)', fontSize:13, margin:0 }}>{t('training.hero.subtitle')}</p>
        </motion.div>
      </div>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'20px 16px 0' }}>

        {/* Header bar */}
        <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
          style={{
            background:'rgba(255,255,255,0.88)', borderRadius:20, padding:'14px 18px', marginBottom:16,
            display:'flex', alignItems:'center', gap:14,
            boxShadow:'0 4px 20px rgba(244,114,182,0.15)',
            border:'1px solid rgba(244,114,182,0.2)',
            backdropFilter:'blur(12px)',
          }}>
          <div style={{ fontSize:44, borderRadius:14, background:'linear-gradient(135deg,#fdf2f8,#fce7f3)', padding:'6px 10px', boxShadow:'0 2px 8px rgba(244,114,182,0.2)', flexShrink:0 }}>🐶</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:17, fontWeight:800, color:'#9d174d' }}>{t('training.header.name')}</div>
            <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{t('training.header.mastered', { n: masteredCount, total: totalSkills })}</div>
            <ProgressBar progress={masteredCount} total={totalSkills} color='linear-gradient(90deg,#f472b6,#fb7185)' animated={false} />
          </div>
          <div style={{ background:'linear-gradient(135deg,#f472b6,#fb7185)', borderRadius:14, padding:'10px 14px', textAlign:'center', boxShadow:'0 4px 12px rgba(244,114,182,0.35)', flexShrink:0 }}>
            <div style={{ fontSize:22, fontWeight:900, color:'#fff', lineHeight:1 }}>{points}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.85)', fontWeight:600, marginTop:2 }}>{t('training.header.points')}</div>
          </div>
          {comboCount > 1 && (
            <div style={{ background:'linear-gradient(135deg,#f59e0b,#f97316)', borderRadius:12, padding:'8px 10px', textAlign:'center', flexShrink:0 }}>
              <div style={{ fontSize:18, fontWeight:900, color:'#fff', lineHeight:1 }}>🔥{comboCount}x</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.85)', fontWeight:600, marginTop:2 }}>{t('training.header.combo')}</div>
            </div>
          )}
        </motion.div>

        <StreakBanner streak={streak} t={t} />

        {/* Info banner */}
        <div style={{ background:'rgba(255,255,255,0.6)', borderRadius:12, padding:'9px 14px', marginBottom:16, fontSize:12, color:'#9ca3af', border:'1px solid rgba(244,114,182,0.1)' }}>
          {t('training.infoBanner', { n: streak.days > 0 ? streak.days : 1 })}
        </div>

        {/* Training Arena */}
        <AnimatePresence>
          {activeSkill && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
              <TrainingArena skill={activeSkill} result={trainingResult} progress={trainingProgress} comboCount={comboCount} t={t} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {tabs.map(tb => (
            <button key={tb.key} onClick={() => setActiveTab(tb.key)}
              style={{
                flex:1, padding:'9px 0', borderRadius:12, border:'none', cursor:'pointer',
                fontWeight:700, fontSize:13,
                background: activeTab === tb.key ? 'linear-gradient(135deg,#ec4899,#be185d)' : 'rgba(255,255,255,0.7)',
                color: activeTab === tb.key ? '#fff' : '#9ca3af',
                boxShadow: activeTab === tb.key ? '0 4px 14px rgba(236,72,153,0.35)' : 'none',
                transition:'all 0.2s',
              }}>
              {tb.emoji} {tb.label}
            </button>
          ))}
        </div>

        {/* Training Tab */}
        <AnimatePresence>
          {activeTab === 'training' && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              {SKILL_CATEGORIES.map(cat => {
                const categoryLabelKey = `training.category.${cat.category}`;
                return (
                  <div key={cat.category} style={{ marginBottom: 24 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                      <span style={{ fontSize:16 }}>{cat.emoji}</span>
                      <span style={{ fontSize:14, fontWeight:800, color:'#9d174d' }}>{t(categoryLabelKey)}</span>
                      <span style={{ fontSize:11, color:'#f9a8d4' }}>{cat.categoryEn}</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {cat.skills.map(skill => {
                        const st = skills[skill.id] || { unlocked:false, progress:0, mastered:false };
                        const isUnlocked = st.unlocked;
                        const isMastered = st.mastered;
                        const isTraining = trainingSkillId === skill.id;
                        const isBusy = trainingSkillId !== null && !isTraining;
                        const comboBonus = skill.comboBonus && comboCount > 1;
                        const skillName = t(skill.nameKey);
                        const skillDesc = t(skill.descKey);

                        return (
                          <motion.div key={skill.id} layout
                            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                            style={{
                              background: isMastered ? 'rgba(220,252,231,0.85)' : isUnlocked ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)',
                              borderRadius:16, padding:'14px 16px',
                              border: isMastered ? '1.5px solid #86efac' : isUnlocked ? '1.5px solid rgba(244,114,182,0.15)' : '1.5px solid transparent',
                              opacity: isBusy && !isUnlocked ? 0.6 : 1,
                              boxShadow: isUnlocked && !isMastered ? '0 2px 8px rgba(244,114,182,0.08)' : 'none',
                            }}>
                            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                              <div style={{
                                fontSize:28, width:48, height:48, borderRadius:12,
                                background: isMastered ? '#16a34a' : isUnlocked ? 'linear-gradient(135deg,#fdf2f8,#fce7f3)' : '#e5e7eb',
                                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                                boxShadow: isMastered ? '0 2px 8px rgba(22,163,74,0.3)' : 'none',
                              }}>
                                {isMastered ? '✅' : !isUnlocked ? '🔒' : skill.emoji}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                                  <span style={{ fontSize:15, fontWeight:700, color:'#9d174d' }}>{skillName}</span>
                                  <span style={{ fontSize:11, color:'#f472b6', fontWeight:600 }}>{skill.cost} pts</span>
                                  {comboBonus && <span style={{ fontSize:11, color:'#f59e0b', fontWeight:700 }}>🔥+{Math.min(comboCount*5,25)}%</span>}
                                </div>
                                <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{skillDesc}</div>
                                {isUnlocked && !isMastered && (
                                  <div style={{ marginTop:8 }}>
                                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                                      <span style={{ fontSize:11, color:'#9ca3af' }}>
                                        {isTraining ? (trainingResult==='fail' ? t('training.status.fail') : trainingResult==='success' ? t('training.status.success') : t('training.status.training')) : t('training.status.progress')}
                                      </span>
                                      <span style={{ fontSize:11, color:'#f472b6', fontWeight:600 }}>{st.progress}/{SESSIONS_TO_MASTER}</span>
                                    </div>
                                    <ProgressBar progress={isTraining ? trainingProgress : (st.progress / SESSIONS_TO_MASTER) * 100}
                                      total={100} color={isMastered ? '#16a34a' : '#f472b6'} animated={!isTraining} />
                                  </div>
                                )}
                                {isMastered && (
                                  <div style={{ marginTop:6, fontSize:12, color:'#16a34a', fontWeight:600 }}>
                                    {t('training.mastered')}
                                  </div>
                                )}
                              </div>
                              {!isMastered && (
                                <motion.button whileTap={{ scale: isBusy ? 1 : 0.95 }}
                                  onClick={() => handleStartTraining(skill)}
                                  disabled={isBusy}
                                  style={{
                                    background: isBusy ? '#e5e7eb' : isUnlocked ? 'linear-gradient(135deg,#f472b6,#fb7185)' : '#d1d5db',
                                    border:'none', borderRadius:10, color: isBusy ? '#9ca3af' : '#fff',
                                    fontWeight:700, fontSize:12, padding:'8px 14px', cursor: isBusy ? 'not-allowed' : 'pointer',
                                    boxShadow: isUnlocked && !isBusy ? '0 3px 10px rgba(244,114,182,0.35)' : 'none',
                                    flexShrink:0, whiteSpace:'nowrap',
                                  }}>
                                  {isBusy ? '…' : isUnlocked ? t('training.btn.startTraining') : t('training.btn.unlocked')}
                                </motion.button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Showcase Tab */}
        <AnimatePresence>
          {activeTab === 'showcase' && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <MasteredShowcase skills={skills} t={t} />
              {masteredCount === 0 && (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af' }}>
                  <div style={{ fontSize:48, marginBottom:8 }}>🌟</div>
                  <p style={{ fontSize:15 }}>{t('training.showcase.empty.title')}</p>
                  <p style={{ fontSize:12, marginTop:4 }}>{t('training.showcase.empty.hint')}</p>
                </div>
              )}
              <div style={{ background:'rgba(255,255,255,0.6)', borderRadius:14, padding:'14px', border:'1px solid rgba(244,114,182,0.1)', marginTop:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#9d174d', marginBottom:8 }}>{t('training.showcase.tip')}</div>
                <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.8 }}>
                  <div>• {t('training.showcase.tip1')}</div>
                  <div>• {t('training.showcase.tip2')}</div>
                  <div>• {t('training.showcase.tip3')}</div>
                  <div>• {t('training.showcase.tip4')}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Tab */}
        <AnimatePresence>
          {activeTab === 'history' && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <HistoryPanel history={history} t={t} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
