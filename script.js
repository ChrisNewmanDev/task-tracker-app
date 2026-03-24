let tasks = JSON.parse(localStorage.getItem('tasks_v2')) || [];
let currentFilter = 'all';
let currentSort = 'date';

function save() {
  localStorage.setItem('tasks_v2', JSON.stringify(tasks));
}

function addTask() {
  const input = document.getElementById('taskInput');
  const name = input.value.trim();
  if (!name) { showToast('Please enter a task name ✏️'); return; }

  const task = {
    id: Date.now(),
    name,
    priority: document.getElementById('prioritySelect').value,
    category: document.getElementById('categorySelect').value,
    dueDate: document.getElementById('dueDateInput').value,
    done: false,
    createdAt: Date.now()
  };

  tasks.unshift(task);
  input.value = '';
  save();
  renderTasks();
  showToast('Task added! 🚀');
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  save();
  if (task.done) spawnConfetti();
  renderTasks();
  if (task.done) showToast('Task complete! 🎉');
}

function deleteTask(id) {
  const li = document.getElementById('task-' + id);
  if (li) {
    li.classList.add('removing');
    li.addEventListener('animationend', () => {
      tasks = tasks.filter(t => t.id !== id);
      save();
      renderTasks();
    }, { once: true });
  } else {
    tasks = tasks.filter(t => t.id !== id);
    save();
    renderTasks();
  }
}

function clearCompleted() {
  const count = tasks.filter(t => t.done).length;
  if (!count) { showToast('No completed tasks to clear.'); return; }
  tasks = tasks.filter(t => !t.done);
  save();
  renderTasks();
  showToast(`Cleared ${count} completed task${count > 1 ? 's' : ''} 🧹`);
}

function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

function setSort(s, btn) {
  currentSort = s;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

function renderTasks() {
  const list = document.getElementById('taskList');
  const emptyState = document.getElementById('emptyState');
  const searchQuery = document.getElementById('searchInput').value.trim().toLowerCase();

  let filtered = tasks.filter(t => {
    if (currentFilter === 'active') return !t.done;
    if (currentFilter === 'completed') return t.done;
    return true;
  });

  if (searchQuery) {
    filtered = filtered.filter(t => t.name.toLowerCase().includes(searchQuery));
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  if (currentSort === 'priority') {
    filtered.sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));
  } else if (currentSort === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    filtered.sort((a, b) => b.createdAt - a.createdAt);
  }

  list.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    filtered.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.done ? ' done' : '');
      li.id = 'task-' + task.id;

      const dueLabel = formatDue(task.dueDate);
      const catEmoji = { general:'📋', work:'💼', personal:'🏠', health:'🧘', learning:'📚' };

      li.innerHTML = `
        <div class="task-check ${task.done ? 'checked' : ''}" onclick="toggleTask(${task.id})">
          ${task.done ? '✓' : ''}
        </div>
        <div class="task-body">
          <div class="task-name">${escapeHtml(task.name)}</div>
          <div class="task-meta">
            <span class="tag tag-priority-${task.priority}">${task.priority}</span>
            <span class="tag tag-category">${catEmoji[task.category] || '📋'} ${task.category}</span>
            ${dueLabel}
          </div>
        </div>
        <button class="btn-delete" onclick="deleteTask(${task.id})" title="Delete">✕</button>
      `;
      list.appendChild(li);
    });
  }

  updateStats();
}

function updateStats() {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const pending = total - done;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById('totalCount').textContent = total;
  document.getElementById('doneCount').textContent = done;
  document.getElementById('pendingCount').textContent = pending;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = pct + '% complete';
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDue(dateStr) {
  if (!dateStr) return '';
  const due = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((due - today) / 86400000);
  let cls = 'task-due';
  let label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (diff < 0) { cls += ' overdue'; label = '⚠ ' + label; }
  else if (diff <= 2) { cls += ' due-soon'; label = '⏰ ' + label; }
  else label = '📅 ' + label;
  return `<span class="${cls}">${label}</span>`;
}

let toastTimer = null;
function showToast(msg) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

function spawnConfetti() {
  const colors = ['#6c63ff','#f72585','#4cc9f0','#4ade80','#fb923c','#a78bfa'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-particle';
    p.style.cssText = `
      left: ${Math.random() * 100}vw;
      top: ${Math.random() * 40}vh;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-delay: ${Math.random() * 0.4}s;
      animation-duration: ${0.9 + Math.random() * 0.6}s;
      transform: rotate(${Math.random() * 360}deg);
    `;
    document.body.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.activeElement.id === 'taskInput') addTask();
});

renderTasks();
