import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const isTherapist = searchParams.get("mode") === "therapist";

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check user role
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        const isTherapist = roles?.some(r => r.role === "therapist");

        if (isTherapist) {
          // Check if therapist completed onboarding
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", session.user.id)
            .single();

          if (profile?.full_name) {
            navigate("/therapist");
          } else {
            navigate("/therapist-onboarding");
          }
          return;
        }

        // Check if patient has completed onboarding
        const { data: profile } = await supabase
          .from("profiles")
          .select("animal_warrior")
          .eq("id", session.user.id)
          .single();

        if (profile?.animal_warrior) {
          navigate("/dashboard");
        } else {
          navigate("/onboarding");
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          // Check user role
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.session.user.id);

          const isUserTherapist = roles?.some(r => r.role === "therapist");

          if (isUserTherapist) {
            // Check if therapist completed onboarding
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", data.session.user.id)
              .single();

            if (profile?.full_name) {
              navigate("/therapist");
            } else {
              navigate("/therapist-onboarding");
            }
            return;
          }

          // Check if patient has completed onboarding
          const { data: profile } = await supabase
            .from("profiles")
            .select("animal_warrior")
            .eq("id", data.session.user.id)
            .single();

          if (profile?.animal_warrior) {
            navigate("/dashboard");
          } else {
            navigate("/onboarding");
          }
        }
      } else {
        if (!fullName.trim()) {
          throw new Error("Por favor ingresa tu nombre completo");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        // If signing up as therapist, update the role
        if (isTherapist && data.user) {
          // First delete the default patient role
          await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", data.user.id)
            .eq("role", "patient");

          // Add therapist role
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: data.user.id,
              role: "therapist",
            });

          if (roleError) throw roleError;

          toast({
            title: "¡Cuenta de terapeuta creada!",
            description: "Completa tu perfil para continuar",
          });

          navigate("/therapist-onboarding");
        } else {
          toast({
            title: "¡Cuenta creada!",
            description: "Ahora completa tu perfil de guerrero",
          });

          navigate("/onboarding");
        }
      }
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-card p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold">
              {isTherapist ? "Portal Terapeuta" : "El Camino del Guerrero"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin ? "Ingresa a tu cuenta" : "Crea tu cuenta de guerrero"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Tu nombre completo"
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="mt-1"
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 rounded-xl"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isLogin ? (
                "Iniciar Sesión"
              ) : (
                "Crear Cuenta"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>

          {!isTherapist && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Volver al inicio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
