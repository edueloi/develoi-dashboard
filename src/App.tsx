/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Values from './pages/Values';
import FAQ from './pages/FAQ';
import Login from './pages/Login';
import Invoice from './pages/Invoice';
import PixAuth from './pages/PixAuth';
import Dashboard from './pages/Dashboard';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import ProjetosPage from './pages/ProjetosPage';
import ProjetoPostPage from './pages/ProjetoPostPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui';
import { PageTransition, ScrollProgress, Spotlight } from './components/motion';
import Preloader from './components/ui/Preloader';
import WhatsAppChat from './components/WhatsAppChat';

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
  // dashboard troca de aba sem recarregar a página: uma única chave para todas as rotas /dashboard
  const transitionKey = location.pathname.startsWith('/dashboard') ? '/dashboard' : location.pathname;
  return (
    <PageTransition key={transitionKey}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/sobre" element={<About />} />
        <Route path="/valores" element={<Values />} />
        <Route path="/duvidas" element={<FAQ />} />
        <Route path="/contato" element={<ContactPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/fatura/:id" element={<Invoice />} />
        <Route path="/autorizar/:id" element={<PixAuth />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/projetos" element={<ProjetosPage />} />
        <Route path="/projetos/:slug" element={<ProjetoPostPage />} />
        <Route path="/privacidade" element={<PrivacyPolicy />} />
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
          '/dashboard/atendimento',
          '/dashboard/atendimento/bot',
          '/dashboard/atendimento/fila',
          '/dashboard/atendimento/em-andamento',
          '/dashboard/atendimento/finalizados',
          '/dashboard/atendimento/nova',
          '/dashboard/avisos',
          '/dashboard/webhooks',
          '/dashboard/postagens',
          '/dashboard/vendas',
          '/dashboard/produtos',
          '/dashboard/contatos',
          '/dashboard/clientes',
          '/dashboard/prospeccao',
          '/dashboard/contas-a-receber',
          '/dashboard/contas-a-pagar',
          '/dashboard/sociedade',
          '/dashboard/plano-de-negocio',
          '/dashboard/perfil',
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
    </PageTransition>
  );
}

function AppContent() {
  console.log("AppContent component rendering");
  const location = useLocation();
  const hideGlobalLayout = location.pathname.startsWith('/dashboard') || location.pathname === '/login' || location.pathname.startsWith('/fatura/') || location.pathname.startsWith('/autorizar/');
  
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
        <>
          <ScrollProgress />
          <Spotlight />
        </>
      )}

      {!hideGlobalLayout && <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>}
      {!hideGlobalLayout && <Navbar />}
      
      <main id="conteudo" tabIndex={-1} className="relative z-10 outline-none">
        <AnimatedRoutes />
      </main>

      {!hideGlobalLayout && <Footer />}
      {!hideGlobalLayout && <WhatsAppChat />}
    </div>
  );
}

export default function App() {
  console.log("App component rendering");
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <ScrollToTop />
          <AppContent />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

