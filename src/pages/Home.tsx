import Hero from '../components/Hero';
import Services from '../components/Services';
import Projects from '../components/Projects';
import DreamSection from '../components/DreamSection';
import Contact from '../components/Contact';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative"
    >
      <Hero />
      <Services />
      <Projects />
      <DreamSection />
      <Contact />
    </motion.div>
  );
}
