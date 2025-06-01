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

  const validateLogin = (login) => {
    // Латинские буквы (a–z), цифры (0–9), подчёркивание (_), длина от 3 до 20 символов
    const loginRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return loginRegex.test(login);
  };

  const validatePassword = (password) => {
    // Минимум 8 символов, одна заглавная, одна строчная, одна цифра, один спецсимвол
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
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

    if (!validateLogin(login)) {
      setError("Login must be 3-20 characters long and contain only Latin letters, digits, and underscores");
      return false;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one digit, and one special character");
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

      if (res.status === 200 || res.data?.success) {
        await loginContext({
          identifier: form.email,
          password: form.password, 
        });

        navigate("/"); 
      } else {
        showLocalModal("Verification Failed", "Something went wrong. Please try logging in.");
        navigate("/login");
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
                  placeholder="Create username (3-20 chars, Latin letters, digits, _)"
                  value={form.login}
                  onChange={handleChange}
                  required
                />
                <MyInput
                  name="password"
                  type="password"
                  placeholder="Create password (8+ chars, upper, lower, digit, special)"
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