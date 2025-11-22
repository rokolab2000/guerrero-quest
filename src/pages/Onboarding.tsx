import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const animals = [
  { id: "leon", name: "León", emoji: "🦁", description: "Valiente y poderoso" },
  { id: "aguila", name: "Águila", emoji: "🦅", description: "Libre y perspicaz" },
  { id: "oso", name: "Oso", emoji: "🐻", description: "Fuerte y protector" },
  { id: "lobo", name: "Lobo", emoji: "🐺", description: "Leal y determinado" },
  { id: "tigre", name: "Tigre", emoji: "🐯", description: "Ágil y feroz" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      // Check if already completed onboarding
      const { data: profile } = await supabase
        .from("profiles")
        .select("animal_warrior")
        .eq("id", session.user.id)
        .single();

      if (profile?.animal_warrior) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleComplete = async () => {
    if (!selectedAnimal || !userId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ animal_warrior: selectedAnimal as "leon" | "aguila" | "oso" | "lobo" | "tigre" })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "¡Bienvenido, Guerrero!",
        description: `Tu ${animals.find(a => a.id === selectedAnimal)?.name} está listo para la aventura`,
      });

      navigate("/dashboard");
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="rounded-3xl bg-card p-8 shadow-xl md:p-12">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold">Elige tu Animal Guerrero</h1>
            <p className="text-lg text-muted-foreground">
              Tu compañero te acompañará en cada misión
            </p>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {animals.map((animal) => (
              <button
                key={animal.id}
                onClick={() => setSelectedAnimal(animal.id)}
                className={`rounded-2xl border-2 p-6 text-center transition-all hover:scale-105 ${
                  selectedAnimal === animal.id
                    ? "border-primary bg-primary/10 shadow-lg"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="mb-3 text-6xl">{animal.emoji}</div>
                <h3 className="mb-1 text-xl font-bold">{animal.name}</h3>
                <p className="text-sm text-muted-foreground">{animal.description}</p>
              </button>
            ))}
          </div>

          <Button
            onClick={handleComplete}
            disabled={!selectedAnimal || loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-lg rounded-xl"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Comenzar Aventura"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
