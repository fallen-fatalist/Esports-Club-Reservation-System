import React, { useContext, useState } from "react";
import MyInput from "../components/UI/input/MyInput";
import MyButton from "../components/UI/button/MyButton/MyButton";
import { AuthContext } from "../context/contextIndex";
import { useNavigate } from "react-router-dom";
import { signUp, activate, verifyEmail } from "../services/authService";

const Register = () => {
  const { setIsAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    login: "",
    password: "",
    confirmPassword: "",
    code: ""
  });

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");

    const { email, login, password, confirmPassword } = form;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await signUp({ email, login, password });
      await activate(email);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Registration error");
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    try {
      await verifyEmail({ email: form.email, code: form.code });
      alert("Email verified! Now you can log in.");
      navigate("/login");
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

  return (
    <section className="authorization">
      <header className="login__header">
        <h1>Register</h1>
      </header>
      <div className="auth__container">
        <div className="login__email">
          {step === 1 ? (
            <form onSubmit={handleRegister}>
              <MyInput name="email" type="text" placeholder="Enter email" value={form.email} onChange={handleChange} />
              <MyInput name="login" type="text" placeholder="Create username" value={form.login} onChange={handleChange} />
              <MyInput name="password" type="password" placeholder="Create password" value={form.password} onChange={handleChange} />
              <MyInput name="confirmPassword" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={handleChange} />
              {error && <div className="error-message"><p>{error}</p></div>}
              <button className="auth-btn">Register</button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <p>Enter verification code sent to your email:</p>
              <MyInput name="code" type="text" placeholder="Verification code" value={form.code} onChange={handleChange} />
              {error && <div className="error-message"><p>{error}</p></div>}
              <button className="auth-btn">Verify</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Register;