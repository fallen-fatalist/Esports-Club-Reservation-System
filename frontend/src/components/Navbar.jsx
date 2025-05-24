import React, { useContext } from "react"
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from "../context/contextIndex";
import sunnyOutline from "../images/SunOutlined.svg";
import moonOutline from "../images/MoonOutlined.svg";
import { ThemeContext } from "../context/ThemeContext";
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';

const Navbar = () => {
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const { isAuth, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleThemeToggle = () => {
    toggleTheme(); 
  };

  return (
    <header className="header">
      <nav className="navbar" aria-label="Main Navigation">
        <Link to="/" className="navbar__logo">
          eReserve
        </Link>
        <button className="theme-toggle-btn" onClick={handleThemeToggle}>
          <img
            src={isDarkTheme ? sunnyOutline : moonOutline}
            alt="Theme Toggle Icon"
            className="theme-icon"
          />
        </button>

        <div className="navbar__links">
          <Link to="/booking">Booking</Link>
          {isAuth && <Link to="/profile">Profile</Link>}

          {!isAuth && (
            <>
              <button className="login-btn icon-only" onClick={() => navigate("/login")} title="Login">
                <LoginIcon />
              </button>
              <button className="register-btn" onClick={() => navigate("/register")}>
                <span className="button__text">Register</span>
              </button>
            </>
          )}
          {isAuth && (
            <button className="logout-btn icon-only" onClick={logout} title="Logout">
              <LogoutIcon />
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;