import React, { useContext, useState, useCallback } from "react";
import MyInput from "../components/UI/input/MyInput";
import MyModal from "../components/UI/modal/MyModal";
import { AuthContext } from "../context/contextIndex";
import { useNavigate } from "react-router-dom";
import { signUp, activate, verifyEmail } from "../services/authService";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

// Password input component with toggle for showing/hiding password characters
const PasswordInput = React.memo(({ name, placeholder, value, onChange, required }) => {
  const [showPassword, setShowPassword] = useState(false);

  // Toggle password visibility state
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <MyInput
        name={name}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        style={{ paddingRight: '40px' }}
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '5px',
          color: '#6c757d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
      </button>
    </div>
  );
});

const Register = () => {
  const { login: loginContext, showModal } = useContext(AuthContext); // Get login function and modal from context
  const navigate = useNavigate(); // Router navigation hook

  // Step controls the registration stage: 1 = fill form, 2 = verify email code
  const [step, setStep] = useState(1);

  // State for form error messages
  const [error, setError] = useState("");

  // Loading state for async requests
  const [isLoading, setIsLoading] = useState(false);

  // Modal visibility and content state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  // Form data state
  const [form, setForm] = useState({
    email: "",
    login: "",
    password: "",
    confirmPassword: "",
    code: ""
  });

  // Show modal with dynamic title and message
  const showLocalModal = useCallback((title, message) => {
    setModalContent({ title, message });
    setModalVisible(true);
  }, []);

  // Handle form input changes and clear errors
  const handleChange = useCallback((e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  }, [error]);

  // Email validation with regex
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Login validation: 3-20 chars, latin letters, digits, underscore
  const validateLogin = useCallback((login) => {
    const loginRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return loginRegex.test(login);
  }, []);

  // Password validation: min 8 chars, uppercase, lowercase, digit, special char
  const validatePassword = useCallback((password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return passwordRegex.test(password);
  }, []);

  // Validate all form fields before submission
  const validateForm = useCallback(() => {  
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
  }, [form, validateEmail, validateLogin, validatePassword]);

  // Handle registration form submit
  const handleRegister = useCallback(async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    const { email, login, password } = form;

    try {
      // Call signup API and send activation email
      await signUp({ email, login, password });
      await activate(email);
      setStep(2); // Move to email verification step
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
  }, [form, validateForm, showLocalModal]);

  // Handle verification code submission
  const handleVerify = useCallback(async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    if (!form.code) {
      setError("Please enter the verification code");
      setIsLoading(false);
      return;
    }

    try {
      // Verify the email code with backend
      const res = await verifyEmail({ email: form.email, code: form.code });

      if (res.status === 200 || res.data?.success) {
        // If verification succeeds, log user in and navigate to homepage
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
  }, [form.code, form.email, form.password, loginContext, navigate, showLocalModal]);

  // Resend activation code email
  const resendActivationCode = useCallback(async () => {
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
  }, [form.email, showLocalModal]);

  // Go back to registration form from verification step
  const goBackToRegistration = useCallback(() => {
    setStep(1);
    setError("");
    setForm(prev => ({ ...prev, code: "" }));
  }, []);

  // Close modal handler
  const handleModalClose = useCallback(() => {
    setModalVisible(false);
  }, []);

  // Navigate to login page
  const navigateToLogin = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  return (
    <>
      <section className="authorization">
        <header className="login__header">
          <h1>Register</h1>
        </header>
        <div className="auth__container">
          <div className="login__email">
            {step === 1 ? (
              // Registration form
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
                <PasswordInput
                  name="password"
                  placeholder="Create password (8+ chars, upper, lower, digit, special)"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <PasswordInput
                  name="confirmPassword"
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
                      onClick={navigateToLogin}
                    >
                      Login here
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              // Email verification form
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
                  <button type="button" className="details-button" onClick={navigateToLogin} style={{ flex: 1 }}>
                    Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Modal for success/error messages */}
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
