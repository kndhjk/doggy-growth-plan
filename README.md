# 🐾 GG Bond Pet Platform

> A full-featured pet management platform for tracking pet health, activity, community matching, and more — built with React and Node.js.

## 🌐 Live Demo

**Frontend:** https://4.155.227.179  
**Backend API:** https://4.155.227.179/api

## 📁 Project Structure

```
gg-bond-pet-platform/
├── frontend/          React (Create React App)
│   ├── src/
│   │   ├── pages/         # Route pages
│   │   │   ├── AdoptPage.js
│   │   │   ├── HealthRecordsPage.js
│   │   │   ├── InventoryPage.js
│   │   │   ├── LeaderboardPage.js
│   │   │   ├── MapPage.js
│   │   │   └── MarketplacePage.js
│   │   ├── components/    # Shared UI components
│   │   ├── context/       # React context (Auth, Pet state)
│   │   ├── i18n/          # Internationalization (EN/ZH/JA/MI)
│   │   ├── services/      # API client layer
│   │   └── utils/         # Helpers (responsive, translate)
│   └── package.json
└── backend/           Node.js + Express
    ├── src/
    │   ├── index.js           # Express server + mock data routes
    │   └── routes/
    │       └── ai.js          # AI endpoints (Groq translation)
    └── package.json
```

## ✨ Features

### Pages
| Page | Description |
|------|-------------|
| 🏪 **Marketplace** | Pet/product listings with search and filter |
| 💊 **Health Records** | Vaccination, vet visits, health history |
| 🏆 **Leaderboard** | Pet rankings by happiness, activity, newcomer |
| 🎒 **Inventory** | Pet supplies and items management |
| 🗺️ **Map** | Google Maps integration for pet-friendly places |
| 🐾 **Adopt** | Pet adoption listings |

### Core
- 🌐 **i18n** — Full internationalization (English, Chinese, Japanese, Māori)
- 🤖 **AI Translation** — Real-time content translation via Groq API
- 📱 **Responsive** — Mobile-first design with adaptive layouts
- 🔄 **Offline Fallback** — localStorage-based fallback when API is unavailable
- 🎨 **Framer Motion** — Smooth page transitions and micro-animations
- 🗄️ **Firebase** — Auth and Firestore for real-time data

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- (Optional) Groq API key for AI translation

### Frontend Setup

```bash
cd frontend
npm install

# Create .env.production for production build
echo "REACT_APP_API_URL=/api" > .env.production

npm start        # Development server at http://localhost:3000
npm run build    # Production build → build/
```

### Backend Setup

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env: set GROQ_API_KEY and PORT

npm start        # Production server on port 5000
npm run dev      # Development with auto-reload
```

### Production Deployment (Nginx)

```bash
# Build frontend
cd frontend
CI=true npm run build

# Deploy to nginx
sudo rsync -a --delete build/ /var/www/gg-bond/
sudo chown -R www-data:www-data /var/www/gg-bond/
```

Sample nginx config is included in `deploy_ggbond_static.sh`.

## 🔑 Environment Variables

### Frontend (`.env.production`)
| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Backend API base URL (e.g. `/api`) |

### Backend (`.env`)
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `5000`) |
| `GROQ_API_KEY` | Groq API key for AI translation |

## 🗂️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/marketplace` | Marketplace listings |
| GET | `/api/health-records` | Health records |
| GET | `/api/inventory` | Inventory items |
| GET | `/api/leaderboard` | Leaderboard rankings |
| GET | `/api/ai/translate` | AI translation (Groq) |
| GET | `/health` | Health check |

## 🧠 i18n Languages

| Code | Language |
|------|----------|
| `zh` | Chinese (中文) |
| `en` | English |
| `ja` | Japanese (日本語) |
| `mi` | Māori |

Language persists in localStorage and switches UI strings live.

## 📝 License

MIT — free to use and modify.
