import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Lock, Trophy, Star, Flame, Mountain, Sparkles } from "lucide-react";
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

// Regiones de Chile como mundos del juego
const WORLD_REGIONS = [
  { name: "Desierto Guerrero", color: "from-amber-600 to-orange-700", icon: Flame },
  { name: "Bosques del Cóndor", color: "from-green-600 to-emerald-700", icon: Mountain },
  { name: "Fiordos del Puma", color: "from-blue-600 to-cyan-700", icon: Mountain },
  { name: "Hielos Australes", color: "from-cyan-400 to-blue-600", icon: Sparkles },
  { name: "Isla Mística", color: "from-purple-600 to-pink-700", icon: Star },
];

const MissionMap = ({ missions }: MissionMapProps) => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const nodesRef = useRef<(HTMLDivElement | null)[]>([]);

  // Genera puntos del camino con curvas suaves estilo carretera
  const generatePathPoints = () => {
    const totalMissions = missions.length;
    const points: { x: number; y: number }[] = [];
    
    const startY = 10;
    const endY = 90;
    const minSpacing = Math.min(15, (endY - startY) / Math.max(totalMissions - 1, 1));
    
    for (let i = 0; i < totalMissions; i++) {
      const progress = i / Math.max(totalMissions - 1, 1);
      const y = startY + (progress * (endY - startY));
      
      // Movimiento sinusoidal para simular carretera serpenteante
      const waveOffset = Math.sin(progress * Math.PI * 2.2) * 18;
      const x = 50 + waveOffset + (i % 3) * 2;
      
      points.push({ 
        x: Math.max(25, Math.min(75, x)), 
        y: Math.max(startY, Math.min(endY, y))
      });
    }
    
    return points;
  };

  const pathPoints = generatePathPoints();

  // Obtener posición exacta en la línea para cada misión
  const getNodePosition = (index: number) => {
    return pathPoints[index] || { x: 50, y: 50 };
  };
  
  // Determinar región según índice
  const getRegion = (index: number) => {
    const regionIndex = Math.floor((index / missions.length) * WORLD_REGIONS.length);
    return WORLD_REGIONS[Math.min(regionIndex, WORLD_REGIONS.length - 1)];
  };

  // Generar SVG path con curvas Bezier suaves para apariencia de carretera
  const generatePath = () => {
    if (pathPoints.length === 0) return '';
    
    let path = `M ${pathPoints[0].x},${pathPoints[0].y}`;
    
    for (let i = 1; i < pathPoints.length; i++) {
      const prev = pathPoints[i - 1];
      const curr = pathPoints[i];
      
      // Puntos de control para curva Bezier suave
      const cp1x = prev.x + (curr.x - prev.x) * 0.5;
      const cp1y = prev.y + (curr.y - prev.y) * 0.3;
      const cp2x = prev.x + (curr.x - prev.x) * 0.5;
      const cp2y = prev.y + (curr.y - prev.y) * 0.7;
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
    }
    
    return path;
  };

  // Animaciones GSAP
  useEffect(() => {
    if (!mapRef.current || !pathRef.current) return;

    const ctx = gsap.context(() => {
      // Animar HUD superior
      gsap.from(".hud-top", {
        y: -100,
        duration: 0.8,
        ease: "power3.out"
      });

      // Animar path con drawSVG
      gsap.from(pathRef.current, {
        strokeDashoffset: 1000,
        strokeDasharray: 1000,
        duration: 2.5,
        ease: "power2.inOut"
      });

      // Animar nodos secuencialmente
      nodesRef.current.forEach((node, index) => {
        if (node) {
          gsap.from(node, {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            delay: index * 0.12,
            ease: "back.out(1.7)"
          });
        }
      });

      // Animar tooltips
      gsap.from(".mission-tooltip", {
        opacity: 0,
        y: -10,
        scale: 0.8,
        duration: 0.4,
        stagger: 0.12,
        delay: missions.length * 0.12 + 0.3,
        ease: "back.out(1.7)"
      });

      // Animar HUD inferior
      gsap.from(".hud-bottom-left", {
        x: -100,
        opacity: 0,
        duration: 0.6,
        delay: 0.5,
        ease: "power3.out"
      });

      gsap.from(".hud-bottom-right", {
        x: 100,
        opacity: 0,
        duration: 0.6,
        delay: 0.6,
        ease: "power3.out"
      });

      // Animar estrellas de progreso
      gsap.from(".progress-star", {
        scale: 0,
        rotation: -180,
        duration: 0.4,
        stagger: 0.1,
        delay: 0.8,
        ease: "back.out(1.7)"
      });
    }, mapRef);

    return () => ctx.revert();
  }, [missions.length]);

  const completedCount = missions.filter(m => m.status === 'completed').length;
  const nextAvailableIndex = missions.findIndex(m => m.status === 'pending');
  const currentRegion = nextAvailableIndex >= 0 ? getRegion(nextAvailableIndex) : WORLD_REGIONS[0];

  return (
    <div ref={mapRef} className="relative w-full min-h-[1000px] bg-gradient-to-b from-background via-primary/5 to-secondary/10 rounded-2xl overflow-hidden border-8 border-primary/40 shadow-2xl">
      {/* HUD Superior - Estilo NES */}
      <div className="hud-top absolute top-0 left-0 right-0 z-30 bg-gradient-to-r from-primary to-secondary p-4 border-b-8 border-primary/60 shadow-xl">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          {/* Título del Mundo */}
          <div className="flex items-center gap-3">
            <div className="text-4xl">{currentRegion.icon && <currentRegion.icon className="w-8 h-8 text-primary-foreground" />}</div>
            <div>
              <h2 className="text-xl font-black text-primary-foreground tracking-tight uppercase" style={{ 
                textShadow: '3px 3px 0 rgba(0,0,0,0.3)',
                fontFamily: 'monospace'
              }}>
                CAMINO DEL GUERRERO
              </h2>
              <p className="text-xs font-bold text-primary-foreground/90 uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
                Mundo {Math.min(Math.floor(completedCount / 2) + 1, 5)}: {currentRegion.name}
              </p>
            </div>
          </div>
          
          {/* Stats - Estilo retro */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-background/20 px-4 py-2 rounded-lg border-2 border-primary-foreground/30">
              <span className="text-sm font-black text-primary-foreground uppercase" style={{ fontFamily: 'monospace' }}>Vidas</span>
              <span className="text-2xl">❤️</span>
              <span className="text-xl font-black text-primary-foreground" style={{ fontFamily: 'monospace' }}>× 03</span>
            </div>
            <div className="flex items-center gap-2 bg-background/20 px-4 py-2 rounded-lg border-2 border-primary-foreground/30">
              <span className="text-2xl">💎</span>
              <span className="text-xl font-black text-primary-foreground" style={{ fontFamily: 'monospace' }}>
                {missions.reduce((sum, m) => sum + (m.status === 'completed' ? m.gems_reward : 0), 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fondo decorativo - Mapa pixelado */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, hsl(var(--primary)) 0px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, hsl(var(--primary)) 0px, transparent 1px, transparent 20px)',
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Elementos decorativos de región */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl opacity-30 animate-pulse" style={{ animationDuration: '4s' }}>☀️</div>
        <div className="absolute top-40 right-20 text-5xl opacity-30 animate-pulse" style={{ animationDuration: '5s' }}>🌲</div>
        <div className="absolute bottom-40 left-20 text-6xl opacity-30 animate-pulse" style={{ animationDuration: '6s' }}>⛰️</div>
        <div className="absolute bottom-20 right-10 text-5xl opacity-30 animate-pulse" style={{ animationDuration: '3s' }}>❄️</div>
      </div>

      {/* SVG Path - Carretera del Guerrero */}
      <svg 
        className="absolute inset-0 w-full h-full mt-20"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.8" />
            <stop offset={`${(completedCount / missions.length) * 100}%`} stopColor="hsl(var(--success))" stopOpacity="0.8" />
            <stop offset={`${(completedCount / missions.length) * 100}%`} stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {/* Sombra del camino */}
        <path
          d={generatePath()}
          stroke="hsl(var(--foreground))"
          strokeWidth="6"
          fill="none"
          opacity="0.15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Camino base */}
        <path
          d={generatePath()}
          stroke="hsl(var(--muted))"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
        />
        
        {/* Camino principal con animación */}
        <path
          ref={pathRef}
          d={generatePath()}
          stroke="url(#pathGradient)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 1000,
            strokeDashoffset: 1000
          }}
        />
        
        {/* Línea punteada central */}
        <path
          d={generatePath()}
          stroke="hsl(var(--background))"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="8,12"
          opacity="0.6"
          strokeLinecap="round"
        />
      </svg>

      {/* Nodos de Misiones - Tótems/Estandartes */}
      <div className="relative z-10 mt-20">
        {missions.map((mission, index) => {
          const position = getNodePosition(index);
          const region = getRegion(index);
          const isCompleted = mission.status === 'completed';
          const isAvailable = mission.status === 'pending' && index === nextAvailableIndex;
          const isLocked = !isCompleted && !isAvailable;
          const RegionIcon = region.icon;

          return (
            <div
              key={mission.id}
              ref={el => nodesRef.current[index] = el}
              className="absolute"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <button
                onClick={() => isAvailable && navigate(`/exercise/${mission.id}`)}
                disabled={isLocked}
                className={`
                  relative group transition-transform duration-200
                  ${isCompleted && 'cursor-default'}
                  ${isAvailable && 'cursor-pointer hover:scale-110'}
                  ${isLocked && 'cursor-not-allowed'}
                `}
                onMouseEnter={(e) => {
                  if (isAvailable) {
                    gsap.to(e.currentTarget, {
                      scale: 1.15,
                      rotation: 5,
                      duration: 0.3,
                      ease: "back.out(1.7)"
                    });
                  }
                }}
                onMouseLeave={(e) => {
                  if (isAvailable) {
                    gsap.to(e.currentTarget, {
                      scale: 1,
                      rotation: 0,
                      duration: 0.3,
                      ease: "power2.out"
                    });
                  }
                }}
              >
                {/* Base del nodo - Estandarte/Tótem estilo pixel */}
                <div className={`
                  relative w-20 h-28 flex flex-col items-center justify-center
                  transition-all duration-500
                  ${isCompleted && 'opacity-90'}
                  ${isLocked && 'opacity-50'}
                `}>
                  
                  {/* Poste del estandarte */}
                  <div className={`
                    absolute bottom-0 w-3 h-24 rounded-sm transition-all duration-500
                    ${isCompleted && 'bg-gradient-to-b from-success to-success/60 shadow-lg shadow-success/50'}
                    ${isAvailable && 'bg-gradient-to-b from-primary to-primary/80 shadow-lg shadow-primary/50'}
                    ${isLocked && 'bg-gradient-to-b from-muted/40 to-muted/20'}
                  `} style={{
                    boxShadow: isAvailable ? '0 0 20px rgba(var(--primary), 0.5)' : 'none'
                  }} />
                  
                  {/* Bandera/Icono principal */}
                  <div className={`
                    relative w-16 h-16 rounded-lg flex items-center justify-center
                    border-4 shadow-2xl z-10 transition-all duration-500
                    ${isCompleted && 'bg-gradient-to-br from-success/90 to-success border-success/50 scale-100'}
                    ${isAvailable && `bg-gradient-to-br ${region.color} border-white/70 animate-pulse scale-110`}
                    ${isLocked && 'bg-gradient-to-br from-muted/60 to-muted/40 border-muted/50 grayscale'}
                  `}
                  style={{
                    boxShadow: isAvailable 
                      ? '0 0 40px rgba(255,255,255,0.6), 0 0 60px rgba(var(--primary), 0.4)' 
                      : isCompleted
                      ? '0 4px 12px rgba(var(--success), 0.3)'
                      : 'none',
                    filter: isLocked ? 'grayscale(80%) brightness(0.7)' : 'none'
                  }}>
                    
                    {/* Icono */}
                    <div className="relative z-10">
                      {isCompleted && (
                        <Trophy className="w-9 h-9 text-white drop-shadow-lg" />
                      )}
                      {isAvailable && (
                        <RegionIcon className="w-9 h-9 text-white drop-shadow-lg" />
                      )}
                      {isLocked && (
                        <Lock className="w-8 h-8 text-muted-foreground/50" />
                      )}
                    </div>

                    {/* Anillos de brillo animados para misión disponible */}
                    {isAvailable && (
                      <>
                        <div
                          className="absolute inset-0 rounded-lg border-4 border-white animate-ping"
                          style={{ animationDuration: '2s' }}
                        />
                        <div
                          className="absolute inset-0 rounded-lg border-2 border-accent animate-ping"
                          style={{ animationDuration: '2s', animationDelay: '0.3s' }}
                        />
                      </>
                    )}

                    {/* Estrella flotante */}
                    {isAvailable && (
                      <div className="absolute -top-4 -right-4 animate-bounce">
                        <Star className="w-6 h-6 text-accent fill-accent drop-shadow-lg" />
                      </div>
                    )}
                  </div>

                  {/* Gemas - Estilo moneda retro */}
                  {!isLocked && (
                    <div 
                      className={`
                        absolute -bottom-2 w-12 h-12 rounded-full
                        flex items-center justify-center text-2xl font-black
                        border-4 shadow-xl z-20
                        ${isCompleted 
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-700' 
                          : 'bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-600 animate-bounce'}
                      `}
                      style={{
                        boxShadow: '0 4px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.3)',
                        animationDuration: '2s'
                      }}
                    >
                      💎
                    </div>
                  )}
                </div>

                {/* Sombra pixelada */}
                <div className={`
                  absolute -bottom-4 left-1/2 -translate-x-1/2
                  w-16 h-3 rounded-full blur-sm
                  ${isCompleted && 'bg-success/20'}
                  ${isAvailable && 'bg-primary/40'}
                  ${isLocked && 'bg-muted/15'}
                `} />
              </button>

              {/* Tooltip - Cuadro de diálogo retro */}
              {isAvailable && (
                <div
                  className="mission-tooltip absolute top-full mt-6 left-1/2 -translate-x-1/2 
                    bg-card/95 backdrop-blur-sm border-4 border-foreground/30 rounded-xl
                    px-4 py-3 text-sm font-bold text-foreground whitespace-nowrap
                    shadow-2xl max-w-[220px] text-center z-20"
                  style={{
                    fontFamily: 'monospace',
                    boxShadow: '0 6px 0 rgba(0,0,0,0.2)'
                  }}
                >
                  {/* Flecha del cuadro */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 
                    border-l-[12px] border-l-transparent 
                    border-r-[12px] border-r-transparent 
                    border-b-[12px] border-b-card/95" 
                  />
                  <div className="relative z-10 uppercase tracking-wide">
                    {mission.title}
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inventario del Guerrero - Esquina inferior derecha */}
      <div 
        className="hud-bottom-right absolute bottom-6 right-6 
          bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-md 
          border-4 border-primary/40 rounded-2xl 
          px-5 py-4 shadow-2xl"
        style={{
          boxShadow: '0 8px 0 rgba(0,0,0,0.2)'
        }}
      >
        <div className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-3" style={{ fontFamily: 'monospace' }}>
          Inventario
        </div>
        <div className="flex gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg border-3 border-amber-700 flex items-center justify-center text-xl shadow-lg">
            🏺
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg border-3 border-purple-700 flex items-center justify-center text-xl shadow-lg">
            💠
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg border-3 border-cyan-700 flex items-center justify-center text-xl shadow-lg">
            🦅
          </div>
        </div>
      </div>

      {/* Progress HUD - Estilo retro inferior izquierda */}
      <div 
        className="hud-bottom-left absolute bottom-6 left-6 
          bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-md 
          border-4 border-primary/40 rounded-2xl 
          px-6 py-4 flex items-center gap-4 shadow-2xl"
        style={{
          boxShadow: '0 8px 0 rgba(0,0,0,0.2)'
        }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-success/30 rounded-full blur-xl" />
          <Trophy className="relative w-8 h-8 text-success drop-shadow-lg" />
        </div>
        
        <div className="flex flex-col">
          <span className="text-3xl font-black text-foreground" style={{ 
            fontFamily: 'monospace',
            textShadow: '2px 2px 0 rgba(0,0,0,0.2)'
          }}>
            {completedCount}/{missions.length}
          </span>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
            Misiones
          </span>
        </div>
        
        <div className="flex gap-1">
          {[...Array(Math.min(3, completedCount))].map((_, i) => (
            <div key={i} className="progress-star">
              <Star className="w-5 h-5 text-accent fill-accent drop-shadow" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MissionMap;
