// Centralised API layer for GG Bond backend
// Falls back to localStorage if API unavailable (offline/dev mode)

const BASE = process.env.REACT_APP_API_URL || '';

// ── Generic fetch wrapper ────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (e) {
    console.warn(`[API] ${path} failed, using fallback:`, e.message);
    return null; // signals fallback to caller
  }
}

// ── Achievements ────────────────────────────────────────────────────────────
export const AchievementsAPI = {
  async get(uid) {
    return apiFetch(`/api/achievements?uid=${encodeURIComponent(uid)}`);
  },
  async incrementCounter(uid, counter, delta = 1) {
    return apiFetch('/api/achievements/increment', {
      method: 'POST', body: JSON.stringify({ uid, counter, delta }),
    });
  },
  async unlock(uid, achievementId) {
    return apiFetch('/api/achievements/unlock', {
      method: 'POST', body: JSON.stringify({ uid, achievementId }),
    });
  },
};

// ── Training ────────────────────────────────────────────────────────────────
export const TrainingAPI = {
  async get(uid) {
    return apiFetch(`/api/training?uid=${encodeURIComponent(uid)}`);
  },
  async updateSkill(uid, skillId, action, delta) {
    return apiFetch('/api/training/skill', {
      method: 'POST', body: JSON.stringify({ uid, skillId, action, delta }),
    });
  },
  async deductPoint(uid) {
    return apiFetch('/api/training/deduct-point', { method: 'POST', body: JSON.stringify({ uid }) });
  },
  async addPoints(uid, delta) {
    return apiFetch('/api/training/add-points', {
      method: 'POST', body: JSON.stringify({ uid, delta }),
    });
  },
  async addHistory(uid, type, skillId, skillName) {
    return apiFetch('/api/training/history', {
      method: 'POST', body: JSON.stringify({ uid, type, skillId, skillName }),
    });
  },
  async updateStreak(uid) {
    return apiFetch('/api/training/streak', { method: 'POST', body: JSON.stringify({ uid }) });
  },
};

// ── Daily Rewards ───────────────────────────────────────────────────────────
export const RewardsAPI = {
  async get(uid) {
    return apiFetch(`/api/rewards?uid=${encodeURIComponent(uid)}`);
  },
  async claim(uid) {
    return apiFetch('/api/rewards/claim', { method: 'POST', body: JSON.stringify({ uid }) });
  },
};

// ── Health Records ─────────────────────────────────────────────────────────
export const HealthAPI = {
  async list(uid) {
    const data = await apiFetch(`/api/health?uid=${encodeURIComponent(uid)}`);
    return data?.records || [];
  },
  async add(uid, record) {
    return apiFetch('/api/health/record', {
      method: 'POST', body: JSON.stringify({ uid, ...record }),
    });
  },
  async remove(uid, id) {
    return apiFetch(`/api/health/record/${id}?uid=${encodeURIComponent(uid)}`, { method: 'DELETE' });
  },
};

export const InventoryAPI = {
  async list(uid) {
    const data = await apiFetch(`/api/inventory?uid=${encodeURIComponent(uid)}`);
    return data?.items || [];
  },
  async use(uid, item) {
    return apiFetch('/api/inventory/use', {
      method: 'POST', body: JSON.stringify({ uid, itemId: item.id, item }),
    });
  },
};

// ── Leaderboard ────────────────────────────────────────────────────────────
export const LeaderboardAPI = {
  async get(type = 'total', limit = 20) {
    const data = await apiFetch(`/api/leaderboard?type=${type}&limit=${limit}`);
    if (data?.rankings) return data.rankings;
    return null; // no fallback for leaderboard
  },
  async updateScore(scoreData) {
    await apiFetch('/api/leaderboard/update', {
      method: 'POST', body: JSON.stringify(scoreData),
    });
  },
  async incrementActivity(delta = 1) {
    await apiFetch('/api/leaderboard/increment-activity', {
      method: 'POST', body: JSON.stringify({ delta }),
    });
  },
};
