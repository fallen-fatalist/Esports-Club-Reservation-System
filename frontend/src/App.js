import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { getCookie } from './components/utils/cookies.js';  

// Components
import Navbar from './components/Navbar';
import AppRouter from './components/AppRouter';
import { AuthContext } from './context/contextIndex';

// Styles
import './styles/main.css';

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const toggleTheme = () => {
    const newTheme = isDarkTheme ? "light" : "dark";
    setIsDarkTheme(!isDarkTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDarkTheme ? "dark" : "light");

    // Проверка токена (используем getCookie вместо Cookies.get)
    const token = getCookie("token");  // <- Вот тут исправлено!
    if (token) {
      setIsAuth(true);
    }
  }, [isDarkTheme]);

  return (
    <AuthContext.Provider value={{ isAuth, setIsAuth }}>
      <BrowserRouter>
        <div className="App">
          <Navbar toggleTheme={toggleTheme} isDarkTheme={isDarkTheme} />
          <AppRouter />
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;