import React, { useContext, useState } from "react";
import MyInput from "../components/UI/input/MyInput";
import MyModal from "../components/UI/modal/MyModal";
import { AuthContext } from "../context/contextIndex";
import { useNavigate } from "react-router-dom";
import { signUp, activate, verifyEmail } from "../services/authService";

const Register = () => {
  const { login, showModal } = useContext(AuthContext);
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

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const { email, login: userLogin, password, confirmPassword } = form;

    if (!email || !userLogin || !password || !confirmPassword) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      await signUp({ email, login: userLogin, password });
      await activate(email);
      setStep(2);
      showLocalModal(
        "Registration Successful!",
        "Please check your email and enter the verification code below."
      );
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
      const response = await verifyEmail({ email: form.email, code: form.code });

      if (response.data?.token) {
        login(response.data.token);
        showModal("Success", "Registration completed successfully! Welcome!");
        setTimeout(() => navigate("/"), 1500);
      } else {
        showModal("Verification Complete", "Please log in with your credentials.");
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      if (err.response?.status === 400) {
        showLocalModal(
          "Verification Error",
          "The verification code you entered is incorrect. Please try again."
        );
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
      showLocalModal(
        "Code Sent",
        "A new verification code has been sent to your email."
      );
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to resend verification code";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError("");
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  const goBackToRegistration = () => {
    setStep(1);
    setError("");
    setForm((prev) => ({ ...prev, code: "" }));
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
                  placeholder="Create username"
                  value={form.login}
                  onChange={handleChange}
                  required
                />
                <MyInput
                  name="password"
                  type="password"
                  placeholder="Create password"
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
                  <div className="error-message">
                    <p>{error}</p>
                  </div>
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
                  <h3 style={{ color: "#28a745", marginBottom: "10px" }}>
                    Check Your Email
                  </h3>
                  <p style={{ color: "#6c757d", fontSize: "14px" }}>
                    We've sent a verification code to:<br />
                    <strong>{form.email}</strong>
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
                  <div className="error-message">
                    <p>{error}</p>
                  </div>
                )}
                <button className="auth-btn" type="submit" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify Email"}
                </button>
                <div
                  style={{ marginTop: "15px", display: "flex", gap: "10px" }}
                >
                  <button
                    type="button"
                    className="details-button"
                    onClick={resendActivationCode}
                    disabled={isLoading}
                    style={{ flex: 1 }}
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    className="details-button"
                    onClick={goBackToRegistration}
                    style={{ flex: 1 }}
                  >
                    Back to Registration
                  </button>
                  <button
                    type="button"
                    className="details-button"
                    onClick={() => navigate("/login")}
                    style={{ flex: 1 }}
                  >
                    Go to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <MyModal visible={modalVisible} setVisible={setModalVisible}>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h3 style={{ marginBottom: "15px", color: "#d8000c" }}>
            {modalContent.title}
          </h3>
          <p style={{ marginBottom: "20px", lineHeight: "1.5" }}>
            {modalContent.message}
          </p>
          <button className="auth-btn" onClick={handleModalClose}>
            OK
          </button>
        </div>
      </MyModal>
    </>
  );
};

export default Register;
