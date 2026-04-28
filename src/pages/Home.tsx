// @ts-nocheck
import HeroRedesign from '../components/site/HeroRedesign';
import MetricsSection from '../components/site/MetricsSection';
import AboutSection from '../components/site/AboutSection';
import ProblemsSection from '../components/site/ProblemsSection';
import CasesPreviewSection from '../components/site/CasesPreviewSection';
import DifferentialsSection from '../components/site/DifferentialsSection';
import HowItWorksSection from '../components/site/HowItWorksSection';
import ValuesSection from '../components/site/ValuesSection';
import EmotionalSection from '../components/site/EmotionalSection';
import CTASection from '../components/site/CTASection';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

export default function Home() {
  const { isDark } = useTheme();

  return (
    <div className={`relative min-h-screen dash-bg dash-text selection:bg-indigo-500/30 selection:text-white overflow-x-hidden ${isDark ? 'dark' : ''}`}>
      {/* Background Blurs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[20%] right-[-5%] w-[600px] h-[600px] bg-purple-500/10 blur-[150px] rounded-full animate-float-slow" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <main>
          <HeroRedesign />
          <MetricsSection />
          <AboutSection />
          <ProblemsSection />
          <CasesPreviewSection />
          <DifferentialsSection />
          <HowItWorksSection />
          <ValuesSection />
          <EmotionalSection />
          <CTASection />
        </main>
      </motion.div>
    </div>
  );
}
