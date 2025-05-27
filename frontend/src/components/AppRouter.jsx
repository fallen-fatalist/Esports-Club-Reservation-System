// components/AppRouter.js
import React, { useContext } from "react"
import {
  Routes,
  Route,
  Navigate
} from 'react-router-dom'

import { privateRoutes, publicRoutes, adminRoutes } from "../router/index"
import { AuthContext } from "../context/contextIndex";

// Импортируем компоненты страниц
import Main from "../pages/Main";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Booking from "../pages/Booking";
import Error from "../pages/Error";

const AdminRoute = ({ children }) => {
  const { isAuth, isAdmin, userRole } = useContext(AuthContext);
   
  if (!isAuth || !userRole) {
    return <Navigate to="/login" replace />;
  }
   
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }
   
  return children;
};

const ProtectedRoute = ({ children }) => {
  const { isAuth } = useContext(AuthContext);
  
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AuthRoute = ({ children }) => {
  const { isAuth, isAdmin } = useContext(AuthContext);
  
  // Если пользователь уже аутентифицирован, перенаправляем его
  if (isAuth) {
    return <Navigate to={isAdmin() ? "/admin" : "/"} replace />;
  }
  
  return children;
};

const AppRouter = () => {
  const { isAuth } = useContext(AuthContext);
   
  return (
    <Routes>
      {/* Админские роуты */}
      {adminRoutes.map(route => 
        <Route
          key={route.path}
          path={route.path}
          element={
            <AdminRoute>
              <route.page/>
            </AdminRoute>
          }
          exact={route.exact}
        />
      )}
      
      {/* Приватные роуты (для всех аутентифицированных пользователей) */}
      {privateRoutes.map(route => 
        <Route
          key={route.path}
          path={route.path}
          element={
            <ProtectedRoute>
              <route.page/>
            </ProtectedRoute>
          }
          exact={route.exact}
        />
      )}
      
      {/* Роуты аутентификации (логин/регистрация) */}
      <Route
        path="/login"
        element={
          <AuthRoute>
            <Login/>
          </AuthRoute>
        }
      />
      
      <Route
        path="/register"
        element={
          <AuthRoute>
            <Register/>
          </AuthRoute>
        }
      />
      
      {/* Публичные роуты */}
      <Route path="/" element={<Main/>} />
      <Route path="/booking" element={<Booking/>} />
      
      {/* 404 роут */}
      <Route path="*" element={<Error/>} />
    </Routes>
  )
};

export default AppRouter;