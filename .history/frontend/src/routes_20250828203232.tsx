import { createBrowserRouter } from 'react-router-dom'
import CustomerLayout from './layouts/CustomerLayout'
import AdminLayout from './layouts/AdminLayout'
import CustomerHome from './modules/customer'
import AdminHome from './modules/admin'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <CustomerLayout />,
    children: [
      { index: true, element: <CustomerHome /> },
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

