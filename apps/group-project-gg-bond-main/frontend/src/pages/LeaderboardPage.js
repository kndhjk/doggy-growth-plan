import React, { useState, useRef, useEffect } from 'react';
import { LeaderboardAPI } from '../services/apiLayer';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../i18n/I18nContext';
import { translateContent } from '../utils/translate';
import { isMobile } from '../utils/responsive';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_RANKINGS = [
  { rank: 1,  petName: '毛毛',   owner: '张*',    level: 45, happiness: 98, activity: 312, badge: '🥇', joinedAt: '2025-01-10', avatar: '🐕' },
  { rank: 2,  petName: '豆豆',   owner: '李*',    level: 42, happiness: 95, activity: 287, badge: '🥈', joinedAt: '2025-02-03', avatar: '🐶' },
  { rank: 3,  petName: '雪球',   owner: '王*',    level: 40, happiness: 99, activity: 265, badge: '🥉', joinedAt: '2025-01-22', avatar: '🐩' },
  { rank: 4,  petName: '旺财',   owner: '赵*',    level: 38, happiness: 90, activity: 241, badge: '',   joinedAt: '2025-03-05', avatar: '🦮' },
  { rank: 5,  petName: '小白',   owner: '钱*',    level: 37, happiness: 88, activity: 220, badge: '',   joinedAt: '2025-03-12', avatar: '🐕🦺' },
  { rank: 6,  petName: '阿福',   owner: '孙*',    level: 36, happiness: 92, activity: 205, badge: '',   joinedAt: '2025-04-01', avatar: '🐶' },
  { rank: 7,  petName: '花花',   owner: '周*',    level: 35, happiness: 85, activity: 198, badge: '',   joinedAt: '2025-04-15', avatar: '🐾' },
  { rank: 8,  petName: '贝贝',   owner: '吴*',    level: 34, happiness: 91, activity: 185, badge: '',   joinedAt: '2025-04-20', avatar: '🐕' },
  { rank: 9,  petName: '球球',   owner: '郑*',    level: 33, happiness: 87, activity: 176, badge: '',   joinedAt: '2025-05-01', avatar: '🐩' },
  { rank: 10, petName: '巧巧',   owner: '冯*',    level: 32, happiness: 89, activity: 162, badge: '',   joinedAt: '2025-05-10', avatar: '🐶' },
  { rank: 11, petName: '朵朵',   owner: '陈*',    level: 31, happiness: 86, activity: 155, badge: '',   joinedAt: '2025-05-18', avatar: '🐾' },
  { rank: 12, petName: '嘟嘟',   owner: '楚*',    level: 30, happiness: 83, activity: 148, badge: '',   joinedAt: '2025-05-25', avatar: '🐕' },
  { rank: 13, petName: '棉花',   owner: '卫*',    level: 29, happiness: 88, activity: 140, badge: '',   joinedAt: '2025-06-01', avatar: '🐕🦺' },
  { rank: 14, petName: '果冻',   owner: '蒋*',    level: 28, happiness: 84, activity: 132, badge: '',   joinedAt: '2025-06-08', avatar: '🐶' },
  { rank: 15, petName: '奶茶',   owner: '沈*',    level: 27, happiness: 82, activity: 125, badge: '',   joinedAt: '2025-06-15', avatar: '🐩' },
  { rank: 16, petName: '小熊',   owner: '韩*',    level: 26, happiness: 80, activity: 118, badge: '',   joinedAt: '2025-06-22', avatar: '🐾' },
  { rank: 17, petName: '小鹿',   owner: '杨*',    level: 25, happiness: 79, activity: 110, badge: '',   joinedAt: '2025-07-01', avatar: '🐕' },
  { rank: 18, petName: '米粒',   owner: '朱*',    level: 24, happiness: 77, activity: 102, badge: '',   joinedAt: '2025-07-08', avatar: '🐶' },
  { rank: 19, petName: '豆奶',   owner: '秦*',    level: 23, happiness: 75, activity: 95,  badge: '',   joinedAt: '2025-07-15', avatar: '🐩' },
  { rank: 20, petName: '布丁',   owner: '许*',    level: 22, happiness: 73, activity: 88,  badge: '',   joinedAt: '2025-07-22', avatar: '🐾' },
];

const CURRENT_USER_RANK = 7;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const medalGradients = {
  1: 'linear-gradient(135deg, #ffd700, #ffb400, #ffd700)',
  2: 'linear-gradient(135deg, #d4d4d4, #b0b0b0, #d4d4d4)',
  3: 'linear-gradient(135deg, #cd7f32, #b5651d, #cd7f32)',
};

function rankBadge(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return rank;
}

// ─── Row Component ─────────────────────────────────────────────────────────────
function RankingRow({ entry, isCurrentUser, index }) {
  const isTop3 = entry.rank <= 3;
  const gradient = medalGradients[entry.rank];

  return (
    <motion.div
      id={`rank-row-${entry.rank}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: isMobile() ? '16px 12px' : '12px 16px',
        borderRadius: 14,
        background: isCurrentUser
          ? 'rgba(244,114,182,0.2)'
          : isTop3
          ? 'rgba(255,255,255,0.9)'
          : 'rgba(255,255,255,0.7)',
        border: isCurrentUser
          ? '2px solid #f472b6'
          : isTop3
          ? '2px solid transparent'
          : '1px solid rgba(244,114,182,0.12)',
        boxShadow: isTop3
          ? `0 4px 16px ${entry.rank === 1 ? 'rgba(255,215,0,0.3)' : entry.rank === 2 ? 'rgba(180,180,180,0.3)' : 'rgba(205,127,50,0.3)'}`
          : '0 2px 8px rgba(244,114,182,0.08)',
      }}
    >
      {/* Rank */}
      <div style={{
        width: 36, minWidth: 36,
        height: 36,
        borderRadius: 10,
        background: gradient || 'rgba(244,114,182,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isTop3 ? 18 : 13,
        fontWeight: 800,
        color: isTop3 ? '#fff' : '#9d174d',
      }}>
        {rankBadge(entry.rank)}
      </div>

      {/* Avatar */}
      <div style={{
        width: 44, height: 44,
        borderRadius: 12,
        background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>
        {entry.avatar}
      </div>

      {/* Pet info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#9d174d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.petName}
        </div>
        <div style={{ fontSize: 12, color: '#f9a8d4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          主人 {entry.owner}
        </div>
      </div>

      {/* Level */}
      <div style={{ textAlign: 'center', minWidth: 44 }}>
        <div style={{ fontSize: 10, color: '#f9a8d4', fontWeight: 600 }}>LV</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#9d174d' }}>{entry.level}</div>
      </div>

      {/* Happiness */}
      <div style={{ textAlign: 'center', minWidth: 44 }}>
        <div style={{ fontSize: 10, color: '#f9a8d4', fontWeight: 600 }}>幸福</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: entry.happiness >= 90 ? '#ec4899' : '#9d174d' }}>
          {entry.happiness}%
        </div>
      </div>

      {/* Activity */}
      <div style={{ textAlign: 'right', minWidth: 50 }}>
        <div style={{ fontSize: 10, color: '#f9a8d4', fontWeight: 600 }}>活跃</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#9d174d' }}>{entry.activity}</div>
      </div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const { t, lang } = useI18n();
  const [activeTab, setActiveTab] = useState('total');
  const [rankings, setRankings] = useState(MOCK_RANKINGS);
  const [translatedRankings, setTranslatedRankings] = useState(MOCK_RANKINGS);
  const myRankRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(MOCK_RANKINGS.map(entry =>
      Promise.all([
        translateContent(entry.petName, lang),
        translateContent(entry.owner, lang),
      ]).then(([petName, owner]) => ({ ...entry, petName, owner }))
    )).then(data => {
      if (!cancelled) setTranslatedRankings(data);
    });
    return () => { cancelled = true; };
  }, [lang]);

  useEffect(() => {
    LeaderboardAPI.get(activeTab, 30).then(data => {
      if (data && data.length > 0) setRankings(data);
    });
  }, [activeTab]);

  const tabs = [
    { key: 'total',    label: t('leaderboard.tab.total') },
    { key: 'active',  label: t('leaderboard.tab.active') },
    { key: 'newcomer', label: t('leaderboard.tab.newcomer') },
  ];

  const sortedData = [...translatedRankings].sort((a, b) => {
    if (activeTab === 'total')    return b.happiness - a.happiness;
    if (activeTab === 'active')   return b.activity - a.activity;
    if (activeTab === 'newcomer') return new Date(b.joinedAt) - new Date(a.joinedAt);
    return 0;
  });

  const scrollToMyRank = () => {
    setTimeout(() => {
      myRankRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f9a8d4 100%)',
      fontFamily: "-apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif",
      padding: '0 0 40px',
    }}>
      {/* Banner */}
      <div style={{
        padding: '32px 20px 20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
        borderBottom: '1px solid rgba(244,114,182,0.15)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>🏆</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#9d174d' }}>
          {t('leaderboard.title')}
        </div>
        <div style={{ fontSize: 13, color: '#f472b6', marginTop: 4 }}>
          {t('leaderboard.subtitle')}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 8, padding: '16px 20px',
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(244,114,182,0.12)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '10px 0',
              borderRadius: 12, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 14,
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, #f472b6, #fb7185)'
                : 'rgba(244,114,182,0.1)',
              color: activeTab === tab.key ? '#fff' : '#9d174d',
              boxShadow: activeTab === tab.key
                ? '0 4px 14px rgba(244,114,182,0.4)'
                : 'none',
              transition: 'all 0.25s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '8px 20px', gap: 12,
        fontSize: 11, fontWeight: 700, color: '#f9a8d4',
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        <div style={{ width: 36, minWidth: 36, textAlign: 'center' }}>{t('leaderboard.col.rank')}</div>
        <div style={{ width: 44, textAlign: 'center' }}></div>
        <div style={{ flex: 1 }}>{t('leaderboard.col.pet')}</div>
        <div style={{ minWidth: 44, textAlign: 'center' }}>{t('leaderboard.col.level')}</div>
        <div style={{ minWidth: 44, textAlign: 'center' }}>{t('leaderboard.col.happiness')}</div>
        <div style={{ minWidth: 50, textAlign: 'right' }}>{t('leaderboard.col.activity')}</div>
      </div>

      {/* Ranking rows */}
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {sortedData.map((entry, index) => (
              <div key={entry.rank} style={{ marginBottom: 8 }}>
                <RankingRow
                  entry={entry}
                  isCurrentUser={entry.rank === CURRENT_USER_RANK}
                  index={index}
                />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* "My Rank" button */}
      <div style={{ padding: '16px 20px', textAlign: 'center' }}>
        <button
          ref={myRankRef}
          onClick={scrollToMyRank}
          style={{
            padding: '14px 32px',
            borderRadius: 14,
            border: 'none',
            background: 'linear-gradient(135deg, #f472b6, #fb7185)',
            color: '#fff',
            fontWeight: 800,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(244,114,182,0.4)',
          }}
        >
          {t('leaderboard.myRank', { n: CURRENT_USER_RANK })}
        </button>
      </div>
    </div>
  );
}
