import React, { useContext, useState } from "react";
import MyInput from "../components/UI/input/MyInput";
import MyModal from "../components/UI/modal/MyModal";
import { AuthContext } from "../context/contextIndex";
import { useNavigate } from "react-router-dom";
import { signUp, activate, verifyEmail } from "../services/authService";

const Register = () => {
  const { login: loginContext, showModal } = useContext(AuthContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  const [form, setForm] = useState({
    email: "",
    login: "",
    password: "",
    confirmPassword: "",
    code: ""
  });

  const showLocalModal = (title, message) => {
    setModalContent({ title, message });
    setModalVisible(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // Минимум 8 символов, одна заглавная буква (английская) и одна цифра
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateForm = () => {
    const { email, login, password, confirmPassword } = form;

    if (!email || !login || !password || !confirmPassword) {
      setError("All fields are required");
      return false;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (login.length < 3) {
      setError("Login must be at least 3 characters long");
      return false;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters long, contain at least one uppercase English letter and one digit");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    const { email, login, password } = form;

    try {
      await signUp({ email, login, password });
      await activate(email);
      setStep(2);
      showLocalModal("Registration Successful!", "Please check your email and enter the verification code.");
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Registration error";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    if (!form.code) {
      setError("Please enter the verification code");
      setIsLoading(false);
      return;
    }

    try {
      const res = await verifyEmail({ email: form.email, code: form.code });

      // Для httpOnly cookies проверяем статус ответа, а не токен
      if (res.status === 200 || res.data?.success) {
        // Если верификация прошла успешно и сервер автоматически авторизует,
        // то вызываем loginContext без параметров (для httpOnly cookies)
        try {
          await loginContext(); // Это вызовет checkAuth для проверки cookie
          navigate("/"); // Мгновенный переход
        } catch (authError) {
          // Если автоматической авторизации нет, направляем на логин
          navigate("/login"); // Мгновенный переход
        }
      } else {
        navigate("/login"); // Мгновенный переход
      }
    } catch (err) {
      if (err.response?.status === 400) {
        showLocalModal("Verification Error", "Invalid verification code. Try again.");
      } else {
        const errorMessage =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Verification failed";
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resendActivationCode = async () => {
    setError("");
    setIsLoading(true);
    try {
      await activate(form.email);
      showLocalModal("Code Sent", "New verification code sent to your email.");
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to resend code";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToRegistration = () => {
    setStep(1);
    setError("");
    setForm((prev) => ({ ...prev, code: "" }));
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  return (
    <>
      <section className="authorization">
        <header className="login__header">
          <h1>Register</h1>
        </header>
        <div className="auth__container">
          <div className="login__email">
            {step === 1 ? (
              <form onSubmit={handleRegister}>
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
                  placeholder="Create login (min 3 characters)"
                  value={form.login}
                  onChange={handleChange}
                  required
                />
                <MyInput
                  name="password"
                  type="password"
                  placeholder="Create password (min 8 chars, 1 uppercase, 1 digit)"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <MyInput
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {error && (
                  <div className="error-message"><p>{error}</p></div>
                )}
                <button className="auth-btn" type="submit" disabled={isLoading}>
                  {isLoading ? "Registering..." : "Register"}
                </button>
                <div style={{ marginTop: "15px", textAlign: "center" }}>
                  <p style={{ color: "#6c757d", fontSize: "14px" }}>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="details-button"
                      onClick={() => navigate("/login")}
                    >
                      Login here
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerify}>
                <div style={{ marginBottom: "20px", textAlign: "center" }}>
                  <h3 style={{ color: "#28a745" }}>Check Your Email</h3>
                  <p style={{ fontSize: "14px" }}>
                    We sent a verification code to: <strong>{form.email}</strong>
                  </p>
                </div>

                <MyInput
                  name="code"
                  type="text"
                  placeholder="Enter verification code"
                  value={form.code}
                  onChange={handleChange}
                  required
                />
                {error && (
                  <div className="error-message"><p>{error}</p></div>
                )}
                <button className="auth-btn" type="submit" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify"}
                </button>
                <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                  <button type="button" className="details-button" onClick={resendActivationCode} disabled={isLoading} style={{ flex: 1 }}>
                    Resend Code
                  </button>
                  <button type="button" className="details-button" onClick={goBackToRegistration} style={{ flex: 1 }}>
                    Back
                  </button>
                  <button type="button" className="details-button" onClick={() => navigate("/login")} style={{ flex: 1 }}>
                    Login
                  </button>
                </div>
              </form>
            )}
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

export default Register;