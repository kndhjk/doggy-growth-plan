import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePet } from '../context/PetContext';
import { computeStatusesV2, STATUS_META } from './statusDecayV2';
import toast from 'react-hot-toast';
import SceneDecor     from '../components/Pet/SceneDecor';
import DogCharacter   from '../components/Pet/DogCharacter';
import StatusRow      from '../components/Pet/StatusRow';
import ActionRing     from '../components/Pet/ActionRing';
import CreatePetModal from '../components/Pet/CreatePetModal';

export default function PetPageV2() {
  const { pet, logActivity, setPetLocal } = usePet();
  const statuses = useMemo(() => computeStatusesV2(pet), [pet]);

  const [showCreate, setShowCreate] = useState(false);
  const [avatarTick, setAvatarTick] = useState(0);

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

    setAvatarTick(t => t + 1);
  };

  const handleMain = (type, label, minutesAgo = 0) => {
    writeActivity(type, minutesAgo);
    toast.success(`${label} 记录成功 ✨${minutesAgo ? `（${minutesAgo} 分钟前）` : ''}`);
  };

  const handleSecondary = (type, label) => {
    writeActivity(type);
    toast.success(`${label} 记录成功 ✨`);
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
            还没有毛孩子
          </h1>
          <p style={{ color: '#f472b6', fontSize: 14, marginBottom: 40, textAlign: 'center', lineHeight: 1.8 }}>
            快来创建你的第一个数字宝贝吧！<br />记录每天的点点滴滴 💕
          </p>
          <motion.button
            onClick={() => setShowCreate(true)}
            style={{ ...btnPrimary, flex: 'none', padding: '16px 40px', fontSize: 16 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          >
            🐶 创建宠物档案
          </motion.button>
        </div>
        <AnimatePresence>
          {showCreate && <CreatePetModal key="create" onClose={() => setShowCreate(false)} />}
        </AnimatePresence>
      </>
    );
  }

  const warning = Object.entries(STATUS_META).some(([k]) => statuses[k] < 40);
  const stageLabel = statuses.avatarStage === 'puppy' ? '小宝宝 🍼' :
                     statuses.avatarStage === 'senior' ? '老宝贝 👴' : '青春活力 ✨';

  return (
    <>
      <GlobalStyles />
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top,#fff0f6 0%,#fdf2f8 50%,#fbcfe8 100%)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div className="v2-topbar">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#9d174d', margin: 0 }}>{pet.name}</h1>
            <p style={{ color: '#f472b6', fontSize: 13, margin: '2px 0 0' }}>{pet.breed} · {stageLabel}</p>
          </div>
          <div style={{
            padding: '10px 18px', borderRadius: 100, background: 'white',
            border: '2px solid #fce7f3', color: '#be185d', fontWeight: 700, fontSize: 14,
            boxShadow: '0 2px 10px rgba(244,114,182,0.15)', whiteSpace: 'nowrap',
          }}>
            ❤️ 健康指数 {statuses.overall}%
            {warning && <span style={{ marginLeft: 6 }}>· 宝贝需要你 🥺</span>}
          </div>
        </div>

        <div className="v2-stage">
          <div className="v2-playground">
            <SceneDecor />
            <StatusRow statuses={statuses} />
            <div className="v2-dog-wrap">
              <DogCharacter
                stage={statuses.avatarStage}
                reactKey={avatarTick}
                wilted={warning}
                size={220}
                draggable
              />
            </div>
            <ActionRing onMain={handleMain} onSecondary={handleSecondary} />
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 14, textAlign: 'center', position: 'relative', zIndex: 3 }}>
              💡 单击记录 · 长按选时间 · "+" 展开更多
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
        padding: 20px 24px; flex-wrap: wrap; gap: 12px;
      }
      @media (min-width: 900px) {
        .v2-topbar { padding: 24px 48px; }
      }
      .v2-stage {
        flex: 1; display: flex; flex-direction: column;
        gap: 16px; padding: 0 16px 24px;
      }
      @media (min-width: 900px) {
        .v2-stage { padding: 0 48px 48px; gap: 20px; }
      }
      .v2-playground {
        flex: 1; position: relative;
        background: linear-gradient(180deg, #fef3ec 0%, #fde4d3 55%, #e8c59a 55%, #d4a574 100%);
        border-radius: 24px; padding: 32px 24px 32px;
        border: 1px solid #fce7f3;
        box-shadow: 0 4px 20px rgba(244,114,182,0.08);
        overflow: hidden; display: flex; flex-direction: column;
        align-items: center; justify-content: flex-start;
        min-height: 620px;
      }
    `}</style>
  );
}