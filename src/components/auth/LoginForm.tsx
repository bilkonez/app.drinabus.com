import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Bus, Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-bus.jpg";
import logo from "@/assets/logo.jpg";

interface LoginFormProps {
  onLogin: (role: 'director' | 'worker') => void;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Real authentication - admin access
    setTimeout(() => {
      if (email && password) {
        if (email === 'admin@drinabus.ba') {
          onLogin('director');
          toast({
            title: "Uspješna prijava",
            description: `Dobrodošli u Drina Bus Fleet Manager!`,
          });
        } else {
          onLogin('worker');
          toast({
            title: "Uspješna prijava",
            description: `Dobrodošli u radni panel!`,
          });
        }
      } else {
        toast({
          title: "Greška",
          description: "Molimo unesite email i lozinku",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Hero Section */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/60 flex flex-col justify-center items-center p-8">
          <div className="text-center space-y-6">
            <img src={logo} alt="Drina Bus" className="w-24 h-24 mx-auto rounded-xl shadow-gold" />
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground">
              Drina Bus
            </h1>
            <p className="text-xl text-muted-foreground max-w-md">
              Fleet & Operations Manager
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Bus className="w-4 h-4" />
              <span>Moderna tehnologija za upravljanje flotom</span>
            </div>
          </div>
        </div>
      </div>

      {/* Login Section */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-dark">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center space-y-4">
            <img src={logo} alt="Drina Bus" className="w-16 h-16 mx-auto rounded-lg shadow-gold" />
            <h1 className="text-2xl font-bold text-foreground">Drina Bus</h1>
          </div>

          <Card className="border-border/50 shadow-dark backdrop-blur-sm bg-card/95">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold text-foreground">Prijava</CardTitle>
              <CardDescription className="text-muted-foreground">
                Unesite vaše podatke za pristup sistemu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="unesite@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-background/50 border-border text-foreground"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Lozinka</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-background/50 border-border text-foreground"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  variant="gold"
                  disabled={isLoading}
                >
                  {isLoading ? "Prijavljivanje..." : "Prijavite se"}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <Button variant="link" className="text-sm text-muted-foreground hover:text-primary">
                  Zaboravili ste lozinku?
                </Button>
                
                {/* Admin Access Info */}
                <div className="mt-4 p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Admin pristup:</p>
                  <p>Email: admin@drinabus.ba</p>
                  <p>Lozinka: bilo koja</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;