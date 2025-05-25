import React, { useContext, useState } from "react";
import MyInput from "../components/UI/input/MyInput";
import MyModal from "../components/UI/modal/MyModal";
import { AuthContext } from "../context/contextIndex";
import { useNavigate } from "react-router-dom";
import { signIn } from "../services/authService";

const Login = () => {
  const { login, showModal } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  const showLocalModal = (title, message) => {
    setModalContent({ title, message });
    setModalVisible(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const validateForm = () => {
    if (!form.identifier.trim()) {
      setError("Email or login cannot be empty.");
      return false;
    }
    if (!form.password.trim()) {
      setError("Password cannot be empty.");
      return false;
    }
    return true;
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Для httpOnly cookies передаем просто form данные
      await login(form); // Используем login из контекста, который уже содержит signIn + checkAuth
      
      // Мгновенный переход без модального окна
      navigate("/");
    } catch (err) {
      let msg = "Login failed. Please try again.";

      if (err.response) {
        switch (err.response.status) {
          case 400:
            msg = "Please check your input.";
            break;
          case 401:
            msg = "Incorrect login/email or password.";
            break;
          case 403:
            msg = "Your account may not be activated.";
            break;
          case 500:
            msg = "Server error. Try again later.";
            break;
          default:
            msg = err.response.data?.message || msg;
        }
      } else {
        msg = "No internet connection.";
      }

      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  return (
    <>
      <section className="authorization">
        <header className="login__header">
          <h1>Login</h1>
        </header>
        <div className="auth__container">
          <div className="login__email">
            <form onSubmit={handleLogin}>
              <MyInput
                name="identifier"
                type="text"
                placeholder="Enter email or login"
                value={form.identifier}
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
                <div className="error-message"><p>{error}</p></div>
              )}
              <button className="auth-btn" type="submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </button>
              <div style={{ marginTop: "15px", textAlign: "center" }}>
                <p style={{ color: "#6c757d", fontSize: "14px" }}>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="details-button"
                    onClick={() => navigate("/register")}
                  >
                    Register here
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      <MyModal visible={modalVisible} setVisible={setModalVisible}>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h3 style={{ 
            color: modalContent.title?.includes("Error") ? "#d8000c" : "#28a745" 
          }}>
            {modalContent.title}
          </h3>
          <p style={{ marginBottom: "20px" }}>{modalContent.message}</p>
          <button className="auth-btn" onClick={handleModalClose}>OK</button>
        </div>
      </MyModal>
    </>
  );
};

export default Login;