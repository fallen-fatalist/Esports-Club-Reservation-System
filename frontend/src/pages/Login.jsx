import React, { useContext, useState } from "react";
import MyInput from "../components/UI/input/MyInput";
import { AuthContext } from "../context/contextIndex";
import { useNavigate } from "react-router-dom";
import { signIn } from "../services/authService";

const Login = () => {
  const { login } = useContext(AuthContext);
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
      const token = res.data.token;
      
      if (token) {
        login(token); 
        navigate("/");
      } else {
        setError("Failed to receive authentication token");
      }
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
              type="email"
              placeholder="Enter email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <MyInput
              name="login"
              type="text"
              placeholder="Enter login"
              value={form.login}
              onChange={handleChange}
              required
            />
            <MyInput
              name="password"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
              required
            />
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}
            <button className="auth-btn">Login</button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Login;