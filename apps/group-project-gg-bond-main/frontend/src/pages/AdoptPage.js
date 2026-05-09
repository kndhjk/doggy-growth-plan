import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useI18n } from '../i18n/I18nContext';

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const ADOPTABLE_PETS = [
  {
    id: 'p1', name: 'Bella', breed: 'Corgi', type: 'dog', age: '2 years old',
    gender: '♂', personality: 'Playful, loves outdoor activities and is great with children',
    health: 95, energy: 88, hunger: 30,
    intro: 'Bella is a lively Corgi whose tail wags like a little propeller! She loves running with her owner and chasing squirrels. With a cheerful personality, she is the joy of the household.',
    tags: ['Corgi', 'Puppy', 'Playful', 'Great with kids'],
    bgGradient: 'linear-gradient(135deg,#fef3c7,#fde68a)',
    accentColor: '#f59e0b',
    emoji: '🐕',
    features: ['Shakes hands', 'Sits on command', 'Loves swimming'],
    adoptionFee: 280,
  },
  {
    id: 'p2', name: 'Snowball', breed: 'Samoyed', type: 'dog', age: '1 year old',
    gender: '♀', personality: 'Gentle, friendly with beautiful white coat, needs regular grooming',
    health: 98, energy: 75, hunger: 45,
    intro: 'Snowball has envy-inducing snow-white fur and smiles like an angel! She is very affectionate and loves to cuddle with her owner. Gets along well with everyone and all animals.',
    tags: ['Samoyed', 'Adult', 'Gentle', 'Stunning coat'],
    bgGradient: 'linear-gradient(135deg,#f0f9ff,#bae6fd)',
    accentColor: '#0ea5e9',
    emoji: '🐕',
    features: ['Smiling angel', 'Non-aggressive', 'Loves cuddles'],
    adoptionFee: 350,
  },
  {
    id: 'p3', name: 'Miggy', breed: 'British Shorthair (Blue)', type: 'cat', age: '3 years old',
    gender: '♂', personality: 'Quiet and independent, prefers calm environments, great for office workers',
    health: 92, energy: 60, hunger: 55,
    intro: 'Miggy is a typical British Shorthair with round face and copper eyes. He is calm and composed, doesn\'t meow much — ideal companion for people living alone.',
    tags: ['British Shorthair', 'Adult', 'Quiet', 'Great for workers'],
    bgGradient: 'linear-gradient(135deg,#e9d5ff,#ddd6fe)',
    accentColor: '#8b5cf6',
    emoji: '🐱',
    features: ['Calm and well-behaved', 'Doesn\'t scratch furniture', 'Very clean'],
    adoptionFee: 200,
  },
  {
    id: 'p4', name: 'Orange', breed: 'Orange Tabby', type: 'cat', age: '6 months old',
    gender: '♀', personality: 'Food-motivated and prone to gaining weight, very affectionate',
    health: 90, energy: 85, hunger: 70,
    intro: 'Orange is an adorable orange tabby kitten with tiger-stripe markings. She has a big appetite and is very lively — loves running around people. As the saying goes: nine out of ten orange cats become chonky!',
    tags: ['Orange Tabby', 'Kitten', 'Foodie', 'Chonky-prone'],
    bgGradient: 'linear-gradient(135deg,#ffedd5,#fed7aa)',
    accentColor: '#fb923c',
    emoji: '🐱',
    features: ['Super cuddly', 'Loves attention', 'Good appetite'],
    adoptionFee: 150,
  },
  {
    id: 'p5', name: 'Duke', breed: 'Mixed Breed', type: 'dog', age: '4 years old',
    gender: '♂', personality: 'Loyal guardian, highly intelligent, strong immune system',
    health: 97, energy: 70, hunger: 40,
    intro: 'Duke is a genuine mixed-breed dog with beautiful golden-brown fur. He is extremely loyal to his owner and an excellent watchdog. Very smart — learns commands in one try.',
    tags: ['Mixed breed', 'Adult', 'Loyal', 'Easy keeper'],
    bgGradient: 'linear-gradient(135deg,#fef9c3,#fef08a)',
    accentColor: '#ca8a04',
    emoji: '🐕',
    features: ['Watchdog', 'Not picky', 'Ultra loyal'],
    adoptionFee: 100,
  },
  {
    id: 'p6', name: 'Cotton', breed: 'Ragdoll', type: 'cat', age: '2 years old',
    gender: '♀', personality: 'Calm temperament, loves being held, high pain tolerance',
    health: 94, energy: 65, hunger: 50,
    intro: 'Cotton is a beautiful Ragdoll cat — when picked up she goes completely relaxed like a stuffed toy! She has captivating blue eyes and silky long fur with an absolutely wonderful temperament.',
    tags: ['Ragdoll', 'Adult', 'Gentle', 'Loves cuddles'],
    bgGradient: 'linear-gradient(135deg,#fce7f3,#fbcfe8)',
    accentColor: '#ec4899',
    emoji: '🐱',
    features: ['Loves being held', 'Blue eyes', 'Silky fur'],
    adoptionFee: 380,
  },
];

const PET_TYPES = (t) => [
  { key: 'all', label: t('adopt.filter.all'), emoji: '🐾', color: '#8b5cf6' },
  { key: 'dog', label: t('adopt.filter.dog'), emoji: '🐕', color: '#f59e0b' },
  { key: 'cat', label: t('adopt.filter.cat'), emoji: '🐱', color: '#ec4899' },
];

// ─── Pet Avatar ───────────────────────────────────────────────────────────────
function PetAvatar({ pet, size = 120 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: pet.bgGradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.55, position: 'relative', overflow: 'hidden',
      boxShadow: `0 8px 32px ${pet.accentColor}40`,
    }}>
      <FloatingPet emoji={pet.emoji} size={size * 0.6} />
      {/* Shine effect */}
      <div style={{
        position: 'absolute', top: '8%', left: '15%', width: '25%', height: '15%',
        background: 'rgba(255,255,255,0.5)', borderRadius: '50%',
        filter: 'blur(4px)', transform: 'rotate(-30deg)',
      }} />
    </div>
  );
}

// ─── Floating Pet Animation ────────────────────────────────────────────────────
function FloatingPet({ emoji, size = 60 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: `translate(-50%, -50%) rotate(${i * 120}deg)`,
          transformOrigin: `0 ${size * 0.6}px`,
          animation: `float ${2 + i * 0.4}s ease-in-out infinite`,
          animationDelay: `${i * 0.3}s`,
        }}>
          <span style={{ fontSize: size * 0.7, display: 'block', textAlign: 'center' }}>{emoji}</span>
        </div>
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) rotate(var(--r, 0deg)) translateY(0); }
          50% { transform: translate(-50%, -50%) rotate(var(--r, 0deg)) translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

// ─── Stat Bar ─────────────────────────────────────────────────────────────────
function StatBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, color: '#1f0933', fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: '#f3e8ff', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{ height: '100%', background: color, borderRadius: 3 }}
        />
      </div>
    </div>
  );
}

// ─── Tag Badge ────────────────────────────────────────────────────────────────
function Tag({ label, color }) {
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>
      {label}
    </span>
  );
}

// ─── Pet Card ─────────────────────────────────────────────────────────────────
function PetCard({ pet, onClick, t }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        background: 'white', borderRadius: 24,
        overflow: 'hidden', cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '2px solid transparent',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = pet.accentColor + '60'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
    >
      {/* Header with gradient */}
      <div style={{ background: pet.bgGradient, padding: '24px 20px 20px', position: 'relative', overflow: 'hidden' }}>
        {/* Floating emoji circles */}
        <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 60, opacity: 0.15 }}>{pet.emoji}</div>
        <div style={{ position: 'absolute', bottom: -15, left: -5, fontSize: 40, opacity: 0.1 }}>{pet.emoji}</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#1f0933' }}>{pet.name}</span>
              <span style={{ fontSize: 13, color: '#6b7280', background: 'rgba(255,255,255,0.8)', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>{pet.gender}</span>
            </div>
            <div style={{ fontSize: 12, color: pet.accentColor, fontWeight: 700, marginTop: 2 }}>{pet.breed}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{pet.age}</div>
          </div>
        </div>

        {/* Pet emoji display */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <PetAvatar pet={pet} size={100} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 20px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {pet.tags.map(tag => (
            <Tag key={tag} label={tag} color={pet.accentColor} />
          ))}
        </div>

        {/* Stats */}
        <div style={{ marginBottom: 14 }}>
          <StatBar label={t('adopt.card.health')} value={pet.health} color="#ef4444" />
          <StatBar label={t('adopt.card.energy')} value={pet.energy} color="#f59e0b" />
          <StatBar label={t('adopt.card.appetite')} value={100 - pet.hunger} color="#10b981" />
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 12, borderTop: '1px solid #f3e8ff',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{t('adopt.card.fee')}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: pet.accentColor }}>
              ${pet.adoptionFee}
            </div>
          </div>
          <div style={{
            padding: '8px 18px', borderRadius: 100, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg,${pet.accentColor},${pet.accentColor}cc)`,
            color: 'white', fontWeight: 800, fontSize: 13, boxShadow: `0 4px 14px ${pet.accentColor}40`,
          }}>
            {t('adopt.card.detail')}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function PetDetailModal({ pet, onAdopt, onClose, t }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(6px)', padding: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0.85, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 28, maxWidth: 520, width: '100%',
          maxHeight: '90vh', overflow: 'auto',
          boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{ background: pet.bgGradient, padding: '28px 28px 24px', position: 'relative' }}>
          <button onClick={onClose}
            style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%',
                     border: 'none', background: 'rgba(255,255,255,0.8)', cursor: 'pointer',
                     fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <PetAvatar pet={pet} size={90} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: '#1f0933' }}>{pet.name}</span>
                <span style={{ fontSize: 16, background: 'rgba(255,255,255,0.8)', padding: '2px 10px', borderRadius: 100, fontWeight: 700 }}>{pet.gender}</span>
              </div>
              <div style={{ fontSize: 14, color: pet.accentColor, fontWeight: 700, marginTop: 4 }}>{pet.breed}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{pet.age} · {pet.type === 'dog' ? t('adopt.filter.dog') : t('adopt.filter.cat')}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px 28px' }}>
          {/* Personality */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{t('adopt.modal.personality')}</div>
            <div style={{ background: '#f9f5ff', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#1f0933', lineHeight: 1.6 }}>
              {pet.personality}
            </div>
          </div>

          {/* Intro */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{t('adopt.modal.intro')}</div>
            <div style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.7 }}>{pet.intro}</div>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {pet.tags.map(tag => <Tag key={tag} label={tag} color={pet.accentColor} />)}
            {pet.features.map(f => <Tag key={f} label={`✨ ${f}`} color={pet.accentColor} />)}
          </div>

          {/* Stats */}
          <div style={{ background: '#fdf2f8', borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{t('adopt.modal.status')}</div>
            <StatBar label={t('adopt.modal.status.health')} value={pet.health} color="#ef4444" />
            <StatBar label={t('adopt.modal.status.energy')} value={pet.energy} color="#f59e0b" />
            <StatBar label={t('adopt.modal.status.appetite')} value={100 - pet.hunger} color="#10b981" />
          </div>

          {/* Adoption fee */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', background: `${pet.accentColor}0f`, borderRadius: 16,
            border: `2px solid ${pet.accentColor}20`, marginBottom: 20,
          }}>
            <div>
              <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{t('adopt.modal.fee')}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: pet.accentColor }}>${pet.adoptionFee}</div>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'right', lineHeight: 1.5 }}>
              {t('adopt.modal.feeIncludes')}<br />
              {t('adopt.modal.feeIncludesDetail')}
            </div>
          </div>

          {/* CTA */}
          {!confirming ? (
            <button onClick={() => setConfirming(true)}
              style={{ width: '100%', padding: '16px', borderRadius: 16, border: 'none', cursor: 'pointer',
                       background: `linear-gradient(135deg,${pet.accentColor},${pet.accentColor}dd)`,
                       color: 'white', fontWeight: 900, fontSize: 16,
                       boxShadow: `0 6px 24px ${pet.accentColor}40` }}>
              {t('adopt.modal.applyAdopt', { name: pet.name })}
            </button>
          ) : (
            <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: 16, padding: '16px 20px' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#92400e', marginBottom: 8 }}>
                ⚠️ {t('adopt.modal.confirm', { name: pet.name })}
              </div>
              <div style={{ fontSize: 13, color: '#78350f', marginBottom: 14, lineHeight: 1.5 }}>
                {t('adopt.modal.confirmBody')}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirming(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: '2px solid #f59e0b',
                           background: 'white', color: '#92400e', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  {t('adopt.modal.thinkAgain')}
                </button>
                <button onClick={() => { onAdopt(pet); setConfirming(false); }}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                           background: `linear-gradient(135deg,${pet.accentColor},${pet.accentColor}dd)`,
                           color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                  ✅ {t('adopt.modal.adopt')}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Success Animation ─────────────────────────────────────────────────────────
function AdoptSuccessModal({ pet, onClose, t }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, backdropFilter: 'blur(8px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        style={{ textAlign: 'center', padding: 40 }}
      >
        <div style={{ fontSize: 100, marginBottom: 20, animation: 'bounce 1s infinite' }}>🎉</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 12 }}>
          {t('adopt.success.title')}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
          {t('adopt.success.submsg', { name: pet.name })}<br />
        </p>
        <button onClick={onClose}
          style={{ padding: '14px 40px', borderRadius: 100, border: 'none', cursor: 'pointer',
                   background: 'white', color: '#1f0933', fontWeight: 900, fontSize: 15,
                   boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          {t('adopt.success.btn')}
        </button>
      </motion.div>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdoptPage() {
  const { t } = useI18n();
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedPet, setSelectedPet] = useState(null);
  const [adoptedPet, setAdoptedPet] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 6;

  const filtered = ADOPTABLE_PETS.filter(p => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.breed.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore = paginated.length < filtered.length;
  const petTypes = PET_TYPES(t);

  const handleAdopt = (pet) => {
    setSelectedPet(null);
    setAdoptedPet(pet);
  };

  const handleAdoptedClose = () => {
    setAdoptedPet(null);
    toast.success(`${adoptedPet?.name} 已添加到您的宠物列表！`, { icon: '🐾' });
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f3ff', fontFamily: 'system-ui, sans-serif', paddingBottom: 80 }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg,#f472b6,#fb7185)',
        padding: '48px 20px 60px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Floating decorations */}
        <div style={{ position: 'absolute', top: 20, left: '10%', fontSize: 40, opacity: 0.2, animation: 'float 3s ease-in-out infinite' }}>🐕</div>
        <div style={{ position: 'absolute', top: 60, right: '8%', fontSize: 50, opacity: 0.15, animation: 'float 2.5s ease-in-out infinite 0.5s' }}>🐱</div>
        <div style={{ position: 'absolute', bottom: 10, left: '30%', fontSize: 35, opacity: 0.15, animation: 'float 3.5s ease-in-out infinite 1s' }}>🐾</div>

        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 8, textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            {t('adopt.title')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            {t('adopt.subtitle')}
          </p>

          {/* Search bar */}
          <div style={{ position: 'relative', maxWidth: 400, margin: '0 auto' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🔍</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('adopt.empty.hint')}
              style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 100, border: 'none', outline: 'none',
                       fontSize: 15, boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)',
                       color: '#1f0933', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(5deg); }
          }
        `}</style>
      </div>

      {/* Type Filter */}
      <div style={{
        display: 'flex', gap: 10, padding: '20px 20px 0', maxWidth: 600, margin: '0 auto',
        justifyContent: 'center', flexWrap: 'wrap',
      }}>
        {petTypes.map(pt => (
          <button key={pt.key} onClick={() => { setTypeFilter(pt.key); setPage(1); }}
            style={{ padding: '8px 20px', borderRadius: 100, border: `2px solid ${typeFilter === pt.key ? pt.color : '#e9d5ff'}`,
                     background: typeFilter === pt.key ? pt.color : 'white', color: typeFilter === pt.key ? 'white' : pt.color,
                     fontWeight: 800, fontSize: 13, cursor: 'pointer',
                     boxShadow: typeFilter === pt.key ? `0 4px 14px ${pt.color}50` : 'none',
                     display: 'flex', alignItems: 'center', gap: 6 }}>
            {pt.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ maxWidth: 900, margin: '20px auto 0', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, color: '#6b7280' }}>
          {t('adopt.results', { n: filtered.length })}
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>
          🏠 {t('adopt.helped', { n: ADOPTABLE_PETS.length * 3 + 12 })}
        </div>
      </div>

      {/* Pet Grid */}
      <div style={{ maxWidth: 900, margin: '16px auto', padding: '0 20px', display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        <AnimatePresence mode="popLayout">
          {paginated.map((pet, i) => (
            <motion.div
              key={pet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              layout
            >
              <PetCard pet={pet} onClick={() => setSelectedPet(pet)} t={t} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {hasMore && (
        <div style={{ textAlign: 'center', padding: '20px 0 40px' }}>
          <button onClick={() => setPage(p => p + 1)}
            style={{ padding: '12px 40px', borderRadius: 100, border: '2px solid #f3e8ff',
                     background: 'white', color: '#7c3aed', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                     boxShadow: '0 4px 14px rgba(139,92,246,0.1)' }}>
            {t('adopt.loadMore')}
          </button>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🔍</div>
          <h3 style={{ fontWeight: 900, color: '#1f0933', marginBottom: 8 }}>{t('adopt.empty.title')}</h3>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>{t('adopt.empty.hint')}</p>
          <button onClick={() => { setTypeFilter('all'); setSearch(''); }}
            style={{ marginTop: 16, padding: '10px 24px', borderRadius: 100, border: 'none',
                     background: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', color: 'white',
                     fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            {t('adopt.empty.clear')}
          </button>
        </div>
      )}

      {/* Stats Banner */}
      <div style={{
        background: 'white', margin: '0 20px 20px', borderRadius: 20, padding: '20px 24px',
        maxWidth: 900, margin: '0 auto 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16,
      }}>
        {[
          { icon: '🐾', value: ADOPTABLE_PETS.length * 3 + 12, label: t('adopt.stats.adopted') },
          { icon: '🏠', value: ADOPTABLE_PETS.length, label: t('adopt.stats.available') },
          { icon: '❤️', value: '98%', label: t('adopt.stats.satisfaction') },
          { icon: '🆓', value: '0', label: t('adopt.stats.free') },
        ].map(({ icon, value, label }) => (
          <div key={label} style={{ textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#1f0933' }}>{value}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedPet && (
          <PetDetailModal
            pet={selectedPet}
            onAdopt={handleAdopt}
            onClose={() => setSelectedPet(null)}
            t={t}
          />
        )}
        {adoptedPet && (
          <AdoptSuccessModal pet={adoptedPet} onClose={handleAdoptedClose} t={t} />
        )}
      </AnimatePresence>
    </div>
  );
}
