import { motion } from 'framer-motion';
import type { Variants, TargetAndTransition } from 'framer-motion';
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiFramer,
  SiSanity,
  SiContentful,
  SiNodedotjs,
  SiExpress,
  SiPostgresql,
  SiMongodb,
  SiPrisma,
  SiZod,
  SiPnpm,
  SiBun,
  SiGit,
  SiGithub,
  SiVercel,
  SiDocker,
  SiExpo,
  SiLinux,
  SiClerk,
  SiVite,
} from 'react-icons/si';

interface SkillItem {
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  iconColor: string;
  animationDelay?: number;
}

const skillsData: SkillItem[][] = [
  [
    { name: 'ReactJS', icon: <SiReact />, color: '#61dafb', bgColor: 'rgba(97, 218, 251, 0.15)', iconColor: '#61dafb', animationDelay: 0 },
    { name: 'NextJS', icon: <SiNextdotjs />, color: '#ffffff', bgColor: 'rgba(255, 255, 255, 0.1)', iconColor: '#fff', animationDelay: 0.05 },
    { name: 'TypeScript', icon: <SiTypescript />, color: '#3178c6', bgColor: 'rgba(49, 120, 198, 0.15)', iconColor: '#3178c6', animationDelay: 0.1 },
    { name: 'Tailwind CSS', icon: <SiTailwindcss />, color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)', iconColor: '#06b6d4', animationDelay: 0.15 },
    { name: 'Motion', icon: <SiFramer />, color: '#ff007f', bgColor: 'rgba(255, 0, 127, 0.15)', iconColor: '#ff007f', animationDelay: 0.2 },
    { name: 'Sanity', icon: <SiSanity />, color: '#f03e2f', bgColor: 'rgba(240, 62, 47, 0.15)', iconColor: '#f03e2f', animationDelay: 0.25 },
  ],
  [
    { name: 'Contentful', icon: <SiContentful />, color: '#29b6f6', bgColor: 'rgba(41, 182, 246, 0.15)', iconColor: '#29b6f6', animationDelay: 0.05 },
    { name: 'NodeJS', icon: <SiNodedotjs />, color: '#68a063', bgColor: 'rgba(104, 160, 99, 0.15)', iconColor: '#68a063', animationDelay: 0.1 },
    { name: 'ExpressJS', icon: <SiExpress />, color: '#90c53f', bgColor: 'rgba(144, 197, 63, 0.15)', iconColor: '#90c53f', animationDelay: 0.15 },
    { name: 'PostgreSQL', icon: <SiPostgresql />, color: '#336791', bgColor: 'rgba(51, 103, 145, 0.15)', iconColor: '#336791', animationDelay: 0.2 },
    { name: 'MongoDB', icon: <SiMongodb />, color: '#13aa52', bgColor: 'rgba(19, 170, 82, 0.15)', iconColor: '#13aa52', animationDelay: 0.25 },
    { name: 'Prisma', icon: <SiPrisma />, color: '#0f766e', bgColor: 'rgba(15, 118, 110, 0.2)', iconColor: '#14b8a6', animationDelay: 0.3 },
  ],
  [
    { name: 'Zustand', icon: <span className="skill-icon-emoji">⚙️</span>, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)', iconColor: '#8b5cf6', animationDelay: 0.1 },
    { name: 'Zod', icon: <SiZod />, color: '#3e8e41', bgColor: 'rgba(62, 142, 65, 0.15)', iconColor: '#3e8e41', animationDelay: 0.15 },
    { name: 'pnpm', icon: <SiPnpm />, color: '#f69220', bgColor: 'rgba(246, 146, 32, 0.15)', iconColor: '#f69220', animationDelay: 0.2 },
    { name: 'Bun', icon: <SiBun />, color: '#fde047', bgColor: 'rgba(253, 224, 71, 0.12)', iconColor: '#fde047', animationDelay: 0.25 },
    { name: 'Git', icon: <SiGit />, color: '#f05032', bgColor: 'rgba(240, 80, 50, 0.15)', iconColor: '#f05032', animationDelay: 0.3 },
    { name: 'GitHub', icon: <SiGithub />, color: '#ffffff', bgColor: 'rgba(255, 255, 255, 0.1)', iconColor: '#fff', animationDelay: 0.35 },
    { name: 'Vercel', icon: <SiVercel />, color: '#ffffff', bgColor: 'rgba(255, 255, 255, 0.1)', iconColor: '#fff', animationDelay: 0.4 },
  ],
  [
    { name: 'AWS', icon: <span className="skill-icon-emoji">☁️</span>, color: '#ff9900', bgColor: 'rgba(255, 153, 0, 0.15)', iconColor: '#ff9900', animationDelay: 0.15 },
    { name: 'Docker', icon: <SiDocker />, color: '#2496ed', bgColor: 'rgba(36, 150, 237, 0.15)', iconColor: '#2496ed', animationDelay: 0.2 },
    { name: 'Expo', icon: <SiExpo />, color: '#ffffff', bgColor: 'rgba(0, 0, 0, 0.35)', iconColor: '#fff', animationDelay: 0.25 },
    { name: 'Clerk', icon: <SiClerk />, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.15)', iconColor: '#6366f1', animationDelay: 0.35 },
  ],
  [
    { name: 'Vite', icon: <SiVite />, color: '#646cff', bgColor: 'rgba(100, 108, 255, 0.15)', iconColor: '#646cff', animationDelay: 0.2 },
    { name: 'Supabase', icon: <span className="skill-icon-emoji">🗄️</span>, color: '#3ecf8e', bgColor: 'rgba(62, 207, 142, 0.15)', iconColor: '#3ecf8e', animationDelay: 0.25 },
    { name: 'Playwright', icon: <span className="skill-icon-emoji">🎭</span>, color: '#2edb66', bgColor: 'rgba(46, 219, 102, 0.15)', iconColor: '#2edb66', animationDelay: 0.3 },
    { name: 'Linux', icon: <SiLinux />, color: '#fcc624', bgColor: 'rgba(252, 198, 36, 0.15)', iconColor: '#fcc624', animationDelay: 0.35 },
  ],
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

const hoverVariant: TargetAndTransition = {
  scale: 1.12,
  y: -8,
  transition: { type: 'spring', stiffness: 300, damping: 25 },
};

const iconFloatVariants: Variants = {
  float: {
    y: [0, -8, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatType: 'loop',
      ease: 'easeInOut',
    },
  },
};

const SkillsetDisplay = () => {
  return (
    <div className="skillset-display">
      <div className="skillset-header">
        <p className="skillset-eyebrow">MY SKILLSET</p>
        <h2 className="skillset-title">
          The Magic <span>Behind</span>
        </h2>
      </div>

      <motion.div
        className="skillset-grid"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
      >
        {skillsData.map((row, rowIndex) => (
          <div key={`skills-row-${rowIndex}`} className="skillset-row">
            {row.map((skill) => (
              <motion.div
                key={skill.name}
                className="skill-pill"
                variants={itemVariants}
                whileHover={hoverVariant}
                style={{
                  backgroundColor: skill.bgColor,
                  borderColor: skill.color,
                }}
              >
                <motion.span 
                  className="skill-icon" 
                  style={{ color: skill.iconColor }}
                  variants={iconFloatVariants}
                  animate="float"
                  custom={skill.animationDelay}
                >
                  {skill.icon}
                </motion.span>
                <span className="skill-label" style={{ color: skill.color }}>
                  {skill.name}
                </span>
              </motion.div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default SkillsetDisplay;



