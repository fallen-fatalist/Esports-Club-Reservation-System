import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from "../context/contextIndex";
import sunnyOutline from "../images/SunOutlined.svg";
import moonOutline from "../images/MoonOutlined.svg";
import { ThemeContext } from "../context/ThemeContext";
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import HomeIcon from '@mui/icons-material/Home';
import ComputerIcon from '@mui/icons-material/Computer';
import { CircularProgress, Tooltip, IconButton } from '@mui/material';
import { checkAuth } from "../services/authService";

const Navbar = () => {
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const { isAuth, userRole, logout, isAdmin } = useContext(AuthContext); 
  const navigate = useNavigate();
  
  const [userBalance, setUserBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const EXCHANGE_RATE_KZT_TO_USD = 0.0021;

  const convertToUSD = (amountInKZT) => {
    return (amountInKZT * EXCHANGE_RATE_KZT_TO_USD).toFixed(2);
  };

  const formatBalance = (balance) => {
    const usdAmount = convertToUSD(balance);
    return `${balance}₸ ($${usdAmount})`;
  };

  useEffect(() => {
    const fetchUserBalance = async () => {
      if (isAuth) {
        try {
          const response = await checkAuth();
          setUserBalance(response.data.balance || 0);
        } catch (err) {
          console.error('Error fetching user balance:', err);
        }
      }
    };
    fetchUserBalance();
  }, [isAuth]);

  const handleThemeToggle = () => {
    toggleTheme(); 
  };

  const handleLogout = async () => {
    try {
      await logout();   
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleRefreshBalance = async () => {
    if (!isAuth) return;
    
    setBalanceLoading(true);
    try {
      const response = await checkAuth();
      setUserBalance(response.data.balance || 0);
    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  return (
    <header className="header">
      <nav className="navbar" aria-label="Main Navigation">
        <Link to="/" className="navbar__logo">
          <ComputerIcon style={{ marginRight: '8px', fontSize: '24px' }} />
          eReserve
        </Link>
        
        <div className="navbar__nav-links">
          <Tooltip title="Home">
            <Link to="/" className="navbar__nav-item">
              <HomeIcon />
              <span className="nav-text">Home</span>
            </Link>
          </Tooltip>
          
          <Tooltip title="Book Computer">
            <Link to="/booking" className="navbar__nav-item">
              <BookOnlineIcon />
              <span className="nav-text">Booking</span>
            </Link>
          </Tooltip>
          
          {isAuth && (
            <Tooltip title="My Profile">
              <Link to="/profile" className="navbar__nav-item">
                <PersonIcon />
                <span className="nav-text">Profile</span>
              </Link>
            </Tooltip>
          )}
          
          {isAuth && isAdmin() && (
            <Tooltip title="Admin Panel">
              <Link to="/admin" className="navbar__nav-item admin-link">
                <AdminPanelSettingsIcon />
                <span className="nav-text">Admin</span>
              </Link>
            </Tooltip>
          )}
        </div>

        <div className="navbar__controls">
          {isAuth && (
            <div className="navbar__balance">
              <AccountBalanceWalletIcon className="balance-icon" />
              <span className="balance-text">{formatBalance(userBalance)}</span>
              <Tooltip title="Refresh Balance">
                <IconButton
                  size="small"
                  onClick={handleRefreshBalance}
                  disabled={balanceLoading}
                  className="balance-refresh-btn"
                >
                  {balanceLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <RefreshIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </div>
          )}

          <Tooltip title={isDarkTheme ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <button className="theme-toggle-btn" onClick={handleThemeToggle}>   
              <img
                src={isDarkTheme ? sunnyOutline : moonOutline}
                alt="Theme Toggle Icon"
                className="theme-icon"
              />
            </button>
          </Tooltip>

          <div className="navbar__auth">
            {!isAuth && (
              <>
                <Tooltip title="Login">
                  <button 
                    className="login-btn icon-only" 
                    onClick={() => navigate("/login")}
                  >
                    <LoginIcon />
                  </button>
                </Tooltip>
                <Tooltip title="Create Account">
                  <button 
                    className="register-btn" 
                    onClick={() => navigate("/register")}
                  >
                    <PersonAddIcon />
                    <span className="button__text">Register</span>
                  </button>
                </Tooltip>
              </>
            )}

            {isAuth && (
              <Tooltip title={`Logout (${userRole})`}>
                <button
                  className="logout-btn icon-only"
                  onClick={handleLogout}
                >
                  <LogoutIcon />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
