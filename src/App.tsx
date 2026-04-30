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
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import CasesPage from './pages/CasesPage';
import CasePostPage from './pages/CasePostPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { motion, useScroll, useSpring } from 'framer-motion';
import Preloader from './components/ui/Preloader';

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
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/:slug" element={<CasePostPage />} />
        {[
          '/dashboard',
          '/dashboard/resumo',
          '/dashboard/projetos',
          '/dashboard/backlog',
          '/dashboard/quadro',
          '/dashboard/cronograma',
          '/dashboard/qualidade',
          '/dashboard/membros',
          '/dashboard/chat',
          '/dashboard/portfolio',
          '/dashboard/equipe',
          '/dashboard/valores',
          '/dashboard/blog',
          '/dashboard/cases',
          '/dashboard/bot',
        ].map(path => (
          <Route
            key={path}
            path={path}
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        ))}
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  console.log("AppContent component rendering");
  const location = useLocation();
  const hideGlobalLayout = location.pathname.startsWith('/dashboard') || location.pathname === '/login';
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const { isDark } = useTheme();

  return (
    <div className={`relative min-h-screen selection:bg-indigo-500/30 selection:text-white overflow-x-hidden ${isDark ? 'dark' : ''}`}>
      <Preloader />
      {/* Background Layer */}
      <div className="fixed inset-0 dash-bg -z-30" />
      
      {/* Decorative Background Elements */}
      {!hideGlobalLayout && (
        <div className="fixed inset-0 pointer-events-none -z-20">
          <div className="absolute top-0 left-0 w-full h-full dash-bg opacity-50" />
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
      )}

      {/* Progress Bar */}
      {!hideGlobalLayout && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-aurora-blue via-aurora-purple to-aurora-pink z-[60] origin-left"
          style={{ scaleX }}
        />
      )}

      {!hideGlobalLayout && <Navbar />}
      
      <main className="relative z-10">
        <AnimatedRoutes />
      </main>

      {!hideGlobalLayout && <Footer />}
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

