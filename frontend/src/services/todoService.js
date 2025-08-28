import axios from 'axios';

console.log('todoService.js: File loaded');
console.log('todoService.js: axios imported:', axios);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
console.log('todoService.js: API_URL:', API_URL);

class TodoService {
  constructor() {
    console.log('TodoService constructor called');
    console.log('axios:', axios);
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('this.api created:', this.api);

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth-token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  async getTodos(params = {}) {
    const response = await this.api.get('/todos', { params });
    return response.data;
  }

  async getTodo(id) {
    const response = await this.api.get(`/todos/${id}`);
    return response.data;
  }

  async createTodo(todoData) {
    console.log('createTodo called with:', todoData);
    console.log('this.api:', this.api);
    const response = await this.api.post('/todos', todoData);
    return response.data;
  }

  async updateTodo(id, todoData) {
    const response = await this.api.put(`/todos/${id}`, todoData);
    return response.data;
  }

  async deleteTodo(id) {
    const response = await this.api.delete(`/todos/${id}`);
    return response.data;
  }

  async getTodoStats() {
    const response = await this.api.get('/todos/stats/summary');
    return response.data;
  }
}

console.log('todoService.js: Creating todoService instance');
export const todoService = new TodoService();
console.log('todoService.js: todoService created:', todoService);
