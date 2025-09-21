import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import Layout from './components/Layout/Layout';

// Pages
import Home from './pages/Home';
import FindCar from './pages/FindCar';
import Booking from './pages/Booking';
import CheckIn from './pages/CheckIn';
import ReturnCar from './pages/ReturnCar';
import History from './pages/History';
import Profile from './pages/Profile';
import Support from './pages/Support';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
            {/* Authentication routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<Terms />} />              {/* Main application routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="find-car" element={<FindCar />} />
                <Route path="booking" element={<Booking />} />
                <Route path="checkin" element={<CheckIn />} />
                <Route path="return" element={<ReturnCar />} />
                <Route path="history" element={<History />} />
                <Route path="profile" element={<Profile />} />
                <Route path="support" element={<Support />} />
              </Route>
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;