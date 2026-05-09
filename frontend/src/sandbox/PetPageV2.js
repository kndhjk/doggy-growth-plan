import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePet } from '../context/PetContext';
import { computeStatusesV2, STATUS_META } from './statusDecayV2';
import { useI18n } from '../i18n/I18nContext';
import { breedLabel } from '../data/breeds';
import toast from 'react-hot-toast';
import SceneDecor     from '../components/Pet/SceneDecor';
import DogCharacter   from '../components/Pet/DogCharacter';
import StatusRow      from '../components/Pet/StatusRow';
import ActionRing     from '../components/Pet/ActionRing';
import CreatePetModal from '../components/Pet/CreatePetModal';
import PetReactions   from '../components/Pet/PetReactions';
import AchievementWatcher from '../components/Pet/AchievementWatcher';
import AgePreviewBar  from '../components/Pet/AgePreviewBar';

// ─────────────────────────────────────────────
// Hijack computeStatusesV2 for preview age
// ─────────────────────────────────────────────
function computePreviewStatuses(pet, previewYears) {
  // Build a fake pet object with a synthetic birthday that corresponds to previewYears
  const now = Date.now();
  const syntheticBirthday = new Date(now - previewYears * 365 * 24 * 60 * 60 * 1000);
  return computeStatusesV2({ ...pet, birthday: syntheticBirthday.toISOString() });
}

export default function PetPageV2() {
  const { pet, logActivity, setPetLocal } = usePet();
  const statuses = useMemo(() => computeStatusesV2(pet), [pet]);
  const { t } = useI18n();
  const nav = useNavigate();

  // ── Age preview state ──
  // null = show real age; number = preview age in years
  const [previewAge, setPreviewAge] = useState(null);

  // Derive preview statuses when previewAge is set
  const previewStatuses = useMemo(() => {
    if (previewAge === null) return null;
    return computePreviewStatuses(pet, previewAge);
  }, [pet, previewAge]);

  // Which statuses to drive the dog display (preview vs real)
  const displayStatuses = previewStatuses || statuses;

  const handlePreviewAgeChange = useCallback((years) => {
    setPreviewAge(years);
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewAge(null);
  }, []);

  // Fire a follow-up "Ask AI" toast after a successful activity log so the
  // AI advisor is embedded into the feeding/health workflow (proposal §4.1
  // M5 wording: "embedded into feeding and health logging workflows").
  const offerAiFollowUp = (label) => {
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
  };

  const [showCreate, setShowCreate] = useState(false);
  const [avatarTick, setAvatarTick] = useState(0);
  const [lastAction, setLastAction] = useState({ type: null, tick: 0 });

  const writeActivity = (type, minutesAgo = 0) => {
    const tsDate = minutesAgo === 0
      ? new Date()
      : new Date(Date.now() - minutesAgo * 60000);
    const ts = { toDate: () => tsDate };

    logActivity(type)?.catch(() => {});

    const prev = pet?.lastActivity?.[type];
    const prevArr = !prev ? [] : Array.isArray(prev) ? prev : [prev];
    const nextArr = [...prevArr, ts].slice(-5);

    setPetLocal({
      ...(pet || {}),
      lastActivity: { ...(pet?.lastActivity || {}), [type]: nextArr },
    });

    setAvatarTick(prev => prev + 1);
    setLastAction({ type, tick: Date.now() });
  };

  const handleMain = (type, label, minutesAgo = 0) => {
    writeActivity(type, minutesAgo);
    toast.success(minutesAgo
      ? t('pet.toast.loggedAgo', { label, n: minutesAgo })
      : t('pet.toast.logged',    { label }));
    offerAiFollowUp(label);
  };

  const handleSecondary = (type, label) => {
    writeActivity(type);
    toast.success(t('pet.toast.logged', { label }));
    offerAiFollowUp(label);
  };

  if (!pet) {
    return (
      <>
        <GlobalStyles />
        <div style={emptyBgStyle}>
          <motion.div
            style={{ fontSize: 96, marginBottom: 16 }}
            animate={{ y: [0, -14, 0], rotate: [0, -4, 4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >🐾</motion.div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#9d174d', marginBottom: 8 }}>
            {t('pet.empty.heading')}
          </h1>
          <p style={{ color: '#f472b6', fontSize: 14, marginBottom: 40, textAlign: 'center', lineHeight: 1.8 }}>
            {t('pet.empty.line1')}<br />{t('pet.empty.line2')}
          </p>
          <motion.button
            onClick={() => setShowCreate(true)}
            style={{ ...btnPrimary, flex: 'none', padding: '16px 40px', fontSize: 16 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          >
            {t('pet.empty.cta')}
          </motion.button>
        </div>
        <AnimatePresence>
          {showCreate && <CreatePetModal key="create" onClose={() => setShowCreate(false)} />}
        </AnimatePresence>
      </>
    );
  }

  const warning = Object.entries(STATUS_META).some(([k]) => statuses[k] < 40);
  const stageLabel = t('pet.stage.' + (displayStatuses.avatarStage || 'adult'));

  return (
    <>
      <GlobalStyles />
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

        {/* ── Age Preview Bar ── */}
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
      </div>

      <AnimatePresence>
        {showCreate && <CreatePetModal key="create" onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </>
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
