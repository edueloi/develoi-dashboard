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
        <div
          className="absolute top-[5%] left-[-8%] w-[500px] h-[500px] blur-[130px] rounded-full animate-pulse-slow"
          style={{ background: 'rgba(13,31,78,0.06)' }}
        />
        <div
          className="absolute bottom-[15%] right-[-5%] w-[500px] h-[500px] blur-[130px] rounded-full animate-float-slow"
          style={{ background: 'rgba(196,154,42,0.05)' }}
        />
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
