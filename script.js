// Todo List App JavaScript

class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.currentFilter = 'all';
        this.currentCategoryFilter = 'all';
        this.currentSearch = '';
        this.editingId = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.render();
        this.updateStats();
    }

    initializeElements() {
        // Input elements
        this.todoInput = document.getElementById('todoInput');
        this.categorySelect = document.getElementById('categorySelect');
        this.addBtn = document.getElementById('addBtn');
        
        // Filter elements
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.searchInput = document.getElementById('searchInput');
        
        // Display elements
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.totalTodos = document.getElementById('totalTodos');
        this.activeTodos = document.getElementById('activeTodos');
        this.completedTodos = document.getElementById('completedTodos');
        
        // Action buttons
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.clearAllBtn = document.getElementById('clearAll');
        
        // Modal elements
        this.editModal = document.getElementById('editModal');
        this.editInput = document.getElementById('editInput');
        this.editCategorySelect = document.getElementById('editCategorySelect');
        this.closeModalBtn = document.getElementById('closeModal');
        this.cancelEditBtn = document.getElementById('cancelEdit');
        this.saveEditBtn = document.getElementById('saveEdit');
    }

    attachEventListeners() {
        // Add todo
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Filter todos
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        this.categoryFilter.addEventListener('change', (e) => {
            this.currentCategoryFilter = e.target.value;
            this.render();
        });

        this.searchInput.addEventListener('input', (e) => {
            this.currentSearch = e.target.value.toLowerCase();
            this.render();
        });

        // Action buttons
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());

        // Modal events
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelEditBtn.addEventListener('click', () => this.closeModal());
        this.saveEditBtn.addEventListener('click', () => this.saveEdit());
        
        // Close modal on outside click
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.closeModal();
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editModal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        const category = this.categorySelect.value;

        if (!text) {
            this.showNotification('Please enter a todo item', 'error');
            return;
        }

        const todo = {
            id: this.generateId(),
            text: text,
            category: category,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.todos.unshift(todo); // Add to beginning of array
        this.saveTodos();
        this.todoInput.value = '';
        this.categorySelect.value = 'personal';
        this.render();
        this.updateStats();
        this.showNotification('Todo added successfully!', 'success');
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.completedAt = todo.completed ? new Date().toISOString() : null;
            this.saveTodos();
            this.render();
            this.updateStats();
        }
    }

    deleteTodo(id) {
        if (confirm('Are you sure you want to delete this todo?')) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.render();
            this.updateStats();
            this.showNotification('Todo deleted', 'success');
        }
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            this.editingId = id;
            this.editInput.value = todo.text;
            this.editCategorySelect.value = todo.category;
            this.openModal();
        }
    }

    saveEdit() {
        const newText = this.editInput.value.trim();
        const newCategory = this.editCategorySelect.value;

        if (!newText) {
            this.showNotification('Please enter a todo item', 'error');
            return;
        }

        const todo = this.todos.find(t => t.id === this.editingId);
        if (todo) {
            todo.text = newText;
            todo.category = newCategory;
            this.saveTodos();
            this.render();
            this.closeModal();
            this.showNotification('Todo updated successfully!', 'success');
        }
    }

    openModal() {
        this.editModal.classList.add('active');
        this.editInput.focus();
    }

    closeModal() {
        this.editModal.classList.remove('active');
        this.editingId = null;
        this.editInput.value = '';
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.render();
    }

    getFilteredTodos() {
        let filtered = [...this.todos];

        // Apply status filter
        if (this.currentFilter === 'active') {
            filtered = filtered.filter(todo => !todo.completed);
        } else if (this.currentFilter === 'completed') {
            filtered = filtered.filter(todo => todo.completed);
        }

        // Apply category filter
        if (this.currentCategoryFilter !== 'all') {
            filtered = filtered.filter(todo => todo.category === this.currentCategoryFilter);
        }

        // Apply search filter
        if (this.currentSearch) {
            filtered = filtered.filter(todo => 
                todo.text.toLowerCase().includes(this.currentSearch)
            );
        }

        return filtered;
    }

    clearCompleted() {
        const completedCount = this.todos.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showNotification('No completed todos to clear', 'info');
            return;
        }

        if (confirm(`Are you sure you want to delete ${completedCount} completed todo(s)?`)) {
            this.todos = this.todos.filter(t => !t.completed);
            this.saveTodos();
            this.render();
            this.updateStats();
            this.showNotification(`${completedCount} completed todo(s) deleted`, 'success');
        }
    }

    clearAll() {
        if (this.todos.length === 0) {
            this.showNotification('No todos to clear', 'info');
            return;
        }

        if (confirm('Are you sure you want to delete ALL todos? This action cannot be undone.')) {
            this.todos = [];
            this.saveTodos();
            this.render();
            this.updateStats();
            this.showNotification('All todos deleted', 'success');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        return date.toLocaleDateString();
    }

    render() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.todoList.style.display = 'none';
            this.emptyState.style.display = 'block';
            
            // Update empty state message based on filters
            const emptyStateTitle = this.emptyState.querySelector('h3');
            const emptyStateText = this.emptyState.querySelector('p');
            
            if (this.todos.length === 0) {
                emptyStateTitle.textContent = 'No todos yet';
                emptyStateText.textContent = 'Add a new todo to get started!';
            } else if (this.currentSearch) {
                emptyStateTitle.textContent = 'No matches found';
                emptyStateText.textContent = 'Try adjusting your search or filters.';
            } else {
                emptyStateTitle.textContent = 'No todos match your filters';
                emptyStateText.textContent = 'Try changing your filter settings.';
            }
        } else {
            this.todoList.style.display = 'block';
            this.emptyState.style.display = 'none';
            
            this.todoList.innerHTML = filteredTodos.map(todo => `
                <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                    <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                         onclick="app.toggleTodo('${todo.id}')"></div>
                    
                    <div class="todo-content">
                        <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                        <div class="todo-meta">
                            <span class="todo-category ${todo.category}">${this.capitalizeFirst(todo.category)}</span>
                            <span class="todo-date">Created ${this.formatDate(todo.createdAt)}</span>
                            ${todo.completed ? `<span class="completed-date">Completed ${this.formatDate(todo.completedAt)}</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="todo-actions">
                        <button class="todo-action-btn edit-btn" onclick="app.editTodo('${todo.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="todo-action-btn delete-btn" onclick="app.deleteTodo('${todo.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
            `).join('');
        }
    }

    updateStats() {
        const total = this.todos.length;
        const active = this.todos.filter(t => !t.completed).length;
        const completed = this.todos.filter(t => t.completed).length;

        this.totalTodos.textContent = total;
        this.activeTodos.textContent = active;
        this.completedTodos.textContent = completed;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add notification styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 1001;
                    animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                .notification.success { background: #22c55e; }
                .notification.error { background: #ef4444; }
                .notification.info { background: #3b82f6; }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Remove notification after animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    loadTodos() {
        const saved = localStorage.getItem('todos');
        return saved ? JSON.parse(saved) : [];
    }

    // Export/Import functionality
    exportTodos() {
        const dataStr = JSON.stringify(this.todos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        this.showNotification('Todos exported successfully!', 'success');
    }

    importTodos(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTodos = JSON.parse(e.target.result);
                if (Array.isArray(importedTodos)) {
                    if (confirm('This will replace all existing todos. Continue?')) {
                        this.todos = importedTodos;
                        this.saveTodos();
                        this.render();
                        this.updateStats();
                        this.showNotification('Todos imported successfully!', 'success');
                    }
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showNotification('Error importing todos. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TodoApp();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to add todo
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            app.addTodo();
        }
        
        // Ctrl/Cmd + F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            app.searchInput.focus();
        }
    });
});

// Service Worker registration for PWA functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
