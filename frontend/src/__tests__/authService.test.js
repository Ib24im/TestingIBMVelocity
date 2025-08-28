/**
 * Tests for authentication service
 */
import { authService } from '../services/authService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('login makes correct API call', async () => {
    const mockResponse = {
      data: {
        access_token: 'mock-token',
        user: { email: 'test@example.com', full_name: 'Test User' }
      }
    };
    
    mockedAxios.post.mockResolvedValue(mockResponse);
    
    const result = await authService.login('test@example.com', 'password123');
    
    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/auth/login',
      expect.any(URLSearchParams),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    );
    
    expect(result).toEqual(mockResponse.data);
    expect(localStorage.getItem('auth-token')).toBe('mock-token');
  });

  test('register makes correct API call', async () => {
    const mockResponse = {
      data: {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User'
      }
    };
    
    mockedAxios.post.mockResolvedValue(mockResponse);
    
    const userData = {
      email: 'test@example.com',
      full_name: 'Test User',
      password: 'password123'
    };
    
    const result = await authService.register(userData);
    
    expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', userData);
    expect(result).toEqual(mockResponse.data);
  });

  test('logout removes token from localStorage', () => {
    localStorage.setItem('auth-token', 'test-token');
    
    authService.logout();
    
    expect(localStorage.getItem('auth-token')).toBeNull();
  });

  test('getCurrentUser makes correct API call', async () => {
    const mockResponse = {
      data: {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User'
      }
    };
    
    mockedAxios.get.mockResolvedValue(mockResponse);
    
    const result = await authService.getCurrentUser();
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/auth/me');
    expect(result).toEqual(mockResponse.data);
  });

  test('API requests include authorization header when token exists', async () => {
    localStorage.setItem('auth-token', 'test-token');
    
    const mockResponse = { data: {} };
    mockedAxios.get.mockResolvedValue(mockResponse);
    
    await authService.getCurrentUser();
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/auth/me');
    // The interceptor should add the Authorization header
  });

  test('login handles server errors correctly', async () => {
    const errorResponse = {
      response: {
        status: 401,
        data: { detail: 'Invalid credentials' }
      }
    };
    
    mockedAxios.post.mockRejectedValue(errorResponse);
    
    await expect(authService.login('wrong@email.com', 'wrongpass')).rejects.toEqual(errorResponse);
  });

  test('register handles validation errors correctly', async () => {
    const errorResponse = {
      response: {
        status: 422,
        data: {
          detail: [
            { loc: ['email'], msg: 'Invalid email format' }
          ]
        }
      }
    };
    
    mockedAxios.post.mockRejectedValue(errorResponse);
    
    await expect(authService.register({
      email: 'invalid-email',
      full_name: 'Test User',
      password: 'password123'
    })).rejects.toEqual(errorResponse);
  });
});
