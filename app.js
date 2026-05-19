// =====================
// Firebase
// =====================
import { initializeApp }
  from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  getFirestore, collection, getDocs, getDoc,
  addDoc, deleteDoc, doc, query, orderBy
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

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
const db          = getFirestore(firebaseApp);


// =====================
// State
// =====================
let clients      = [];
let isAdmin      = false;
let basePath     = localStorage.getItem('basePath')     || '/project/';
let recentlyUsed = JSON.parse(localStorage.getItem('recentlyUsed') || '[]');
let lastLaunched = JSON.parse(localStorage.getItem('lastLaunched')  || '{}');
let notes        = JSON.parse(localStorage.getItem('notes')         || '{}');
let openNotes    = new Set();


// =====================
// DOM References
// =====================
const searchInput   = document.getElementById('search');
const clearBtn      = document.getElementById('clear-btn');
const searchHint    = document.getElementById('search-hint');
const idleState     = document.getElementById('idle-state');
const emptyState    = document.getElementById('empty-state');
const emptyTerm     = document.getElementById('empty-term');
const clientTable   = document.getElementById('client-table');
const tbody         = document.getElementById('client-tbody');
const resultCount   = document.getElementById('result-count');
const launchMsg     = document.getElementById('launch-msg');
const recentSec     = document.getElementById('recent-section');
const recentChips   = document.getElementById('recent-chips');
const basePathInput = document.getElementById('base-path-input');
const saveBtn       = document.getElementById('save-settings');
const saveConfirm   = document.getElementById('save-confirm');


// =====================
// Auth Guard
// =====================
onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // Update topbar
  const topbarUser = document.querySelector('.topbar-user');
  if (topbarUser) topbarUser.textContent = user.email;
  const avatarEl = document.querySelector('.avatar');
  if (avatarEl) avatarEl.textContent = user.email.slice(0, 2).toUpperCase();

  // Check if user is admin
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists() && userDoc.data().isAdmin === true) {
      isAdmin = true;
      document.getElementById('admin-nav').style.display = 'flex';
    }
  } catch (e) {
    console.warn('Could not check admin status:', e);
  }

  // Load clients from Firestore
  await loadClients();

  // Init
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  basePathInput.value = basePath;
  renderRecent();
});


// =====================
// Load Clients from Firestore
// =====================
async function loadClients() {
  try {
    const q    = query(collection(db, 'clients'), orderBy('name'));
    const snap = await getDocs(q);
    clients    = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Failed to load clients:', e);
    clients = [];
  }
}


// =====================
// Logout
// =====================
document.getElementById('logout-btn').addEventListener('click', () => {
  signOut(auth).then(() => window.location.href = 'login.html');
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

    if (view === 'dashboard') setTimeout(() => searchInput.focus(), 50);
    if (view === 'admin') {
      renderAdminClients();
      renderAdminUsers();
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
  lastLaunched[clientName] = Date.now();
  localStorage.setItem('lastLaunched', JSON.stringify(lastLaunched));
  addRecent(clientName);

  const client   = clients.find(c => c.name === clientName);
  const swLabel  = software === 'sw_a' ? 'Software A' : 'Software B';
  const fullPath = `${basePath}${client.path}/${software}.exe`;
  showLaunchMsg(`Launched ${swLabel} → ${fullPath}`);

  render(searchInput.value);

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
  openNotes.has(clientName) ? openNotes.delete(clientName) : openNotes.add(clientName);
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
  if (!recentlyUsed.length) { recentSec.style.display = 'none'; return; }
  recentSec.style.display = 'block';
  recentChips.innerHTML = recentlyUsed.map(name =>
    `<div class="chip" data-name="${name}"><span class="chip-dot"></span>${name}</div>`
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
// Render Dashboard Table
// =====================
function render(query) {
  const q = query.trim();

  clearBtn.style.display   = q ? 'block' : 'none';
  searchHint.style.display = q ? 'none'  : 'flex';

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
           <i class="ti ti-clock" style="font-size:10px"></i> ${timeAgo(ts)}
         </div>`
      : '';

    const notesOpen = openNotes.has(c.name);
    const savedNote = notes[c.name] || '';

    const mainRow = `
      <tr class="client-row">
        <td>
          <div class="client-name-text">${highlight(c.name, q)}</div>${sub}
        </td>
        <td>
          <button class="notes-btn ${notesOpen ? 'open' : ''}"
                  data-client="${c.name}" title="Toggle notes">
            <i class="ti ti-notes"></i>
          </button>
        </td>
        <td>
          <button class="launch-btn btn-a" data-client="${c.name}" data-sw="sw_a">
            <i class="ti ti-player-play" style="font-size:11px"></i> Launch
          </button>
        </td>
        <td>
          <button class="launch-btn btn-b" data-client="${c.name}" data-sw="sw_b">
            <i class="ti ti-player-play" style="font-size:11px"></i> Launch
          </button>
        </td>
      </tr>`;

    const notesRow = notesOpen ? `
      <tr class="notes-row">
        <td colspan="4">
          <div class="notes-inner">
            <textarea class="notes-textarea"
              id="ta_${safeId(c.name)}"
              data-client="${c.name}"
              placeholder="Notes for ${c.name}..."
            >${savedNote}</textarea>
          </div>
        </td>
      </tr>` : '';

    return mainRow + notesRow;
  }).join('');

  tbody.querySelectorAll('.launch-btn').forEach(btn =>
    btn.addEventListener('click', () => launch(btn.dataset.client, btn.dataset.sw))
  );
  tbody.querySelectorAll('.notes-btn').forEach(btn =>
    btn.addEventListener('click', () => toggleNotes(btn.dataset.client))
  );
  tbody.querySelectorAll('.notes-textarea').forEach(ta =>
    ta.addEventListener('input', () => {
      notes[ta.dataset.client] = ta.value;
      localStorage.setItem('notes', JSON.stringify(notes));
    })
  );

  clientTable.style.display = '';
  emptyState.style.display  = 'none';
  resultCount.textContent   = `${filtered.length} client${filtered.length !== 1 ? 's' : ''} found`;
}


// =====================
// Admin Panel
// =====================
async function renderAdminClients() {
  if (!isAdmin) return;

  const adminTable   = document.getElementById('admin-client-table');
  const adminTbody   = document.getElementById('admin-client-tbody');
  const adminLoading = document.getElementById('admin-loading');

  adminLoading.style.display = 'block';
  adminTable.style.display   = 'none';

  await loadClients();

  adminTbody.innerHTML = clients.map(c => `
    <tr>
      <td class="client-name-text">${c.name}</td>
      <td style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text3)">${c.path}</td>
      <td>
        <button class="notes-btn delete-client-btn"
                data-id="${c.id}" data-name="${c.name}"
                title="Delete client">
          <i class="ti ti-trash" style="color:var(--danger)"></i>
        </button>
      </td>
    </tr>
  `).join('');

  adminTbody.querySelectorAll('.delete-client-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteClient(btn.dataset.id, btn.dataset.name));
  });

  adminLoading.style.display = 'none';
  adminTable.style.display   = '';
}

// Add client
document.getElementById('admin-add-client').addEventListener('click', async () => {
  const nameInput  = document.getElementById('admin-client-name');
  const pathInput  = document.getElementById('admin-client-path');
  const addConfirm = document.getElementById('admin-add-confirm');
  const addError   = document.getElementById('admin-add-error');

  const name = nameInput.value.trim();
  const path = pathInput.value.trim();

  if (!name || !path) {
    addError.textContent   = 'Both fields are required.';
    addError.style.opacity = '1';
    setTimeout(() => addError.style.opacity = '0', 3000);
    return;
  }

  try {
    await addDoc(collection(db, 'clients'), { name, path });
    nameInput.value          = '';
    pathInput.value          = '';
    addConfirm.style.opacity = '1';
    setTimeout(() => addConfirm.style.opacity = '0', 2000);
    renderAdminClients();
  } catch (e) {
    addError.textContent   = 'Failed to add client.';
    addError.style.opacity = '1';
    setTimeout(() => addError.style.opacity = '0', 3000);
  }
});

// Delete client
async function deleteClient(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    await deleteDoc(doc(db, 'clients', id));
    renderAdminClients();
  } catch (e) {
    alert('Failed to delete client.');
  }
}


// =====================
// User Management
// =====================
async function getToken() {
  return await auth.currentUser.getIdToken();
}

async function renderAdminUsers() {
  if (!isAdmin) return;

  const userTable   = document.getElementById('admin-user-table');
  const userTbody   = document.getElementById('admin-user-tbody');
  const userLoading = document.getElementById('admin-users-loading');

  userLoading.style.display = 'block';
  userTable.style.display   = 'none';

  try {
    const token = await getToken();
    const res   = await fetch('/api/list-users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data  = await res.json();

    if (!res.ok) throw new Error(data.error);

    const users = data.users.sort((a, b) => a.email.localeCompare(b.email));

    userTbody.innerHTML = users.map(u => `
      <tr>
        <td class="client-name-text">${u.email}</td>
        <td>
          <input type="checkbox"
                 class="role-checkbox"
                 data-uid="${u.uid}"
                 data-role="isPowerUser"
                 style="accent-color:var(--accent)"
                 ${u.isPowerUser ? 'checked' : ''} />
        </td>
        <td>
          <input type="checkbox"
                 class="role-checkbox"
                 data-uid="${u.uid}"
                 data-role="isAdmin"
                 style="accent-color:var(--accent)"
                 ${u.isAdmin ? 'checked' : ''} />
        </td>
        <td>
          <button class="notes-btn delete-user-btn"
                  data-uid="${u.uid}"
                  data-email="${u.email}"
                  title="Delete user">
            <i class="ti ti-trash" style="color:var(--danger)"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // Role toggle
    userTbody.querySelectorAll('.role-checkbox').forEach(cb => {
      cb.addEventListener('change', () => updateUserRole(cb));
    });

    // Delete user
    userTbody.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteUser(btn.dataset.uid, btn.dataset.email));
    });

    userLoading.style.display = 'none';
    userTable.style.display   = '';

  } catch (e) {
    userLoading.innerHTML = `<span style="color:var(--danger)">Failed to load users: ${e.message}</span>`;
  }
}

// Add user
document.getElementById('admin-add-user').addEventListener('click', async () => {
  const emailInput    = document.getElementById('admin-user-email');
  const passwordInput = document.getElementById('admin-user-password');
  const isPowerUser   = document.getElementById('admin-user-poweruser').checked;
  const isAdminUser   = document.getElementById('admin-user-isadmin').checked;
  const confirmEl     = document.getElementById('admin-user-confirm');
  const errorEl       = document.getElementById('admin-user-error');

  const email    = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    errorEl.textContent   = 'Email and password are required.';
    errorEl.style.opacity = '1';
    setTimeout(() => errorEl.style.opacity = '0', 3000);
    return;
  }

  try {
    const token = await getToken();
    const res   = await fetch('/api/create-user', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email, password, isAdmin: isAdminUser, isPowerUser })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    emailInput.value    = '';
    passwordInput.value = '';
    document.getElementById('admin-user-poweruser').checked = false;
    document.getElementById('admin-user-isadmin').checked   = false;

    confirmEl.style.opacity = '1';
    setTimeout(() => confirmEl.style.opacity = '0', 2000);
    renderAdminUsers();

  } catch (e) {
    errorEl.textContent   = e.message || 'Failed to create user.';
    errorEl.style.opacity = '1';
    setTimeout(() => errorEl.style.opacity = '0', 4000);
  }
});

// Update role
async function updateUserRole(checkbox) {
  const uid  = checkbox.dataset.uid;
  const role = checkbox.dataset.role;

  // Get current values for this row
  const row         = checkbox.closest('tr');
  const checkboxes  = row.querySelectorAll('.role-checkbox');
  const roles       = {};
  checkboxes.forEach(cb => roles[cb.dataset.role] = cb.checked);

  try {
    const token = await getToken();
    const res   = await fetch('/api/update-user', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ uid, ...roles })
    });
    const data = await res.json();
    if (!res.ok) {
      checkbox.checked = !checkbox.checked; // revert
      alert(data.error);
    }
  } catch (e) {
    checkbox.checked = !checkbox.checked; // revert
    alert('Failed to update user.');
  }
}

// Delete user
async function deleteUser(uid, email) {
  if (!confirm(`Delete "${email}"? This cannot be undone.`)) return;
  try {
    const token = await getToken();
    const res   = await fetch('/api/delete-user', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ uid })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    renderAdminUsers();
  } catch (e) {
    alert(e.message || 'Failed to delete user.');
  }
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
  launchMsg.textContent   = msg;
  launchMsg.style.opacity = '1';
  setTimeout(() => launchMsg.style.opacity = '0', 3000);
}
