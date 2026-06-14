// To-Do List Application JavaScript

class TodoApp {
    constructor() {
        this.tasks = this.loadFromLocalStorage() || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.cacheDOMElements();
        this.bindEvents();
        this.render();
    }

    cacheDOMElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.tasksList = document.getElementById('tasksList');
        this.emptyState = document.getElementById('emptyState');
        this.categorySelect = document.getElementById('categorySelect');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        this.categorySelect.addEventListener('change', (e) => this.filterByCategory(e.target.value));
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => this.setFilter(btn.dataset.filter));
        });
    }

    addTask() {
        const taskText = this.taskInput.value.trim();
        const category = this.categorySelect.value !== 'all' ? this.categorySelect.value : 'other';

        if (!taskText) {
            this.showNotification('Please enter a task!', 'warning');
            return;
        }

        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            category: category,
            createdAt: new Date().toLocaleString()
        };

        this.tasks.unshift(task);
        this.taskInput.value = '';
        this.categorySelect.value = 'all';
        this.saveToLocalStorage();
        this.render();
        this.showNotification('Task added successfully!', 'success');
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveToLocalStorage();
            this.render();
            this.showNotification('Task deleted!', 'success');
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveToLocalStorage();
            this.render();
        }
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const newText = prompt('Edit your task:', task.text);
        if (newText && newText.trim()) {
            task.text = newText.trim();
            this.saveToLocalStorage();
            this.render();
            this.showNotification('Task updated!', 'success');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        if (filter === 'clear-completed') {
            if (confirm('Delete all completed tasks?')) {
                this.tasks = this.tasks.filter(t => !t.completed);
                this.saveToLocalStorage();
                this.currentFilter = 'all';
            }
        }
        this.render();
    }

    filterByCategory(category) {
        // Filter is handled in render based on tasks
        this.render();
    }

    getFilteredTasks() {
        let filtered = this.tasks;

        // Apply category filter
        const selectedCategory = this.categorySelect.value;
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(t => t.category === selectedCategory);
        }

        // Apply status filter
        if (this.currentFilter === 'active') {
            filtered = filtered.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filtered = filtered.filter(t => t.completed);
        }

        return filtered;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;

        this.totalTasksEl.textContent = total;
        this.completedTasksEl.textContent = completed;
        this.pendingTasksEl.textContent = pending;
    }

    render() {
        this.updateStats();
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            this.tasksList.innerHTML = '';
            this.emptyState.classList.add('show');
        } else {
            this.emptyState.classList.remove('show');
            this.tasksList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
            this.attachTaskEventListeners();
        }
    }

    createTaskHTML(task) {
        const timeAgo = this.getTimeAgo(task.createdAt);
        return `
            <li class="task-item ${task.completed ? 'completed' : ''}">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    data-id="${task.id}"
                >
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="task-category ${task.category}">${task.category}</span>
                        <span class="task-time">${timeAgo}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-btn edit-btn" data-id="${task.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-btn delete-btn" data-id="${task.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </li>
        `;
    }

    attachTaskEventListeners() {
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.toggleTask(parseInt(e.target.dataset.id)));
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.editTask(parseInt(btn.dataset.id)));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteTask(parseInt(btn.dataset.id)));
        });
    }

    getTimeAgo(dateString) {
        const taskDate = new Date(dateString);
        const now = new Date();
        const diffMs = now - taskDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return taskDate.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create and show a notification (optional enhancement)
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    saveToLocalStorage() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
    }

    loadFromLocalStorage() {
        const data = localStorage.getItem('todoTasks');
        return data ? JSON.parse(data) : null;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});