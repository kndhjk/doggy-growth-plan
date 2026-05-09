import React, { useState } from 'react';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import MarketplacePage from './pages/MarketplacePage';
import HealthRecordsPage from './pages/HealthRecordsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import InventoryPage from './pages/InventoryPage';
import MapPage from './pages/MapPage';
import AdoptPage from './pages/AdoptPage';

const LANG_LABELS = { en: 'EN', zh: '中文', ja: '日本語', mi: 'MI' };

function LangSwitcher() {
  const { lang, setLang, availableLangs, t } = useI18n();
  return (
    <div style={navStyles.langSwitcher}>
      <span style={navStyles.langLabel}>{t('language')}: </span>
      {availableLangs.map(code => (
        <button
          key={code}
          onClick={() => setLang(code)}
          style={{
            ...navStyles.langBtn,
            ...(lang === code ? navStyles.langBtnActive : {}),
          }}
        >
          {LANG_LABELS[code] || code}
        </button>
      ))}
    </div>
  );
}

function NavBar() {
  const { t } = useI18n();
  const [active, setActive] = useState('marketplace');

  const navItems = [
    { id: 'marketplace', label: () => `🛒 ${t('marketplace')}` },
    { id: 'health', label: () => `🏥 ${t('healthRecords')}` },
    { id: 'leaderboard', label: () => `🏆 ${t('leaderboard')}` },
    { id: 'inventory', label: () => `📦 ${t('inventory')}` },
    { id: 'map', label: () => `🗺️ ${t('map')}` },
    { id: 'adopt', label: () => `🏠 ${t('adopt')}` },
  ];

  return (
    <nav style={navStyles.nav}>
      <div style={navStyles.navLeft}>
        <span style={navStyles.logo}>🐾 GG Bond</span>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            style={{
              ...navStyles.navBtn,
              ...(active === item.id ? navStyles.navBtnActive : {}),
            }}
          >
            {item.label()}
          </button>
        ))}
      </div>
      <LangSwitcher />
    </nav>
  );
}

function MainContent() {
  const [active, setActive] = useState('marketplace');

  const navItems = [
    { id: 'marketplace', label: () => <NavBtn label="marketplace" icon="🛒" /> },
    { id: 'health', label: () => <NavBtn label="healthRecords" icon="🏥" /> },
    { id: 'leaderboard', label: () => <NavBtn label="leaderboard" icon="🏆" /> },
    { id: 'inventory', label: () => <NavBtn label="inventory" icon="📦" /> },
    { id: 'map', label: () => <NavBtn label="map" icon="🗺️" /> },
    { id: 'adopt', label: () => <NavBtn label="adopt" icon="🏠" /> },
  ];

  function NavBtn({ label, icon }) {
    const { t } = useI18n();
    return <>{icon} {t(label)}</>;
  }

  const renderPage = () => {
    switch (active) {
      case 'marketplace': return <MarketplacePage />;
      case 'health': return <HealthRecordsPage />;
      case 'leaderboard': return <LeaderboardPage />;
      case 'inventory': return <InventoryPage />;
      case 'map': return <MapPage />;
      case 'adopt': return <AdoptPage />;
      default: return <MarketplacePage />;
    }
  };

  return (
    <div>
      <nav style={navStyles.nav}>
        <div style={navStyles.navLeft}>
          <span style={navStyles.logo}>🐾 GG Bond</span>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              style={{
                ...navStyles.navBtn,
                ...(active === item.id ? navStyles.navBtnActive : {}),
              }}
            >
              {item.label()}
            </button>
          ))}
        </div>
        <LangSwitcher />
      </nav>
      <MainContent_ page={active} />
    </div>
  );
}

function MainContent_({ page }) {
  switch (page) {
    case 'marketplace': return <MarketplacePage />;
    case 'health': return <HealthRecordsPage />;
    case 'leaderboard': return <LeaderboardPage />;
    case 'inventory': return <InventoryPage />;
    case 'map': return <MapPage />;
    case 'adopt': return <AdoptPage />;
    default: return <MarketplacePage />;
  }
}

const navStyles = {
  nav: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#2c3e50', padding: '0 20px', height: '56px', color: '#fff',
    position: 'sticky', top: 0, zIndex: 100,
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: '4px' },
  logo: { fontSize: '18px', fontWeight: 'bold', marginRight: '16px', whiteSpace: 'nowrap' },
  navBtn: {
    background: 'transparent', border: 'none', color: '#bdc3c7',
    padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
  },
  navBtnActive: { background: '#34495e', color: '#fff' },
  langSwitcher: { display: 'flex', alignItems: 'center', gap: '4px' },
  langLabel: { fontSize: '12px', color: '#bdc3c7', marginRight: '4px' },
  langBtn: {
    background: 'transparent', border: '1px solid #4a5f7f', color: '#bdc3c7',
    padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
  },
  langBtnActive: { background: '#3498db', borderColor: '#3498db', color: '#fff' },
};

function App() {
  return (
    <I18nProvider>
      <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
        <NavBarWrapper />
      </div>
    </I18nProvider>
  );
}

function NavBarWrapper() {
  const [active, setActive] = useState('marketplace');
  const { t } = useI18n();

  const navItems = [
    { id: 'marketplace', label: () => `🛒 ${t('marketplace')}` },
    { id: 'health', label: () => `🏥 ${t('healthRecords')}` },
    { id: 'leaderboard', label: () => `🏆 ${t('leaderboard')}` },
    { id: 'inventory', label: () => `📦 ${t('inventory')}` },
    { id: 'map', label: () => `🗺️ ${t('map')}` },
    { id: 'adopt', label: () => `🏠 ${t('adopt')}` },
  ];

  function renderPage() {
    switch (active) {
      case 'marketplace': return <MarketplacePage />;
      case 'health': return <HealthRecordsPage />;
      case 'leaderboard': return <LeaderboardPage />;
      case 'inventory': return <InventoryPage />;
      case 'map': return <MapPage />;
      case 'adopt': return <AdoptPage />;
      default: return <MarketplacePage />;
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <nav style={navStyles.nav}>
        <div style={navStyles.navLeft}>
          <span style={navStyles.logo}>🐾 GG Bond</span>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              style={{
                ...navStyles.navBtn,
                ...(active === item.id ? navStyles.navBtnActive : {}),
              }}
            >
              {item.label()}
            </button>
          ))}
        </div>
        <LangSwitcher />
      </nav>
      {renderPage()}
    </div>
  );
}

export default App;
