import React, { useState, useEffect, useCallback } from 'react';

const MOCK_RANKINGS = [
  { rank: 1,  petName: '毛毛',   owner: '王小明',   score: 9850, breed: '金毛'     },
  { rank: 2,  petName: '豆豆',   owner: '李小红',   score: 9200, breed: '柯基'     },
  { rank: 3,  petName: '旺财',   owner: '张大伟',   score: 8750, breed: '哈士奇'   },
  { rank: 4,  petName: '小白',   owner: '陈美丽',   score: 8400, breed: '萨摩耶'   },
  { rank: 5,  petName: '黑黑',   owner: '刘强',     score: 7900, breed: '拉布拉多' },
  { rank: 6,  petName: '球球',   owner: '赵雪',     score: 7450, breed: '边境牧羊犬'},
  { rank: 7,  petName: '花花',   owner: '钱伟',     score: 7000, breed: '柴犬'     },
  { rank: 8,  petName: '布丁',   owner: '孙婷',     score: 6600, breed: '法斗'     },
  { rank: 9,  petName: '奶茶',   owner: '周杰',     score: 6200, breed: '比熊'     },
  { rank: 10, petName: '糯糯',   owner: '吴芳',     score: 5800, breed: '马尔济斯' },
];

// Language labels embedded so no i18n dependency needed for basic render
const LABELS = {
  leaderboard: '排行榜',
  rank: '排名',
  petName: '宠物名',
  owner: '主人',
  breed: '品种',
  score: '积分',
  loading: '加载中...',
  noData: '暂无数据',
};

function getLabel(key) {
  return LABELS[key] || key;
}

function RankingRow({ entry }) {
  const isTop3 = entry.rank <= 3;
  const medalColors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
  const scoreStr = entry.score != null ? entry.score.toLocaleString() : '-';

  return (
    <tr style={{ borderBottom: '1px solid #eee', background: isTop3 ? '#fafafa' : '#fff' }}>
      <td style={{ padding: '12px', textAlign: 'center' }}>
        <span style={{
          display: 'inline-block',
          width: 32,
          height: 32,
          lineHeight: '32px',
          textAlign: 'center',
          borderRadius: '50%',
          background: isTop3 ? medalColors[entry.rank] : '#eee',
          color: isTop3 ? '#fff' : '#999',
          fontWeight: 'bold',
          fontSize: 14,
        }}>
          {entry.rank <= 3 ? '🏅' : entry.rank}
        </span>
      </td>
      <td style={{ padding: '12px', fontWeight: 700, color: '#333' }}>
        {entry.petName || '-'}
      </td>
      <td style={{ padding: '12px', color: '#666' }}>
        {entry.owner || '-'}
      </td>
      <td style={{ padding: '12px', color: '#888' }}>
        {entry.breed || '-'}
      </td>
      <td style={{ padding: '12px', fontWeight: 'bold', color: '#e67e22', textAlign: 'right' }}>
        {scoreStr}
      </td>
    </tr>
  );
}

export default function LeaderboardPage() {
  const [rankings, setRankings] = useState(MOCK_RANKINGS);
  const [loading, setLoading] = useState(false); // Start false — show data immediately

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch('/api/leaderboard', { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('bad response');
        return res.json();
      })
      .then(data => {
        clearTimeout(timeout);
        if (Array.isArray(data) && data.length > 0) {
          setRankings(data);
          setLoading(false);
        }
      })
      .catch(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  // Never show loading spinner — show mock data immediately
  const pageStyle = {
    padding: '20px',
    fontFamily: "system-ui, -apple-system, 'PingFang SC', sans-serif",
    minHeight: '100vh',
    background: '#f5f7fa',
  };

  const headingStyle = {
    fontSize: 24,
    marginBottom: 20,
    color: '#333',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const theadStyle = {
    background: '#f0f0f0',
  };

  const thStyle = {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: 13,
    color: '#555',
    fontWeight: 600,
  };

  if (rankings.length === 0 && loading) {
    return (
      <div style={pageStyle}>
        <h2 style={headingStyle}>🏆 {getLabel('leaderboard')}</h2>
        <p>{getLabel('loading')}</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <h2 style={headingStyle}>🏆 {getLabel('leaderboard')}</h2>
      {rankings.length === 0 ? (
        <p>{getLabel('noData')}</p>
      ) : (
        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr>
              <th style={thStyle}>{getLabel('rank')}</th>
              <th style={thStyle}>{getLabel('petName')}</th>
              <th style={thStyle}>{getLabel('owner')}</th>
              <th style={thStyle}>{getLabel('breed')}</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>{getLabel('score')}</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map(entry => (
              <RankingRow key={entry.rank || entry.petName} entry={entry} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}