import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class TodoService {
  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

export const todoService = new TodoService();
