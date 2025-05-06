import About from "../pages/About"
import Booking from "../pages/Booking"
import Posts from "../pages/Posts"
import PostIdPage from "../pages/PostIdPage"
import Error from "../pages/Error"
import Main from "../pages/Main"
import Login from "../pages/Login"
import Register from "../pages/Register"


export const privateRoutes = [
    {path: '/', page: Main, exact: true},
    {path: '/about', page: About, exact: true},
    {path: '/booking', page: Booking, exact: true},
    {path: '/posts', page: Posts, exact: true},
    {path: '/posts/:id', page: PostIdPage, exact: false},
    {path: '*', page: Error, exact: false},
]

export const publicRoutes = [
    {path: '/', page: Main, exact: true},
    {path: '/about', page: About, exact: true},
    {path: "/login", page: Login, exact: true},
    {path: "/register", page: Register, exact: true},
    {path: '*', page: Login, exact: false},
]