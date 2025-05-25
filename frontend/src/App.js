import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './components/Navbar';
import AppRouter from './components/AppRouter';
import MyModal from './components/UI/modal/MyModal';
import { AuthContext } from './context/contextIndex';
import { ThemeProviderCustom } from './context/ThemeContext';
import './styles/main.css';
import { checkAuth, signIn, logoutRequest } from './services/authService';

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const [loading, setLoading] = useState(true);

  const showModal = (title, message) => {
    setModalContent({ title, message });
    setModalVisible(true);
  };

  const handleAuthError = (message = "Authentication required") => {
    logout();
    showModal("Authentication Error", message);
  };

  const login = async (credentials) => {
    try {
      await signIn(credentials);
      await checkUserAuth();
    } catch (error) {
      showModal("Login Error", error?.response?.data?.error || "Unknown error");
    }
  };

  const logout = async () => {
    try {
      await logoutRequest(); 
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setIsAuth(false); 
    }
  };

  const checkUserAuth = async () => {
    try {
      setLoading(true);
      const res = await checkAuth();
      if (res.data?.role) {
        setIsAuth(true);
      } else {
        setIsAuth(false);
      }
    } catch (error) {
      setIsAuth(false);
      if (error.response?.status !== 401) {
        console.error('Auth check error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserAuth();

    const handleAuthEvent = () => {
      setIsAuth(false); 
    };

    window.addEventListener('auth-error', handleAuthEvent);
    
    return () => {
      window.removeEventListener('auth-error', handleAuthEvent);
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading...</div>
      </div>
    );
  }

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