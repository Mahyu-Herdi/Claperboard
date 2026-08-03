import React from 'react';

export function ClapperLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-24 min-h-[50vh] w-full animate-fade-in">
      <style>{`
        @keyframes clapper-clap {
          0% {
            transform: rotate(-28deg);
          }
          65% {
            transform: rotate(1deg);
          }
          80% {
            transform: rotate(-1.5deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
        .animate-clap {
          animation: clapper-clap 0.65s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          transform-origin: bottom left;
        }
      `}</style>
      
      {/* Clapperboard Body */}
      <div className="relative w-48 flex flex-col items-center transform hover:scale-[1.02] transition-transform duration-300">
        {/* Top bar (Rotating Arm) */}
        <div className="w-full h-6 bg-[#1a1a1a] rounded-t-md relative animate-clap border-b border-black flex overflow-hidden z-10 shadow-lg">
          {/* Alternating stripes */}
          <div className="flex w-[200%] h-full shrink-0 -ml-4">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className={`w-6 h-12 transform -skew-x-[25deg] ${
                  i % 2 === 0 ? 'bg-[#ffffff]' : 'bg-[#1a1a1a]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Middle Bar (Static base bar) */}
        <div className="w-full h-6 bg-[#1a1a1a] border-t border-black flex overflow-hidden z-20 shadow-md">
          <div className="flex w-[200%] h-full shrink-0 -ml-2">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className={`w-6 h-12 transform -skew-x-[25deg] ${
                  i % 2 === 1 ? 'bg-[#ffffff]' : 'bg-[#1a1a1a]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Board Bottom */}
        <div className="w-full bg-[#1e1e1e] border-2 border-t-0 border-[#121212] rounded-b-xl p-4 flex flex-col justify-between font-mono text-[9px] text-[#f5f5f5]/90 tracking-wider shadow-xl h-28 space-y-2 relative overflow-hidden">
          {/* Chalk Board Texture overlay */}
          <div className="absolute inset-0 bg-white/[0.02] pointer-events-none mix-blend-overlay" />
          
          <div className="border-b border-white/20 pb-1.5 flex justify-between">
            <div>
              <span className="opacity-40 text-[7px] block uppercase">Production</span>
              <span className="font-bold text-[#fafafa] uppercase">CLAPPER APP</span>
            </div>
            <div className="text-right">
              <span className="opacity-40 text-[7px] block uppercase">Director</span>
              <span className="font-bold text-[#fafafa] uppercase">YOU</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 border-b border-white/20 pb-1.5 flex-1">
            <div className="border-r border-white/10 pr-1 text-center">
              <span className="opacity-40 text-[7px] block uppercase">Scene</span>
              <span className="text-xs font-bold text-amber-300">LOAD</span>
            </div>
            <div className="border-r border-white/10 px-1 text-center">
              <span className="opacity-40 text-[7px] block uppercase">Take</span>
              <span className="text-xs font-bold text-amber-300">01</span>
            </div>
            <div className="pl-1 text-center">
              <span className="opacity-40 text-[7px] block uppercase">Roll</span>
              <span className="text-xs font-bold text-amber-300">A1</span>
            </div>
          </div>

          <div className="text-center pt-1 animate-pulse flex items-center justify-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="font-black text-[10px] uppercase tracking-widest text-[#fafafa]">CUTTING...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
