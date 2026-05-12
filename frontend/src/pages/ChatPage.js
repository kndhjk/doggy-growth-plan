import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../context/AuthContext';
import { fetchMessages, sendMessage as sendMessageApi, markConversationRead } from '../services/api';

const LOCAL_CONVERSATIONS_KEY = 'gg_local_conversations';
const localMessagesKey = (conversationId) => `gg_local_messages_${conversationId}`;
const readLocalConversations = () => {
  try { return JSON.parse(localStorage.getItem(LOCAL_CONVERSATIONS_KEY) || '[]'); }
  catch { return []; }
};
const writeLocalConversations = (items) => {
  try { localStorage.setItem(LOCAL_CONVERSATIONS_KEY, JSON.stringify(items)); } catch {}
};
const readLocalMessages = (conversationId) => {
  try { return JSON.parse(localStorage.getItem(localMessagesKey(conversationId)) || '[]'); }
  catch { return []; }
};
const writeLocalMessages = (conversationId, items) => {
  try { localStorage.setItem(localMessagesKey(conversationId), JSON.stringify(items)); } catch {}
};

function timeStr(ts) {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const otherName = searchParams.get('other') || 'User';
  const sellerId = searchParams.get('sellerId') || '';
  const otherUid = sellerId || conversationId.split('_').find(uid => uid !== currentUser?.uid) || '';
  const isLocal = false;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    if (isLocal) {
      setMessages(readLocalMessages(conversationId));
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    let cancelled = false;
    const refresh = () => {
      fetchMessages(conversationId)
        .then(list => {
          if (cancelled) return;
          setMessages(list);
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        })
        .catch(() => {});
    };
    refresh();
    const timer = setInterval(refresh, 3000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [conversationId, currentUser, isLocal]);

  // Mark messages as read
  useEffect(() => {
    if (!currentUser || !messages.length) return;
    const unread = messages.filter(
      m => m.senderId !== currentUser.uid && !m.read
    );
    if (unread.length === 0) return;

    const latestMessage = messages[messages.length - 1];
    const shouldMarkLastMessageRead = latestMessage && latestMessage.senderId !== currentUser.uid;

    if (isLocal) {
      const nextMessages = messages.map(m => (
        m.senderId !== currentUser.uid ? { ...m, read: true } : m
      ));
      setMessages(nextMessages);
      writeLocalMessages(conversationId, nextMessages);
      const nextConversations = readLocalConversations().map(conv => (
        conv.id === conversationId
          ? {
              ...conv,
              lastMessage: shouldMarkLastMessageRead && conv.lastMessage
                ? { ...conv.lastMessage, read: true }
                : conv.lastMessage,
            }
          : conv
      ));
      writeLocalConversations(nextConversations);
      return;
    }

    markConversationRead(conversationId, currentUser.uid).catch(() => {});
  }, [messages, currentUser, conversationId, isLocal]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      if (isLocal) {
        const msg = {
          id: `local-msg-${Date.now()}`,
          senderId: currentUser.uid,
          text: text.trim(),
          createdAt: new Date().toISOString(),
          read: false,
        };
        const nextMessages = [...readLocalMessages(conversationId), msg];
        writeLocalMessages(conversationId, nextMessages);
        setMessages(nextMessages);
        const others = readLocalConversations().filter(conv => conv.id !== conversationId);
        writeLocalConversations([{
          id: conversationId,
          lastMessage: msg,
          updatedAt: msg.createdAt,
          participants: {
            [currentUser.uid]: { name: currentUser.displayName || currentUser.email || 'Me', uid: currentUser.uid },
            ...(otherUid ? { [otherUid]: { name: otherName, uid: otherUid } } : {}),
          },
          otherUid,
        }, ...others]);
        setText('');
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }

      await sendMessageApi(conversationId, {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email || 'Me',
        text: text.trim(),
        participants: {
          [currentUser.uid]: { name: currentUser.displayName || currentUser.email || 'Me', uid: currentUser.uid },
          ...(otherUid ? { [otherUid]: { name: otherName, uid: otherUid } } : {}),
        },
        otherUid,
      });
      setText('');
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#fdf2f8',
      fontFamily: "system-ui,-apple-system,'PingFang SC',sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #fce7f3',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0,
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f472b6, #fb7185)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 18, fontWeight: 900, flexShrink: 0,
        }}>
          {otherName?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#9d174d' }}>{otherName}</div>
          <div style={{ fontSize: 12, color: '#f472b6' }}>{t('marketplace.seller')}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '16px 16px 8px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {messages.map(msg => {
          const isMe = msg.senderId === currentUser?.uid;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              style={{
                display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth: '75%',
                background: isMe ? 'linear-gradient(135deg, #f472b6, #fb7185)' : '#fff',
                color: isMe ? '#fff' : '#9d174d',
                padding: '10px 16px', borderRadius: 20,
                borderBottomRightRadius: isMe ? 6 : 20,
                borderBottomLeftRadius: isMe ? 20 : 6,
                boxShadow: '0 2px 10px rgba(244,114,182,0.15)',
                fontSize: 15, lineHeight: 1.5,
              }}>
                <div style={{ wordBreak: 'break-word' }}>{msg.text}</div>
                <div style={{
                  fontSize: 11, marginTop: 4, opacity: 0.7,
                  textAlign: isMe ? 'right' : 'left',
                }}>
                  {timeStr(msg.createdAt)}
                  {isMe && msg.read && ' ✓✓'}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid #fce7f3',
        padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
        display: 'flex', gap: 10, alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={t('marketplace.messagePlaceholder')}
          rows={1}
          style={{
            flex: 1, padding: '12px 16px',
            border: '1.5px solid #fce7f3', borderRadius: 24,
            fontSize: 15, outline: 'none', resize: 'none',
            background: '#fdf2f8', color: '#9d174d',
            maxHeight: 120, overflowY: 'auto',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          style={{
            width: 48, height: 48, borderRadius: '50%',
            background: text.trim() ? 'linear-gradient(135deg, #f472b6, #fb7185)' : '#f9a8d4',
            color: '#fff', border: 'none', fontSize: 20,
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: text.trim() ? '0 4px 12px rgba(244,114,182,0.4)' : 'none',
            flexShrink: 0,
          }}
        >
          {sending ? '...' : '➤'}
        </button>
      </div>
    </div>
  );
}