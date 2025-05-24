import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { getCookie, setCookie, deleteCookie } from './components/utils/cookies.js';

// Components
import Navbar from './components/Navbar';
import AppRouter from './components/AppRouter';
import MyModal from './components/UI/modal/MyModal';
import { AuthContext } from './context/contextIndex';
import { ThemeProviderCustom } from './context/ThemeContext'; 

// Styles
import './styles/main.css';

function App() {
  const [isAuth, setIsAuth] = useState(!!getCookie('token'));
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  const showModal = (title, message) => {
    setModalContent({ title, message });
    setModalVisible(true);
  };

  const handleAuthError = (message = "Authentication required") => {
    logout();
    showModal("Authentication Error", message);
  };

  const login = (token) => {
    setCookie('token', token, 7);
    setIsAuth(true);
  };

  const logout = () => {
    deleteCookie('token');
    setIsAuth(false);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuth, 
      setIsAuth,
      login,
      logout,
      handleAuthError,
      showModal,
      modalVisible,
      setModalVisible,
      modalContent
    }}>
      <ThemeProviderCustom> 
        <BrowserRouter>
          <div className="App">
            <Navbar />
            <AppRouter />

            {/* Глобальное модальное окно для уведомлений */}
            <MyModal visible={modalVisible} setVisible={setModalVisible}>
              <div style={{ padding: "20px", textAlign: "center" }}>
                <h3 style={{ 
                  marginBottom: "15px", 
                  color: modalContent.title?.includes("Error") || modalContent.title?.includes("Expired") 
                    ? "#dc3545" 
                    : "#28a745" 
                }}>
                  {modalContent.title}
                </h3>
                <p style={{ marginBottom: "20px", lineHeight: "1.5" }}>
                  {modalContent.message}
                </p>
                <button 
                  className="auth-btn" 
                  onClick={() => setModalVisible(false)}
                >
                  OK
                </button>
              </div>
            </MyModal>
          </div>
        </BrowserRouter>
      </ThemeProviderCustom>
    </AuthContext.Provider>
  );
}

export default App;
