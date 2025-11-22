import { motion } from "framer-motion";
import { Lock, Sparkles, Trophy, Star, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Mission {
  id: string;
  title: string;
  description: string;
  gems_reward: number;
  status: string;
}

interface MissionMapProps {
  missions: Mission[];
}

const MissionMap = ({ missions }: MissionMapProps) => {
  const navigate = useNavigate();

  // Calculate positions for mission nodes in a winding path (Mario-style)
  const getNodePosition = (index: number) => {
    const positions = [
      { x: 15, y: 85 },  // Start bottom left
      { x: 30, y: 70 },
      { x: 50, y: 65 },
      { x: 70, y: 55 },
      { x: 85, y: 40 },
      { x: 75, y: 25 },
      { x: 50, y: 15 },
      { x: 25, y: 20 },
      { x: 15, y: 35 },
      { x: 35, y: 50 },
    ];
    return positions[index % positions.length] || { x: 50, y: 50 };
  };

  // Draw SVG path connecting all nodes
  const generatePath = () => {
    const points = missions.map((_, i) => {
      const pos = getNodePosition(i);
      return `${pos.x},${pos.y}`;
    });
    
    let path = `M ${points[0]}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1].split(',').map(Number);
      const curr = points[i].split(',').map(Number);
      const midX = (prev[0] + curr[0]) / 2;
      path += ` Q ${midX},${prev[1]} ${curr[0]},${curr[1]}`;
    }
    return path;
  };

  const completedCount = missions.filter(m => m.status === 'completed').length;
  
  // Find the index of the first pending mission (next available)
  const nextAvailableIndex = missions.findIndex(m => m.status === 'pending');

  return (
    <div className="relative w-full min-h-[750px] bg-gradient-to-br from-accent/20 via-primary/10 to-secondary/20 rounded-3xl p-8 overflow-hidden shadow-2xl border-4 border-primary/30">
      {/* Decorative background - clouds and patterns */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-accent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-secondary rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/3 left-1/4 w-36 h-36 bg-primary rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, hsl(var(--primary)) 0px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, hsl(var(--primary)) 0px, transparent 1px, transparent 40px)',
      }} />

      {/* SVG Path - Mario-style thick road */}
      <svg 
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Shadow/outline path */}
        <motion.path
          d={generatePath()}
          stroke="hsl(var(--foreground))"
          strokeWidth="2.5"
          fill="none"
          opacity="0.15"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        {/* Main path */}
        <motion.path
          d={generatePath()}
          stroke="url(#roadGradient)"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        {/* Dashed line on path */}
        <motion.path
          d={generatePath()}
          stroke="hsl(var(--accent))"
          strokeWidth="0.4"
          fill="none"
          strokeDasharray="3,6"
          opacity="0.6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut", delay: 0.3 }}
        />
        <defs>
          <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>

      {/* Mission nodes */}
      <div className="relative z-10">
        {missions.map((mission, index) => {
          const position = getNodePosition(index);
          const isCompleted = mission.status === 'completed';
          // Only the next pending mission after completed ones is available
          const isAvailable = mission.status === 'pending' && index === nextAvailableIndex;
          const isLocked = !isCompleted && !isAvailable;

          return (
            <motion.div
              key={mission.id}
              className="absolute"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1, type: "spring" }}
            >
              <motion.button
                onClick={() => isAvailable && navigate(`/exercise/${mission.id}`)}
                disabled={isLocked}
                className={`
                  relative group
                  ${isCompleted && 'cursor-default'}
                  ${isAvailable && 'cursor-pointer'}
                  ${isLocked && 'cursor-not-allowed'}
                `}
                whileHover={isAvailable ? { scale: 1.1 } : {}}
                whileTap={isAvailable ? { scale: 0.95 } : {}}
              >
                {/* Node base with Mario-style shadow */}
                <div className={`
                  relative w-24 h-24 rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${isCompleted && 'bg-gradient-to-br from-success via-success to-success/90'}
                  ${isAvailable && 'bg-gradient-to-br from-primary via-secondary to-accent'}
                  ${isLocked && 'bg-gradient-to-br from-muted/60 to-muted/40'}
                  shadow-2xl
                  border-4 ${isCompleted ? 'border-success/30' : isAvailable ? 'border-white/40' : 'border-muted/60'}
                `}>
                  
                  {/* Inner glow */}
                  <div className={`
                    absolute inset-1 rounded-full
                    ${isCompleted && 'bg-gradient-to-br from-success/20 to-transparent'}
                    ${isAvailable && 'bg-gradient-to-br from-white/30 to-transparent'}
                  `} />
                  
                  {/* Icon */}
                  <div className="relative z-10">
                    {isCompleted && (
                      <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
                    )}
                    {isAvailable && (
                      <Star className="w-12 h-12 text-white drop-shadow-lg" />
                    )}
                    {isLocked && (
                      <Lock className="w-10 h-10 text-muted-foreground/60" />
                    )}
                  </div>

                  {/* Pulsing ring for available missions */}
                  {isAvailable && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-white"
                      animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [0.8, 0, 0.8]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}

                  {/* Floating sparkles for available missions */}
                  {isAvailable && (
                    <>
                      <motion.div
                        className="absolute -top-3 -right-3"
                        animate={{ 
                          y: [-5, 5, -5],
                          rotate: [0, 180, 360],
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Sparkles className="w-7 h-7 text-accent fill-accent drop-shadow-lg" />
                      </motion.div>
                      <motion.div
                        className="absolute -bottom-2 -left-3"
                        animate={{ 
                          y: [5, -5, 5],
                          rotate: [360, 180, 0],
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 1.5
                        }}
                      >
                        <Zap className="w-6 h-6 text-secondary fill-secondary drop-shadow-lg" />
                      </motion.div>
                    </>
                  )}

                  {/* Gem reward badge - Mario coin style */}
                  {!isLocked && (
                    <motion.div 
                      className={`
                        absolute -bottom-2 -right-2 w-10 h-10 rounded-full
                        flex items-center justify-center text-base font-black
                        border-3 shadow-xl
                        ${isCompleted 
                          ? 'bg-gradient-to-br from-amber-300 to-amber-500 border-amber-600 text-amber-900' 
                          : 'bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-600 text-yellow-900'}
                      `}
                      animate={!isCompleted ? { 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      } : {}}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      💎
                    </motion.div>
                  )}
                </div>

                {/* Shadow effect */}
                <div className={`
                  absolute -bottom-2 left-1/2 -translate-x-1/2
                  w-20 h-4 rounded-full blur-md
                  ${isCompleted && 'bg-success/30'}
                  ${isAvailable && 'bg-primary/40'}
                  ${isLocked && 'bg-muted/20'}
                `} />
              </motion.button>

              {/* Mission title tooltip - Mario-style speech bubble */}
              {isAvailable && (
                <motion.div
                  className="absolute top-full mt-4 left-1/2 -translate-x-1/2 
                    bg-white/95 backdrop-blur-sm border-4 border-foreground/20 rounded-2xl 
                    px-4 py-2.5 text-sm font-bold text-foreground whitespace-nowrap
                    shadow-2xl max-w-[200px] text-center"
                  initial={{ opacity: 0, y: -10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.1 + 0.3,
                    type: "spring",
                    stiffness: 200
                  }}
                >
                  {/* Speech bubble arrow */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 
                    border-l-8 border-l-transparent 
                    border-r-8 border-r-transparent 
                    border-b-8 border-b-white/95" 
                  />
                  <div className="relative z-10">
                    {mission.title}
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress indicator - Mario-style HUD */}
      <motion.div 
        className="absolute bottom-6 left-1/2 -translate-x-1/2 
          bg-gradient-to-br from-card via-card to-card/90 backdrop-blur-md 
          border-4 border-primary/40 rounded-3xl 
          px-8 py-4 flex items-center gap-4 shadow-2xl"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
      >
        {/* Trophy icon with glow */}
        <div className="relative">
          <div className="absolute inset-0 bg-success/30 rounded-full blur-xl" />
          <Trophy className="relative w-7 h-7 text-success drop-shadow-lg" />
        </div>
        
        {/* Progress text */}
        <div className="flex flex-col items-center">
          <span className="text-2xl font-black text-foreground tracking-tight">
            {completedCount}/{missions.length}
          </span>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Misiones
          </span>
        </div>
        
        {/* Decorative stars */}
        <div className="flex gap-1">
          {[...Array(Math.min(3, completedCount))].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.7 + i * 0.1, type: "spring" }}
            >
              <Star className="w-5 h-5 text-accent fill-accent drop-shadow" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default MissionMap;