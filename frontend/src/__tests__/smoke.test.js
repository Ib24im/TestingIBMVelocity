/**
 * Integration smoke tests for React components and functionality
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from '../App';
import LoginPage from '../pages/LoginPage';
import TodosPage from '../pages/TodosPage';
import { authService } from '../services/authService';
import { todoService } from '../services/todoService';

// Mock the services
jest.mock('../services/authService');
jest.mock('../services/todoService');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Todo App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  test('app renders without crashing', () => {
    renderWithProviders(<App />);
    expect(document.body).toBeInTheDocument();
  });

  test('login page renders correctly', () => {
    renderWithProviders(<LoginPage />);
    
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('login form validates email format', async () => {
    renderWithProviders(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  test('login form validates password requirement', async () => {
    renderWithProviders(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password.*required/i)).toBeInTheDocument();
    });
  });

  test('successful login calls auth service', async () => {
    const mockLoginResponse = {
      access_token: 'mock-token',
      user: { email: 'test@example.com', full_name: 'Test User' }
    };
    
    authService.login.mockResolvedValue(mockLoginResponse);
    
    renderWithProviders(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'testpassword');
    });
  });

  test('todos page displays loading state', () => {
    // Mock the query to return loading state
    todoService.getTodos.mockReturnValue(new Promise(() => {})); // Never resolves
    
    renderWithProviders(<TodosPage />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('todos page displays empty state when no todos', async () => {
    todoService.getTodos.mockResolvedValue([]);
    
    renderWithProviders(<TodosPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/no todos found/i)).toBeInTheDocument();
    });
  });

  test('todos page displays todos list', async () => {
    const mockTodos = [
      {
        id: 1,
        title: 'Test Todo 1',
        description: 'First test todo',
        completed: false,
        priority: 'high',
        category: 'work'
      },
      {
        id: 2,
        title: 'Test Todo 2',
        description: 'Second test todo',
        completed: true,
        priority: 'medium',
        category: 'personal'
      }
    ];
    
    todoService.getTodos.mockResolvedValue(mockTodos);
    
    renderWithProviders(<TodosPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
      expect(screen.getByText('Test Todo 2')).toBeInTheDocument();
    });
  });

  test('todo creation form validation', async () => {
    todoService.getTodos.mockResolvedValue([]);
    
    renderWithProviders(<TodosPage />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/add.*todo/i)).toBeInTheDocument();
    });
    
    const addButton = screen.getByRole('button', { name: /add/i });
    
    // Try to add empty todo
    fireEvent.click(addButton);
    
    // Should not call create service with empty title
    expect(todoService.createTodo).not.toHaveBeenCalled();
  });

  test('todo creation with valid data', async () => {
    todoService.getTodos.mockResolvedValue([]);
    todoService.createTodo.mockResolvedValue({
      id: 1,
      title: 'New Todo',
      completed: false,
      priority: 'medium',
      category: 'personal'
    });
    
    renderWithProviders(<TodosPage />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/add.*todo/i)).toBeInTheDocument();
    });
    
    const todoInput = screen.getByPlaceholderText(/add.*todo/i);
    const addButton = screen.getByRole('button', { name: /add/i });
    
    fireEvent.change(todoInput, { target: { value: 'New Todo' } });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(todoService.createTodo).toHaveBeenCalledWith({
        title: 'New Todo',
        priority: 'medium',
        category: 'personal'
      });
    });
  });

  test('todo completion toggle', async () => {
    const mockTodos = [
      {
        id: 1,
        title: 'Test Todo',
        completed: false,
        priority: 'medium',
        category: 'personal'
      }
    ];
    
    todoService.getTodos.mockResolvedValue(mockTodos);
    todoService.updateTodo.mockResolvedValue({
      ...mockTodos[0],
      completed: true
    });
    
    renderWithProviders(<TodosPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Todo')).toBeInTheDocument();
    });
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(todoService.updateTodo).toHaveBeenCalledWith(1, { completed: true });
    });
  });

  test('todo filtering functionality', async () => {
    const mockTodos = [
      { id: 1, title: 'Completed Todo', completed: true, priority: 'high', category: 'work' },
      { id: 2, title: 'Pending Todo', completed: false, priority: 'low', category: 'personal' }
    ];
    
    todoService.getTodos.mockResolvedValue(mockTodos);
    
    renderWithProviders(<TodosPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Completed Todo')).toBeInTheDocument();
      expect(screen.getByText('Pending Todo')).toBeInTheDocument();
    });
    
    // Test filter by completed
    const completedFilter = screen.getByText(/completed/i);
    fireEvent.click(completedFilter);
    
    await waitFor(() => {
      expect(screen.getByText('Completed Todo')).toBeInTheDocument();
      expect(screen.queryByText('Pending Todo')).not.toBeInTheDocument();
    });
  });

  test('search functionality', async () => {
    const mockTodos = [
      { id: 1, title: 'Buy groceries', completed: false, priority: 'medium', category: 'personal' },
      { id: 2, title: 'Finish project', completed: false, priority: 'high', category: 'work' }
    ];
    
    todoService.getTodos.mockResolvedValue(mockTodos);
    
    renderWithProviders(<TodosPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      expect(screen.getByText('Finish project')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'groceries' } });
    
    await waitFor(() => {
      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      expect(screen.queryByText('Finish project')).not.toBeInTheDocument();
    });
  });

  test('error handling for failed API calls', async () => {
    todoService.getTodos.mockRejectedValue(new Error('Network error'));
    
    renderWithProviders(<TodosPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/error.*loading/i)).toBeInTheDocument();
    });
  });
});