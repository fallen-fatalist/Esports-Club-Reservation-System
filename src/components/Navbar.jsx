import React, { useContext } from "react"
import {Link, useNavigate} from 'react-router-dom'
import { AuthContext } from "../context/contextIndex";
import MyButton from "./UI/button/MyButton/MyButton";

const Navbar = (props) => {
  const {isAuth, setIsAuth} = useContext(AuthContext)

  const logout = () => {
    setIsAuth(false)
    navigate("/")
  }
  const navigate = useNavigate()
  return (
    <header className="header">
      <nav className="navbar" aria-label="Main Navigation">
        <Link to="/" className="navbar__logo">Logo</Link>

        <div className="navbar__links">
          <Link to="/about">About</Link>
          <Link to="/booking">Booking</Link>

          {!isAuth && (
            <>
              <MyButton onClick={() => navigate("/login")}>
                <span className="button__text">Login</span>
              </MyButton>
              <MyButton onClick={() => navigate("/register")}>
                <span className="button__text">Register</span>
              </MyButton>
            </>
          )}

          {isAuth && (
            <MyButton onClick={() => setIsAuth(false)}>
              <span className="button__text">Logout</span>
            </MyButton>
          )}
        </div>
      </nav>
    </header>


  )
};

export default Navbar;
