import React, { useContext, useState } from "react";
import MyInput from "../components/UI/input/MyInput";
import MyButton from "../components/UI/button/MyButton/MyButton";
import { AuthContext } from "../context/contextIndex";
import { useNavigate } from "react-router-dom";
import { signIn } from "../services/authService";

// Нативные методы для работы с куками
const setCookie = (name, value, days) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/`;
};

const Login = () => {
  const { setIsAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", login: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const res = await signIn(form);
      const token = res.data.message;
      
      // Устанавливаем куку на 7 дней
      setCookie("token", token, 7);
      setIsAuth(true);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <section className="authorization">
      <header className="login__header">
        <h1>Login page</h1>
      </header>
      <div className="auth__container">
        <div className="login__email">
          <form onSubmit={handleLogin}>
            <MyInput 
              name="email" 
              type="text" 
              placeholder="Enter email" 
              onChange={handleChange} 
            />
            <MyInput 
              name="login" 
              type="text" 
              placeholder="Enter login" 
              onChange={handleChange} 
            />
            <MyInput 
              name="password" 
              type="password" 
              placeholder="Enter password" 
              onChange={handleChange} 
            />
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}
            <MyButton>Login</MyButton>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Login;