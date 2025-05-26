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
  
  // Forgot Password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: email, 2: code, 3: new password
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

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login(form);
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

  // Mock Forgot Password Functions
  const mockSendResetCode = async (email) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Mock: Reset code sent to ${email}`);
        resolve({ success: true });
      }, 1000);
    });
  };

  const mockVerifyResetCode = async (email, code) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (code === "123456") {
          console.log(`Mock: Code ${code} verified for ${email}`);
          resolve({ success: true });
        } else {
          reject(new Error("Invalid verification code"));
        }
      }, 1000);
    });
  };

  const mockResetPassword = async (email, code, newPassword) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Mock: Password reset for ${email}`);
        resolve({ success: true });
      }, 1000);
    });
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

        await mockSendResetCode(forgotPasswordForm.email);
        setForgotPasswordStep(2);
        showLocalModal("Reset Code Sent", `We've sent a reset code to ${forgotPasswordForm.email}. Use code: 123456 for demo.`);
        
      } else if (forgotPasswordStep === 2) {
        if (!forgotPasswordForm.code.trim()) {
          setForgotPasswordError("Verification code is required");
          return;
        }

        await mockVerifyResetCode(forgotPasswordForm.email, forgotPasswordForm.code);
        setForgotPasswordStep(3);
        showLocalModal("Code Verified", "Please enter your new password.");
        
      } else if (forgotPasswordStep === 3) {
        if (!forgotPasswordForm.newPassword || !forgotPasswordForm.confirmPassword) {
          setForgotPasswordError("Both password fields are required");
          return;
        }

        if (!validatePassword(forgotPasswordForm.newPassword)) {
          setForgotPasswordError("Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one digit, and one special character");
          return;
        }

        if (forgotPasswordForm.newPassword !== forgotPasswordForm.confirmPassword) {
          setForgotPasswordError("Passwords do not match");
          return;
        }

        await mockResetPassword(forgotPasswordForm.email, forgotPasswordForm.code, forgotPasswordForm.newPassword);
        showLocalModal("Password Reset Successful", "Your password has been reset successfully. You can now login with your new password.");
        handleCloseForgotPassword();
      }
    } catch (err) {
      setForgotPasswordError(err.message || "An error occurred. Please try again.");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep(1);
    setForgotPasswordForm({
      email: "",
      code: "",
      newPassword: "",
      confirmPassword: ""
    });
    setForgotPasswordError("");
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  const renderForgotPasswordStep = () => {
    switch (forgotPasswordStep) {
      case 1:
        return (
          <>
            <h3 className="forgot-password-title">Reset Password</h3>
            <p className="forgot-password-description">
              Enter your email address and we'll send you a code to reset your password.
            </p>
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
            <h3 className="forgot-password-title">Enter Verification Code</h3>
            <p className="forgot-password-description">
              We sent a verification code to: <strong>{forgotPasswordForm.email}</strong>
            </p>
            <p className="demo-note">Demo code: <strong>123456</strong></p>
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
            <h3 className="forgot-password-title">Set New Password</h3>
            <p className="forgot-password-description">
              Enter your new password below.
            </p>
            <MyInput
              name="newPassword"
              type="password"
              placeholder="New password (8+ chars, upper, lower, digit, special)"
              value={forgotPasswordForm.newPassword}
              onChange={handleForgotPasswordChange}
              required
            />
            <MyInput
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={forgotPasswordForm.confirmPassword}
              onChange={handleForgotPasswordChange}
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
        <div className="forgot-password-modal">
          <form onSubmit={handleForgotPasswordSubmit}>
            {renderForgotPasswordStep()}
            
            {forgotPasswordError && (
              <div className="error-message">
                <p>{forgotPasswordError}</p>
              </div>
            )}
            
            <div className="forgot-password-buttons">
              <button 
                className="auth-btn" 
                type="submit" 
                disabled={forgotPasswordLoading}
              >
                {forgotPasswordLoading ? "Processing..." : 
                 forgotPasswordStep === 1 ? "Send Code" :
                 forgotPasswordStep === 2 ? "Verify Code" :
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
      </MyModal>

      <MyModal visible={modalVisible} setVisible={setModalVisible}>
        <div className="info-modal">
          <h3 className={modalContent.title?.includes("Error") ? "error-title" : "success-title"}>
            {modalContent.title}
          </h3>
          <p>{modalContent.message}</p>
          <button className="auth-btn" onClick={handleModalClose}>OK</button>
        </div>
      </MyModal>
    </>
  );
};

export default Login;