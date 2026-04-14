import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/cursor.css';

interface MousePosition {
  x: number;
  y: number;
}

export default function AnimatedCursor() {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Hide default cursor globally
    document.documentElement.style.cursor = 'none';
    document.body.style.cursor = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  return (
    <>
      <style>{`
        * {
          cursor: none !important;
        }
        *:hover {
          cursor: none !important;
        }
        a, button, [role="button"], input[type="button"], input[type="submit"] {
          cursor: none !important;
        }
      `}</style>
      
      {isVisible && (
        <motion.div
          className="animated-cursor"
          animate={{
            x: mousePosition.x - 32,
            y: mousePosition.y - 32,
          }}
          transition={{
            type: 'spring',
            stiffness: 1000,
            damping: 45,
            mass: 0.3,
          }}
        >
          <motion.img
            src="/cursor-icon.png"
            alt="cursor"
            className="cursor-image"
            animate={{
              scale: [1, 1.06, 1],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            draggable={false}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              console.error('Failed to load cursor image');
              setImageLoaded(false);
            }}
            style={{ opacity: imageLoaded ? 1 : 0.8 }}
          />
        </motion.div>
      )}
    </>
  );
}
