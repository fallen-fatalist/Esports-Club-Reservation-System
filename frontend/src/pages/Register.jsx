import React, { useContext, useState } from "react";
import MyInput from "../components/UI/input/MyInput";
import MyModal from "../components/UI/modal/MyModal";
import { AuthContext } from "../context/contextIndex";
import { useNavigate } from "react-router-dom";
import { signUp, activate, verifyEmail } from "../services/authService";

const Register = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const [form, setForm] = useState({
    email: "",
    login: "",
    password: "",
    confirmPassword: "",
    code: ""
  });

  const showModal = (title, message) => {
    setModalContent({ title, message });
    setModalVisible(true);
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");

    const { email, login: userLogin, password, confirmPassword } = form;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await signUp({ email, login: userLogin, password });
      await activate(email);
      setStep(2);
      showModal(
        "Registration Successful!", 
        "Please check your email and enter the verification code below."
      );
    } catch (err) {
      setError(err.response?.data?.error || "Registration error");
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    try {
      const response = await verifyEmail({ email: form.email, code: form.code });
      
      if (response.data?.token) {
        login(response.data.token);
        navigate("/");
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed");
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
                {error && <div className="error-message"><p>{error}</p></div>}
                <button className="auth-btn">Register</button>
              </form>
            ) : (
              <form onSubmit={handleVerify}>
                <p>Enter verification code sent to your email:</p>
                <MyInput 
                  name="code" 
                  type="text" 
                  placeholder="Verification code" 
                  value={form.code} 
                  onChange={handleChange}
                  required 
                />
                {error && <div className="error-message"><p>{error}</p></div>}
                <button className="auth-btn">Verify</button>
                <div style={{ marginTop: "10px" }}>
                  <button className="details-button" 
                    type="button" 
                    onClick={() => setStep(1)}
                    style={{ backgroundColor: "#6c757d" }}
                  >
                    Back to Registration
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <MyModal visible={modalVisible} setVisible={setModalVisible}>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h3 style={{ marginBottom: "15px", color: "#28a745" }}>
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