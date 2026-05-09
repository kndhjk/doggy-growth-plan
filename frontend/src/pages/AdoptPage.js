import React from 'react';
import { useI18n } from '../i18n/I18nContext';

// Mock adoptable pets — English names (not user content, so no translation needed)
const ADOPTABLE_PETS = [
  {
    id: 1,
    name: 'Max',
    breed: 'Golden Retriever',
    age: '3 months',
    gender: 'Male',
    personality: 'Friendly, energetic, and loves to play fetch. Great with kids!',
    image: 'https://placekitten.com/400/300',
  },
  {
    id: 2,
    name: 'Bella',
    breed: 'Corgi',
    age: '6 months',
    gender: 'Female',
    personality: 'Cute and clever with a playful spirit. Loves belly rubs.',
    image: 'https://placekitten.com/401/300',
  },
  {
    id: 3,
    name: 'Charlie',
    breed: 'Labrador',
    age: '2 years',
    gender: 'Male',
    personality: 'Gentle giant, well-trained, excellent with other pets.',
    image: 'https://placekitten.com/402/300',
  },
  {
    id: 4,
    name: 'Luna',
    breed: 'Husky',
    age: '1 year',
    gender: 'Female',
    personality: 'Adventurous and loyal. Loves outdoor activities.',
    image: 'https://placekitten.com/403/300',
  },
  {
    id: 5,
    name: 'Cooper',
    breed: 'Bulldog',
    age: '4 years',
    gender: 'Male',
    personality: 'Calm, affectionate, and great for apartment living.',
    image: 'https://placekitten.com/404/300',
  },
  {
    id: 6,
    name: 'Daisy',
    breed: 'Shiba Inu',
    age: '8 months',
    gender: 'Female',
    personality: 'Independent yet loving. Clean and easy to care for.',
    image: 'https://placekitten.com/405/300',
  },
];

function PetCard({ pet, t }) {
  return (
    <div style={styles.card}>
      <img src={pet.image} alt={pet.name} style={styles.cardImage} />
      <div style={styles.cardBody}>
        <h3 style={styles.petName}>{pet.name}</h3>
        <p style={styles.petBreed}>{pet.breed}</p>
        <div style={styles.petMeta}>
          <span>🎂 {pet.age}</span>
          <span>⚧ {pet.gender}</span>
        </div>
        <p style={styles.personality}>💬 {pet.personality}</p>
        <button style={styles.adoptBtn} onClick={() => alert(`Interest in adopting ${pet.name}!`)}>
          ❤️ {t('adoptMe')}
        </button>
      </div>
    </div>
  );
}

export default function AdoptPage() {
  const { t } = useI18n();

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>🏠 {t('adopt')}</h2>
      <p style={styles.subtitle}>Meet pets looking for a loving home</p>
      <div style={styles.grid}>
        {ADOPTABLE_PETS.map(pet => (
          <PetCard key={pet.id} pet={pet} t={t} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '20px', fontFamily: 'system-ui, sans-serif' },
  heading: { fontSize: '24px', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#888', marginBottom: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' },
  card: { border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden', background: '#fff' },
  cardImage: { width: '100%', height: '180px', objectFit: 'cover' },
  cardBody: { padding: '12px' },
  petName: { fontSize: '18px', margin: '0 0 4px' },
  petBreed: { fontSize: '13px', color: '#666', margin: '0 0 8px' },
  petMeta: { display: 'flex', gap: '12px', fontSize: '12px', color: '#888', marginBottom: '8px' },
  personality: { fontSize: '13px', color: '#555', margin: '0 0 12px', lineHeight: '1.4' },
  adoptBtn: {
    width: '100%', padding: '8px', background: '#e74c3c', color: '#fff',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
  },
};
