import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ThemeProvider } from './context/ThemeContext'
import { SidebarProvider } from './context/SidebarContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { Layout } from './components/Layout/Layout'
import { Toaster } from './components/ui/toaster'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Customers } from './pages/Customers'
import { Payments } from './pages/Payments'
import { PaymentSuccess } from './pages/PaymentSuccess'
import { Fleet } from './pages/Fleet'
import Booking from './pages/Booking'
import { Rentals } from './pages/Rentals'
import { Contracts } from './pages/Contracts'
import Profile from './pages/Profile'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    if (token) setIsAuthenticated(true)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    // Clear any stored tokens
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('refreshToken')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider defaultTheme="light" storageKey="ev-rental-theme">
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
        >
          <Login onLogin={handleLogin} />
        </motion.div>
        <Toaster />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="ev-rental-theme">
      <ProfileProvider>
        <NotificationProvider>
          <SidebarProvider>
            <Router>
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Routes>
                {/* Routes without Layout */}
                <Route path="/payments/success" element={<PaymentSuccess />} />

                {/* Routes with Layout */}
                <Route path="/" element={<Layout onLogout={handleLogout}><Dashboard /></Layout>} />
                <Route path="/customers" element={<Layout onLogout={handleLogout}><Customers /></Layout>} />
                <Route path="/payments" element={<Layout onLogout={handleLogout}><Payments /></Layout>} />
                <Route path="/fleet" element={<Layout onLogout={handleLogout}><Fleet /></Layout>} />
                <Route path="/bookings" element={<Layout onLogout={handleLogout}><Booking /></Layout>} />
                <Route path="/rentals" element={<Layout onLogout={handleLogout}><Rentals /></Layout>} />
                <Route path="/contracts" element={<Layout onLogout={handleLogout}><Contracts /></Layout>} />
                <Route path="/profile" element={<Layout onLogout={handleLogout}><Profile /></Layout>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
            <Toaster />
          </Router>
        </SidebarProvider>
        </NotificationProvider>
      </ProfileProvider>
    </ThemeProvider>
  )
}

export default App