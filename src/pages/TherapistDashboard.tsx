import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface PatientData {
  id: string;
  full_name: string;
  animal_warrior: string;
  total_gems: number;
  missions_completed: number;
  current_streak: number;
  today_mission_status: "completed" | "in_progress" | "pending" | "none";
}

interface MissionHistory {
  id: string;
  title: string;
  completed_at: string | null;
  gems_reward: number;
  status: string;
}

const TherapistDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [isTherapist, setIsTherapist] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [missionHistory, setMissionHistory] = useState<MissionHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    checkAuthAndLoadPatients();
  }, []);

  const checkAuthAndLoadPatients = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?mode=therapist");
        return;
      }

      // Check if user is therapist
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const hasTherapistRole = roles?.some(r => r.role === "therapist" || r.role === "admin");
      
      if (!hasTherapistRole) {
        toast({
          title: "Acceso Denegado",
          description: "No tienes permisos de terapeuta",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsTherapist(true);

      // Load all patients with their progress
      const { data: profiles } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          animal_warrior
        `);

      if (!profiles) return;

      const patientsData: PatientData[] = [];
      const today = new Date().toISOString().split("T")[0];

      for (const profile of profiles) {
        // Get progress
        const { data: progress } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", profile.id)
          .single();

        // Get today's mission status
        const { data: missions } = await supabase
          .from("missions")
          .select("status")
          .eq("user_id", profile.id)
          .eq("scheduled_for", today)
          .order("created_at", { ascending: false })
          .limit(1);

        const todayStatus = missions && missions.length > 0 
          ? missions[0].status 
          : "none";

        patientsData.push({
          id: profile.id,
          full_name: profile.full_name,
          animal_warrior: profile.animal_warrior || "sin asignar",
          total_gems: progress?.total_gems || 0,
          missions_completed: progress?.missions_completed || 0,
          current_streak: progress?.current_streak || 0,
          today_mission_status: todayStatus as any,
        });
      }

      setPatients(patientsData);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleViewPatient = async (patient: PatientData) => {
    setSelectedPatient(patient);
    setLoadingHistory(true);
    
    const { data, error } = await supabase
      .from("missions")
      .select("*")
      .eq("user_id", patient.id)
      .order("completed_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el historial del paciente",
        variant: "destructive",
      });
    } else {
      setMissionHistory(data || []);
    }
    
    setLoadingHistory(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando dashboard...</p>
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

  const getWeeklyProgress = () => {
    if (!selectedPatient) return 0;
    return Math.min((selectedPatient.missions_completed / 7) * 100, 100);
  };

  return (
    <>
      {/* Dialog for Patient Details */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-3xl">
                {selectedPatient && (animalEmojis[selectedPatient.animal_warrior] || "👤")}
              </span>
              <div>
                <div>{selectedPatient?.full_name}</div>
                <div className="text-sm font-normal text-muted-foreground capitalize">
                  {selectedPatient?.animal_warrior}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-6">
              {/* Progress Overview */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary">{selectedPatient.total_gems}</div>
                    <div className="text-sm text-muted-foreground">Gemas Totales</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-secondary">{selectedPatient.missions_completed}</div>
                    <div className="text-sm text-muted-foreground">Misiones Completadas</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-accent">{selectedPatient.current_streak}</div>
                    <div className="text-sm text-muted-foreground">Racha Actual</div>
                  </CardContent>
                </Card>
              </div>

              {/* Weekly Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progreso Semanal</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={getWeeklyProgress()} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedPatient.missions_completed} de 7 misiones esta semana
                  </p>
                </CardContent>
              </Card>

              {/* Mission History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Historial de Misiones</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <p className="text-center py-4 text-muted-foreground">Cargando historial...</p>
                  ) : missionHistory.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {missionHistory.map((mission) => (
                        <div
                          key={mission.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{mission.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {mission.completed_at
                                ? new Date(mission.completed_at).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Pendiente'}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={mission.status === 'completed' ? 'default' : 'outline'}>
                              {mission.status === 'completed' ? 'Completada' : 'Pendiente'}
                            </Badge>
                            {mission.status === 'completed' && (
                              <span className="text-sm font-semibold text-primary">
                                +{mission.gems_reward} 💎
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">
                      No hay misiones registradas aún
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Dashboard */}
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Terapeuta</h1>
            <p className="text-sm text-muted-foreground">Monitoreo de pacientes</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Salir
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Pacientes ({patients.length})</h2>
          <p className="text-muted-foreground">Estado de misiones de hoy</p>
        </div>

        {patients.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-border bg-muted/20 p-12 text-center">
            <p className="text-muted-foreground">No hay pacientes registrados</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="text-4xl">
                    {animalEmojis[patient.animal_warrior] || "👤"}
                  </div>
                  <div>
                    <h3 className="font-bold">{patient.full_name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {patient.animal_warrior}
                    </p>
                  </div>
                </div>

                <div className="mb-4 space-y-2 rounded-xl bg-muted/50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gemas</span>
                    <span className="font-semibold">{patient.total_gems} 💎</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completadas</span>
                    <span className="font-semibold">{patient.missions_completed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Racha</span>
                    <span className="font-semibold">{patient.current_streak} días</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Misión de hoy:</span>
                    {patient.today_mission_status === "completed" ? (
                      <span className="flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        Completada
                      </span>
                    ) : patient.today_mission_status === "in_progress" ? (
                      <span className="flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                        <Clock className="h-3 w-3" />
                        En progreso
                      </span>
                    ) : patient.today_mission_status === "pending" ? (
                      <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Pendiente
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                        <XCircle className="h-3 w-3" />
                        Sin misión
                      </span>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2"
                    onClick={() => handleViewPatient(patient)}
                  >
                    <Eye className="h-4 w-4" />
                    Ver Detalle
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default TherapistDashboard;
