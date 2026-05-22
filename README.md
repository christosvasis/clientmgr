# ClientMgr — React

Internal client management and software launcher tool.

## Tech Stack
- React + Vite
- Tailwind CSS
- Firebase Auth + Firestore
- Vercel (hosting + serverless functions)

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally
```bash
npm run dev
```

### 3. Deploy to Vercel
- Push to GitHub
- Connect repo in Vercel dashboard
- Add environment variable: `FIREBASE_SERVICE_ACCOUNT` = contents of your Firebase service account JSON

## Project structure
```
src/
├── components/
│   ├── admin/
│   │   ├── ClientManager.jsx   — Add/edit/delete clients
│   │   ├── PendingRequests.jsx — Approve/reject signups
│   │   └── UserManager.jsx     — Manage users and roles
│   ├── ClientPanel.jsx         — Slide-in client details panel
│   ├── Layout.jsx              — Sidebar + topbar shell
│   ├── StatusBadge.jsx         — Active/Inactive/On Hold badge
│   └── Tabs.jsx                — Tab navigation component
├── context/
│   ├── AuthContext.jsx         — Firebase auth + user profile
│   └── ThemeContext.jsx        — Dark/light mode toggle
├── firebase/
│   └── config.js               — Firebase initialization
├── pages/
│   ├── Admin.jsx               — Admin panel
│   ├── Dashboard.jsx           — Layout wrapper with routes
│   ├── Home.jsx                — Main search + client table
│   ├── Login.jsx               — Login page
│   ├── Notes.jsx               — All client notes
│   ├── Settings.jsx            — Zoom, base path, account
│   └── Signup.jsx              — Request access page
api/
├── create-user.js              — Vercel serverless: create user
├── delete-user.js              — Vercel serverless: delete user
├── list-users.js               — Vercel serverless: list users
└── update-user.js              — Vercel serverless: update roles
```

## Firestore structure
```
clients/
  <id>: { name, path, status, notes, software: [{ key, label, exe }] }

users/
  <uid>: { email, isAdmin, isPowerUser, status, createdAt }
```

## Allowed signup domain
Edit `ALLOWED_DOMAIN` in `src/pages/Signup.jsx` to match your company email.
