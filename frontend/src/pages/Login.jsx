import React, { useContext } from "react"
import MyInput from "../components/UI/input/MyInput";
import MyButton from "../components/UI/button/MyButton/MyButton";
import { AuthContext } from "../context/contextIndex";
import { useNavigate } from "react-router-dom";

const Login = (props) => {
    const {isAuth, setIsAuth} = useContext(AuthContext)
    const navigate = useNavigate()
    const login = event => {
        event.preventDefault();
        setIsAuth(true);
        navigate("/")
    }
  return (
    <section className="authorization">
      <header className="login__header">
        <h1>Login page</h1>
      </header>
      <div className="auth__container">
        <div className="login__email">
          <form onSubmit={login}>
            <MyInput type="text" placeholder="Enter login"/>
            <MyInput type="password" placeholder="Enter password"/>
            <MyButton>Login</MyButton>
          </form>
        </div>
        <div className="login__telegram">
          dfsfdy
        </div>
      </div>
    </section>
  )
};

export default Login;

