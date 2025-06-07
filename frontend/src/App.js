import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './components/Navbar';
import AppRouter from './components/AppRouter';
import MyModal from './components/UI/modal/MyModal';
import { AuthContext } from './context/contextIndex';
import { ThemeProviderCustom } from './context/ThemeContext';
import './styles/main.css';
import { checkAuth, signIn, logoutRequest, checkIsPriveleged } from './services/authService';

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const [loading, setLoading] = useState(true);

  // Show reusable modal
  const showModal = (title, message) => {
    setModalContent({ title, message });
    setModalVisible(true);
  };

  // Handle authentication errors globally
  const handleAuthError = (message = "Authentication required") => {
    logout();
    showModal("Authentication Error", message);
  };

  // Logout the user and reset state
  const logout = async () => {
    try {
      await logoutRequest(); 
    } catch (error) {
      // Silent catch
    } finally {
      setIsAuth(false);
      setUserRole(null);
    }
  };

  // Role checking helpers
  const isOwner = () => userRole === 'owner';
  const isAdmin = () => ['admin', 'privileged', 'owner'].includes(userRole);
  const isPrivileged = () => ['privileged', 'owner'].includes(userRole);

  // Check if user is authenticated (used on initial load)
  const checkUserAuth = async () => {
    try {
      setLoading(true);
      const res = await checkAuth();
      
      if (res.data?.role) {
        setIsAuth(true);
        setUserRole(res.data.role);

        // Extra privilege check for admins (excluding owner)
        if (isAdmin() && !isOwner()) {
          try {
            await checkIsPriveleged();
          } catch (error) {
            if (error.response?.status !== 403) {
              // Silent fail for unexpected errors
            }
          }
        }
      } else {
        setIsAuth(false);
        setUserRole(null);
      }
    } catch (error) {
      setIsAuth(false);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  // Used during login process to confirm and store user role
  const checkUserAuthForLogin = async () => {
    try {
      const res = await checkAuth();
      if (res.data?.role) {
        setIsAuth(true);
        setUserRole(res.data.role);
        return true;
      }
      throw new Error('No user role in response');
    } catch (error) {
      setIsAuth(false);
      setUserRole(null);
      throw error;
    }
  };

  // Handle login logic and update auth state
  const login = async (credentials) => {
    try {
      const signInResponse = await signIn(credentials);
      if (signInResponse.status !== 200) throw new Error('Sign in failed');

      await checkUserAuthForLogin();
      return {
        success: true,
        userRole,
        isAdmin: isAdmin(),
        isOwner: isOwner()
      };
    } catch (error) {
      throw error;
    }
  };

  // Initial auth check and global auth-error listener
  useEffect(() => {
    checkUserAuth();

    const handleAuthEvent = () => {
      setIsAuth(false);
      setUserRole(null);
    };

    window.addEventListener('auth-error', handleAuthEvent);
    return () => window.removeEventListener('auth-error', handleAuthEvent);
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
      userRole,
      setUserRole,
      isAdmin,
      isOwner,
      isPrivileged,
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
