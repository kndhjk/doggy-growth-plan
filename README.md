# Doggy Growth Plan

> 虚拟宠物成长平台，支持喂食、喝水、洗澡、AI 对话、社区社交和地图探索。

---

## 功能一览

- **宠物养成** — 水分、心情、体重实时衰减，支持洗澡/喂食/喝水等交互
- **年龄预览滑块** — 拖动查看宠物在不同年龄阶段的样子（V2 页面）
- **AI 助手** — 基于 Firebase + Kimi API 的宠物 AI 对话
- **市场** — 宠物交易平台，支持图片上传、搜索过滤、卖家联系、应用内消息
- **社区** — 用户分享宠物卡片、评论互动
- **地图** — Google Maps 整合，展示周边用户
- **多语言** — 支持英文、中文、日语、毛利语

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React + Vite |
| 样式 | Tailwind CSS |
| 状态管理 | React Context (AuthContext, PetContext) |
| 后端 | Firebase (Auth + Firestore) + Vercel Serverless Functions |
| AI | Kimi (moonshot) API |
| 地图 | Google Maps API |
| 市场 | Firebase Storage + Firestore |
| 部署 | Vercel (前端) + 作业测试服务器 (后端) |

---

## 目录结构

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout/         # 全局布局 (TabBar, safe-area)
│   │   └── Pet/            # 宠物相关组件
│   │       ├── ActionRing.js      # 底部操作按钮环
│   │       ├── StatusRow.js       # 状态指标行
│   │       ├── SpeechBubble.js    # 气泡对话框
│   │       ├── StatusBar.js       # 状态条
│   │       └── ...
│   ├── pages/
│   │   ├── PetPage.js            # 宠物主页 (V1)
│   │   ├── PetPageV2.js          # 宠物主页 V2 (含年龄滑块)
│   │   ├── MarketplacePage.js    # 宠物市场（列表/发布/详情）
│   │   ├── MessagesPage.js       # 消息列表页
│   │   ├── ChatPage.js           # 聊天页面
│   │   └── ...
│   ├── sandbox/            # 实验性页面 (PetPageV2, statusDecayV2)
│   ├── context/            # AuthContext, PetContext
│   ├── services/           # Firebase, authFallback, achievementsService
│   └── i18n/               # 多语言 (en, zh, ja, mi)
api/                    # Vercel Serverless Functions
```

---

## 移动端适配修复记录 (2026-05-09)

### 问题 1: 底部 TabBar 被遮挡
**根因**: 根容器 `100vh` 在移动端会被浏览器地址栏/工具栏吃掉；`paddingBottom: 72` 没加 `safe-area-inset`，iPhone 底部 Home Bar 遮挡内容。

**修复** (`Layout.js`):
```js
// 前
minHeight: '100vh'
paddingBottom: 72

// 后
minHeight: '100dvh'  // dvh = dynamic viewport height，不受地址栏影响
paddingBottom: 'calc(72px + env(safe-area-inset-bottom))'
```

### 问题 2: ActionRing 按钮被裁掉
**根因**: 外层容器设了 `height: calc(100dvh - 72px)` + `overflow: hidden`，把按钮区域截断。

**修复** (`PetPage.js` → V2):
```js
// 前
height: 'calc(100dvh - 72px)'
overflow: hidden

// 后
minHeight: 0
flex: 1
// .v2-stage: overflow-y: auto; overflow-x: hidden
// .v2-playground: overflow: visible
```

### 问题 3: StatusRow 和 ActionRing 之间太挤
**根因**: `gap` 偏大 + `margin-bottom` 偏小。

**修复** (`StatusRow.js`):
```js
gap: 8 → 4px
margin-bottom: 20 → 12px
```

### 问题 4: 气泡被 StatusRow/StatusBar 盖住
**根因**: 气泡 `top: -10` 位置太低，`zIndex: 5` 比 StatusRow (`z-index: 3`) 只高一点，仍被指标盖住。

**修复** (`SpeechBubble.js`):
```js
top: -10 → -20
zIndex: 5 → 20
```

### 问题 5: 语言切换后 Home 页面 UI 不同步
**根因**: `PetPageV2.js` 中大量 UI 文字硬编码了中文（如"实时状态"、"今日照顾清单"、"活动记录"等），没有走 i18n 的 `t()` 函数，切换语言后这些地方不更新。

**修复** (`PetPageV2.js` + 4 个 locale 文件):
- 新增 `pet.home.*` 系列翻译 key（活动类型、相处天数、实时状态、今日照顾清单、暂无记录、活动记录、暂无活动记录、今日天气、AI 健康洞察等）
- 所有硬编码中文替换为 `t('key')` 调用：StatusPill 标签、QuickBtn 标签 + handleMain/handleSecondary 参数、careItems 清单 label、Section 标题、labelMap、AI 健康消息模板

---

## Admin 后台管理 (`/admin`)

访问 `http://4.155.227.179/admin`，使用管理员密码登录。

### 页面功能

| 模块 | 功能 |
|------|------|
| **📊 总览** | 显示用户总数/宠物总数/今日活跃/平均健康，最新 20 条动态 |
| **👥 用户** | 用户列表（邮箱/昵称/注册时间/最后登录），搜索过滤、禁用/启用、删除 |
| **🐕 宠物** | 宠物列表（名字/品种/年龄/主人），搜索过滤、今日活跃筛选、编辑资料、删除 |
| **📋 动态** | 所有用户活动记录，含时间/用户/宠物/类型 |
| **📢 广播** | 发送系统广播通知到数据库 |

### 后端 API 端点 (`/api/admin/*`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/stats` | 获取平台统计数据 |
| GET | `/users` | 获取所有用户列表 |
| POST | `/users/:uid/disable` | 禁用/启用用户 |
| DELETE | `/users/:uid` | 删除用户（同时删除 Auth 账户） |
| GET | `/pets` | 获取所有宠物 |
| PATCH | `/pets/:uid` | 更新宠物资料 |
| DELETE | `/pets/:uid` | 删除宠物 |
| GET | `/activities` | 获取活动记录 |
| POST | `/broadcast` | 发送广播通知 |

---

## 部署

### 前端 (Vercel)
```bash
cd frontend
npm install
npm run build
# Vercel 自动检测 vercel.json
```

### 后端 (作业测试服务器)
- IP: `4.155.227.179`
- SSH: `destiny@4.155.227.179`
- 代码路径: `/home/destiny/apps/group-project-gg-bond-main/frontend`

---

## 团队 (CS732 - Team GG Bond)

- Huanhuan Li, Jiayi Lyu, Xiang Zhang, **Ming Zhao**, Xingyan Zhou, Kejun Xu
- GitHub: [UOA-CS732-S1-2026/group-project-gg-bond](https://github.com/UOA-CS732-S1-2026/group-project-gg-bond)
- 个人备份: [kndhjk/doggy-growth-plan](https://github.com/kndhjk/doggy-growth-plan)