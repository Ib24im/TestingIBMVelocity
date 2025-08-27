import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TodosPage from './pages/TodosPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated } = useAuthStore();
  const { isDark } = useThemeStore();

  // Apply dark mode class to html element
  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/todos" replace /> : <LoginPage />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/todos" replace /> : <RegisterPage />
        } />
        <Route path="/todos" element={
          <ProtectedRoute>
            <Layout>
              <TodosPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <Navigate to={isAuthenticated ? "/todos" : "/login"} replace />
        } />
      </Routes>
    </div>
  );
}

export default App;
