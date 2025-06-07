import React, { useContext, useState, useCallback } from "react";
import MyInput from "../components/UI/input/MyInput";
import MyModal from "../components/UI/modal/MyModal";
import { AuthContext } from "../context/contextIndex";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset, confirmPasswordReset } from "../services/authService";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const PasswordInput = ({ name, placeholder, value, onChange, showPassword, toggleShow, required = false }) => (
  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
    <MyInput
      name={name}
      type={showPassword ? "text" : "password"}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      style={{ paddingRight: '50px' }}
    />
    <button
      type="button"
      onClick={toggleShow}
      style={{
        position: 'absolute',
        right: '10px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px',
        color: '#666',
        zIndex: 1
      }}
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
    </button>
  </div>
);

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const { login, showModal, isAdmin, userRole } = useContext(AuthContext);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const showLocalModal = (title, message) => {
    setModalContent({ title, message });
    setModalVisible(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleForgotPasswordChange = (e) => {
    setForgotPasswordForm({ ...forgotPasswordForm, [e.target.name]: e.target.value });
    if (forgotPasswordError) setForgotPasswordError("");
  };

  const validateForm = () => form.identifier.trim() && form.password.trim();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(!showPassword);
  }, [showPassword]);

  const toggleNewPasswordVisibility = useCallback(() => {
    setShowNewPassword(!showNewPassword);
  }, [showNewPassword]);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(!showConfirmPassword);
  }, [showConfirmPassword]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!validateForm()) {
      setError("Email/login and password are required.");
      return;
    }

    setIsLoading(true);

    try {
      await login(form);   
      showModal("Login Successful", "You have successfully logged in!");
      
      setTimeout(() => {
        setModalVisible(false);
      }, 1500);
      
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

      console.error("Login error:", msg);
      setError(msg);
      setModalContent({
        type: "error",
        title: "Login Error",
        message: msg
      });
      setModalVisible(true);
      setForm((prev) => ({ ...prev, password: "" }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordLoading(true);

    try {
      if (forgotPasswordStep === 1) {
        if (!forgotPasswordForm.email.trim()) {
          setForgotPasswordError("Email is required");
          return;
        }
        if (!validateEmail(forgotPasswordForm.email)) {
          setForgotPasswordError("Please enter a valid email address");
          return;
        }
        await requestPasswordReset(forgotPasswordForm.email);
        setForgotPasswordStep(2);
        showLocalModal("Reset Code Sent", `We've sent a reset code to ${forgotPasswordForm.email}. Please check your email.`);
      } else if (forgotPasswordStep === 2) {
        if (!forgotPasswordForm.code.trim()) {
          setForgotPasswordError("Verification code is required");
          return;
        }
        setForgotPasswordStep(3);
        showLocalModal("Code Verified", "Please enter your new password.");
      } else if (forgotPasswordStep === 3) {
        const { newPassword, confirmPassword } = forgotPasswordForm;
        if (!newPassword || !confirmPassword) {
          setForgotPasswordError("Both password fields are required");
          return;
        }
        if (!validatePassword(newPassword)) {
          setForgotPasswordError("Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one digit, and one special character");
          return;
        }
        if (newPassword !== confirmPassword) {
          setForgotPasswordError("Passwords do not match");
          return;
        }

        const resetData = {
          code: forgotPasswordForm.code,
          email: forgotPasswordForm.email,
          new_password: newPassword
        };

        await confirmPasswordReset(resetData);
        showLocalModal("Password Reset Successful", "Your password has been reset successfully. You can now login with your new password.");
        handleCloseForgotPassword();
      }
    } catch (err) {
      console.error("Password reset error:", err);
      let errorMessage = "An error occurred. Please try again.";
      if (err.response) {
        const { status, data } = err.response;
        switch (status) {
          case 404:
            errorMessage = "Password reset service is currently unavailable. Please contact support or try again later.";
            break;
          case 400:
            errorMessage = data?.message || data?.error || "Invalid request. Please check your input.";
            break;
          case 401:
            errorMessage = "Authentication failed. Please try again.";
            break;
          case 429:
            errorMessage = "Too many requests. Please wait a moment before trying again.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          default:
            errorMessage = data?.message || data?.error || `Server error (${status}). Please try again.`;
        }
      } else if (err.request) {
        errorMessage = "Unable to connect to the server. Please check your internet connection.";
      } else {
        errorMessage = err.message || "An unexpected error occurred.";
      }
      setForgotPasswordError(errorMessage);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep(1);
    setForgotPasswordForm({ email: "", code: "", newPassword: "", confirmPassword: "" });
    setForgotPasswordError("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (modalContent.title === "Login Successful") {
      console.log("Login modal closed, redirect will happen automatically");
    }
  };

  const renderForgotPasswordStep = () => {
    switch (forgotPasswordStep) {
      case 1:
        return (
          <>
            <h3 className="login__header">Reset Password</h3>
            <p className="auth-footer">Enter your email address and we'll send you a code to reset your password.</p>
            <MyInput
              name="email"
              type="email"
              placeholder="Enter your email"
              value={forgotPasswordForm.email}
              onChange={handleForgotPasswordChange}
              required
            />
          </>
        );
      case 2:
        return (
          <>
            <h3 className="login__header">Enter Verification Code</h3>
            <p className="auth-footer">We sent a verification code to: <strong>{forgotPasswordForm.email}</strong></p>
            <p className="auth-footer">Please check your email and enter the code below.</p>
            <MyInput
              name="code"
              type="text"
              placeholder="Enter verification code"
              value={forgotPasswordForm.code}
              onChange={handleForgotPasswordChange}
              required
            />
          </>
        );
      case 3:
        return (
          <>
            <h3 className="login__header">Set New Password</h3>
            <p className="auth-footer">Enter your new password below.</p>
            <PasswordInput
              name="newPassword"
              placeholder="New password"
              value={forgotPasswordForm.newPassword}
              onChange={handleForgotPasswordChange}
              showPassword={showNewPassword}
              toggleShow={toggleNewPasswordVisibility}
              required
            />
            <PasswordInput
              name="confirmPassword"
              placeholder="Confirm new password"
              value={forgotPasswordForm.confirmPassword}
              onChange={handleForgotPasswordChange}
              showPassword={showConfirmPassword}
              toggleShow={toggleConfirmPasswordVisibility}
              required
            />
          </>
        );
      default:
        return null;
    }
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
              <PasswordInput
                name="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                showPassword={showPassword}
                toggleShow={togglePasswordVisibility}
                required
              />
              {error && <div className="error-message"><p>{error}</p></div>}
              <button className="auth-btn" type="submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </button>
              <div className="auth-links">
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="auth-footer">
                <p>
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

      <MyModal visible={showForgotPassword} setVisible={setShowForgotPassword}>
        <div className="auth__container">
          <div className="login__email">
            <form onSubmit={handleForgotPasswordSubmit}>
              {renderForgotPasswordStep()}
              {forgotPasswordError && (
                <div className="error-message">
                  <p>{forgotPasswordError}</p>
                </div>
              )}
              <div className="auth-links">
                <button
                  className="auth-btn"
                  type="submit"
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading ? "Processing..." :
                    forgotPasswordStep === 1 ? "Send Code" :
                      forgotPasswordStep === 2 ? "Next" :
                        "Reset Password"}
                </button>
                {forgotPasswordStep > 1 && (
                  <button
                    type="button"
                    className="details-button"
                    onClick={() => setForgotPasswordStep(forgotPasswordStep - 1)}
                    disabled={forgotPasswordLoading}
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  className="details-button"
                  onClick={handleCloseForgotPassword}
                  disabled={forgotPasswordLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </MyModal>

      <MyModal visible={modalVisible} setVisible={setModalVisible}>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h3 style={{ 
            color: modalContent.title?.includes("Error") ? "#d8000c" : "#28a745",
            fontWeight: "bold",
            marginBottom: "10px"
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