// components/AppRouter.js
import React, { useContext } from "react"
import {
  Routes,
  Route,
  Navigate
} from 'react-router-dom'

import { privateRoutes, publicRoutes, adminRoutes } from "../router/index"
import { AuthContext } from "../context/contextIndex";

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
  
  if (isAuth) {
    return <Navigate to={isAdmin() ? "/admin" : "/"} replace />;
  }
  
  return children;
};

const AppRouter = () => {
  const { isAuth } = useContext(AuthContext);
   
  return (
    <Routes>
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
      
      <Route path="/" element={<Main/>} />
      <Route path="/booking" element={<Booking/>} />
      
      <Route path="*" element={<Error/>} />
    </Routes>
  )
};

export default AppRouter;