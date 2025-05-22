import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { getCookie } from './components/utils/cookies.js';  

// Components
import Navbar from './components/Navbar';
import AppRouter from './components/AppRouter';
import { AuthContext } from './context/contextIndex';
import { ThemeProviderCustom } from './context/ThemeContext'; 

// Styles
import './styles/main.css';

function App() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {

    const token = getCookie("token");  
    if (token) {
      setIsAuth(true);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuth, setIsAuth }}>
      <ThemeProviderCustom> 
        <BrowserRouter>
          <div className="App">
            <Navbar />
            <AppRouter />
          </div>
        </BrowserRouter>
      </ThemeProviderCustom>
    </AuthContext.Provider>
  );
}

export default App;