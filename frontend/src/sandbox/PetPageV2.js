import React, { useState, useMemo, useCallback } from 'react';
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

// ─────────────────────────────────────────────
// Preview age helpers
// ─────────────────────────────────────────────
function computePreviewStatuses(pet, previewYears) {
  const now = Date.now();
  const syntheticBirthday = new Date(now - previewYears * 365 * 24 * 60 * 60 * 1000);
  return computeStatusesV2({ ...pet, birthday: syntheticBirthday.toISOString() });
}

// ─────────────────────────────────────────────
// Screen-size hook
// ─────────────────────────────────────────────
function useScreenSize() {
  const [size, setSize] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  React.useEffect(() => {
    const handler = () => setSize(window.innerWidth);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size; // <640 mobile, 640-1023 tablet, ≥1024 desktop
}

// ─────────────────────────────────────────────
// Shared: AI follow-up toast
// ─────────────────────────────────────────────
function offerAiFollowUp(nav, t, label) {
  setTimeout(() => {
    toast((tInst) => (
      <span style={{ display:'flex', alignItems:'center', gap:10, fontSize:13 }}>
        <span style={{ color:'#9d174d' }}>{t('pet.toast.askAi', { action: label })}</span>
        <button
          onClick={() => {
            toast.dismiss(tInst.id);
            nav(`/ai?q=${encodeURIComponent(t('ai.askAbout', { action: label }))}`);
          }}
          style={{ flexShrink:0, padding:'4px 12px', borderRadius:100, border:'none',
                   background:'linear-gradient(135deg,#f472b6,#fb7185)', color:'white',
                   fontWeight:700, fontSize:11, cursor:'pointer' }}>
          {t('pet.toast.askAiBtn')}
        </button>
      </span>
    ), {
      id: 'pet-ai-suggest',
      duration: 3500,
      position: 'bottom-center',
      style: { paddingRight: 14, marginBottom: 80 },
    });
  }, 700);
}

// ─────────────────────────────────────────────
// Mobile Layout (single-column, centered card)
// ─────────────────────────────────────────────
function MobilePetPage({ pet, statuses, displayStatuses, previewAge, handlePreviewAgeChange,
  clearPreview, handleMain, handleSecondary, warning, stageLabel, avatarTick, lastAction,
  showCreate, setShowCreate, t }) {

  return (
    <div style={{
      minHeight: 0, flex: 1,
      background: 'radial-gradient(ellipse at top,#fff0f6 0%,#fdf2f8 50%,#fbcfe8 100%)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      maxWidth: 480, margin: '0 auto',
      boxShadow: '0 0 32px rgba(244,114,182,0.12)',
    }}>
      <div className="v2-topbar">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#9d174d', margin: 0 }}>{pet.name}</h1>
          <p style={{ color: '#f472b6', fontSize: 13, margin: '2px 0 0' }}>
            {breedLabel(pet.breed, t)} · {stageLabel}
            {previewAge !== null && (
              <span style={{ marginLeft: 6, fontSize: 11, color: '#fb923c', fontStyle: 'italic' }}>
                （{t('pet.previewMode')}）
              </span>
            )}
          </p>
        </div>
        <div style={{
          padding: '10px 18px', borderRadius: 100, background: 'white',
          border: '2px solid #fce7f3', color: '#be185d', fontWeight: 700, fontSize: 14,
          boxShadow: '0 2px 10px rgba(244,114,182,0.15)', whiteSpace: 'nowrap',
        }}>
          {t('pet.healthIndex', { n: statuses.overall })}
          {warning && <span style={{ marginLeft: 6 }}>{t('pet.needsYou')}</span>}
        </div>
      </div>

      <AgePreviewBar
        previewAge={previewAge !== null ? previewAge : (pet?.birthday
          ? (Date.now() - new Date(pet.birthday).getTime()) / (1000 * 60 * 60 * 24 * 365)
          : 2)}
        onChange={handlePreviewAgeChange}
        disabled={false}
      />

      <div className="v2-stage">
        <div className="v2-playground">
          <SceneDecor />
          <StatusRow statuses={statuses} />
          <div style={{ display:'flex', justifyContent:'center',
                        transform:'translateY(0px)', position:'relative', zIndex:2 }}>
            <motion.div
              className="v2-dog-wrap"
              drag
              dragConstraints={{ left: -80, right: 80, top: -40, bottom: 40 }}
              dragElastic={0.4}
              dragTransition={{ bounceStiffness: 300, bounceDamping: 18 }}
              whileTap={{ scale: 0.96 }}
            >
              <DogCharacter
                stage={displayStatuses.avatarStage}
                reactKey={avatarTick}
                wilted={warning}
                lastActionType={lastAction.type}
                size={displayStatuses.avatarSize}
                draggable={false}
              />
              <PetReactions lastAction={lastAction} statuses={statuses} />
            </motion.div>
          </div>
          <AchievementWatcher pet={pet} statuses={statuses} />
          <ActionRing onMain={handleMain} onSecondary={handleSecondary} />
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, marginBottom: 16,
                      textAlign: 'center', position: 'relative', zIndex: 3, flexShrink: 0 }}>
            {t('pet.hint')}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && <CreatePetModal key="create" onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Tablet Layout (two-column: status left, pet right)
// ─────────────────────────────────────────────
function TabletPetPage({ pet, statuses, displayStatuses, previewAge, handlePreviewAgeChange,
  handleMain, handleSecondary, warning, stageLabel, avatarTick, lastAction,
  showCreate, setShowCreate, t }) {

  const stagePct = Math.round((statuses?.overall || 0));

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
    }}>
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', gap: 16, padding: '16px 16px 0' }}>

        {/* Left: Status panel */}
        <div style={{
          width: 200, flexShrink: 0,
          background: 'white',
          borderRadius: 20,
          padding: 20,
          boxShadow: '0 4px 20px rgba(244,114,182,0.1)',
          display: 'flex', flexDirection: 'column', gap: 14,
          overflow: 'auto',
        }}>
          <PetMiniCard pet={pet} stageLabel={stageLabel} t={t} />
          <OverallBar pct={stagePct} t={t} warning={warning} />
          <QuickActions handleMain={handleMain} handleSecondary={handleSecondary} t={t} />
        </div>

        {/* Right: Pet area */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '16px 20px',
            boxShadow: '0 4px 20px rgba(244,114,182,0.1)',
          }}>
            <StatusRow statuses={statuses} />
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <div className="v2-playground" style={{ minHeight: 300 }}>
              <SceneDecor />
              <div style={{ display:'flex', justifyContent:'center', transform:'translateY(0px)', position:'relative', zIndex:2 }}>
                <motion.div drag dragConstraints={{ left:-80, right:80, top:-40, bottom:40 }}
                  dragElastic={0.4} dragTransition={{ bounceStiffness:300, bounceDamping:18 }}
                  whileTap={{ scale:0.96 }}>
                  <DogCharacter stage={displayStatuses.avatarStage} reactKey={avatarTick}
                    wilted={warning} lastActionType={lastAction.type}
                    size={displayStatuses.avatarSize} draggable={false} />
                  <PetReactions lastAction={lastAction} statuses={statuses} />
                </motion.div>
              </div>
              <AchievementWatcher pet={pet} statuses={statuses} />
              <ActionRing onMain={handleMain} onSecondary={handleSecondary} />
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, marginBottom: 0, textAlign: 'center' }}>
                {t('pet.hint')}
              </p>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>{showCreate && <CreatePetModal key="create" onClose={() => setShowCreate(false)} />}</AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Desktop Layout (three-column Dashboard)
// ─────────────────────────────────────────────
function DesktopPetPage({ pet, statuses, displayStatuses, previewAge, handlePreviewAgeChange,
  handleMain, handleSecondary, warning, stageLabel, avatarTick, lastAction,
  showCreate, setShowCreate, t }) {

  const stagePct = Math.round((statuses?.overall || 0));

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)',
      overflow: 'hidden',
    }}>

      {/* ── Top Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 28px',
        borderBottom: '1px solid rgba(244,114,182,0.12)',
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 52, height: 52,
          background: 'linear-gradient(135deg, #f472b6, #fb7185)',
          borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, boxShadow: '0 4px 14px rgba(244,114,182,0.4)',
          flexShrink: 0,
        }}>🐕</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#9d174d' }}>{pet.name}</div>
          <div style={{ fontSize: 13, color: '#f472b6', fontWeight: 600 }}>
            {breedLabel(pet.breed, t)} · {stageLabel}
            {previewAge !== null && <span style={{ color: '#fb923c', marginLeft: 6 }}>（{t('pet.previewMode')}）</span>}
          </div>
        </div>
        <div style={{
          padding: '10px 20px', borderRadius: 100, background: 'white',
          border: '2px solid #fce7f3', color: '#be185d', fontWeight: 700, fontSize: 15,
          boxShadow: '0 2px 10px rgba(244,114,182,0.15)',
        }}>
          ❤️ {t('pet.healthIndex', { n: statuses.overall })}
          {warning && <span style={{ marginLeft: 8, color: '#ef4444', fontSize: 13 }}>⚠️ {t('pet.needsYou')}</span>}
        </div>
        <button
          onClick={() => {}}
          style={{ padding: '8px 16px', borderRadius: 12, border: '2px solid #fce7f3',
                   background: 'white', color: '#be185d', fontWeight: 700, fontSize: 13,
                   cursor: 'pointer', boxShadow: '0 2px 8px rgba(244,114,182,0.12)' }}
        >📋 AI 记录</button>
      </div>

      {/* ── Three-Column Body ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', gap: 0 }}>

        {/* ── Left Column: Stats & Quick Actions ── */}
        <div style={{
          width: 260, flexShrink: 0,
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(244,114,182,0.12)',
          padding: '20px 16px',
          display: 'flex', flexDirection: 'column', gap: 16,
          overflowY: 'auto',
        }}>
          <SectionCard title="今日状态" icon="📊">
            <StatusBarRow label="💧 水分" value={statuses?.hydration || 0} />
            <StatusBarRow label="🍖 饥饿" value={statuses?.appetite || 0} />
            <StatusBarRow label="😊 心情" value={statuses?.mood || 0} />
            <StatusBarRow label="💚 健康" value={statuses?.health || 0} />
            <StatusBarRow label="🐾 社交" value={statuses?.social || 0} />
            <div style={{ marginTop: 8 }}>
              <OverallBar pct={stagePct} t={t} warning={warning} />
            </div>
          </SectionCard>

          <SectionCard title="快捷操作" icon="⚡">
            <QuickActions handleMain={handleMain} handleSecondary={handleSecondary} t={t} vertical />
          </SectionCard>

          <SectionCard title="今日待办" icon="📝">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['喂食', '喝水', '遛弯', '互动'].map((item, i) => (
                <div key={item} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 10,
                  background: i % 2 === 0 ? '#fdf2f8' : 'white',
                  fontSize: 13, color: '#9d174d', fontWeight: 600,
                }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%',
                                background: '#f472b6', display: 'inline-block', flexShrink: 0 }} />
                  {item}
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#f472b6' }}>点击记录</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ── Center Column: Pet Visual ── */}
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column',
          padding: '16px 20px',
          gap: 12, overflow: 'auto',
          alignItems: 'center',
        }}>
          {/* Age preview */}
          <div style={{ width: '100%', maxWidth: 500 }}>
            <AgePreviewBar
              previewAge={previewAge !== null ? previewAge : (pet?.birthday
                ? (Date.now() - new Date(pet.birthday).getTime()) / (1000 * 60 * 60 * 24 * 365)
                : 2)}
              onChange={handlePreviewAgeChange}
              disabled={false}
            />
          </div>

          {/* Playground */}
          <div style={{
            width: '100%', maxWidth: 520,
            flex: 1, minHeight: 0,
            background: 'linear-gradient(180deg, #fef3ec 0%, #fde4d3 55%, #e8c59a 55%, #d4a574 100%)',
            borderRadius: 24,
            border: '1px solid #fce7f3',
            boxShadow: '0 8px 32px rgba(244,114,182,0.15)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(24px, 4vh, 48px) clamp(20px, 4vw, 32px)',
            gap: 12,
            position: 'relative',
            overflow: 'visible',
          }}>
            <SceneDecor />
            <StatusRow statuses={statuses} />
            <div style={{ display:'flex', justifyContent:'center', transform:'translateY(0px)', position:'relative', zIndex:2 }}>
              <motion.div drag dragConstraints={{ left:-100, right:100, top:-60, bottom:60 }}
                dragElastic={0.4} dragTransition={{ bounceStiffness:300, bounceDamping:18 }}
                whileTap={{ scale:0.96 }}>
                <DogCharacter stage={displayStatuses.avatarStage} reactKey={avatarTick}
                  wilted={warning} lastActionType={lastAction.type}
                  size={Math.min(displayStatuses.avatarSize * 1.2, 200)}
                  draggable={false} />
                <PetReactions lastAction={lastAction} statuses={statuses} />
              </motion.div>
            </div>
            <AchievementWatcher pet={pet} statuses={statuses} />
            <ActionRing onMain={handleMain} onSecondary={handleSecondary} />
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, marginBottom: 0, textAlign: 'center' }}>
              {t('pet.hint')}
            </p>
          </div>
        </div>

        {/* ── Right Column: Tasks & Social ── */}
        <div style={{
          width: 280, flexShrink: 0,
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(16px)',
          borderLeft: '1px solid rgba(244,114,182,0.12)',
          padding: '20px 16px',
          display: 'flex', flexDirection: 'column', gap: 16,
          overflowY: 'auto',
        }}>
          <SectionCard title="成长进度" icon="🏆">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ProgressBar label="总体成长" pct={stagePct} color="#f472b6" />
              <ProgressBar label="今日活跃" pct={72} color="#fb923c" />
              <ProgressBar label="健康指数" pct={Math.round((statuses?.health || 0))} color="#34d399" />
            </div>
            <div style={{
              marginTop: 12, padding: '10px 12px', borderRadius: 12,
              background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
              fontSize: 12, color: '#9d174d', lineHeight: 1.6,
              border: '1px solid #fce7f3',
            }}>
              🌟 距离下次升级还需 320 成长值
            </div>
          </SectionCard>

          <SectionCard title="今日任务" icon="📋">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '🍖', text: '喂食 GG Bond', done: true },
                { icon: '💧', text: '补充水分', done: true },
                { icon: '🚶', text: '遛弯 2 次', done: false },
                { icon: '🤝', text: '互动 3 次', done: false },
              ].map(task => (
                <div key={task.text} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 10,
                  background: task.done ? 'rgba(52,211,153,0.1)' : 'white',
                  border: `1px solid ${task.done ? 'rgba(52,211,153,0.3)' : '#fce7f3'}`,
                  fontSize: 13, color: task.done ? '#059669' : '#9d174d',
                  fontWeight: 600, textDecoration: task.done ? 'none' : 'none',
                }}>
                  <span>{task.icon}</span>
                  <span style={{ flex: 1 }}>{task.text}</span>
                  {task.done
                    ? <span style={{ color: '#34d399', fontSize: 14 }}>✓</span>
                    : <span style={{ width: 16, height: 16, borderRadius: '50%',
                                    border: '2px solid #f472b6', display: 'inline-block' }} />}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="道具背包" icon="🎒">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['🍖', '🦴', '🎾', '🧸', '🛁'].map((e, i) => (
                <div key={i} style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: i === 0 ? '#fef3c7' : 'white',
                  border: `1px solid ${i === 0 ? '#fbbf24' : '#fce7f3'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(244,114,182,0.1)',
                }}>{e}</div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="AI 健康建议" icon="🤖">
            <div style={{
              padding: '10px 12px', borderRadius: 12,
              background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
              fontSize: 12.5, color: '#9d174d', lineHeight: 1.7,
              border: '1px solid #fce7f3',
            }}>
              💡 {warning
                ? 'GG Bond 健康指数偏低！建议增加互动频率并关注饮食。'
                : 'GG Bond 状态良好！坚持每日照顾，成长更顺利～'}
            </div>
          </SectionCard>

          <SectionCard title="最近动态" icon="🕐">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { time: '10 分钟前', text: '完成遛弯活动' },
                { time: '1 小时前', text: '吃了美味的狗粮' },
                { time: '今天', text: '喝了 3 次水' },
              ].map((e, i) => (
                <div key={i} style={{ fontSize: 12, color: '#9ca3af', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#f472b6', fontWeight: 600, flexShrink: 0 }}>{e.time}</span>
                  <span style={{ color: '#6b7280' }}>{e.text}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && <CreatePetModal key="create" onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────
function SectionCard({ title, icon, children }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '14px',
      boxShadow: '0 2px 12px rgba(244,114,182,0.08)',
      border: '1px solid rgba(244,114,182,0.08)',
    }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: '#9d174d', marginBottom: 10,
                    display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{icon}</span> {title}
      </div>
      {children}
    </div>
  );
}

function StatusBarRow({ label, value }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  const color = pct > 60 ? '#34d399' : pct > 30 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, color: '#9d174d', fontWeight: 700 }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 6, background: '#fce7f3', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 100,
                      transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

function OverallBar({ pct, t, warning }) {
  const color = pct > 60 ? '#34d399' : pct > 30 ? '#fbbf24' : '#f87171';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#9d174d' }}>{t('pet.healthIndex', { n: pct })}</span>
        {warning && <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700 }}>⚠️ {t('pet.needsYou')}</span>}
      </div>
      <div style={{ height: 8, background: '#fce7f3', borderRadius: 100, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${color}, ${color}dd)`, borderRadius: 100 }}
        />
      </div>
    </div>
  );
}

function ProgressBar({ label, pct, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
        <span style={{ fontSize: 12, color: '#9d174d', fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: '#fce7f3', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 100 }} />
      </div>
    </div>
  );
}

const QUICK_ACTIONS = [
  { icon: '🍖', label: '喂食', type: 'feed', key: 'feed' },
  { icon: '💧', label: '喝水', type: 'water', key: 'water' },
  { icon: '🛁', label: '洗澡', type: 'bath', key: 'bath' },
  { icon: '🚶', label: '遛弯', type: 'walk', key: 'walk' },
];

function QuickActions({ handleMain, handleSecondary, t, vertical = false }) {
  const btn = (action, label, icon) => ({
    onClick: () => action(),
    style: {
      flex: 1, minWidth: 0,
      padding: '10px 6px', borderRadius: 12, border: 'none',
      background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
      color: '#be185d', fontWeight: 700, fontSize: 12,
      cursor: 'pointer', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 4,
      boxShadow: '0 2px 8px rgba(244,114,182,0.1)',
      transition: 'transform 0.15s, box-shadow 0.15s',
    },
  });
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6,
      flexDirection: vertical ? 'column' : 'row',
    }}>
      {QUICK_ACTIONS.map(({ icon, label, type, key }) => (
        <motion.button
          key={key}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => type === 'feed' || type === 'water'
            ? handleMain(type, label)
            : handleSecondary(type, label)}
          style={{
            flex: 1, minWidth: 0,
            padding: '10px 6px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
            color: '#be185d', fontWeight: 700, fontSize: 12,
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4,
            boxShadow: '0 2px 8px rgba(244,114,182,0.1)',
          }}
        >
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span>{label}</span>
        </motion.button>
      ))}
    </div>
  );
}

function PetMiniCard({ pet, stageLabel, t }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
      borderRadius: 14, padding: '12px',
      display: 'flex', alignItems: 'center', gap: 10,
      border: '1px solid #fce7f3',
    }}>
      <div style={{
        width: 44, height: 44, background: 'linear-gradient(135deg, #f472b6, #fb7185)',
        borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0, boxShadow: '0 3px 8px rgba(244,114,182,0.3)',
      }}>🐕</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#9d174d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pet.name}</div>
        <div style={{ fontSize: 11, color: '#f472b6', fontWeight: 600 }}>{stageLabel}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main PetPageV2
// ─────────────────────────────────────────────
export default function PetPageV2() {
  const { pet, logActivity, setPetLocal } = usePet();
  const statuses = useMemo(() => computeStatusesV2(pet), [pet]);
  const { t } = useI18n();
  const nav = useNavigate();
  const screenWidth = useScreenSize();

  const [previewAge, setPreviewAge] = useState(null);
  const previewStatuses = useMemo(() => {
    if (previewAge === null) return null;
    return computePreviewStatuses(pet, previewAge);
  }, [pet, previewAge]);
  const displayStatuses = previewStatuses || statuses;

  const handlePreviewAgeChange = useCallback((years) => setPreviewAge(years), []);
  const clearPreview = useCallback(() => setPreviewAge(null), []);

  const [showCreate, setShowCreate] = useState(false);
  const [avatarTick, setAvatarTick] = useState(0);
  const [lastAction, setLastAction] = useState({ type: null, tick: 0 });

  const writeActivity = useCallback((type, minutesAgo = 0) => {
    const tsDate = minutesAgo === 0 ? new Date() : new Date(Date.now() - minutesAgo * 60000);
    const ts = { toDate: () => tsDate };
    logActivity(type)?.catch(() => {});
    const prev = pet?.lastActivity?.[type];
    const prevArr = !prev ? [] : Array.isArray(prev) ? prev : [prev];
    const nextArr = [...prevArr, ts].slice(-5);
    setPetLocal({ ...(pet || {}), lastActivity: { ...(pet?.lastActivity || {}), [type]: nextArr } });
    setAvatarTick(prev => prev + 1);
    setLastAction({ type, tick: Date.now() });
  }, [pet, logActivity, setPetLocal]);

  const handleMain = useCallback((type, label, minutesAgo = 0) => {
    writeActivity(type, minutesAgo);
    toast.success(minutesAgo ? t('pet.toast.loggedAgo', { label, n: minutesAgo }) : t('pet.toast.logged', { label }));
    offerAiFollowUp(nav, t, label);
  }, [writeActivity, t, nav]);

  const handleSecondary = useCallback((type, label) => {
    writeActivity(type);
    toast.success(t('pet.toast.logged', { label }));
    offerAiFollowUp(nav, t, label);
  }, [writeActivity, t, nav]);

  if (!pet) {
    return (
      <>
        <GlobalStyles />
        <div style={emptyBgStyle}>
          <motion.div style={{ fontSize: 96, marginBottom: 16 }}
            animate={{ y: [0, -14, 0], rotate: [0, -4, 4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>🐾</motion.div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#9d174d', marginBottom: 8 }}>{t('pet.empty.heading')}</h1>
          <p style={{ color: '#f472b6', fontSize: 14, marginBottom: 40, textAlign: 'center', lineHeight: 1.8 }}>
            {t('pet.empty.line1')}<br />{t('pet.empty.line2')}
          </p>
          <motion.button onClick={() => setShowCreate(true)}
            style={{ ...btnPrimary, flex: 'none', padding: '16px 40px', fontSize: 16 }}
            whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
            {t('pet.empty.cta')}
          </motion.button>
        </div>
        <AnimatePresence>{showCreate && <CreatePetModal key="create" onClose={() => setShowCreate(false)} />}</AnimatePresence>
      </>
    );
  }

  const warning = Object.entries(STATUS_META).some(([k]) => statuses[k] < 40);
  const stageLabel = t('pet.stage.' + (displayStatuses.avatarStage || 'adult'));

  // Responsive layout
  if (screenWidth >= 1024) {
    return (
      <DesktopPetPage
        pet={pet} statuses={statuses} displayStatuses={displayStatuses}
        previewAge={previewAge} handlePreviewAgeChange={handlePreviewAgeChange}
        handleMain={handleMain} handleSecondary={handleSecondary}
        warning={warning} stageLabel={stageLabel}
        avatarTick={avatarTick} lastAction={lastAction}
        showCreate={showCreate} setShowCreate={setShowCreate} t={t}
      />
    );
  }

  if (screenWidth >= 640) {
    return (
      <TabletPetPage
        pet={pet} statuses={statuses} displayStatuses={displayStatuses}
        previewAge={previewAge} handlePreviewAgeChange={handlePreviewAgeChange}
        handleMain={handleMain} handleSecondary={handleSecondary}
        warning={warning} stageLabel={stageLabel}
        avatarTick={avatarTick} lastAction={lastAction}
        showCreate={showCreate} setShowCreate={setShowCreate} t={t}
      />
    );
  }

  return (
    <MobilePetPage
      pet={pet} statuses={statuses} displayStatuses={displayStatuses}
      previewAge={previewAge} handlePreviewAgeChange={handlePreviewAgeChange}
      clearPreview={clearPreview}
      handleMain={handleMain} handleSecondary={handleSecondary}
      warning={warning} stageLabel={stageLabel}
      avatarTick={avatarTick} lastAction={lastAction}
      showCreate={showCreate} setShowCreate={setShowCreate} t={t}
    />
  );
}

const btnPrimary = {
  flex: 1, padding: '12px', borderRadius: 16, border: 'none',
  background: 'linear-gradient(135deg,#f472b6,#fb7185)', color: 'white',
  fontWeight: 700, cursor: 'pointer', fontSize: 14,
  boxShadow: '0 4px 15px rgba(244,114,182,0.4)',
};

const emptyBgStyle = {
  minHeight: '100vh', background: 'linear-gradient(160deg,#fdf2f8,#fce7f3)',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', padding: 32, position: 'relative',
};

function GlobalStyles() {
  return (
    <style>{`
      .v2-topbar {
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 16px; flex-wrap: wrap; gap: 8px; flex-shrink: 0;
      }
      @media (min-width: 900px) {
        .v2-topbar { padding: 16px 48px; }
      }
      .v2-stage {
        flex: 1; min-height: 0; display: flex; flex-direction: column;
        gap: 12px; padding: 0 12px 12px;
        overflow-y: auto; overflow-x: hidden;
      }
      @media (min-width: 900px) {
        .v2-stage { padding: 0 48px 24px; gap: 16px; }
      }
      .v2-playground {
        flex: 1; min-height: 0; position: relative;
        background: linear-gradient(180deg, #fef3ec 0%, #fde4d3 55%, #e8c59a 55%, #d4a574 100%);
        border-radius: 24px;
        padding: clamp(20px, 4vh, 40px) clamp(16px, 4vw, 24px);
        border: 1px solid #fce7f3;
        box-shadow: 0 4px 20px rgba(244,114,182,0.08);
        overflow: visible; display: flex; flex-direction: column;
        align-items: center; justify-content: space-evenly;
      }
    `}</style>
  );
}
