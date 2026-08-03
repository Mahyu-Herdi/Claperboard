import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onTransitionComplete: () => void;
  targetLabel: string;
}

export function ClapperTransition({ isOpen, onTransitionComplete, targetLabel }: Props) {
  const [phase, setPhase] = useState<'closing' | 'impact' | 'opening' | 'idle'>('idle');

  useEffect(() => {
    if (isOpen) {
      setPhase('closing');
      
      // Impact after closing animation (300ms)
      const impactTimer = setTimeout(() => {
        setPhase('impact');
        onTransitionComplete(); // Switch view in background
        
        // Start opening after brief impact pause (150ms)
        const openTimer = setTimeout(() => {
          setPhase('opening');
        }, 150);
        
        return () => clearTimeout(openTimer);
      }, 300);

      return () => clearTimeout(impactTimer);
    } else {
      setPhase('idle');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="fixed inset-0 z-[999] bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md flex flex-col items-center justify-center no-print"
      >
        <div className="flex flex-col items-center justify-center space-y-8">
          {/* Main Animating Clapperboard */}
          <div className="relative w-56 flex flex-col items-center select-none">
            {/* Top Bar / Clapper Arm */}
            <motion.div
              initial={{ rotate: -28 }}
              animate={{ 
                rotate: phase === 'closing' ? -28 : phase === 'impact' ? 0 : -15
              }}
              transition={{ 
                type: 'spring', 
                stiffness: phase === 'closing' ? 250 : 150, 
                damping: phase === 'closing' ? 15 : 20 
              }}
              style={{ transformOrigin: 'bottom left' }}
              className="w-full h-7 bg-[#1a1a1a] rounded-t-md relative border-b-2 border-black flex overflow-hidden z-10 shadow-lg"
            >
              <div className="flex w-[200%] h-full shrink-0 -ml-4">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-6 h-12 transform -skew-x-[25deg] ${
                      i % 2 === 0 ? 'bg-[#ffffff]' : 'bg-[#1a1a1a]'
                    }`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Base Bar (Static) */}
            <div className="w-full h-7 bg-[#1a1a1a] border-t-2 border-black flex overflow-hidden z-20 shadow-md">
              <div className="flex w-[200%] h-full shrink-0 -ml-2">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-6 h-12 transform -skew-x-[25deg] ${
                      i % 2 === 1 ? 'bg-[#ffffff]' : 'bg-[#1a1a1a]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Slate Board */}
            <div className="w-full bg-[#1e1e1e] border-2 border-t-0 border-[#121212] rounded-b-2xl p-4 flex flex-col justify-between font-mono text-[10px] text-[#f5f5f5]/90 tracking-wider shadow-xl h-32 space-y-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/[0.02] pointer-events-none mix-blend-overlay" />
              
              <div className="border-b border-white/20 pb-1.5 flex justify-between items-center">
                <div>
                  <span className="opacity-40 text-[7px] block uppercase">Studio</span>
                  <span className="font-extrabold text-[#fafafa] tracking-tight text-[9px]">ERBEA WEBird</span>
                </div>
                <div>
                  <span className="opacity-40 text-[7px] block uppercase text-right">Director</span>
                  <span className="font-extrabold text-[#fafafa] tracking-tight text-[9px] block">PRE-PRO</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-white/20 pb-1.5 flex-1">
                <div className="border-r border-white/10 pr-1 flex flex-col justify-center">
                  <span className="opacity-40 text-[7px] block uppercase">Scene / Tab</span>
                  <span className="text-[10px] font-black text-amber-300 uppercase truncate">
                    {targetLabel}
                  </span>
                </div>
                <div className="pl-1 flex flex-col justify-center text-center">
                  <span className="opacity-40 text-[7px] block uppercase">Status</span>
                  <motion.span 
                    key={phase}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-[11px] font-black ${
                      phase === 'closing' ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {phase === 'closing' ? 'CUT!' : 'ACTION!'}
                  </motion.span>
                </div>
              </div>

              <div className="text-center pt-1 text-[8px] opacity-40 uppercase tracking-widest font-bold">
                TRANSITION ACTIVE
              </div>
            </div>
          </div>

          {/* Large text label under clapperboard */}
          <div className="text-center min-h-[4rem]">
            <AnimatePresence mode="wait">
              {phase === 'closing' && (
                <motion.div
                  key="cut-text"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-1"
                >
                  <h3 className="text-2xl font-black uppercase text-red-600 dark:text-red-500 tracking-wider">CUT!</h3>
                  <p className="text-xs text-black/40 dark:text-white/40 font-bold uppercase tracking-wider">Menyimpan scene sebelumnya...</p>
                </motion.div>
              )}
              {phase === 'impact' && (
                <motion.div
                  key="impact-text"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1.1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="text-2xl font-black uppercase text-black dark:text-white tracking-widest"
                >
                  * CLACK *
                </motion.div>
              )}
              {phase === 'opening' && (
                <motion.div
                  key="action-text"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1"
                >
                  <h3 className="text-2xl font-black uppercase text-green-600 dark:text-green-500 tracking-wider">ACTION!</h3>
                  <p className="text-xs text-black/40 dark:text-white/40 font-bold uppercase tracking-wider">
                    Buka tab {targetLabel}...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
