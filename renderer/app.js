// ── Quick Tasks — Renderer ────────────────────────────────
const $ = id => document.getElementById(id);

const taskInput = $('taskInput');
const taskList = $('taskList');
const emptyState = $('emptyState');
const taskCount = $('taskCount');
const clearDoneBtn = $('clearDoneBtn');
const closeBtn = $('closeBtn');
const addNoDeadline = $('addNoDeadline');
const customDeadlineBtn = $('customDeadlineBtn');

// Picker elements
const pickerOverlay = $('pickerOverlay');
const pickerMonth = $('pickerMonth');
const pickerDays = $('pickerDays');
const prevMonth = $('prevMonth');
const nextMonth = $('nextMonth');
const pickerHour = $('pickerHour');
const pickerMinute = $('pickerMinute');
const pickerCancel = $('pickerCancel');
const pickerConfirm = $('pickerConfirm');

let tasks = [];
let pickerDate = new Date();
let selectedDay = null;

// ── Init ──────────────────────────────────────────────────
async function init() {
    tasks = await window.api.getTasks();
    render();
}

// ── Helpers ───────────────────────────────────────────────
function relativeTime(iso) {
    const ms = Date.now() - new Date(iso).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(ms / 3600000);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(ms / 86400000);
    if (d < 7) return `${d}d ago`;
    const dt = new Date(iso);
    return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dt.getMonth()]} ${dt.getDate()}`;
}

function fmtDeadline(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = d - now;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');

    const absDiff = Math.abs(diff);
    const mins = Math.round(absDiff / 60000);
    const hrs = Math.round(absDiff / 3600000);

    let label;
    if (diff > 0) {
        if (mins < 60) label = `in ${mins}m`;
        else if (hrs < 24) label = `in ${hrs}h`;
        else label = `${months[d.getMonth()]} ${d.getDate()}, ${hh}:${mm}`;
    } else {
        if (mins < 60) label = `${mins}m overdue`;
        else if (hrs < 24) label = `${hrs}h overdue`;
        else label = `${months[d.getMonth()]} ${d.getDate()}`;
    }

    return { label, overdue: diff < 0 };
}

function esc(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

// ── Deadline Calculation ──────────────────────────────────
function calcDeadline(el) {
    const days = el.dataset.days;

    if (days) {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(days));
        d.setHours(23, 59, 0, 0);
        return d.toISOString();
    }

    return null;
}

// ── Custom Date Picker ────────────────────────────────────
function openPicker() {
    pickerDate = new Date();
    selectedDay = new Date();
    const now = new Date();
    pickerHour.value = String(Math.min(now.getHours() + 1, 23)).padStart(2, '0');
    pickerMinute.value = '00';
    renderPicker();
    pickerOverlay.classList.remove('hidden');
}

function closePicker() {
    pickerOverlay.classList.add('hidden');
}

function renderPicker() {
    const year = pickerDate.getFullYear();
    const month = pickerDate.getMonth();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    pickerMonth.textContent = `${months[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1; // Monday = 0

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    pickerDays.innerHTML = '';

    // Previous month padding
    const prevLast = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
        const btn = document.createElement('button');
        btn.className = 'picker-day other-month';
        btn.textContent = prevLast - i;
        pickerDays.appendChild(btn);
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const btn = document.createElement('button');
        btn.className = 'picker-day';
        btn.textContent = d;

        const thisDate = new Date(year, month, d);
        thisDate.setHours(0, 0, 0, 0);

        if (thisDate < today) btn.classList.add('past');
        if (thisDate.getTime() === today.getTime()) btn.classList.add('today');
        if (selectedDay && thisDate.getTime() === new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate()).getTime()) {
            btn.classList.add('selected');
        }

        btn.addEventListener('click', () => {
            selectedDay = new Date(year, month, d);
            renderPicker();
        });

        pickerDays.appendChild(btn);
    }

    // Next month padding
    const totalCells = startDow + lastDay.getDate();
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
        const btn = document.createElement('button');
        btn.className = 'picker-day other-month';
        btn.textContent = i;
        pickerDays.appendChild(btn);
    }
}

prevMonth.addEventListener('click', () => {
    pickerDate.setMonth(pickerDate.getMonth() - 1);
    renderPicker();
});

nextMonth.addEventListener('click', () => {
    pickerDate.setMonth(pickerDate.getMonth() + 1);
    renderPicker();
});

pickerCancel.addEventListener('click', closePicker);

pickerOverlay.addEventListener('click', (e) => {
    if (e.target === pickerOverlay) closePicker();
});

pickerConfirm.addEventListener('click', () => {
    if (!selectedDay) return;
    const d = new Date(selectedDay);
    d.setHours(parseInt(pickerHour.value) || 0, parseInt(pickerMinute.value) || 0, 0, 0);
    closePicker();
    addTask(d.toISOString());
});

// Clamp time inputs
pickerHour.addEventListener('input', () => {
    let v = parseInt(pickerHour.value);
    if (v > 23) pickerHour.value = '23';
    if (v < 0) pickerHour.value = '00';
});

pickerMinute.addEventListener('input', () => {
    let v = parseInt(pickerMinute.value);
    if (v > 59) pickerMinute.value = '59';
    if (v < 0) pickerMinute.value = '00';
});

// ── Render ────────────────────────────────────────────────
function render() {
    taskList.querySelectorAll('.task-item').forEach(el => el.remove());

    if (tasks.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        tasks.forEach(t => taskList.insertBefore(makeEl(t), emptyState));
    }

    const pending = tasks.filter(t => !t.done).length;
    const done = tasks.filter(t => t.done).length;
    taskCount.textContent = tasks.length === 0
        ? 'No tasks'
        : `${pending} pending${done ? ` · ${done} done` : ''}`;
    clearDoneBtn.style.display = done > 0 ? 'block' : 'none';
}

function makeEl(task) {
    const el = document.createElement('div');
    el.className = `task-item${task.done ? ' done' : ''}`;
    el.dataset.id = task.id;

    let badgeHtml = '';
    if (task.deadline) {
        const dl = fmtDeadline(task.deadline);
        const cls = task.done ? 'completed' : (dl.overdue ? 'overdue' : 'upcoming');
        const icon = task.done
            ? '<path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
            : '<circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.5"/><path d="M7 4v3l2 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
        badgeHtml = `<span class="task-deadline-badge ${cls}"><svg viewBox="0 0 14 14" fill="none">${icon}</svg>${dl.label}</span>`;
    }

    el.innerHTML = `
    <div class="task-check${task.done ? ' checked' : ''}" data-action="toggle">
      <svg viewBox="0 0 14 14" fill="none">
        <path d="M2 7L5.5 10.5L12 3.5" stroke="#0F1320" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="task-content">
      <div class="task-text">${esc(task.text)}</div>
      <div class="task-info">
        <span class="task-date">${relativeTime(task.createdAt)}</span>
        ${badgeHtml}
      </div>
    </div>
    <button class="task-del" data-action="delete" title="Delete">
      <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
        <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>`;

    return el;
}

// ── Task Ops ──────────────────────────────────────────────
async function addTask(deadline = null) {
    const text = taskInput.value.trim();
    if (!text) { taskInput.focus(); return; }
    taskInput.value = '';
    const t = await window.api.addTask(text, deadline);
    tasks.unshift(t);
    render();
    taskInput.focus();
}

async function toggleTask(id) {
    tasks = await window.api.toggleTask(id);
    render();
}

async function deleteTask(id) {
    const el = taskList.querySelector(`.task-item[data-id="${id}"]`);
    if (el) { el.classList.add('removing'); await new Promise(r => setTimeout(r, 200)); }
    tasks = await window.api.deleteTask(id);
    render();
}

async function clearDone() {
    for (const t of tasks.filter(t => t.done)) await window.api.deleteTask(t.id);
    tasks = tasks.filter(t => !t.done);
    render();
}

// ── Events ────────────────────────────────────────────────
taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
    if (e.key === 'Escape') window.api.hideWindow();
});

addNoDeadline.addEventListener('click', () => addTask());

document.querySelectorAll('.chip-deadline:not(.chip-custom)').forEach(chip => {
    chip.addEventListener('click', () => {
        const deadline = calcDeadline(chip);
        if (deadline) addTask(deadline);
    });
});

customDeadlineBtn.addEventListener('click', openPicker);

closeBtn.addEventListener('click', () => window.api.hideWindow());
clearDoneBtn.addEventListener('click', clearDone);

taskList.addEventListener('click', e => {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const item = action.closest('.task-item');
    if (!item) return;
    const id = item.dataset.id;
    if (action.dataset.action === 'toggle') toggleTask(id);
    else if (action.dataset.action === 'delete') deleteTask(id);
});

window.api.onWindowShown(() => {
    setTimeout(() => taskInput.focus(), 50);
    render();
});

// ── Start ─────────────────────────────────────────────────
init();
