// =====================
// Firebase Auth
// =====================
import { initializeApp }   from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyBJii3XONCMHHDpm9TrqYwHKZ4rJSEb_CI",
  authDomain:        "clientmgr-b66ae.firebaseapp.com",
  projectId:         "clientmgr-b66ae",
  storageBucket:     "clientmgr-b66ae.firebasestorage.app",
  messagingSenderId: "416134439201",
  appId:             "1:416134439201:web:a2482a79088e9ee0d5de60"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth        = getAuth(firebaseApp);

// Auth guard — redirect to login if not signed in
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // Show logged-in email in topbar
  const topbarUser = document.querySelector('.topbar-user');
  if (topbarUser) topbarUser.textContent = user.email;

  // Avatar initials from email
  const avatarEl = document.querySelector('.avatar');
  if (avatarEl) avatarEl.textContent = user.email.slice(0, 2).toUpperCase();
});


// =====================
// Client Data
// Replace these with your real clients.
// 'path' is the subfolder name inside basePath.
// =====================
const clients = [
  { name: "Acme Corp",     path: "acme_corp"     },
  { name: "Blue Ridge",    path: "blue_ridge"    },
  { name: "Client Alpha",  path: "client_alpha"  },
  { name: "Client Beta",   path: "client_beta"   },
  { name: "Delta Systems", path: "delta_systems" },
  { name: "Echo Works",    path: "echo_works"    },
  { name: "Foxwell Inc",   path: "foxwell_inc"   },
  { name: "Green Valley",  path: "green_valley"  },
].sort((a, b) => a.name.localeCompare(b.name));


// =====================
// State (persisted via localStorage)
// =====================
let basePath     = localStorage.getItem('basePath')     || '/project/';
let recentlyUsed = JSON.parse(localStorage.getItem('recentlyUsed') || '[]');
let lastLaunched = JSON.parse(localStorage.getItem('lastLaunched')  || '{}');
let notes        = JSON.parse(localStorage.getItem('notes')         || '{}');
let openNotes    = new Set(); // not persisted — resets on page load


// =====================
// DOM References
// =====================
const searchInput  = document.getElementById('search');
const clearBtn     = document.getElementById('clear-btn');
const searchHint   = document.getElementById('search-hint');
const idleState    = document.getElementById('idle-state');
const emptyState   = document.getElementById('empty-state');
const emptyTerm    = document.getElementById('empty-term');
const clientTable  = document.getElementById('client-table');
const tbody        = document.getElementById('client-tbody');
const resultCount  = document.getElementById('result-count');
const launchMsg    = document.getElementById('launch-msg');
const recentSec    = document.getElementById('recent-section');
const recentChips  = document.getElementById('recent-chips');
const basePathInput = document.getElementById('base-path-input');
const saveBtn      = document.getElementById('save-settings');
const saveConfirm  = document.getElementById('save-confirm');


// =====================
// Init
// =====================
document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-GB', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
});

basePathInput.value = basePath;
renderRecent();


// =====================
// Navigation
// =====================
// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  signOut(auth).then(() => {
    window.location.href = 'login.html';
  });
});


// =====================
// Navigation
// =====================
document.querySelectorAll('.nav-item[data-view]').forEach(item => {
  item.addEventListener('click', () => {
    const view = item.dataset.view;

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');

    if (view === 'dashboard') {
      setTimeout(() => searchInput.focus(), 50);
    }
  });
});


// =====================
// Settings
// =====================
saveBtn.addEventListener('click', () => {
  basePath = basePathInput.value.trim() || '/project/';
  localStorage.setItem('basePath', basePath);
  saveConfirm.style.opacity = '1';
  setTimeout(() => saveConfirm.style.opacity = '0', 2000);
});


// =====================
// Search
// =====================
searchInput.addEventListener('input', () => render(searchInput.value));

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchInput.focus();
  render('');
});


// =====================
// Keyboard Shortcut: / to focus search
// =====================
document.addEventListener('keydown', e => {
  const tag = document.activeElement.tagName;
  if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
    e.preventDefault();
    // Switch to dashboard view
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-nav="dashboard"]').classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-dashboard').classList.add('active');
    searchInput.focus();
  }
});


// =====================
// Launch
// =====================
function launch(clientName, software) {
  // Record timestamp and update recently used
  lastLaunched[clientName] = Date.now();
  localStorage.setItem('lastLaunched', JSON.stringify(lastLaunched));

  addRecent(clientName);

  // Show launch message
  const client = clients.find(c => c.name === clientName);
  const swLabel = software === 'sw_a' ? 'Software A' : 'Software B';
  const fullPath = `${basePath}${client.path}/${software}.exe`;
  showLaunchMsg(`Launched ${swLabel} → ${fullPath}`);

  // Re-render to update timestamp
  render(searchInput.value);

  // Fire the protocol handler.
  // This triggers the "Open ClientMgr Launcher?" popup in the browser.
  const protocolUrl = `clientmgr://launch/${client.path}/${software}`;
  const a = document.createElement('a');
  a.href = protocolUrl;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


// =====================
// Notes
// =====================
function toggleNotes(clientName) {
  if (openNotes.has(clientName)) {
    openNotes.delete(clientName);
  } else {
    openNotes.add(clientName);
  }
  render(searchInput.value);

  if (openNotes.has(clientName)) {
    setTimeout(() => {
      const ta = document.getElementById('ta_' + safeId(clientName));
      if (ta) ta.focus();
    }, 30);
  }
}


// =====================
// Recently Used
// =====================
function addRecent(clientName) {
  recentlyUsed = [clientName, ...recentlyUsed.filter(n => n !== clientName)].slice(0, 4);
  localStorage.setItem('recentlyUsed', JSON.stringify(recentlyUsed));
  renderRecent();
}

function renderRecent() {
  if (!recentlyUsed.length) {
    recentSec.style.display = 'none';
    return;
  }
  recentSec.style.display = 'block';
  recentChips.innerHTML = recentlyUsed.map(name =>
    `<div class="chip" data-name="${name}">
      <span class="chip-dot"></span>${name}
    </div>`
  ).join('');

  recentChips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      searchInput.value = chip.dataset.name;
      render(chip.dataset.name);
      searchInput.focus();
    });
  });
}


// =====================
// Render Table
// =====================
function render(query) {
  const q = query.trim();

  clearBtn.style.display  = q ? 'block' : 'none';
  searchHint.style.display = q ? 'none' : 'flex';

  if (!q) {
    idleState.style.display   = 'block';
    clientTable.style.display = 'none';
    emptyState.style.display  = 'none';
    resultCount.textContent   = '';
    return;
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(q.toLowerCase())
  );

  idleState.style.display = 'none';

  if (!filtered.length) {
    clientTable.style.display = 'none';
    emptyState.style.display  = 'block';
    emptyTerm.textContent     = q;
    resultCount.textContent   = '0 clients found';
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const ts  = lastLaunched[c.name];
    const sub = ts
      ? `<div class="client-sub">
           <i class="ti ti-clock" style="font-size:10px"></i>
           ${timeAgo(ts)}
         </div>`
      : '';

    const notesOpen = openNotes.has(c.name);
    const savedNote = notes[c.name] || '';

    const mainRow = `
      <tr class="client-row">
        <td>
          <div class="client-name-text">${highlight(c.name, q)}</div>
          ${sub}
        </td>
        <td>
          <button class="notes-btn ${notesOpen ? 'open' : ''}"
                  data-client="${c.name}"
                  title="Toggle notes">
            <i class="ti ti-notes"></i>
          </button>
        </td>
        <td>
          <button class="launch-btn btn-a"
                  data-client="${c.name}"
                  data-sw="sw_a">
            <i class="ti ti-player-play" style="font-size:11px"></i> Launch
          </button>
        </td>
        <td>
          <button class="launch-btn btn-b"
                  data-client="${c.name}"
                  data-sw="sw_b">
            <i class="ti ti-player-play" style="font-size:11px"></i> Launch
          </button>
        </td>
      </tr>`;

    const notesRow = notesOpen ? `
      <tr class="notes-row">
        <td colspan="4">
          <div class="notes-inner">
            <textarea
              class="notes-textarea"
              id="ta_${safeId(c.name)}"
              data-client="${c.name}"
              placeholder="Notes for ${c.name}..."
            >${savedNote}</textarea>
          </div>
        </td>
      </tr>` : '';

    return mainRow + notesRow;
  }).join('');

  // Wire up buttons and textareas
  tbody.querySelectorAll('.launch-btn').forEach(btn => {
    btn.addEventListener('click', () => launch(btn.dataset.client, btn.dataset.sw));
  });

  tbody.querySelectorAll('.notes-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleNotes(btn.dataset.client));
  });

  tbody.querySelectorAll('.notes-textarea').forEach(ta => {
    ta.addEventListener('input', () => {
      notes[ta.dataset.client] = ta.value;
      localStorage.setItem('notes', JSON.stringify(notes));
    });
  });

  clientTable.style.display = '';
  emptyState.style.display  = 'none';
  resultCount.textContent   = `${filtered.length} client${filtered.length !== 1 ? 's' : ''} found`;
}


// =====================
// Utils
// =====================
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}

function highlight(text, q) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return text;
  return (
    text.slice(0, i) +
    '<mark class="highlight">' + text.slice(i, i + q.length) + '</mark>' +
    text.slice(i + q.length)
  );
}

function safeId(name) {
  return name.replace(/[^a-zA-Z0-9]/g, '_');
}

function showLaunchMsg(msg) {
  launchMsg.textContent  = msg;
  launchMsg.style.opacity = '1';
  setTimeout(() => launchMsg.style.opacity = '0', 3000);
}
