// const API_URL = 'http://localhost:8000';
const API_URL = import.meta.env.VITE_API_BASE_URL;

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


let allTasks = [];
let currentFilter = 'all';
let currentPriorityFilter = 'all';
let currentCategoryFilter = 'all';
let searchQuery = '';
let selectedTaskIds = new Set();

// Load tasks on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    loadCategories();
    setupEventListeners();
    loadDarkMode();
});

function setupEventListeners() {
    // Task form submission
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        filterAndDisplayTasks();
    });
    
    // Status filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            filterAndDisplayTasks();
        });
    });
    
    // Priority filter buttons
    document.querySelectorAll('.priority-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.priority-filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentPriorityFilter = e.target.dataset.priority;
            filterAndDisplayTasks();
        });
    });
    
    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        currentCategoryFilter = e.target.value;
        filterAndDisplayTasks();
    });
    
    // Select all checkbox
    document.getElementById('selectAllCheckbox').addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.task-select-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            const taskId = parseInt(cb.dataset.taskId);
            if (e.target.checked) {
                selectedTaskIds.add(taskId);
            } else {
                selectedTaskIds.delete(taskId);
            }
        });
        updateBulkDeleteButton();
    });
    
    // Bulk delete button
    document.getElementById('bulkDeleteBtn').addEventListener('click', handleBulkDelete);
    
    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportTasks);
    
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
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const category = document.getElementById('taskCategory').value.trim() || 'general';
    const dueDate = document.getElementById('taskDueDate').value;
    
    if (!title) return;
    
    const taskData = {
        title,
        description,
        priority,
        category,
        completed: false
    };
    
    if (dueDate) {
        taskData.due_date = new Date(dueDate).toISOString();
    }
    
    await createTask(taskData);
    
    // Clear form
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskCategory').value = '';
    document.getElementById('taskDueDate').value = '';
    
    await loadTasks();
    await loadCategories();
}

async function handleEditSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value.trim();
    const priority = document.getElementById('editTaskPriority').value;
    const category = document.getElementById('editTaskCategory').value.trim();
    const dueDate = document.getElementById('editTaskDueDate').value;
    
    if (!title) return;
    
    const taskData = {
        title,
        description,
        priority,
        category
    };
    
    if (dueDate) {
        taskData.due_date = new Date(dueDate).toISOString();
    }
    
    await updateTask(id, taskData);
    
    document.getElementById('editModal').style.display = 'none';
    await loadTasks();
    await loadCategories();
}

async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`);
        allTasks = await response.json();
        
        // Sort by creation date (newest first)
        allTasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        await updateStats();
        filterAndDisplayTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        showNotification('Failed to load tasks', 'error');
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();
        
        // Update category datalist
        const datalist = document.getElementById('categoryList');
        datalist.innerHTML = categories.map(cat => `<option value="${cat}">`).join('');
        
        // Update category filter
        const select = document.getElementById('categoryFilter');
        const currentValue = select.value;
        select.innerHTML = '<option value="all">All Categories</option>' +
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        select.value = currentValue;
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function updateStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();
        
        document.getElementById('totalTasks').textContent = stats.total;
        document.getElementById('activeTasks').textContent = stats.active;
        document.getElementById('completedTasks').textContent = stats.completed;
        document.getElementById('highPriorityTasks').textContent = stats.high_priority;
        document.getElementById('overdueTasks').textContent = stats.overdue;
    } catch (error) {
        console.error('Error loading stats:', error);
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
    
    // Apply priority filter
    if (currentPriorityFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.priority === currentPriorityFilter);
    }
    
    // Apply category filter
    if (currentCategoryFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.category === currentCategoryFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchQuery) ||
            (task.description && task.description.toLowerCase().includes(searchQuery)) ||
            (task.category && task.category.toLowerCase().includes(searchQuery))
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

async function createTask(taskData) {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) throw new Error('Failed to create task');
        
        showNotification('✓ Task created successfully!', 'success');
    } catch (error) {
        console.error('Error creating task:', error);
        showNotification('✗ Failed to create task', 'error');
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
        
        showNotification('✓ Task updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating task:', error);
        showNotification('✗ Failed to update task', 'error');
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
        
        showNotification('✓ Task deleted successfully!', 'success');
        await loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('✗ Failed to delete task', 'error');
    }
}

async function handleBulkDelete() {
    if (selectedTaskIds.size === 0) {
        showNotification('No tasks selected', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedTaskIds.size} task(s)?`)) return;
    
    try {
        const response = await fetch(`${API_URL}/tasks?${Array.from(selectedTaskIds).map(id => `task_ids=${id}`).join('&')}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(Array.from(selectedTaskIds))
        });
        
        if (!response.ok) throw new Error('Failed to delete tasks');
        
        showNotification(`✓ ${selectedTaskIds.size} task(s) deleted successfully!`, 'success');
        selectedTaskIds.clear();
        document.getElementById('selectAllCheckbox').checked = false;
        updateBulkDeleteButton();
        await loadTasks();
    } catch (error) {
        console.error('Error deleting tasks:', error);
        showNotification('✗ Failed to delete tasks', 'error');
    }
}

function handleTaskCheckbox(taskId, checked) {
    if (checked) {
        selectedTaskIds.add(taskId);
    } else {
        selectedTaskIds.delete(taskId);
    }
    updateBulkDeleteButton();
}

function updateBulkDeleteButton() {
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    if (selectedTaskIds.size > 0) {
        bulkDeleteBtn.style.display = 'block';
        bulkDeleteBtn.textContent = `🗑️ Delete ${selectedTaskIds.size}`;
    } else {
        bulkDeleteBtn.style.display = 'none';
    }
}

function openEditModal(task) {
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editTaskPriority').value = task.priority;
    document.getElementById('editTaskCategory').value = task.category || '';
    
    if (task.due_date) {
        const date = new Date(task.due_date);
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        document.getElementById('editTaskDueDate').value = localDate.toISOString().slice(0, 16);
    } else {
        document.getElementById('editTaskDueDate').value = '';
    }
    
    document.getElementById('editModal').style.display = 'block';
}

function createTaskElement(task) {
    const div = document.createElement('div');
    
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed;
    
    div.className = `task priority-${task.priority} ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
    
    const createdDate = formatDate(task.created_at);
    const dueDate = task.due_date ? formatDate(task.due_date) : null;
    
    const priorityIcons = {
        high: '🔴',
        medium: '🟡',
        low: '🟢'
    };
    
    div.innerHTML = `
        <div class="task-header">
            <div class="task-checkbox">
                <input type="checkbox" 
                       class="task-select-checkbox" 
                       data-task-id="${task.id}"
                       onchange="handleTaskCheckbox(${task.id}, this.checked)">
            </div>
            
            <div class="task-main">
                <div class="task-title-row">
                    <div class="task-content">
                        <h3>${escapeHtml(task.title)}</h3>
                    </div>
                    <div class="task-badges">
                        <span class="badge badge-priority ${task.priority}">${priorityIcons[task.priority]} ${task.priority}</span>
                        ${task.category ? `<span class="badge badge-category">${escapeHtml(task.category)}</span>` : ''}
                        ${isOverdue ? '<span class="badge badge-overdue">⏰ Overdue</span>' : ''}
                    </div>
                </div>
                
                ${task.description ? `<div class="task-content"><p>${escapeHtml(task.description)}</p></div>` : ''}
                
                <div class="task-meta">
                    <span class="task-meta-item">📅 Created: ${createdDate}</span>
                    ${dueDate ? `<span class="task-meta-item">⏰ Due: ${dueDate}</span>` : ''}
                    ${task.updated_at && task.updated_at !== task.created_at ? 
                        `<span class="task-meta-item">✏️ Updated: ${formatDate(task.updated_at)}</span>` : ''}
                </div>
            </div>
            
            <div class="task-actions">
                <button class="btn-complete" onclick="toggleTask(${task.id}, ${task.completed})" title="${task.completed ? 'Mark as active' : 'Mark as complete'}">
                    ${task.completed ? '↩️' : '✓'}
                </button>
                <button class="btn-edit" onclick="editTask(${task.id})" title="Edit task">
                    ✏️
                </button>
                <button class="btn-delete" onclick="deleteTask(${task.id})" title="Delete task">
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

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (diffDays < 7) {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Dark Mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    
    const btn = document.getElementById('darkModeToggle');
    btn.textContent = isDark ? '☀️' : '🌙';
}

function loadDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').textContent = '☀️';
    }
}

// Export Tasks
function exportTasks() {
    const dataStr = JSON.stringify(allTasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('✓ Tasks exported successfully!', 'success');
}

// Notification System
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 600;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    
    if (!document.getElementById('notification-style')) {
        style.id = 'notification-style';
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Make functions globally available
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.editTask = editTask;
window.handleTaskCheckbox = handleTaskCheckbox;