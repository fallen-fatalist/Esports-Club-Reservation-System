// router/index.js
import Booking from "../pages/Booking"
import Error from "../pages/Error"
import Main from "../pages/Main"
import Login from "../pages/Login"
import Register from "../pages/Register"
import Profile from "../pages/Profile"
import Admin from "../pages/Admin"

export const privateRoutes = [
    {path: '/profile', page: Profile, exact: true},
]

export const adminRoutes = [
    {path: '/admin', page: Admin, exact: true},
]

export const publicRoutes = [
    {path: '/', page: Main, exact: true},
    {path: "/login", page: Login, exact: true},
    {path: "/register", page: Register, exact: true},
    {path: '/booking', page: Booking, exact: true},
    {path: '*', page: Error, exact: false},
]