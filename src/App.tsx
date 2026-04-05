import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Github, Linkedin, Twitter, Mail, ExternalLink, ChevronDown, Menu, X, ArrowRight } from 'lucide-react';
import supabase from './lib/supabase';

// Types
interface Project {
  id: number;
  title: string;
  description: string;
  image_url: string;
  year: number;
  category: string;
  link_url: string;
}

// Components
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Vision', href: '#vision' },
    { name: 'Projects', href: '#projects' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-black/80 backdrop-blur-md py-4' : 'bg-transparent py-8'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-display font-bold tracking-tighter text-white"
        >
          SWARAJ <span className="text-zinc-500">MUNDHE</span>
        </motion.div>
        
        <div className="hidden md:flex space-x-12">
          {navLinks.map((link, i) => (
            <motion.a
              key={link.name}
              href={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-sm uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              {link.name}
            </motion.a>
          ))}
        </div>

        <button 
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-zinc-900 border-b border-zinc-800 overflow-hidden"
          >
            <div className="flex flex-col p-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg text-zinc-300 hover:text-white"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      <motion.div style={{ y: y1, opacity }} className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-40 scale-110 grayscale contrast-125"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black" />
      </motion.div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <span className="text-zinc-500 uppercase tracking-[0.3em] text-sm mb-4 block">Visionary Founder & Strategist</span>
          <h1 className="text-6xl md:text-9xl font-display font-bold text-white mb-8 tracking-tighter leading-none">
            Architecting the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-600">Future of Tech</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Building digital ecosystems that bridge the gap between human intuition and technological excellence.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="#projects" className="px-8 py-4 bg-white text-black font-medium hover:bg-zinc-200 transition-all rounded-sm flex items-center gap-2">
              Explore Works <ArrowRight size={18} />
            </a>
            <a href="#contact" className="px-8 py-4 border border-zinc-700 text-white font-medium hover:bg-zinc-900 transition-all rounded-sm">
              Get in Touch
            </a>
          </div>
        </motion.div>
      </div>

      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-zinc-500 cursor-pointer"
        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
      >
        <ChevronDown size={32} />
      </motion.div>
    </section>
  );
};

const VisionSection = () => {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const xLeft = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const xRight = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section id="vision" ref={containerRef} className="py-32 bg-black overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col space-y-24">
          <motion.div style={{ x: xLeft }} className="text-7xl md:text-[12rem] font-bold text-zinc-900 whitespace-nowrap select-none">
            INNOVATION • DISRUPTION • VISION •
          </motion.div>
          
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-display font-bold text-white"
            >
              Beyond the Horizon
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-zinc-400 leading-relaxed font-light"
            >
              I believe in technology that disappears into the background, empowering human creativity rather than replacing it. My journey is defined by the pursuit of elegance in complexity and the courage to challenge established norms.
            </motion.p>
          </div>

          <motion.div style={{ x: xRight }} className="text-7xl md:text-[12rem] font-bold text-zinc-900 whitespace-nowrap select-none self-end">
            • EXECUTION • SCALE • FUTURE •
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ProjectsSection = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from('projects').select('*').order('year', { ascending: false });
      if (data) setProjects(data as Project[]);
    };
    fetchProjects();
  }, []);

  return (
    <section id="projects" className="py-32 bg-zinc-950">
      <div className="container mx-auto px-6">
        <div className="mb-20">
          <span className="text-zinc-500 uppercase tracking-widest text-sm mb-4 block">Selected Works</span>
          <h2 className="text-5xl md:text-7xl font-display font-bold text-white">Featured Ventures</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[16/10] overflow-hidden mb-6 bg-zinc-900">
                <img 
                  src={project.image_url} 
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ExternalLink className="text-white" size={32} />
                </div>
                <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                  <span className="text-xs text-white font-medium">{project.year}</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-zinc-400 transition-colors">{project.title}</h3>
              <p className="text-zinc-500 font-light line-clamp-2">{project.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ContactSection = () => {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    const { error } = await supabase.from('contact_messages').insert([formState]);
    if (!error) {
      setStatus('success');
      setFormState({ name: '', email: '', message: '' });
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="py-32 bg-black border-t border-zinc-900">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <span className="text-zinc-500 uppercase tracking-widest text-sm mb-4 block">Get in touch</span>
            <h2 className="text-5xl md:text-7xl font-display font-bold text-white mb-8">Let's build the future together.</h2>
            <p className="text-zinc-400 text-lg mb-12 max-w-md">
              Whether you have a groundbreaking idea or just want to discuss the future of technology, my door is always open.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-zinc-300 hover:text-white transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center">
                  <Mail size={20} />
                </div>
                <span>hello@swarajmundhe.com</span>
              </div>
              <div className="flex items-center gap-4 text-zinc-300 hover:text-white transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center">
                  <Linkedin size={20} />
                </div>
                <span>linkedin.com/in/swarajmundhe</span>
              </div>
              <div className="flex items-center gap-4 text-zinc-300 hover:text-white transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center">
                  <Twitter size={20} />
                </div>
                <span>@swarajmundhe_tech</span>
              </div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-zinc-900/50 p-8 md:p-12 rounded-sm border border-zinc-800"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm uppercase tracking-widest text-zinc-500 mb-2">Name</label>
                <input 
                  type="text" 
                  required
                  value={formState.name}
                  onChange={(e) => setFormState({...formState, name: e.target.value})}
                  className="w-full bg-transparent border-b border-zinc-800 py-3 focus:border-white transition-colors outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-widest text-zinc-500 mb-2">Email</label>
                <input 
                  type="email" 
                  required
                  value={formState.email}
                  onChange={(e) => setFormState({...formState, email: e.target.value})}
                  className="w-full bg-transparent border-b border-zinc-800 py-3 focus:border-white transition-colors outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-widest text-zinc-500 mb-2">Message</label>
                <textarea 
                  rows={4}
                  required
                  value={formState.message}
                  onChange={(e) => setFormState({...formState, message: e.target.value})}
                  className="w-full bg-transparent border-b border-zinc-800 py-3 focus:border-white transition-colors outline-none text-white resize-none"
                />
              </div>
              <button 
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50"
              >
                {status === 'loading' ? 'Sending...' : status === 'success' ? 'Message Sent' : 'Send Message'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="py-12 bg-black border-t border-zinc-900">
    <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="text-zinc-500 text-sm tracking-widest uppercase">
        © 2024 SWARAJ MUNDHE. ALL RIGHTS RESERVED.
      </div>
      <div className="flex gap-8">
        <a href="#" className="text-zinc-500 hover:text-white transition-colors"><Twitter size={20} /></a>
        <a href="#" className="text-zinc-500 hover:text-white transition-colors"><Linkedin size={20} /></a>
        <a href="#" className="text-zinc-500 hover:text-white transition-colors"><Github size={20} /></a>
      </div>
    </div>
  </footer>
);

export default function App() {
  return (
    <div className="bg-black min-h-screen text-white selection:bg-white selection:text-black font-sans">
      <Navbar />
      <main>
        <Hero />
        <VisionSection />
        <ProjectsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
