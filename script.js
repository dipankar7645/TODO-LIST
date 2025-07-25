let todos = [];
let currentPage = 1;
const perPage = 10;

// DOM elements
const elements = {
  todoList: document.getElementById('todoList'),
  search: document.getElementById('search'),
  from: document.getElementById('fromDate'),
  to: document.getElementById('toDate'),
  filter: document.getElementById('filterBtn'),
  addBtn: document.getElementById('addTodoBtn'),
  newTodo: document.getElementById('newTodo'),
  pagination: document.getElementById('pagination'),
  loader: document.getElementById('loader'),
  error: document.getElementById('error'),
  themeToggle: document.getElementById('themeToggle'),
  app: document.getElementById('appContainer'),
  body: document.getElementById('body'),
};

function applyTheme(mode) {
  const dark = mode === 'dark';
  elements.body.classList.replace(dark ? 'bg-light' : 'bg-dark', dark ? 'bg-dark' : 'bg-light');
  elements.body.classList.replace(dark ? 'text-dark' : 'text-white', dark ? 'text-white' : 'text-dark');
  elements.app.classList.toggle('bg-secondary', dark);
  elements.app.classList.toggle('text-white', dark);
  localStorage.setItem('theme', mode);
}

const saved = localStorage.getItem('theme') || 'light';
applyTheme(saved);
elements.themeToggle.checked = saved === 'dark';
elements.themeToggle.addEventListener('change', () =>
  applyTheme(elements.themeToggle.checked ? 'dark' : 'light')
);

async function fetchTodos() {
  toggleLoader(true);
  try {
    const res = await fetch('https://dummyjson.com/todos');
    const data = await res.json();
    todos = data.todos.map(t => ({ ...t, createdAt: randomDate(new Date(2023, 0, 1), new Date()) }));
    renderTodos();
  } catch {
    showError("❌ Failed to fetch todos.");
  } finally {
    toggleLoader(false);
  }
}

function renderTodos() {
  let filtered = todos.filter(t => t.todo.toLowerCase().includes(elements.search.value.toLowerCase()));
  if (elements.from.value && elements.to.value) {
    const f = new Date(elements.from.value), t = new Date(elements.to.value);
    filtered = filtered.filter(todo => {
      const d = new Date(todo.createdAt);
      return d >= f && d <= t;
    });
  }

  const totalPages = Math.ceil(filtered.length / perPage);
  const start = (currentPage - 1) * perPage;
  const pageTodos = filtered.slice(start, start + perPage);

  elements.todoList.innerHTML = pageTodos.map(todo => `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      ${todo.todo}
      <span class="badge bg-${todo.completed ? 'success' : 'warning'}">${todo.completed ? '✔ Done' : '⌛ Pending'}</span>
    </li>
  `).join('');

  renderPagination(totalPages);
}

function renderPagination(pages) {
  elements.pagination.innerHTML = '';
  for (let i = 1; i <= pages; i++) {
    elements.pagination.innerHTML += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <button class="page-link" onclick="goToPage(${i})">${i}</button>
      </li>`;
  }
}

function goToPage(p) {
  currentPage = p;
  renderTodos();
}

async function addTodo() {
  const task = elements.newTodo.value.trim();
  if (!task) return;

  toggleLoader(true);
  try {
    const res = await fetch('https://dummyjson.com/todos/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todo: task, completed: false, userId: 1 }),
    });

    const newTodo = await res.json();
    newTodo.createdAt = new Date();
    todos.unshift(newTodo);
    elements.newTodo.value = '';
    currentPage = 1;
    renderTodos();
  } catch {
    showError("❌ Failed to add todo.");
  } finally {
    toggleLoader(false);
  }
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function toggleLoader(show) {
  elements.loader.classList.toggle('d-none', !show);
}

function showError(msg) {
  elements.error.textContent = msg;
  elements.error.classList.remove('d-none');
  setTimeout(() => elements.error.classList.add('d-none'), 3000);
}

elements.search.addEventListener('input', () => { currentPage = 1; renderTodos(); });
elements.filter.addEventListener('click', () => { currentPage = 1; renderTodos(); });
elements.addBtn.addEventListener('click', addTodo);

fetchTodos();
