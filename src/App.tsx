import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ThemeProvider } from './context/ThemeContext'
import { SidebarProvider } from './context/SidebarContext'
import { Layout } from './components/layout/Layout'
import { Toaster } from './components/ui/toaster'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Vehicles } from './pages/Vehicles'
import { Customers } from './pages/Customers'
import { Payments } from './pages/Payments'
import { Fleet } from './pages/Fleet'

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
      <SidebarProvider>
        <Router>
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Layout onLogout={handleLogout}>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/vehicles" element={<Vehicles />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/fleet" element={<Fleet />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </Layout>
          </motion.div>
          <Toaster />
        </Router>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App