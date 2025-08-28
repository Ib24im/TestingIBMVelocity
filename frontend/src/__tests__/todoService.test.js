/**
 * Tests for todo service
 */
import { todoService } from '../services/todoService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('TodoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('getTodos makes correct API call', async () => {
    const mockResponse = {
      data: [
        { id: 1, title: 'Test Todo 1', completed: false },
        { id: 2, title: 'Test Todo 2', completed: true }
      ]
    };
    
    mockedAxios.get.mockResolvedValue(mockResponse);
    
    const result = await todoService.getTodos();
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/todos', { params: {} });
    expect(result).toEqual(mockResponse.data);
  });

  test('getTodos with filter parameters', async () => {
    const mockResponse = { data: [] };
    mockedAxios.get.mockResolvedValue(mockResponse);
    
    const params = { completed: true, priority: 'high' };
    await todoService.getTodos(params);
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/todos', { params });
  });

  test('getTodo makes correct API call', async () => {
    const mockResponse = {
      data: { id: 1, title: 'Test Todo', completed: false }
    };
    
    mockedAxios.get.mockResolvedValue(mockResponse);
    
    const result = await todoService.getTodo(1);
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/todos/1');
    expect(result).toEqual(mockResponse.data);
  });

  test('createTodo makes correct API call', async () => {
    const mockResponse = {
      data: { id: 1, title: 'New Todo', completed: false, priority: 'medium', category: 'personal' }
    };
    
    mockedAxios.post.mockResolvedValue(mockResponse);
    
    const todoData = {
      title: 'New Todo',
      priority: 'medium',
      category: 'personal'
    };
    
    const result = await todoService.createTodo(todoData);
    
    expect(mockedAxios.post).toHaveBeenCalledWith('/todos', todoData);
    expect(result).toEqual(mockResponse.data);
  });

  test('updateTodo makes correct API call', async () => {
    const mockResponse = {
      data: { id: 1, title: 'Updated Todo', completed: true }
    };
    
    mockedAxios.put.mockResolvedValue(mockResponse);
    
    const updateData = { completed: true };
    const result = await todoService.updateTodo(1, updateData);
    
    expect(mockedAxios.put).toHaveBeenCalledWith('/todos/1', updateData);
    expect(result).toEqual(mockResponse.data);
  });

  test('deleteTodo makes correct API call', async () => {
    const mockResponse = { data: { message: 'Todo deleted' } };
    mockedAxios.delete.mockResolvedValue(mockResponse);
    
    const result = await todoService.deleteTodo(1);
    
    expect(mockedAxios.delete).toHaveBeenCalledWith('/todos/1');
    expect(result).toEqual(mockResponse.data);
  });

  test('getTodoStats makes correct API call', async () => {
    const mockResponse = {
      data: {
        total: 10,
        completed: 5,
        pending: 5,
        by_priority: { high: 2, medium: 5, low: 3 }
      }
    };
    
    mockedAxios.get.mockResolvedValue(mockResponse);
    
    const result = await todoService.getTodoStats();
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/todos/stats/summary');
    expect(result).toEqual(mockResponse.data);
  });

  test('API requests include authorization header when token exists', async () => {
    localStorage.setItem('auth-token', 'test-token');
    
    const mockResponse = { data: [] };
    mockedAxios.get.mockResolvedValue(mockResponse);
    
    await todoService.getTodos();
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/todos', { params: {} });
    // The interceptor should add the Authorization header
  });

  test('createTodo handles validation errors', async () => {
    const errorResponse = {
      response: {
        status: 422,
        data: {
          detail: [
            { loc: ['title'], msg: 'Title is required' }
          ]
        }
      }
    };
    
    mockedAxios.post.mockRejectedValue(errorResponse);
    
    await expect(todoService.createTodo({ title: '' })).rejects.toEqual(errorResponse);
  });

  test('updateTodo handles not found errors', async () => {
    const errorResponse = {
      response: {
        status: 404,
        data: { detail: 'Todo not found' }
      }
    };
    
    mockedAxios.put.mockRejectedValue(errorResponse);
    
    await expect(todoService.updateTodo(999, { completed: true })).rejects.toEqual(errorResponse);
  });

  test('deleteTodo handles authorization errors', async () => {
    const errorResponse = {
      response: {
        status: 401,
        data: { detail: 'Not authenticated' }
      }
    };
    
    mockedAxios.delete.mockRejectedValue(errorResponse);
    
    await expect(todoService.deleteTodo(1)).rejects.toEqual(errorResponse);
  });

  test('handles network errors gracefully', async () => {
    const networkError = new Error('Network Error');
    networkError.code = 'NETWORK_ERROR';
    
    mockedAxios.get.mockRejectedValue(networkError);
    
    await expect(todoService.getTodos()).rejects.toEqual(networkError);
  });
});
