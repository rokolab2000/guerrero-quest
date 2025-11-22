import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Stethoscope } from "lucide-react";

const TherapistOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?mode=therapist");
        return;
      }
      setUserId(session.user.id);

      // Check if user is therapist
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const isTherapist = roles?.some(r => r.role === "therapist");
      
      if (!isTherapist) {
        navigate("/auth");
        return;
      }

      // Check if already completed onboarding
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      if (profile?.full_name) {
        navigate("/therapist");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleComplete = async () => {
    if (!fullName.trim() || !userId) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu nombre completo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          full_name: fullName.trim(),
          animal_warrior: null // Therapists don't need an animal
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "¡Bienvenido, Terapeuta!",
        description: "Tu perfil ha sido configurado correctamente",
      });

      navigate("/therapist");
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-accent/10 via-background to-primary/10 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-card p-8 shadow-xl">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-primary/10 p-6">
                <Stethoscope className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="mb-2 text-3xl font-bold">Bienvenido, Terapeuta</h1>
            <p className="text-muted-foreground">
              Completa tu perfil para comenzar
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ej: Dr. Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidad (opcional)</Label>
              <Input
                id="specialty"
                type="text"
                placeholder="Ej: Kinesiología, Terapia Física"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="h-12"
              />
            </div>

            <Button
              onClick={handleComplete}
              disabled={!fullName.trim() || loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-lg rounded-xl"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Completar Perfil"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistOnboarding;
