import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Trophy, Target, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        
        <div className="container relative mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              Telerehabilitación Gamificada
            </div>
            
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              El Camino del{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Guerrero
              </span>
            </h1>
            
            <p className="mb-10 max-w-2xl text-xl text-muted-foreground sm:text-2xl">
              Convierte tu terapia en una aventura épica. Completa misiones, gana recompensas y 
              fortalece tu cuerpo junto a tu Animal Guerrero.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/auth")}
              >
                Comenzar Aventura
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="font-bold text-lg px-8 py-6 rounded-2xl border-2"
                onClick={() => navigate("/auth?mode=therapist")}
              >
                Soy Terapeuta
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl">
            ¿Por qué El Camino del Guerrero?
          </h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center transition-all hover:scale-105">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Misiones Diarias</h3>
              <p className="text-muted-foreground">
                Ejercicios adaptados a tu ritmo con objetivos claros y alcanzables
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-secondary/10 to-secondary/5 p-8 text-center transition-all hover:scale-105">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <Trophy className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Sistema de Recompensas</h3>
              <p className="text-muted-foreground">
                Gana gemas y desbloquea logros mientras progresas en tu recuperación
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-accent/10 to-accent/5 p-8 text-center transition-all hover:scale-105">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Acompañamiento Profesional</h3>
              <p className="text-muted-foreground">
                Tu terapeuta monitorea tu progreso y adapta tus ejercicios
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
            Lista para comenzar tu aventura
          </h2>
          <p className="mb-8 text-xl text-muted-foreground">
            Únete a cientos de guerreros que ya están transformando su terapia
          </p>
          <Button 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate("/auth")}
          >
            Crear Cuenta Gratis
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
