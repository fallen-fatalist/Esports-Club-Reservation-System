import About from "../pages/About"
import Booking from "../pages/Booking"
import Error from "../pages/Error"
import Main from "../pages/Main"
import Login from "../pages/Login"
import Register from "../pages/Register"
import Calendar from "../pages/Calendar"


export const privateRoutes = [
    {path: '/', page: Main, exact: true},
    {path: '/about', page: About, exact: true},
    {path: '/booking', page: Booking, exact: true},
    {path: '/calendar', page: Calendar, exact: true},
    {path: '*', page: Error, exact: false},
]

export const publicRoutes = [
    {path: '/', page: Main, exact: true},
    {path: '/about', page: About, exact: true},
    {path: "/login", page: Login, exact: true},
    {path: "/register", page: Register, exact: true},
    {path: '/booking', page: Booking, exact: true},
    {path: '/calendar', page: Calendar, exact: true},
    {path: '*', page: Login, exact: false},
]