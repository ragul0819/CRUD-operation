const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
let nextId = tasks.reduce((largestId, task) => Math.max(largestId, task.id), 0) + 1;

const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const taskCount = document.querySelector("#task-count");
const taskMessage = document.querySelector("#task-message");
let editingTaskId = null;

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function createTask(title) {
  if (typeof title !== "string" || title.trim() === "") {
    throw new Error("Task title must be a non-empty string.");
  }

  const task = { id: nextId++, title: title.trim(), completed: false };
  tasks.push(task);
  saveTasks();
  return { ...task };
}

function getTasks() {
  return tasks.map((task) => ({ ...task }));
}

function getTask(id) {
  const task = tasks.find((item) => item.id === id);
  return task ? { ...task } : null;
}

function updateTask(id, updates) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return null;

  if (updates.title !== undefined) {
    if (typeof updates.title !== "string" || updates.title.trim() === "") {
      throw new Error("Task title must be a non-empty string.");
    }
    task.title = updates.title.trim();
  }

  if (updates.completed !== undefined) {
    if (typeof updates.completed !== "boolean") {
      throw new Error("Task completed must be true or false.");
    }
    task.completed = updates.completed;
  }

  saveTasks();
  return { ...task };
}

function deleteTask(id) {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) return false;

  tasks.splice(index, 1);
  saveTasks();
  return true;
}

function renderTasks() {
  const currentTasks = getTasks();
  const completedCount = currentTasks.filter((task) => task.completed).length;

  taskCount.textContent = `${currentTasks.length} ${currentTasks.length === 1 ? "task" : "tasks"} · ${completedCount} done`;

  if (currentTasks.length === 0) {
    taskList.innerHTML = '<li class="empty-state">Nothing on your list yet.</li>';
    return;
  }

  taskList.innerHTML = currentTasks.map((task) => {
    if (editingTaskId === task.id) {
      return `
        <li class="task-row${task.completed ? " is-complete" : ""}" data-id="${task.id}">
          <form class="inline-edit" data-edit-form>
            <label class="visually-hidden" for="edit-task-${task.id}">Edit task title</label>
            <input id="edit-task-${task.id}" name="title" value="${escapeHtml(task.title)}" maxlength="120" required>
            <div class="task-actions">
              <button class="text-button save-button" type="submit">Save</button>
              <button class="text-button" type="button" data-action="cancel-edit">Cancel</button>
            </div>
          </form>
        </li>
      `;
    }

    return `
      <li class="task-row${task.completed ? " is-complete" : ""}" data-id="${task.id}">
        <label class="task-main">
          <input type="checkbox" data-action="toggle" ${task.completed ? "checked" : ""}>
          <span>${escapeHtml(task.title)}</span>
        </label>
        <div class="task-actions">
          <button class="text-button" type="button" data-action="edit">Edit</button>
          <button class="text-button delete-button" type="button" data-action="delete">Delete</button>
        </div>
      </li>
    `;
  }).join("");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    createTask(taskInput.value);
    taskInput.value = "";
    taskMessage.textContent = "";
    renderTasks();
    taskInput.focus();
  } catch (error) {
    taskMessage.textContent = error.message;
  }
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const row = button.closest("[data-id]");
  const id = Number(row.dataset.id);

  if (button.dataset.action === "delete") {
    deleteTask(id);
    renderTasks();
    return;
  }

  if (button.dataset.action === "edit") {
    editingTaskId = id;
    renderTasks();
    taskList.querySelector("[data-edit-form] input").focus();
    return;
  }

  if (button.dataset.action === "cancel-edit") {
    editingTaskId = null;
    renderTasks();
  }
});

taskList.addEventListener("submit", (event) => {
  const editForm = event.target.closest("[data-edit-form]");
  if (!editForm) return;

  event.preventDefault();
  const id = Number(editForm.closest("[data-id]").dataset.id);

  try {
    updateTask(id, { title: new FormData(editForm).get("title") });
    editingTaskId = null;
    taskMessage.textContent = "";
    renderTasks();
  } catch (error) {
    taskMessage.textContent = error.message;
  }
});

taskList.addEventListener("change", (event) => {
  if (event.target.matches('input[data-action="toggle"]')) {
    const id = Number(event.target.closest("[data-id]").dataset.id);
    updateTask(id, { completed: event.target.checked });
    renderTasks();
  }
});

renderTasks();