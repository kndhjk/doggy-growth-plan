# GG Bond / Doggy Growth Plan — Beginner Handoff Guide (English)

> This is the English companion to the Chinese README.  
> It is written for teammates who are new to React, Firebase, and full-stack project structure, so we can onboard together.

**Chinese version:** `README.md`  
**English version:** `README_EN.md`

---

## 1. Most important first: where is the real project code?

The current `master` branch was pushed from the test server, so the repository root looks like a server home directory.

### The actual project is here:

```bash
apps/group-project-gg-bond-main/
```

That is the folder we should work inside.

```bash
apps/group-project-gg-bond-main/
├── frontend/   # React frontend
├── backend/    # Express backend
└── README.md   # local project notes if needed later
```

---

## 2. What is this project?

This is a **virtual pet growth platform** with features such as:

- pet creation and pet care interactions
- AI chat / pet assistant
- map exploration
- community posts and comments
- pet marketplace
- adoption page
- inventory system
- leaderboard
- health records
- achievements
- daily rewards
- pet training
- profile page
- messaging / chat
- admin dashboard

---

## 3. Tech stack

### Frontend
- React
- React Router
- Framer Motion
- react-hot-toast
- mostly inline styles
- i18n with Chinese / English / Japanese / Māori

### Backend
- Node.js
- Express
- Firebase Admin
- REST APIs

### Data layer
- Firebase Auth for login/register
- Firestore for user/community/message data
- Firebase Storage for uploads
- localStorage fallback for demos / offline cases

---

## 4. High-level architecture

```text
Browser
  ↓
frontend/src/App.js
  ↓
React Router sends user to a page
  ↓
Page gets data from one or more of:
    1) context
    2) services/apiLayer.js
    3) services/firebase.js
    4) local fallback
  ↓
backend/src/index.js mounts /api/* routes
```

---

## 5. Which files should a beginner read first?

1. `frontend/src/App.js`  
   Learn all routes and page entry points.

2. `frontend/src/components/Layout/Layout.js`  
   Learn the 13 tabs, their order, and responsive layouts.

3. `frontend/src/context/AuthContext.js`  
   Learn login state and auth fallback.

4. `frontend/src/context/PetContext.js`  
   Learn current pet loading / creation / state updates.

5. `backend/src/index.js`  
   Learn how backend routes are mounted.

---

## 6. Full map of the 13 tabs

| # | Tab | Route | Main file | Related logic | Data source |
|---|---|---|---|---|---|
| 1 | Home / Pet | `/` | `frontend/src/sandbox/PetPageV2.js` | `components/Pet/*`, `statusDecayV2.js`, `PetContext.js` | Firestore / local fallback |
| 2 | AI | `/ai` | `frontend/src/pages/AIPage.js` | Auth + Pet context | Firebase + AI API |
| 3 | Map | `/map` | `frontend/src/pages/MapPage.js` | Google Maps logic | Firebase / Maps API |
| 4 | Marketplace | `/marketplace` | `frontend/src/pages/MarketplacePage.js` | `services/api.js`, storage | API + Firebase |
| 5 | Community | `/community` | `frontend/src/pages/CommunityPage.js` | Community components | Firestore |
| 6 | Profile | `/profile` | `frontend/src/pages/ProfilePage.js` | Profile components + i18n | Auth + PetContext |
| 7 | Adopt | `/adopt` | `frontend/src/pages/AdoptPage.js` | mostly UI | static / local data |
| 8 | Achievements | `/achievements` | `frontend/src/pages/AchievementsPage.js` | `AchievementsAPI` | `/api/achievements` + fallback |
| 9 | Inventory | `/inventory` | `frontend/src/pages/InventoryPage.js` | item use logic | `/api/inventory` + local state |
| 10 | Leaderboard | `/leaderboard` | `frontend/src/pages/LeaderboardPage.js` | `LeaderboardAPI` | `/api/leaderboard` |
| 11 | Health | `/health` | `frontend/src/pages/HealthRecordsPage.js` | `HealthAPI` | `/api/health` + fallback |
| 12 | Rewards | `/rewards` | `frontend/src/pages/DailyRewardsPage.js` | `RewardsAPI` | `/api/rewards` + fallback |
| 13 | Training | `/training` | `frontend/src/pages/PetTrainingPage.js` | `TrainingAPI` | `/api/training` + fallback |

---

## 7. Important pages that are not tabs

### Messages
- Route: `/messages`
- File: `frontend/src/pages/MessagesPage.js`
- Purpose: conversation list

### Chat
- Route: `/messages/:conversationId`
- File: `frontend/src/pages/ChatPage.js`
- Purpose: chat detail page

---

## 8. More detailed “where to edit” guide for each tab

### 1) Home / Pet page
Main file:
```bash
frontend/src/sandbox/PetPageV2.js
```
Related files:
```bash
frontend/src/components/Pet/CreatePetModal.js
frontend/src/components/Pet/ActionRing.js
frontend/src/components/Pet/StatusRow.js
frontend/src/components/Pet/DogCharacter.js
frontend/src/context/PetContext.js
frontend/src/sandbox/statusDecayV2.js
```
Edit here for:
- pet home layout
- create pet modal
- feed / water / walk / bath actions
- empty state for new users
- desktop / tablet / mobile display

### 2) AI
Main file:
```bash
frontend/src/pages/AIPage.js
```
Related files:
```bash
backend/src/routes/ai.js
frontend/src/context/AuthContext.js
frontend/src/context/PetContext.js
frontend/src/services/firebase.js
```
Edit here for AI UI, prompt building, and response rendering.

### 3) Map
Main file:
```bash
frontend/src/pages/MapPage.js
```
Backend:
```bash
backend/src/routes/map.js
```
Edit here for map center, markers, nearby pet/user display, and Maps loading.

### 4) Marketplace
Main file:
```bash
frontend/src/pages/MarketplacePage.js
```
Related files:
```bash
frontend/src/services/api.js
backend/src/routes/marketplace.js
frontend/src/services/firebase.js
frontend/src/services/storage.js
```
Edit here for listings, publish form, product images, filters, and sale tabs.

### 5) Community
Main file:
```bash
frontend/src/pages/CommunityPage.js
```
Related files:
```bash
frontend/src/components/Community/CommentList.js
frontend/src/components/Community/MyMatchCard.js
frontend/src/components/PhotoUpload.js
backend/src/routes/community.js
```
Edit here for posting, commenting, images, and social cards.

### 6) Profile
Main file:
```bash
frontend/src/pages/ProfilePage.js
```
Related files:
```bash
frontend/src/components/Profile/PetEditCard.js
frontend/src/components/Profile/AchievementWall.js
frontend/src/context/AuthContext.js
frontend/src/context/PetContext.js
frontend/src/i18n/I18nContext.js
```
Edit here for user profile, pet profile, language switch, and achievements wall.

### 7) Adopt
Main file:
```bash
frontend/src/pages/AdoptPage.js
```
Good beginner entry point for pure UI changes.

### 8) Achievements
Main file:
```bash
frontend/src/pages/AchievementsPage.js
```
Related files:
```bash
frontend/src/services/apiLayer.js
backend/src/routes/achievements.js
frontend/src/services/achievementsService.js
```

### 9) Inventory
Main file:
```bash
frontend/src/pages/InventoryPage.js
```
Related files:
```bash
backend/src/routes/inventory.js
frontend/src/context/PetContext.js
```

### 10) Leaderboard
Main file:
```bash
frontend/src/pages/LeaderboardPage.js
```
Related files:
```bash
frontend/src/services/apiLayer.js
backend/src/routes/leaderboard.js
```

### 11) Health
Main file:
```bash
frontend/src/pages/HealthRecordsPage.js
```
Related files:
```bash
frontend/src/services/apiLayer.js
backend/src/routes/health.js
```

### 12) Rewards
Main file:
```bash
frontend/src/pages/DailyRewardsPage.js
```
Related files:
```bash
frontend/src/services/apiLayer.js
backend/src/routes/rewards.js
```

### 13) Training
Main file:
```bash
frontend/src/pages/PetTrainingPage.js
```
Related files:
```bash
frontend/src/services/apiLayer.js
backend/src/routes/training.js
```

---

## 9. Feature-to-file quick mapping

### Login / Register
- `frontend/src/pages/LoginPage.js`
- `frontend/src/pages/RegisterPage.js`
- `frontend/src/context/AuthContext.js`
- `frontend/src/services/firebase.js`

### Pet creation / pet home
- `frontend/src/sandbox/PetPageV2.js`
- `frontend/src/components/Pet/CreatePetModal.js`
- `frontend/src/context/PetContext.js`
- `frontend/src/sandbox/statusDecayV2.js`
- `backend/src/routes/pet.js`

### Community
- `frontend/src/pages/CommunityPage.js`
- `frontend/src/components/Community/CommentList.js`
- `backend/src/routes/community.js`

### Map
- `frontend/src/pages/MapPage.js`
- `backend/src/routes/map.js`

### Marketplace
- `frontend/src/pages/MarketplacePage.js`
- `frontend/src/services/api.js`
- `backend/src/routes/marketplace.js`

### Inventory / Health / Achievements / Rewards / Training / Leaderboard
Mostly centralized in:
- `frontend/src/services/apiLayer.js`

With backend routes:
- `inventory.js`
- `health.js`
- `achievements.js`
- `rewards.js`
- `training.js`
- `leaderboard.js`

---

## 10. If we only want to change a tab’s UI

Workflow:
1. Open `frontend/src/components/Layout/Layout.js`
2. Find the tab route
3. Open `frontend/src/App.js`
4. Find the page file used by that route
5. Edit that page file

Example for leaderboard:
```bash
frontend/src/pages/LeaderboardPage.js
```

---

## 11. If we want to change feature logic

Look at the `import` lines first.

- imports `context/...` → state comes from global context
- imports `services/apiLayer` → page uses backend API wrapper
- imports `services/firebase` → page talks to Firebase directly
- imports `components/...` → UI pieces are split out elsewhere

---

## 12. Backend API summary

Backend entry:
```bash
backend/src/index.js
```

Mounted APIs:
- `/api/pet`
- `/api/activities`
- `/api/ai`
- `/api/community`
- `/api/map`
- `/api/marketplace`
- `/api/inventory`
- `/api/admin`
- `/api/achievements`
- `/api/training`
- `/api/rewards`
- `/api/health`
- `/api/leaderboard`
- `/health`

---

## 13. Common frontend directories

```bash
frontend/src/
├── pages/         # route-level pages
├── components/    # reusable UI pieces
├── context/       # global state
├── services/      # API / Firebase / fallback utilities
├── sandbox/       # experimental or complex page versions
├── i18n/          # locale files and translation logic
├── data/          # static data
└── utils/         # helper functions
```

---

## 14. Recommended reading order for beginners

### Pass 1: structure only
1. `App.js`
2. `Layout.js`
3. `backend/src/index.js`

### Pass 2: core product flow
4. `AuthContext.js`
5. `PetContext.js`
6. `PetPageV2.js`

### Pass 3: your assigned tab
7. Read the page file
8. Then read its imported services / components / backend route

---

## 15. Good first changes for new teammates

### Easiest
- Adopt page UI
- Profile page text / layout
- tab icon / label in `Layout.js`

### Medium
- leaderboard display logic
- health records form
- rewards visuals

### More complex
- Marketplace
- Community
- Pet page V2
- AI / Firebase / Admin logic

---

## 16. Important recent bugs already fixed

1. New users without pets could hit a blank screen  
   Fixed in `frontend/src/sandbox/PetPageV2.js`

2. Create-pet empty state had leftover debug code  
   Fixed in `frontend/src/sandbox/PetPageV2.js`

3. After rollback, browser cache caused blank page confusion  
   Fixed by nginx cache headers on the server

---

## 17. Local development

### Frontend
```bash
cd apps/group-project-gg-bond-main/frontend
npm install
npm start
```

### Backend
```bash
cd apps/group-project-gg-bond-main/backend
npm install
npm start
```

Health check:
```bash
curl http://localhost:5000/health
```

---

## 18. Test server info

- IP: `4.155.227.179`
- SSH: `destiny@4.155.227.179`
- frontend static dir: `/var/www/gg-bond`
- backend code dir: `/home/destiny/apps/group-project-gg-bond-main/backend`
- frontend code dir: `/home/destiny/apps/group-project-gg-bond-main/frontend`

---

## 19. One sentence teammates should remember

> Find the page in `App.js`, find the tab in `Layout.js`, then follow imports.

---

## 20. Team info

- Team: **GG Bond**
- Course: CS732
- Project: Virtual Pet Growth Platform
- Current maintained repo state: synced to the test server version

---

## 21. What should a teammate do in the first hour after cloning?

1. `cd apps/group-project-gg-bond-main`
2. Read `App.js`
3. Read `Layout.js`
4. Read `AuthContext.js`
5. Read `PetContext.js`
6. Read `backend/src/index.js`
7. Pick one tab and make one tiny safe change first

---

## 22. What are the environment files for?

### Frontend
```bash
apps/group-project-gg-bond-main/frontend/.env.production
```
Usually contains:
- `REACT_APP_API_URL`
- Firebase keys
- Google Maps key
- AI / Gemini related keys

### Backend
```bash
apps/group-project-gg-bond-main/backend/.env
```
Usually contains:
- `PORT=5000`
- `FRONTEND_URL=...`
- Firebase Admin config
- other service keys

Remember:
- changing frontend env usually needs a rebuild
- changing backend env usually needs a restart

---

## 23. How the frontend is layered

1. **Routing layer** → `frontend/src/App.js`
2. **Layout layer** → `frontend/src/components/Layout/Layout.js`
3. **Page layer** → `frontend/src/pages/` and `frontend/src/sandbox/`
4. **Data layer** → `frontend/src/context/` and `frontend/src/services/`

---

## 24. How the backend is layered

1. **Entry layer** → `backend/src/index.js`
2. **Route layer** → `backend/src/routes/*.js`
3. **Shared logic layer** → `backend/src/services/` and `backend/src/middleware/`

---

## 25. Common development tasks and which files to edit

### Change page text
- page file itself
- maybe locale files under `frontend/src/i18n/`

### Change tab order / icon
- `frontend/src/components/Layout/Layout.js`

### Add a button that calls backend
1. page file
2. `services/apiLayer.js` or `services/api.js`
3. `backend/src/routes/xxx.js`

### Change auth logic
- `AuthContext.js`
- `services/firebase.js`

### Change pet decay logic
- `sandbox/statusDecayV2.js`
- possibly `PetContext.js`

---

## 26. How to add a new tab

1. Create a new page file
2. Register route in `App.js`
3. Add a tab item to `Layout.js`
4. Add i18n keys
5. If backend is needed, add service + route + mount it in `backend/src/index.js`

---

## 27. How to do i18n safely

Do **not** hard-code Chinese text directly in pages unless you truly mean Chinese-only content.

Use:
```js
const { t } = useI18n();
```
Then render:
```jsx
{t('nav.home')}
```
And update all locale files, not just one.

---

## 28. Quick mental map of data sources

### Context
For current app state like current user / current pet.

### `services/apiLayer.js`
For wrapped REST-style APIs like achievements, training, rewards, health, leaderboard.

### `services/firebase.js`
For direct Firebase usage like auth, Firestore, messaging, community.

### localStorage fallback
For offline/demo resilience when backend/Firebase is unavailable.

---

## 29. First places to check for common failures

### Blank page
- browser console
- null access in page code
- route mismatch

### Button does nothing
- `onClick`
- handler execution
- API error
- state update swallowed

### Save failed
- which service is used?
- API or Firebase?
- does backend route exist?
- env missing?

### Auth weirdness
- `AuthContext.js`
- `firebase.js`
- local fallback behavior

### Built successfully but no visible change
- did you redeploy `frontend/build/`?
- browser cache?
- correct `REACT_APP_API_URL`?

---

## 30. Ten beginner mistakes to avoid

1. editing the wrong root folder
2. changing UI without changing data flow
3. only updating Chinese text but not i18n
4. mixing context and local state incorrectly
5. forgetting to mount a backend route in `backend/src/index.js`
6. changing env without rebuild/restart
7. assuming blank screen is CSS when it is actually JS error
8. making a huge first change instead of a tiny one
9. ignoring `import` lines and getting lost
10. forgetting browser cache during deployment

---

## 31. Suggested team task split

### Good for beginners
- Adopt
- Profile
- Leaderboard
- Health UI
- Rewards display
- documentation

### Good for intermediate teammates
- Marketplace
- Community
- Inventory
- Achievements
- Training

### Better for stronger teammates
- Auth
- PetContext / PetPageV2
- AI
- Firebase structure
- Admin
- deployment

---

## 32. Recommended git workflow

1. fetch/pull latest code
2. change one feature only
3. run locally and confirm no blank screen
4. test `/health` if backend touched
5. write a clear commit message

Example:
```bash
git add .
git commit -m "fix: leaderboard i18n labels"
git push origin master
```

---

## 33. What docs should be split out later?

Recommended future docs:
- `CONTRIBUTING.md`
- `DEPLOYMENT.md`
- `ARCHITECTURE.md`

---

## 34. A troubleshooting sequence teammates can copy

### I want to change a tab but do not know where to begin
1. check `Layout.js`
2. find route
3. check `App.js`
4. open page file
5. inspect imports
6. follow service/context/component imports
7. if needed, inspect backend route

### I changed something but cannot see it
1. confirm you edited inside `apps/group-project-gg-bond-main/`
2. confirm rebuild happened
3. confirm deployment to `/var/www/gg-bond`
4. confirm cache is cleared

### I added an API and got 404
1. route file created?
2. route mounted in `backend/src/index.js`?
3. path prefix correct?
4. backend restarted?

---

## 35. Three lines for truly new teammates

1. **The real code is inside `apps/group-project-gg-bond-main/`.**
2. **Find pages in `App.js`; find tabs in `Layout.js`.**
3. **Follow imports to find data sources.**

---

## 36. How deployment works

Two modes:

### Local dev
- frontend dev server
- backend Node/Express

### Test server deployment
- frontend built and served by nginx
- backend running on port `5000`
- nginx proxies `/api/*` to backend

---

## 37. What a full test-server deployment actually does

### Frontend
```bash
cd apps/group-project-gg-bond-main/frontend
npm install
CI=true npm run build
```
Then sync `frontend/build/` to `/var/www/gg-bond`.

### Backend
```bash
cd apps/group-project-gg-bond-main/backend
npm install
npm start
```

### Verification
```bash
curl http://127.0.0.1:5000/health
curl -I http://127.0.0.1/
```

---

## 38. Why is `frontend/build/` in git?

Because current `master` came from a server snapshot.

For normal development:
- focus on `src/`
- do not manually edit build artifacts unless you are intentionally snapshotting a deployment

---

## 39. What each backend route roughly owns

| Route file | Responsibility |
|---|---|
| `routes/pet.js` | pet creation / read / update |
| `routes/activities.js` | pet activity logs |
| `routes/ai.js` | AI requests |
| `routes/community.js` | posts / comments / social data |
| `routes/map.js` | map data |
| `routes/marketplace.js` | market listings and publishing |
| `routes/inventory.js` | inventory items |
| `routes/achievements.js` | achievement progress |
| `routes/training.js` | training system |
| `routes/rewards.js` | daily rewards |
| `routes/health.js` | health records |
| `routes/leaderboard.js` | leaderboard data |
| `routes/admin.js` | admin actions |

---

## 40. How to understand the frontend `services/` folder

- `firebase.js` → initialize `auth`, `db`, `storage`
- `api.js` → lower-level API calls
- `apiLayer.js` → business-oriented API wrappers
- `authFallback.js` → local auth fallback
- `petLocalStore.js` → local pet storage fallback
- `storage.js` → upload helpers

---

## 41. Difference between `context/` and `services/`

- `context/` = state containers used by pages/components
- `services/` = tools used to fetch/store/update data

Short version:
> **Context stores state; services move data.**

---

## 42. Difference between `pages/` and `components/`

- `pages/` = route-level full pages
- `components/` = reusable parts used inside pages

Short version:
> **A page is a screen; a component is a part.**

---

## 43. How to tell whether a feature has backend support

- imports `apiLayer` / `api` → likely has backend API
- imports `firebase.js` → likely uses Firebase directly
- only local arrays/state/mock data → maybe frontend-only
- lots of `localStorage` → likely fallback-heavy

---

## 44. Why can one feature have multiple data sources?

Because this is a course project optimized for “it still demos even if something breaks.”

Typical pattern:
- normal path → backend API or Firebase
- fallback path → localStorage
- some pages → mock/static data

When editing a feature, always confirm whether you are changing:
- the real data flow
- or only the fallback/mock layer

---

## 45. Pre-change checklist for teammates

Before editing, ask:
1. which tab/page am I touching?
2. which page file is it?
3. where does data come from?
4. do i18n files need updates?
5. does backend route also need changes?
6. do I need a rebuild?
7. do I need a backend restart?
8. will this break mobile layout?

---

## 46. Review checklist for reviewers

### Page layer
- hard-coded text?
- null checks?
- mobile layout safe?

### Data layer
- correct API usage?
- fallback still works?
- localStorage compatibility?

### Backend layer
- route mounted?
- params validated?
- errors clear enough?

### Deployment layer
- build synced?
- restart requirements documented?

---

## 47. Recommended cleanup order if you refactor the repo later

1. move `apps/group-project-gg-bond-main/` to repo root
2. remove server-only junk from version control
3. decide whether `build/` should remain committed
4. split docs into README / DEPLOYMENT / CONTRIBUTING / ARCHITECTURE

---

## 48. How different people should use this README

### Brand new teammates
Focus on sections 5, 6, 8, and 21 onward.

### Bug fixers
Focus on sections 9, 29, 34, and 45.

### Deployment owners
Focus on sections 17, 18, 36, and 37.

### Repo cleanup owners
Focus on sections 1, 38, and 47.

---

## 49. One realistic note

This is not a perfect textbook architecture.
It is a **working, demoable, feature-heavy course project that depends on documentation to be understandable**.

So when you take it over, do not ask “why is this not perfectly elegant?” first. Ask:
1. where is the page?
2. where does data come from?
3. which layer will my change affect?
4. how do I verify it?

---

## 50. If we only have 30 seconds, read this

```text
Real project folder: apps/group-project-gg-bond-main/
Page entry: frontend/src/App.js
Tab definition: frontend/src/components/Layout/Layout.js
Auth state: frontend/src/context/AuthContext.js
Pet state: frontend/src/context/PetContext.js
Backend entry: backend/src/index.js
API routes: backend/src/routes/*.js
```
