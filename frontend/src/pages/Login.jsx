import React, { useContext, useState } from "react";
import MyInput from "../components/UI/input/MyInput";
import MyModal from "../components/UI/modal/MyModal";
import { AuthContext } from "../context/contextIndex";
import { useNavigate } from "react-router-dom";
import { signIn } from "../services/authService";

const Login = () => {
  const { login, showModal } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", login: "", password: "" });
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!form.email.trim()) {
      setErrorModalMessage("Email cannot be empty.");
      return false;
    }
    if (!form.login.trim()) {
      setErrorModalMessage("Login cannot be empty.");
      return false;
    }
    if (!form.password.trim()) {
      setErrorModalMessage("Password cannot be empty.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setErrorModalMessage("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setErrorModalVisible(true);
      return;
    }

    setIsLoading(true);

    try {
      const res = await signIn(form);
      const token = res.data?.token;

      if (token) {
        login(token);
        showModal("Success", "You have successfully logged in!");
        setTimeout(() => navigate("/"), 1500);
      } else {
        setErrorModalMessage("Invalid server response.");
        setErrorModalVisible(true);
      }
    } catch (err) {
      console.error("Login error:", err);

      let msg = "Login failed. Please try again.";

      if (err.response) {
        switch (err.response.status) {
          case 400:
            msg = "Please check your input data.";
            break;
          case 401:
            msg = "Incorrect email, login, or password.";
            break;
          case 403:
            msg = "Access denied. Your account might not be activated.";
            break;
          case 404:
            msg = "Service is temporarily unavailable. Please try again later.";
            break;
          case 500:
            msg = "Server error. Please try again later.";
            break;
          default:
            msg = err.response.data?.error || err.response.data?.message || msg;
        }
      } else {
        msg = "No internet connection.";
      }

      setErrorModalMessage(msg);
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <section className="authorization">
        <header className="login__header">
          <h1>Login Page</h1>
        </header>
        <div className="auth__container">
          <div className="login__email">
            <form onSubmit={handleLogin}>
              <MyInput
                name="email"
                type="text"
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

              <button className="auth-btn" type="submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <MyModal visible={errorModalVisible} setVisible={setErrorModalVisible}>
        <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-primary)" }}>
          <h3 style={{ color: "#d8000c" }}>Error</h3>
          <p>{errorModalMessage}</p>
          <button
            className="auth-btn"
            onClick={() => setErrorModalVisible(false)}
            style={{ marginTop: "15px", padding: "8px 16px" }}
          >
            Close
          </button>
        </div>
      </MyModal>

    </>
  );
};

export default Login;
