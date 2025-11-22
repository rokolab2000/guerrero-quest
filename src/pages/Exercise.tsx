import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Play, CheckCircle2, ArrowLeft } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Mission = Database["public"]["Tables"]["missions"]["Row"];

const Exercise = () => {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mission, setMission] = useState<Mission | null>(null);
  const [exercising, setExercising] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadMission();
  }, [missionId]);

  const loadMission = async () => {
    if (!missionId) return;

    const { data, error } = await supabase
      .from("missions")
      .select("*")
      .eq("id", missionId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la misión",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setMission(data);
  };

  const startExercise = async () => {
    // Update mission status
    await supabase
      .from("missions")
      .update({ status: "in_progress" })
      .eq("id", missionId);

    // Start countdown
    setExercising(true);
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(countdownInterval);
        simulateExercise();
      }
    }, 1000);
  };

  const simulateExercise = () => {
    // Simulate exercise detection for 5 seconds
    setTimeout(() => {
      completeMission();
    }, 5000);
  };

  const completeMission = async () => {
    if (!missionId || !mission) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Update mission
      await supabase
        .from("missions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", missionId);

      // Update user progress
      const { data: progress } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (progress) {
        await supabase
          .from("user_progress")
          .update({
            total_gems: (progress.total_gems || 0) + (mission.gems_reward || 0),
            missions_completed: (progress.missions_completed || 0) + 1,
            last_activity_date: new Date().toISOString().split("T")[0],
          })
          .eq("user_id", session.user.id);
      }

      setCompleted(true);
      toast({
        title: "¡Misión Completada!",
        description: `Has ganado ${mission.gems_reward} gemas`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!mission) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando misión...</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-success/20 via-background to-primary/20 px-4">
        <div className="max-w-lg text-center">
          <div className="mb-6 text-8xl animate-bounce">🎉</div>
          <h1 className="mb-4 text-4xl font-bold text-success">¡Misión Completada!</h1>
          <p className="mb-2 text-xl">Has ganado</p>
          <div className="mb-6 text-5xl font-bold text-primary">
            {mission.gems_reward} 💎
          </div>
          <p className="mb-8 text-lg text-muted-foreground">
            ¡Excelente trabajo, guerrero! Sigue así para desbloquear más recompensas.
          </p>
          <Button
            onClick={() => navigate("/dashboard")}
            size="lg"
            className="bg-primary hover:bg-primary/90 font-bold"
          >
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="container mx-auto px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="mx-auto max-w-3xl">
          <div className="mb-8 rounded-3xl bg-card p-8">
            <h1 className="mb-4 text-3xl font-bold">{mission.title}</h1>
            <p className="mb-6 text-lg text-muted-foreground">{mission.description}</p>

            <div className="rounded-2xl bg-primary/10 p-6">
              <p className="text-sm font-semibold text-primary">Recompensa</p>
              <p className="text-2xl font-bold">{mission.gems_reward} 💎 Gemas</p>
            </div>
          </div>

          {!exercising ? (
            <div className="rounded-3xl bg-card p-12 text-center">
              <div className="mb-6 text-6xl">📹</div>
              <h2 className="mb-4 text-2xl font-bold">Prepárate para Comenzar</h2>
              <p className="mb-8 text-muted-foreground">
                Asegúrate de tener espacio suficiente y que la cámara pueda verte completamente.
                La detección de movimiento comenzará automáticamente.
              </p>
              <Button
                onClick={startExercise}
                size="lg"
                className="bg-primary hover:bg-primary/90 font-bold"
              >
                <Play className="mr-2 h-5 w-5" />
                Comenzar Ejercicio
              </Button>
            </div>
          ) : countdown > 0 ? (
            <div className="rounded-3xl bg-card p-12 text-center">
              <p className="mb-4 text-lg text-muted-foreground">Comenzando en...</p>
              <div className="text-9xl font-bold text-primary animate-pulse">{countdown}</div>
            </div>
          ) : (
            <div className="rounded-3xl bg-card p-12 text-center">
              <div className="mb-6 text-6xl animate-pulse">💪</div>
              <h2 className="mb-4 text-2xl font-bold">¡Excelente!</h2>
              <p className="text-muted-foreground">
                Detectando tu movimiento... Sigue así, guerrero!
              </p>
              <div className="mt-8">
                <div className="mx-auto h-2 w-64 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-full animate-pulse bg-primary" style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Exercise;
