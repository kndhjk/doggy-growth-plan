import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../context/AuthContext';
import { fetchConversations } from '../services/api';

const LOCAL_CONVERSATIONS_KEY = 'gg_local_conversations';
const readLocalConversations = () => {
  try { return JSON.parse(localStorage.getItem(LOCAL_CONVERSATIONS_KEY) || '[]'); }
  catch { return []; }
};

function timeAgo(ts) {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function MessagesPage() {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isLocal = false;
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    if (isLocal) {
      const refresh = () => {
        const convs = readLocalConversations()
          .filter(c => c.participants && currentUser.uid in c.participants)
          .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        setConversations(convs);
        setLoading(false);
      };
      refresh();
      const onStorage = (e) => {
        if (!e || e.key === LOCAL_CONVERSATIONS_KEY) refresh();
      };
      const onFocus = () => refresh();
      const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
      window.addEventListener('storage', onStorage);
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisible);
      return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisible);
      };
    }
    let cancelled = false;
    const refresh = () => {
      fetchConversations(currentUser.uid)
        .then(convs => { if (!cancelled) { setConversations(convs); setLoading(false); } })
        .catch(() => { if (!cancelled) setLoading(false); });
    };
    refresh();
    const timer = setInterval(refresh, 4000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [currentUser, isLocal]);

  const getOther = (conv) => {
    const otherId = Object.keys(conv.participants || {}).find(k => k !== currentUser?.uid);
    return otherId
      ? { uid: otherId, ...conv.participants[otherId] }
      : { uid: '', name: 'Unknown', email: '' };
  };

  const isUnread = (conv) => {
    const last = conv.lastMessage;
    return last && !last.read && last.senderId !== currentUser?.uid;
  };

  return (
    <div style={{
      minHeight: '100%',
      background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
      fontFamily: "system-ui,-apple-system,'PingFang SC',sans-serif",
      padding: '0 16px 100px',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 0 16px' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#9d174d' }}>
          💬 {t('marketplace.messages')}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#f472b6' }}>
          {conversations.length} {t('marketplace.conversations')}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#f472b6' }}>
          {t('common.loading')}
        </div>
      ) : conversations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#f9a8d4', fontSize: 15 }}>
          {t('marketplace.noConversations')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {conversations.map(conv => {
            const other = getOther(conv);
            const unread = isUnread(conv);
            return (
              <motion.div
                key={conv.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/messages/${conv.id}?other=${encodeURIComponent(other.name)}&sellerId=${other.uid || ''}`)}
                style={{
                  background: '#fff', borderRadius: 16, padding: '16px 20px',
                  cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center',
                  boxShadow: unread ? '0 4px 20px rgba(239,68,68,0.15)' : '0 2px 12px rgba(244,114,182,0.1)',
                  border: unread ? '1.5px solid #fca5a5' : '1.5px solid transparent',
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f472b6, #fb7185)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 20, fontWeight: 900, flexShrink: 0,
                }}>
                  {other.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#9d174d' }}>{other.name}</span>
                    <span style={{ fontSize: 12, color: '#f9a8d4', flexShrink: 0 }}>{timeAgo(conv.updatedAt)}</span>
                  </div>
                  <div style={{
                    fontSize: 14, color: unread ? '#9d174d' : '#f472b6',
                    fontWeight: unread ? 700 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {conv.lastMessage?.text || t('marketplace.noMessages')}
                  </div>
                </div>
                {unread && (
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: '#ef4444', flexShrink: 0,
                  }} />
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}