import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user exists in local storage on app load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data", error);
        localStorage.removeItem('user'); // Clean up corrupt data
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });

  localStorage.setItem('user', JSON.stringify(data));
  
  if (data.token) {
    localStorage.setItem('token', data.token);
  }

  setUser(data);
  return data;
};

const register = async (name, email, password) => {
  const { data } = await api.post('/auth/register', { name, email, password });

  localStorage.setItem('user', JSON.stringify(data));

  if (data.token) {
    localStorage.setItem('token', data.token);
  }

  setUser(data);
  return data;
};


  // Logout Function - FIXED
  const logout = () => {
    // 1. Clear User
    setUser(null);
    localStorage.removeItem('user');
    
    // 2. Clear Token (Important!)
    localStorage.removeItem('token');

    // 3. FORCE CLEAR BUSINESS DATA
    // This prevents the new user from seeing the previous user's dashboard data
    localStorage.removeItem('activeBusiness');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);