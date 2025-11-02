const API_URL = 'http://localhost:8000';

let allTasks = [];
let currentFilter = 'all';
let searchQuery = '';
let isEditing = false;

// Load tasks on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupEventListeners();
});

function setupEventListeners() {
    // Task form submission
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        filterAndDisplayTasks();
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            filterAndDisplayTasks();
        });
    });
    
    // Edit modal
    const modal = document.getElementById('editModal');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.querySelector('.btn-cancel-modal');
    
    closeBtn.onclick = () => modal.style.display = 'none';
    cancelBtn.onclick = () => modal.style.display = 'none';
    
    window.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    // Edit form submission
    document.getElementById('editForm').addEventListener('submit', handleEditSubmit);
    
    // Cancel button
    document.getElementById('cancelBtn').addEventListener('click', cancelEdit);
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    
    if (!title) return;
    
    await createTask(title, description);
    
    // Clear form
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    
    await loadTasks();
}

async function handleEditSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value.trim();
    
    if (!title) return;
    
    await updateTask(id, { title, description });
    
    document.getElementById('editModal').style.display = 'none';
    await loadTasks();
}

function cancelEdit() {
    isEditing = false;
    document.getElementById('taskId').value = '';
    document.getElementById('submitBtn').textContent = 'Add Task';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
}

async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`);
        allTasks = await response.json();
        
        // Sort by creation date (newest first)
        allTasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        updateStats();
        filterAndDisplayTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        showError('Failed to load tasks');
    }
}

function filterAndDisplayTasks() {
    let filteredTasks = allTasks;
    
    // Apply status filter
    if (currentFilter === 'active') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }
    
    // Apply search filter
    if (searchQuery) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchQuery) ||
            (task.description && task.description.toLowerCase().includes(searchQuery))
        );
    }
    
    displayTasks(filteredTasks);
}

function displayTasks(tasks) {
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    
    if (tasks.length === 0) {
        taskList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    taskList.style.display = 'flex';
    emptyState.style.display = 'none';
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
}

function updateStats() {
    const total = allTasks.length;
    const active = allTasks.filter(t => !t.completed).length;
    const completed = allTasks.filter(t => t.completed).length;
    
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('activeTasks').textContent = active;
    document.getElementById('completedTasks').textContent = completed;
}

async function createTask(title, description) {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description, completed: false })
        });
        
        if (!response.ok) throw new Error('Failed to create task');
        
        showSuccess('Task created successfully!');
    } catch (error) {
        console.error('Error creating task:', error);
        showError('Failed to create task');
    }
}

async function updateTask(id, data) {
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Failed to update task');
        
        showSuccess('Task updated successfully!');
    } catch (error) {
        console.error('Error updating task:', error);
        showError('Failed to update task');
    }
}

async function toggleTask(id, completed) {
    await updateTask(id, { completed: !completed });
    await loadTasks();
}

async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete task');
        
        showSuccess('Task deleted successfully!');
        await loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
        showError('Failed to delete task');
    }
}

function openEditModal(task) {
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editModal').style.display = 'block';
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = `task ${task.completed ? 'completed' : ''}`;
    
    const date = new Date(task.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    div.innerHTML = `
        <div class="task-header">
            <div class="task-content">
                <h3>${escapeHtml(task.title)}</h3>
                ${task.description ? `<p>${escapeHtml(task.description)}</p>` : ''}
                <div class="task-date">Created: ${date}</div>
            </div>
            <div class="task-actions">
                <button class="btn-complete" onclick="toggleTask(${task.id}, ${task.completed})">
                    ${task.completed ? '↩️' : '✓'}
                </button>
                <button class="btn-edit" onclick="editTask(${task.id})">
                    ✏️
                </button>
                <button class="btn-delete" onclick="deleteTask(${task.id})">
                    🗑️
                </button>
            </div>
        </div>
    `;
    
    return div;
}

function editTask(id) {
    const task = allTasks.find(t => t.id === id);
    if (task) {
        openEditModal(task);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSuccess(message) {
    // Simple success notification (you can make this fancier)
    console.log('✓', message);
}

function showError(message) {
    // Simple error notification (you can make this fancier)
    console.error('✗', message);
    alert(message);
}

// Make functions globally available
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.editTask = editTask;