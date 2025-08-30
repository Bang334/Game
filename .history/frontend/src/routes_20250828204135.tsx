import { createBrowserRouter } from 'react-router-dom'
import CustomerLayout from './layouts/CustomerLayout'
import AdminLayout from './layouts/AdminLayout'
import CustomerHome from './modules/customer'
import AdminHome from './modules/admin'
import Login from './modules/auth/Login'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <CustomerLayout />,
    children: [
      { index: true, element: <CustomerHome /> },
      { path: 'login', element: <Login /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminHome /> },
    ],
  },
])

export default router

