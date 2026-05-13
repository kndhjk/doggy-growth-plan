import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { RewardsAPI } from '../services/apiLayer';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../context/AuthContext';


// REWARDS data — display text resolved via i18n by type
const REWARDS = [
  { day: 1, emoji: '🪙', type: 'coin',       count: 10 },
  { day: 2, emoji: '🍖', type: 'food',        count: 3  },
  { day: 3, emoji: '🎁', type: 'smallGift',   count: 2  },
  { day: 4, emoji: '🪙', type: 'coin',        count: 25 },
  { day: 5, emoji: '💊', type: 'vitamin',     count: 1  },
  { day: 6, emoji: '🪙', type: 'coin',        count: 40 },
  { day: 7, emoji: '🎁', type: 'bigGift',     count: 5  },
];

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.6,
    color: ['#f472b6', '#fb7185', '#facc15', '#4ade80', '#60a5fa', '#c084fc'][i % 6],
    size: 8 + Math.random() * 8,
  }));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }}>
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ top: -20, left: `${p.x}%`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ top: '110%', opacity: 0, rotate: 360 * (Math.random() > 0.5 ? 1 : -1), scale: 0.5 }}
          transition={{ duration: 1.8, delay: p.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : 2,
          }}
        />
      ))}
    </div>
  );
}

// Resolve reward item display label from i18n by type
function rewardItemLabel(t, type, count) {
  switch (type) {
    case 'coin':       return t('rewards.item.coin',       { n: count });
    case 'food':       return t('rewards.item.food',         { n: count });
    case 'smallGift':  return t('rewards.item.smallGift');
    case 'bigGift':    return t('rewards.item.bigGift');
    case 'vitamin':    return t('rewards.item.vitamin');
    case 'randomItems':return t('rewards.item.randomItems',  { n: count });
    default:           return type;
  }
}

export default function DailyRewardsPage() {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const [state, setState] = useState({ lastClaimDate: null, streak: 0, todayClaimed: false, cycleDay: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimingDay, setClaimingDay] = useState(null);

  const today = getToday();

  useEffect(() => {
    if (!currentUser?.uid) return;
    RewardsAPI.get(currentUser.uid).then(apiData => {
      const s = {
        lastClaimDate: apiData?.lastClaimDate || null,
        streak: apiData?.streak || 0,
        todayClaimed: !!apiData?.todayClaimed,
        cycleDay: apiData?.cycleDay || 0,
      };
      setState(s);
    });
  }, [currentUser?.uid]);

  const handleClaim = useCallback((day) => {
    if (state.claimedToday) return;
    if (day !== state.streak + 1) return;

    setClaimingDay(day);
    setShowConfetti(true);

    setTimeout(() => {
      const newStreak = state.streak + 1;
      const isLast = newStreak === 7;
      const newState = {
        lastClaimDate: today,
        streak: isLast ? 0 : newStreak,
        claimedToday: true,
      };
      setState(newState);
      setClaimingDay(null);
      if (currentUser?.uid) RewardsAPI.claim(currentUser.uid).catch(() => {});

      const reward = REWARDS[day - 1];
      const label = rewardItemLabel(t, reward.type, reward.count);
      toast.success(t('rewards.toast.success', { item: `${reward.emoji} ${label}` }), { duration: 4000 });

      setTimeout(() => setShowConfetti(false), 2000);
    }, 1200);
  }, [state, today, t]);

  const { lastClaimDate, streak, claimedToday } = state;

  // Last 7-day calendar
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = dateStr === today;
    const isPast = dateStr < today;
    const isClaimed = isPast && !!lastClaimDate && dateStr <= lastClaimDate;
    days.push({ date: dateStr, isToday, isPast, isClaimed, dayLabel: d.getDate() });
  }

  const dowLabels = [
    t('common.daySun'), t('common.dayMon'), t('common.dayTue'),
    t('common.dayWed'), t('common.dayThu'), t('common.dayFri'), t('common.daySat'),
  ];

  return (
    <div style={{
      minHeight: '100%',
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f9a8d4 100%)',
      fontFamily: "-apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif",
      padding: '24px 16px 80px',
    }}>
      {showConfetti && <Confetti />}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: 28 }}
      >
        <div style={{ fontSize: 40, marginBottom: 6 }}>🎁</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#9d174d', margin: '0 0 4px' }}>
          {t('rewards.heading')}
        </h1>
        <p style={{ fontSize: 15, color: '#db2777', margin: 0 }}>
          {t('rewards.title')}
        </p>
      </motion.div>

      {/* Streak Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'rgba(255,255,255,0.85)',
          borderRadius: 20,
          padding: '20px 24px',
          marginBottom: 20,
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(244,114,182,0.15)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(244,114,182,0.2)',
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 900, color: '#be185d', lineHeight: 1 }}>
          {streak}<span style={{ fontSize: 28 }}> 🔥</span>
        </div>
        <div style={{ fontSize: 18, color: '#ec4899', fontWeight: 600, marginTop: 4 }}>
          {t('rewards.streak', { n: streak })}
        </div>
        {claimedToday && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ marginTop: 10, color: '#16a34a', fontWeight: 700, fontSize: 15 }}
          >
            ✅ {t('rewards.claimed')}
          </motion.div>
        )}
      </motion.div>

      {/* 7-day calendar */}
      <div style={{
        background: 'rgba(255,255,255,0.8)',
        borderRadius: 20,
        padding: '16px 12px',
        marginBottom: 20,
        boxShadow: '0 2px 12px rgba(244,114,182,0.1)',
        border: '1px solid rgba(244,114,182,0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {days.map((d) => {
            const dow = new Date(d.date).getDay();
            return (
              <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{dowLabels[dow]}</div>
                <motion.div
                  animate={d.isToday && !claimedToday ? {
                    boxShadow: ['0 0 0 0 rgba(244,114,182,0.4)', '0 0 0 10px rgba(244,114,182,0)', '0 0 0 0 rgba(244,114,182,0.4)'],
                  } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    width: 36, height: 36,
                    borderRadius: '50%',
                    background: d.isToday
                      ? (claimedToday ? '#d1fae5' : 'linear-gradient(135deg, #f472b6, #fb7185)')
                      : d.isClaimed ? '#d1fae5' : '#f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: d.isToday ? '#fff' : d.isClaimed ? '#16a34a' : '#9ca3af',
                  }}
                >
                  {d.isClaimed ? '✓' : d.dayLabel}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reward List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {REWARDS.map((reward) => {
          const dayNum = reward.day;
          const isReachable = dayNum <= streak + 1 && !claimedToday;
          const isClaimed = dayNum <= streak && claimedToday;
          const isToday = dayNum === streak + 1 && !claimedToday;
          const isFuture = dayNum > streak + 1;
          const itemLabel = rewardItemLabel(t, reward.type, reward.count);

          return (
            <motion.div
              key={dayNum}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (dayNum - 1) * 0.06 }}
              style={{
                background: isFuture
                  ? 'rgba(255,255,255,0.45)'
                  : isClaimed
                  ? 'rgba(209,250,229,0.7)'
                  : isToday
                  ? 'rgba(255,255,255,0.9)'
                  : 'rgba(255,255,255,0.75)',
                borderRadius: 16,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                boxShadow: isToday ? '0 4px 20px rgba(244,114,182,0.3)' : '0 2px 8px rgba(244,114,182,0.08)',
                border: isToday
                  ? '2px solid #f472b6'
                  : isClaimed
                  ? '1px solid #86efac'
                  : '1px solid rgba(244,114,182,0.12)',
                opacity: isFuture ? 0.5 : 1,
              }}
            >
              {/* Day badge */}
              <div style={{
                width: 44, height: 44,
                borderRadius: 12,
                background: isFuture
                  ? '#e5e7eb'
                  : isClaimed
                  ? '#16a34a'
                  : 'linear-gradient(135deg, #f472b6, #fb7185)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {isFuture ? (
                  <span style={{ fontSize: 16 }}>🔒</span>
                ) : isClaimed ? (
                  <span style={{ fontSize: 20, color: '#fff' }}>✓</span>
                ) : (
                  <>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 700, lineHeight: 1 }}>{t('common.day')}</span>
                    <span style={{ fontSize: 16, color: '#fff', fontWeight: 900, lineHeight: 1.2 }}>{dayNum}</span>
                  </>
                )}
              </div>

              {/* Reward info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#9d174d' }}>
                  {reward.emoji} {itemLabel}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  {t('rewards.day', { n: dayNum })}
                </div>
              </div>

              {/* Action */}
              {isFuture ? (
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{t('rewards.unlocked')}</span>
              ) : isClaimed ? (
                <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 13 }}>
                  {t('rewards.received.days', { n: streak })}
                </span>
              ) : isToday ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleClaim(dayNum)}
                  disabled={claimingDay !== null}
                  style={{
                    background: 'linear-gradient(135deg, #f472b6, #fb7185)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    padding: '8px 20px',
                    cursor: claimingDay !== null ? 'wait' : 'pointer',
                    boxShadow: '0 4px 14px rgba(244,114,182,0.4)',
                  }}
                >
                  {claimingDay === dayNum ? t('common.loading') : t('rewards.claimNow')}
                </motion.button>
              ) : (
                <span style={{ color: '#d1d5db', fontSize: 13 }}>—</span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Note */}
      <p style={{ textAlign: 'center', color: '#f9a8d4', fontSize: 12, marginTop: 24 }}>
        {t('rewards.sevenDayNote')}
      </p>
    </div>
  );
}
