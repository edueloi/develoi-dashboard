/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Values from './pages/Values';
import FAQ from './pages/FAQ';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { motion, useScroll, useSpring } from 'framer-motion';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/sobre" element={<About />} />
        <Route path="/valores" element={<Values />} />
        <Route path="/duvidas" element={<FAQ />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard/*" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  console.log("AppContent component rendering");
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname === '/login';
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="relative min-h-screen selection:bg-aurora-blue/30 selection:text-white overflow-x-hidden">
      {/* Background Layer */}
      <div className="fixed inset-0 bg-[#030303] -z-30" />
      
      {/* Decorative Background Elements */}
      {!isDashboard && (
        <div className="fixed inset-0 pointer-events-none -z-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(17,17,17,0)_0%,rgba(3,3,3,1)_100%)]" />
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
      )}

      {/* Progress Bar */}
      {!isDashboard && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-aurora-blue via-aurora-purple to-aurora-pink z-[60] origin-left"
          style={{ scaleX }}
        />
      )}

      {!isDashboard && <Navbar />}
      
      <main className="relative z-10">
        <AnimatedRoutes />
      </main>

      {!isDashboard && <Footer />}
    </div>
  );
}

export default function App() {
  console.log("App component rendering");
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

