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
  async get() {
    const data = await apiFetch('/api/achievements');
    if (data) return data;
    // Fallback: localStorage
    try {
      const raw = localStorage.getItem('gg_achievement_counters');
      const counters = raw ? JSON.parse(raw) : {};
      const raw2 = localStorage.getItem('gg_achievement_unlock_dates');
      const unlockDates = raw2 ? JSON.parse(raw2) : {};
      const unlockedIds = Object.keys(unlockDates);
      return { counters, unlockDates, unlockedIds, totalPoints: 0 };
    } catch { return null; }
  },
  async incrementCounter(counter, delta = 1) {
    const data = await apiFetch('/api/achievements/increment', {
      method: 'POST', body: JSON.stringify({ counter, delta }),
    });
    if (!data) {
      // localStorage fallback: already handled by in-memory update
    }
  },
  async unlock(achievementId) {
    await apiFetch('/api/achievements/unlock', {
      method: 'POST', body: JSON.stringify({ achievementId }),
    });
  },
};

// ── Training ────────────────────────────────────────────────────────────────
export const TrainingAPI = {
  async get() {
    const data = await apiFetch('/api/training');
    if (data) return data;
    try {
      const skills = JSON.parse(localStorage.getItem('gg_pet_skills') || '{}');
      const points = parseInt(localStorage.getItem('gg_training_points') || '5', 10);
      const history = JSON.parse(localStorage.getItem('gg_training_history') || '[]');
      const streak = JSON.parse(localStorage.getItem('gg_training_streak') || '{"last":null,"days":0}');
      return { skills, trainingPoints: points, history, streak };
    } catch { return null; }
  },
  async updateSkill(skillId, action, delta) {
    await apiFetch('/api/training/skill', {
      method: 'POST', body: JSON.stringify({ skillId, action, delta }),
    });
  },
  async deductPoint() {
    await apiFetch('/api/training/deduct-point', { method: 'POST' });
  },
  async addPoints(delta) {
    await apiFetch('/api/training/add-points', {
      method: 'POST', body: JSON.stringify({ delta }),
    });
  },
  async addHistory(type, skillId, skillName) {
    await apiFetch('/api/training/history', {
      method: 'POST', body: JSON.stringify({ type, skillId, skillName }),
    });
  },
  async updateStreak() {
    await apiFetch('/api/training/streak', { method: 'POST' });
  },
};

// ── Daily Rewards ───────────────────────────────────────────────────────────
export const RewardsAPI = {
  async get() {
    const data = await apiFetch('/api/rewards');
    if (data) return data;
    try {
      const raw = localStorage.getItem('gg_daily_rewards');
      return raw ? JSON.parse(raw) : { lastClaimDate: null, streak: 0, todayClaimed: false, cycleDay: 0 };
    } catch { return null; }
  },
  async claim() {
    const data = await apiFetch('/api/rewards/claim', { method: 'POST' });
    return data; // returns { streak, cycleDay, reward } or null (fallback)
  },
};

// ── Health Records ─────────────────────────────────────────────────────────
export const HealthAPI = {
  async list() {
    const data = await apiFetch('/api/health');
    if (data?.records) return data.records;
    try {
      return JSON.parse(localStorage.getItem('gg_health_records') || '[]');
    } catch { return []; }
  },
  async add(record) {
    const data = await apiFetch('/api/health/record', {
      method: 'POST', body: JSON.stringify(record),
    });
    if (!data?.id) {
      // Fallback: save to localStorage
      try {
        const raw = localStorage.getItem('gg_health_records') || '[]';
        const records = JSON.parse(raw);
        const newRecord = { ...record, id: `local_${Date.now()}` };
        records.push(newRecord);
        localStorage.setItem('gg_health_records', JSON.stringify(records));
        return { id: newRecord.id };
      } catch {}
    }
    return data;
  },
  async remove(id) {
    await apiFetch(`/api/health/record/${id}`, { method: 'DELETE' });
    // Also remove from localStorage fallback
    try {
      const raw = localStorage.getItem('gg_health_records') || '[]';
      const records = JSON.parse(raw).filter(r => r.id !== id);
      localStorage.setItem('gg_health_records', JSON.stringify(records));
    } catch {}
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
