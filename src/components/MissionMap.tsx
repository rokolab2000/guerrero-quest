import { motion } from "framer-motion";
import { Lock, Sparkles, Trophy, Target } from "lucide-react";
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

  // Calculate positions for mission nodes in a winding path
  const getNodePosition = (index: number) => {
    const positions = [
      { x: 50, y: 8 },
      { x: 25, y: 20 },
      { x: 70, y: 32 },
      { x: 35, y: 44 },
      { x: 65, y: 56 },
      { x: 30, y: 68 },
      { x: 60, y: 80 },
      { x: 45, y: 92 },
    ];
    return positions[index % positions.length] || { x: 50, y: 92 };
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

  return (
    <div className="relative w-full min-h-[700px] bg-gradient-to-b from-primary/5 via-secondary/5 to-accent/5 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-lg border border-border/50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-secondary rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-accent rounded-full blur-2xl" />
      </div>

      {/* SVG Path */}
      <svg 
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <motion.path
          d={generatePath()}
          stroke="hsl(var(--primary))"
          strokeWidth="0.3"
          fill="none"
          strokeDasharray="4,4"
          opacity="0.4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
      </svg>

      {/* Mission nodes */}
      <div className="relative z-10">
        {missions.map((mission, index) => {
          const position = getNodePosition(index);
          const isCompleted = mission.status === 'completed';
          const isAvailable = mission.status === 'pending' && index <= completedCount;
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
                  relative w-20 h-20 rounded-full flex items-center justify-center
                  transition-all duration-300 shadow-xl
                  ${isCompleted && 'bg-gradient-to-br from-success to-success/80 cursor-default border-2 border-success/50'}
                  ${isAvailable && 'bg-gradient-to-br from-primary to-primary/80 cursor-pointer hover:shadow-2xl border-2 border-primary/50'}
                  ${isLocked && 'bg-muted/50 cursor-not-allowed border-2 border-muted'}
                `}
                whileHover={isAvailable ? { scale: 1.15, rotate: 5 } : {}}
                whileTap={isAvailable ? { scale: 0.9 } : {}}
              >
                {/* Icon */}
                {isCompleted && (
                  <Trophy className="w-10 h-10 text-success-foreground" />
                )}
                {isAvailable && (
                  <Target className="w-10 h-10 text-primary-foreground" />
                )}
                {isLocked && (
                  <Lock className="w-8 h-8 text-muted-foreground" />
                )}

                {/* Sparkles for available missions */}
                {isAvailable && (
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-secondary fill-secondary" />
                  </motion.div>
                )}

                {/* Gem reward badge */}
                {!isLocked && (
                  <div className={`
                    absolute -bottom-1 -right-1 w-7 h-7 rounded-full
                    flex items-center justify-center text-xs font-bold
                    ${isCompleted ? 'bg-success-foreground text-success' : 'bg-secondary text-secondary-foreground'}
                  `}>
                    💎
                  </div>
                )}
              </motion.button>

              {/* Mission title tooltip */}
              {isAvailable && (
                <motion.div
                  className="absolute top-full mt-2 left-1/2 -translate-x-1/2 
                    bg-card border border-border rounded-lg px-3 py-2 
                    text-xs font-semibold text-card-foreground whitespace-nowrap
                    shadow-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  {mission.title}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 
        bg-card/90 backdrop-blur-sm border border-border rounded-full 
        px-6 py-3 flex items-center gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-success" />
          <span className="font-bold text-foreground">{completedCount}/{missions.length}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">Completadas</span>
        </div>
      </div>
    </div>
  );
};

export default MissionMap;