import { createBrowserRouter } from 'react-router-dom'
import CustomerLayout from './layouts/CustomerLayout'
import AdminLayout from './layouts/AdminLayout'
import CustomerHome from './modules/customer'
import AdminHome from './modules/admin'
import Login from './modules/auth/Login'
function ProtectedAdmin({ children }: { children: JSX.Element }) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  const role = typeof localStorage !== 'undefined' ? localStorage.getItem('role') : null
  if (!token || role !== 'ADMIN') {
    return <CustomerLayout />
  }
  return children
}

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
    element: (
      <ProtectedAdmin>
        <AdminLayout />
      </ProtectedAdmin>
    ),
    children: [
      { index: true, element: <AdminHome /> },
    ],
  },
])

export default router

