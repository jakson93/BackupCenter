import { createBrowserRouter } from 'react-router-dom'

import AppLayout from './layouts/AppLayout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Equipments from './pages/Equipments.jsx'
import Backups from './pages/Backups.jsx'
import Alerts from './pages/Alerts.jsx'
import FtpServer from './pages/FtpServer.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/equipments', element: <Equipments /> },
      { path: '/backups', element: <Backups /> },
      { path: '/alerts', element: <Alerts /> },
      { path: '/server', element: <FtpServer /> },
      { path: '/reports', element: <Reports /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <Login /> },
])
