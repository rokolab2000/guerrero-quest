import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Trophy, Target, LogOut } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import MissionMap from "@/components/MissionMap";

type Mission = Database["public"]["Tables"]["missions"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserProgress = Database["public"]["Tables"]["user_progress"]["Row"];

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [generatingMission, setGeneratingMission] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!profileData?.animal_warrior) {
        navigate("/onboarding");
        return;
      }

      setProfile(profileData);

      // Load progress
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      setProgress(progressData);

      // Load today's missions
      const today = new Date().toISOString().split("T")[0];
      const { data: missionsData } = await supabase
        .from("missions")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("scheduled_for", today)
        .order("created_at", { ascending: false });

      setMissions(missionsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMission = async () => {
    setGeneratingMission(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get random exercises
      const { data: exercises } = await supabase
        .from("exercises")
        .select("*");

      if (!exercises || exercises.length === 0) return;

      // Generate mission templates
      const missionTemplates = [
        {
          title: `🎯 Conquista`,
          description: `Tu ${profile?.animal_warrior} necesita tu ayuda para completar esta misión. ¡Demuestra tu fuerza interior!`,
        },
        {
          title: `⚔️ Desafío`,
          description: `El camino del guerrero requiere dedicación. ¡Tu ${profile?.animal_warrior} confía en ti!`,
        },
        {
          title: `🌟 Prueba de Poder`,
          description: `Una nueva prueba te espera. Cada repetición te acerca a tu meta.`,
        },
        {
          title: `🔥 Misión Ardiente`,
          description: `El fuego interior te guía. ¡Completa este desafío!`,
        },
        {
          title: `⛰️ Cima del Guerrero`,
          description: `Alcanza la cima de tus capacidades. ¡Tu momento es ahora!`,
        },
      ];

      // Generate 5 missions
      const missionsToInsert = [];
      for (let i = 0; i < 5; i++) {
        const randomExercise = exercises[Math.floor(Math.random() * exercises.length)];
        const template = missionTemplates[i];
        
        missionsToInsert.push({
          user_id: session.user.id,
          exercise_id: randomExercise.id,
          title: `${template.title}: ${randomExercise.name}`,
          description: template.description,
          gems_reward: 10 + Math.floor(Math.random() * 10),
          status: 'pending',
        });
      }

      const { error } = await supabase.from("missions").insert(missionsToInsert);

      if (error) throw error;

      toast({
        title: "¡Camino Generado!",
        description: "Se han generado 5 misiones. ¡Completa la primera para desbloquear las siguientes!",
      });

      loadDashboard();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingMission(false);
    }
  };

  const startMission = (missionId: string) => {
    navigate(`/exercise/${missionId}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl animate-pulse">⚔️</div>
          <p className="text-muted-foreground">Cargando tu aventura...</p>
        </div>
      </div>
    );
  }

  const animalEmojis: Record<string, string> = {
    leon: "🦁",
    aguila: "🦅",
    oso: "🐻",
    lobo: "🐺",
    tigre: "🐯",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{animalEmojis[profile?.animal_warrior || "leon"]}</div>
            <div>
              <h2 className="text-xl font-bold">{profile?.full_name}</h2>
              <p className="text-sm text-muted-foreground">Guerrero {profile?.animal_warrior}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Salir
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-6">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">Gemas</span>
            </div>
            <p className="text-3xl font-bold">{progress?.total_gems || 0}</p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-success/10 to-success/5 p-6">
            <div className="mb-2 flex items-center gap-2 text-success">
              <Trophy className="h-5 w-5" />
              <span className="text-sm font-semibold">Completadas</span>
            </div>
            <p className="text-3xl font-bold">{progress?.missions_completed || 0}</p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 p-6">
            <div className="mb-2 flex items-center gap-2 text-secondary">
              <Target className="h-5 w-5" />
              <span className="text-sm font-semibold">Racha</span>
            </div>
            <p className="text-3xl font-bold">{progress?.current_streak || 0} días</p>
          </div>
        </div>

        {/* Missions Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Misiones de Hoy</h2>
          <Button
            onClick={generateMission}
            disabled={generatingMission}
            className="bg-primary hover:bg-primary/90"
          >
            {generatingMission ? "Generando Camino..." : "Generar Camino del Guerrero"}
          </Button>
        </div>

        {missions.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-border bg-muted/20 p-12 text-center">
            <div className="mb-4 text-6xl">🎯</div>
            <h3 className="mb-2 text-xl font-bold">No tienes misiones</h3>
            <p className="mb-4 text-muted-foreground">
              Genera tu camino del guerrero con 5 niveles para comenzar tu entrenamiento
            </p>
            <Button onClick={generateMission} disabled={generatingMission}>
              Generar Camino del Guerrero
            </Button>
          </div>
        ) : (
          <MissionMap missions={missions} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
