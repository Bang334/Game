import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';

interface User {
  user_id: number;
  username: string;
  email: string;
  role: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  age?: number;
  gender?: string;
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  loading: boolean;
  error: string;
  setError: (error: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      setError('');
      
      // Clear existing auth data before login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lastActivity');
      
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email,
        password
      });
      
      const { token, user_id, username, email: userEmail, role } = response.data;
      
      const user: User = {
        user_id,
        username,
        email: userEmail,
        role
      };
      
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('lastActivity', Date.now().toString());
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      
      return user;
    } catch (error) {
      console.error('Login error details:', error);
      const message = error.response?.data?.error === 'INVALID_CREDENTIALS' 
        ? 'Email hoặc mật khẩu không đúng' 
        : error.response?.data?.error === 'MISSING_FIELDS'
        ? 'Vui lòng nhập đầy đủ email và mật khẩu'
        : 'Đăng nhập thất bại';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setError('');
  };

  const value = {
    currentUser,
    login,
    logout,
    loading,
    error,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
