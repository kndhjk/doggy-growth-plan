# 需要在 Vercel 后端 API 项目配置的环境变量
# 去 https://vercel.com → doggy-growth-plan 项目 → Settings → Environment Variables

FIREBASE_PROJECT_ID=你的Firebase项目ID
FIREBASE_CLIENT_EMAIL=你的Firebase服务账号邮箱
FIREBASE_PRIVATE_KEY=你的Firebase私钥（很长，包含\n换行符）
GEMINI_API_KEY=你的Google Gemini API Key
GOOGLE_MAPS_API_KEY=你的Google Maps API Key

# 前端 (doggy-growth-plan-frontend) 需要配置：
REACT_APP_FIREBASE_API_KEY=同上Firebase的apiKey
REACT_APP_FIREBASE_AUTH_DOMAIN=你的Firebase项目.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=同上
REACT_APP_FIREBASE_STORAGE_BUCKET=你的Firebase存储桶
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=你的Firebase messaging sender ID
REACT_APP_FIREBASE_APP_ID=你的Firebase app ID
REACT_APP_API_URL=https://doggy-growth-plan-bvss.vercel.app