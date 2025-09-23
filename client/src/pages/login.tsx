import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (!success) {
        toast({
          title: "Erreur d'authentification",
          description: "Identifiants incorrects. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <CardContent className="pt-6 pb-8 px-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary mb-2" data-testid="text-app-title">
              ChargeCapa
            </h1>
            <p className="text-muted-foreground" data-testid="text-app-subtitle">
              Gestion de Capacité Formation
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username" className="block text-sm font-medium mb-2">
                Nom d'utilisateur
              </Label>
              <Input
                type="text"
                id="username"
                data-testid="input-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="block text-sm font-medium mb-2">
                Mot de passe
              </Label>
              <Input
                type="password"
                id="password"
                data-testid="input-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="chargecapa@2025"
                required
                className="w-full"
              />
            </div>
            
            <Button
              type="submit"
              data-testid="button-login"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
