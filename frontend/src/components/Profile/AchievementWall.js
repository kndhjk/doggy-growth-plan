import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { usePet } from '../../context/PetContext';
import { ACHIEVEMENTS } from '../../data/achievements';
import { readUnlocked } from '../../services/achievementsService';

// Grid of achievement medals shown on the Profile page. Unlocked medals are
// vibrant; locked medals are greyed out and reveal their description on tap.
export default function AchievementWall() {
  const { currentUser } = useAuth();
  const { pet }         = usePet();
  const [unlocked, setUnlocked] = useState(() => readUnlocked(currentUser?.uid));
  const [openKey, setOpenKey]   = useState(null);

  // Re-read on pet changes — covers the case where a fresh unlock happened on
  // PetPage and the user navigates here.
  useEffect(() => {
    setUnlocked(readUnlocked(currentUser?.uid));
  }, [currentUser, pet]);

  const total       = ACHIEVEMENTS.length;
  const unlockedCnt = ACHIEVEMENTS.filter(a => unlocked.has(a.key)).length;

  return (
    <div style={card}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <p style={cardTitle}>🏅 成就墙</p>
        <span style={{ fontSize:12, color:'#9ca3af', fontWeight:700 }}>
          {unlockedCnt} / {total}
        </span>
      </div>

      <div style={grid}>
        {ACHIEVEMENTS.map(a => {
          const got = unlocked.has(a.key);
          return (
            <motion.button
              type="button"
              key={a.key}
              onClick={() => setOpenKey(openKey === a.key ? null : a.key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                ...tile,
                background: got ? 'linear-gradient(135deg,#fff0f6,#fce7f3)' : '#f9fafb',
                borderColor: got ? '#f9a8d4' : '#e5e7eb',
                opacity: got ? 1 : 0.55,
                filter:  got ? 'none' : 'grayscale(0.8)',
              }}
            >
              <div style={{ fontSize:30, lineHeight:1 }}>{a.emoji}</div>
              <div style={{
                fontSize:11, fontWeight:700, marginTop:4,
                color: got ? '#9d174d' : '#6b7280',
                textAlign:'center',
              }}>
                {a.label}
              </div>
            </motion.button>
          );
        })}
      </div>

      {openKey && (
        <div style={{
          marginTop:12, padding:'10px 12px', background:'#fdf2f8',
          borderRadius:12, fontSize:12, color:'#9d174d', lineHeight:1.6,
        }}>
          <strong>{ACHIEVEMENTS.find(a => a.key === openKey)?.label}</strong>
          {' — '}
          {ACHIEVEMENTS.find(a => a.key === openKey)?.desc}
        </div>
      )}
    </div>
  );
}

const card = {
  background:'white', borderRadius:18, padding:16, marginBottom:12,
  border:'1px solid #fce7f3', boxShadow:'0 2px 10px rgba(244,114,182,0.08)',
};
const cardTitle = { fontWeight:800, color:'#9d174d', fontSize:14, margin:0 };
const grid = {
  display:'grid',
  gridTemplateColumns:'repeat(3, 1fr)',
  gap:8,
};
const tile = {
  border:'2px solid', borderRadius:14, padding:'12px 8px',
  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
  cursor:'pointer', minHeight:80, transition:'all 0.2s',
};
