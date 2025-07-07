import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Sub-Components for Animation ---

// Animated text for a staggered character effect
const AnimatedText = memo(({ text }) => {
  const letters = Array.from(text);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.2 * i },
    }),
  };
  const childVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 12, stiffness: 200 },
    },
  };

  return (
    <motion.h2
      key={text} // Re-animate when text changes
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mt-6 text-xl font-semibold text-white text-center px-4"
    >
      {letters.map((letter, index) => (
        <motion.span key={index} variants={childVariants}>
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </motion.h2>
  );
});

// Circular progress indicator
const ProgressCircle = memo(({ progress }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative h-20 w-20">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
        <circle
          className="text-white/10"
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          r={radius}
          cx="40"
          cy="40"
        />
        <motion.circle
          className="text-blue-500"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="40"
          cy="40"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{`${Math.round(
          progress
        )}%`}</span>
      </div>
    </div>
  );
});

// Default indeterminate spinner with a more complex look
const IndeterminateSpinner = () => (
  <div className="relative h-20 w-20">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute h-full w-full rounded-full border-solid border-t-transparent"
        style={{
          borderWidth: `${2 + i * 2}px`,
          borderColor: `rgba(59, 130, 246, ${0.4 + i * 0.2})`,
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1 + i * 0.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    ))}
  </div>
);

// --- Main Overlay Component ---

function LoadingOverlay({
  show,
  text = 'Loading...',
  progress = null,
  messages = [],
}) {
  const [currentMessage, setCurrentMessage] = useState(text);

  useEffect(() => {
    if (show && messages.length > 0) {
      const interval = setInterval(() => {
        setCurrentMessage((prev) => {
          const currentIndex = messages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % messages.length;
          return messages[nextIndex];
        });
      }, 2500);
      return () => clearInterval(interval);
    } else {
      setCurrentMessage(text);
    }
  }, [show, messages, text]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50"
        >
          {progress !== null ? (
            <ProgressCircle progress={progress} />
          ) : (
            <IndeterminateSpinner />
          )}

          <AnimatedText text={currentMessage} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoadingOverlay;