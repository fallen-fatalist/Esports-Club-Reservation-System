import React, { createContext, useState, useEffect } from 'react';
import { getCookie, setCookie, deleteCookie } from '../components/utils/cookies';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const token = getCookie('token');
    if (token) setIsAuth(true);
  }, []);

  const login = (token) => {
    setCookie('token', token, { expires: 7 });
    setIsAuth(true);
  };

  const logout = () => {
    deleteCookie('token');
    setIsAuth(false);
  };

  return (
    <AuthContext.Provider value={{ isAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};