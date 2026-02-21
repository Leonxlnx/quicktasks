const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, nativeImage, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store').default || require('electron-store');

const store = new Store({
  defaults: {
    tasks: []
  }
});

let mainWindow = null;
let tray = null;
let isQuitting = false;
let deadlineInterval = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 440,
    height: 580,
    frame: false,
    transparent: false,
    resizable: false,
    skipTaskbar: false,
    icon: path.join(__dirname, 'icon.png'),
    alwaysOnTop: true,
    show: false,
    backgroundColor: '#0A0A0A',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('blur', () => {
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
    }
  });
}

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const winBounds = mainWindow.getBounds();
    const x = Math.round((width - winBounds.width) / 2);
    const y = Math.round((height - winBounds.height) / 2);
    mainWindow.setPosition(x, y);
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('window-shown');
  }
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'icon.png')).resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip('Quick Tasks');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Quick Tasks', click: () => toggleWindow() }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => toggleWindow());
}

// ── Deadline Notification Checker ─────────────────────────
function startDeadlineChecker() {
  // Check every 30 seconds for upcoming deadlines
  deadlineInterval = setInterval(() => {
    const tasks = store.get('tasks', []);
    const now = Date.now();

    tasks.forEach(task => {
      if (task.done || !task.deadline || task.notified) return;

      const deadlineMs = new Date(task.deadline).getTime();
      const diff = deadlineMs - now;

      // Notify if deadline is within 60 seconds or past
      if (diff <= 60000) {
        const notification = new Notification({
          title: diff <= 0 ? '⏰ Task Overdue!' : '⏰ Deadline Soon!',
          body: task.text,
          urgency: 'critical',
          silent: false
        });
        notification.show();
        notification.on('click', () => toggleWindow());

        // Mark as notified
        task.notified = true;
        store.set('tasks', tasks);
      }
    });
  }, 30000);
}

// ── IPC Handlers ──────────────────────────────────────────
ipcMain.handle('get-tasks', () => {
  return store.get('tasks', []);
});

ipcMain.handle('add-task', (_event, text, deadline) => {
  const tasks = store.get('tasks', []);
  const newTask = {
    id: Date.now().toString(),
    text: text.trim(),
    done: false,
    deadline: deadline || null,
    notified: false,
    createdAt: new Date().toISOString()
  };
  tasks.unshift(newTask);
  store.set('tasks', tasks);
  return newTask;
});

ipcMain.handle('toggle-task', (_event, id) => {
  const tasks = store.get('tasks', []);
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    store.set('tasks', tasks);
  }
  return tasks;
});

ipcMain.handle('delete-task', (_event, id) => {
  let tasks = store.get('tasks', []);
  tasks = tasks.filter(t => t.id !== id);
  store.set('tasks', tasks);
  return tasks;
});

ipcMain.handle('hide-window', () => {
  if (mainWindow) mainWindow.hide();
});

// ── App Lifecycle ─────────────────────────────────────────
app.whenReady().then(() => {
  // ── Auto-launch at Windows login ────────────────────────
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true   // starts silently in tray, no window popup
  });

  createWindow();
  createTray();
  startDeadlineChecker();

  const registered = globalShortcut.register('Ctrl+Shift+Space', () => {
    toggleWindow();
  });

  if (!registered) {
    console.error('Global shortcut registration failed');
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (deadlineInterval) clearInterval(deadlineInterval);
});

app.on('window-all-closed', () => { });
app.on('before-quit', () => { isQuitting = true; });
