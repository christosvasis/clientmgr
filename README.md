# ClientMgr

Internal client management and software launcher tool built with React, Firebase, and Tailwind CSS.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 8, Tailwind CSS 4 |
| Auth & Database | Firebase Auth, Firestore |
| API | Vercel serverless functions (Node.js) |
| Hosting | Vercel |

---

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm run preview    # preview production build locally
```

### Environment Variables

Set in your Vercel project dashboard (required for API routes):

| Variable | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Contents of your Firebase service account JSON (stringified) |

---

## Project Structure

```
clientmgr/
├── firestore.rules               # Server-side authorization (deploy separately)
│
├── api/                          # Vercel serverless functions
│   ├── _firebase.js              # Shared Firebase Admin initialization
│   ├── create-user.js            # POST /api/create-user
│   ├── delete-user.js            # POST /api/delete-user
│   └── update-user.js            # POST /api/update-user
│
├── src/
│   ├── main.jsx                  # App entry point, providers, zoom init
│   ├── App.jsx                   # Root router + ProtectedRoute guard
│   ├── index.css                 # Tailwind import, theme vars, cm-* classes
│   │
│   ├── firebase/
│   │   └── config.js             # Firebase client SDK initialization
│   │
│   ├── context/
│   │   ├── AuthContext.jsx       # Firebase auth state + user profile
│   │   └── ThemeContext.jsx      # Dark/light mode toggle
│   │
│   ├── hooks/
│   │   └── useClients.js         # Firestore clients subscription hook
│   │
│   ├── lib/
│   │   └── api.js                # adminFetch — authenticated API helper
│   │
│   ├── utils/
│   │   └── zoom.js               # applyZoom — UI zoom utility
│   │
│   ├── components/
│   │   ├── Layout.jsx            # App shell (topbar + sidebar slot)
│   │   ├── Sidebar.jsx           # Nav links, admin link, logout
│   │   ├── ClientPanel.jsx       # Slide-in panel: client details & edit
│   │   ├── StatusBadge.jsx       # Active / Inactive / On Hold badge
│   │   ├── Tabs.jsx              # Tab bar component
│   │   ├── ui/
│   │   │   ├── AuthLayout.jsx    # Auth page shell (grid bg + logo)
│   │   │   └── SearchInput.jsx   # Search input with clear button
│   │   └── admin/
│   │       ├── ClientManager.jsx # Add/edit/delete clients (admin)
│   │       ├── PendingRequests.jsx# Approve/reject signup requests
│   │       └── UserManager.jsx   # Create users, manage roles
│   │
│   └── pages/
│       ├── Dashboard.jsx         # Nested route container inside Layout
│       ├── Home.jsx              # Client search + table + recently used
│       ├── Notes.jsx             # Notes grid + NoteModal
│       ├── Settings.jsx          # Zoom, base path, account info
│       ├── Admin.jsx             # Admin panel with tabs
│       ├── Login.jsx             # Sign in form
│       └── Signup.jsx            # Request access form
```

---

## Architecture

### Authentication flow

```
Firebase Auth (onAuthStateChanged)
  └── AuthContext  →  { user, profile, isAdmin, isPowerUser, isApproved }
        └── ProtectedRoute  →  redirects to /login if not approved
              └── Dashboard  →  Layout + nested routes
```

A user goes through three states after signup:
1. **pending** — account created, awaiting admin approval
2. **approved** — can log in and access the app
3. **rejected** — sign-in is blocked with an error message

### Role system

| Flag | Access |
|---|---|
| `isAdmin` | Full admin panel: manage users, approve requests, manage clients |
| `isPowerUser` | Can edit client notes and status in `ClientPanel` and `Notes` |
| (neither) | Read-only: search clients, view notes |

### Theme system

CSS custom properties are declared in `index.css` under `:root[data-theme="dark"]` and `:root[data-theme="light"]`. `ThemeContext` sets the `data-theme` attribute on `<html>` and persists the choice in `localStorage`. All component styling references these variables (`var(--bg)`, `var(--accent)`, etc.) so the whole app responds to theme changes without re-rendering.

### UI zoom

`applyZoom(zoom)` in `src/utils/zoom.js` scales the `#zoom-root` div (which wraps the entire authenticated app) using CSS `transform: scale()`. This lets users compensate for high-DPI screens or personal preference. The setting is persisted in `localStorage` under `uiZoom` (range: 80–130, default: 100).

---

## Firestore Schema

```
clients/
  <docId>: {
    name:     string          // Display name, e.g. "Acme Corp"
    path:     string          // Folder name, e.g. "acme_corp"
    status:   "active" | "inactive" | "on_hold"
    notes:    string          // Free-form markdown-safe text
    software: [               // Launchable programs
      {
        key:   string         // Unique identifier, e.g. "crm"
        label: string         // Display name, e.g. "CRM Tool"
        exe:   string         // Executable filename, e.g. "crm.exe"
      }
    ]
  }

users/
  <uid>: {
    email:       string
    isAdmin:     boolean
    isPowerUser: boolean
    status:      "pending" | "approved" | "rejected"
    createdAt:   ISO 8601 string
  }
```

---

## Security

The client-side role checks (`isAdmin`, `isPowerUser`, `canEdit`) control what the
UI *shows* — they are **not** a security boundary. Anyone authenticated can talk to
Firestore directly, so authorization is enforced server-side in two places:

1. **`firestore.rules`** — role-based read/write rules for the `clients` and `users`
   collections (see the file for the full policy). Apply them via the Firebase
   console (Firestore → Rules) or, with the Firebase CLI configured:
   ```bash
   firebase deploy --only firestore:rules
   ```
2. **API routes** (`api/*.js`) — verify the caller's Firebase ID token and confirm
   `isAdmin` against Firestore before any privileged Auth operation.

> The rules require an explicit `status: 'approved'` on a user doc. The client also
> accepts a *missing* status field as approved (legacy docs); the rules fail closed
> instead. Backfill any legacy users with `status: 'approved'`.

## API Routes

All routes are Vercel serverless functions that require a valid Firebase ID token in the `Authorization: Bearer <token>` header. The caller must be an admin (verified server-side against Firestore).

| Route | Method | Body | Description |
|---|---|---|---|
| `/api/create-user` | POST | `{ email, password, isAdmin, isPowerUser }` | Create a new approved user |
| `/api/update-user` | POST | `{ uid, isAdmin, isPowerUser }` | Update user roles |
| `/api/delete-user` | POST | `{ uid }` | Delete user from Auth + Firestore |

All routes share Firebase Admin initialization via `api/_firebase.js`.

---

## Key Components

### `useClients` hook
Subscribes to the Firestore `clients` collection ordered by name. Returns `{ clients, setClients, loading }`. Used by `Home`, `Notes`, and `ClientManager` — a single subscription per page.

### `adminFetch(path, currentUser, body)`
Retrieves a fresh Firebase ID token, then POSTs to a Vercel API route. Throws if the response is not OK so callers only need a single `try/catch`.

### `AuthLayout`
Shared wrapper for `Login` and `Signup`: renders the dark grid background, the CLIENTmgr logo, and centers the card. Children are rendered inside.

### `SearchInput`
Controlled search input with a clear button (`x`). Accepts `value`, `onChange(string)`, `placeholder`, and an optional `inputRef` for programmatic focus.

### `Sidebar`
Standalone component (not defined inside `Layout`) that renders nav links, the admin link (if `isAdmin`), and the logout button. Handles its own `signOut` call and navigation. Receives `collapsed`, `setCollapsed`, `mobile`, and `onClose` as props.

---

## Customization

### Change allowed signup domain
Edit `ALLOWED_DOMAIN` at the top of `src/pages/Signup.jsx`:
```js
const ALLOWED_DOMAIN = '@yourcompany.com'
```

### Add a new nav item
Add an entry to `NAV_ITEMS` in `src/components/Sidebar.jsx`:
```js
{ to: '/reports', label: 'Reports', icon: '▤', end: false }
```
Then add the corresponding `<Route>` in `src/pages/Dashboard.jsx`.

### Add a client status
1. Add the value to `STATUS_OPTIONS` in `src/components/ClientPanel.jsx`
2. Add the Firestore `select` option in `src/components/admin/ClientManager.jsx`
3. Add the badge style to both `STATUS_DARK` and `STATUS_LIGHT` in `src/components/StatusBadge.jsx`

### Change the theme colours
Edit the CSS variables in `src/index.css` under `:root[data-theme="dark"]` or `:root[data-theme="light"]`.

## Styling conventions

Interactive hover/focus states live in reusable `cm-*` classes in `src/index.css`
(e.g. `cm-btn-primary`, `cm-btn-save`, `cm-input`, `cm-row`, `cm-card`, `cm-chip`,
`cm-hover-text`, `cm-link`). They own both the base and `:hover`/`:focus` colours so
the hover actually wins — an inline `style` would override a `:hover` rule. Prefer
adding/extending a `cm-*` class over per-element `onMouseOver`/`onMouseOut` handlers.
