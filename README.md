Welcome to the CS732 project. We look forward to seeing the amazing things you create this semester! This is your team's repository.

Our team members are:
- Huanhuan Li _(hli758@aucklanduni.ac.nz)_
- Jiayi Lyu _(jlyu233@aucklanduni.ac.nz)_
- Xiang Zhang _(hxza940@aucklanduni.ac.nz)_
- Ming Zhao _(mzha585@aucklanduni.ac.nz)_
- Xingyan Zhou _(xzho343@aucklanduni.ac.nz)_
- Kejun Xu _(kxu311@aucklanduni.ac.nz)_

> This repository now also contains the repaired production deployment and online/shared-data fixes for GG Bond.

**中文版请看：[`README_CN.md`](./README_CN.md)**

---

# GG Bond Pet Platform

GG Bond is a React + Node.js pet app that was refit from mixed demo/offline behavior into a server-backed deployment.

## Live
- Frontend: `http://4.155.227.179/`
- Backend health: `http://4.155.227.179/health`
- API base: `http://4.155.227.179/api`

## What is online now
The production path is no longer browser-only demo state for core user flows.

### Auth + pet core
- register / login via backend auth
- pet profile load / save / delete via MySQL-backed APIs
- relogin white-screen crash fixed

### Marketplace + adoption
- marketplace listings are persisted in MySQL
- image uploads survive Firebase-storage failure by falling back to inline payloads
- adoption page now reads real shared `free` listings from backend data instead of pure mock cards

### Messages + chat
- conversations list, message send, message read state all use backend persistence
- fixed conversation lookup SQL for `online-*` users

### AI
- `/api/ai/chat` is live
- if upstream model auth fails, backend returns a local pet-care fallback reply instead of 500

### Community / map extras
- community feed posts/comments/likes use backend APIs
- match profile can now persist through backend endpoints
- map check-ins now persist through backend endpoints and show shared history for the signed-in user

## Repo structure
```text
.
├── frontend/                # buildable React source used for deployment
├── backend/                 # Express + MySQL API server
├── apps/                    # historical/backup material from the original project
└── README.md
```

## Key frontend pages
- `frontend/src/pages/MarketplacePage.js`
- `frontend/src/pages/AdoptPage.js`
- `frontend/src/pages/MessagesPage.js`
- `frontend/src/pages/ChatPage.js`
- `frontend/src/pages/AIPage.js`
- `frontend/src/pages/CommunityPage.js`
- `frontend/src/pages/MapPage.js`

## Local development
### Frontend
```bash
cd frontend
npm install
npm start
npm run build
```

Optional env:
```bash
echo REACT_APP_API_URL=/api > frontend/.env.production
```

### Backend
```bash
cd backend
npm install
cp .env.example .env
# fill in keys if you want real upstream AI
node src/index.js
```

## Production deploy notes
The current server uses nginx to serve the React build from `/var/www/gg-bond` and proxies `/api/` to the Node process on port `5000`.

Typical redeploy:
```bash
cd frontend
npm run build
sudo rsync -a --delete build/ /var/www/gg-bond/

cd ../backend
node src/index.js
```

## Important backend endpoints
### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Pet
- `GET /api/users/:uid/pet`
- `PUT /api/users/:uid/pet`
- `POST /api/users/:uid/pet/activity`
- `DELETE /api/users/:uid/pet`

### Marketplace / adoption
- `GET /api/marketplace`
- `POST /api/marketplace`
- `GET /api/adoptions`

### Chat
- `GET /api/conversations?uid=...`
- `GET /api/conversations/:id/messages`
- `POST /api/conversations/:id/messages`
- `POST /api/conversations/:id/read`

### Community
- `GET /api/community/posts`
- `POST /api/community/posts`
- `POST /api/community/posts/:id/like`
- `GET /api/community/posts/:id/comments`
- `POST /api/community/posts/:id/comments`
- `GET /api/community/match-profile?uid=...`
- `PUT /api/community/match-profile`
- `GET /api/community/matches?uid=...`

### Map / AI / other game systems
- `GET /api/map/checkins?uid=...`
- `POST /api/map/checkin`
- `POST /api/ai/chat`
- `GET /api/training?uid=...`
- `GET /api/rewards?uid=...`
- `GET /api/achievements?uid=...`
- `GET /api/health?uid=...`
- `GET /api/inventory?uid=...`
- `GET /api/leaderboard`

## Notes
- `frontend/` is the cleaned buildable source to keep in Git.
- `apps/` contains older project material and should not be treated as the deployment source of truth.
- do not commit real `.env` values.
