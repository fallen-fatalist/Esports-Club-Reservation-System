import React, { useContext, useState } from "react";
import MyInput from "../components/UI/input/MyInput";
import MyButton from "../components/UI/button/MyButton/MyButton";
import { AuthContext } from "../context/contextIndex";
import { useNavigate } from "react-router-dom";

const Register = () => {
    const { setIsAuth } = useContext(AuthContext);
    const navigate = useNavigate();

    const [error, setError] = useState("");
  
    const handleRegister = (event) => {
    event.preventDefault();

    const email = event.target[0].value;
    const username = event.target[1].value;
    const password = event.target[2].value;
    const confirmPassword = event.target[3].value;

    if (password !== confirmPassword) {
        setError("Passwords do not match");
        return; 
    }
    const user = { email, username, password };
    localStorage.setItem("user", JSON.stringify(user));

    setIsAuth(true);
    navigate("/");
  }

  return (
    <section className="authorization">
      <header className="login__header">
        <h1>Register</h1>
      </header>
      <div className="auth__container">
        <div className="login__email">
          <form onSubmit={handleRegister}>
            <MyInput type="text" placeholder="Enter email" />
            <MyInput type="text" placeholder="Create username" />
            <MyInput type="password" placeholder="Create password" />
            <MyInput type="password" placeholder="Confirm password" />
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}
            <MyButton>Register</MyButton>
          </form>
        </div>
        <div className="login__telegram">
          {/* Здесь можно будет сделать вход через Telegram */}
        </div>
      </div>
    </section>
  )
};

export default Register;
