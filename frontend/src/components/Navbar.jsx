import React, { useContext   } from "react"
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from "../context/contextIndex";
import sunnyOutline from "../images/SunOutlined.svg";
import moonOutline from "../images/MoonOutlined.svg";
import { logout }  from "../services/authService";
import { ThemeContext } from "../context/ThemeContext";

const Navbar = () => {
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const { isAuth, setIsAuth } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleThemeToggle = () => {
    toggleTheme(); 
  };

  return (
    <header className="header">
      <nav className="navbar" aria-label="Main Navigation">
        <Link to="/" className="navbar__logo">eReserve</Link>
          <button className="theme-toggle-btn" onClick={handleThemeToggle}>
            <img
              src={isDarkTheme ? sunnyOutline : moonOutline}
              alt="Theme Toggle Icon"
              className="theme-icon"
            />
          </button>

        <div className="navbar__links">
          <Link to="/booking">Booking</Link>
          {/* <Link to="/profile">Profile</Link> */}

          {!isAuth && (
            <>
              <button className="login-btn" onClick={() => navigate("/login")}>
                <span className="button__text">Login</span>
              </button>
              <button className="register-btn" onClick={() => navigate("/register")}>
                <span className="button__text">Register</span>
              </button>
            </>
          )}

          {isAuth && (
            <button className="logout-btn" onClick={() => { setIsAuth(false); logout();}}>
              <span className="button__text">Logout</span>
            </button>
          )}

        </div>
      </nav>
    </header>
  );
};

export default Navbar;


