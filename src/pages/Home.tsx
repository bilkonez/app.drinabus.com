import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bus, LogIn, Phone, Mail, MapPin } from "lucide-react";
import logoImage from "@/assets/logo.jpg";

const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busImages, setBusImages] = useState<string[]>([]);
  
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    loadBusImages();
  }, []);

  const loadBusImages = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('media')
        .list('buses', { limit: 6 });

      if (error || !data || data.length === 0) {
        // No images found, use placeholders
        setBusImages([]);
        return;
      }

      const imageUrls = data.map(file => {
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(`buses/${file.name}`);
        return urlData.publicUrl;
      });

      setBusImages(imageUrls);
    } catch (error) {
      console.error('Error loading bus images:', error);
      setBusImages([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={logoImage} alt="Drina Bus Logo" className="h-16 w-auto mx-auto" />
          <p className="text-muted-foreground">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <img src={logoImage} alt="Drina Bus Logo" className="h-10 md:h-12 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                Drina Bus
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">Pouzdano putovanje</p>
            </div>
          </div>
          
          <Button onClick={() => navigate("/login")} size="sm" className="text-xs md:text-sm">
            <LogIn className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Pristup sistemu</span>
            <span className="sm:hidden">Login</span>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto text-center space-y-6 md:space-y-8">
          <div className="space-y-3 md:space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-foreground">
              Drina Bus
            </h2>
            <p className="text-base md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto px-4">
              Profesionalan autobusni prevoz kroz Bosnu i Hercegovinu i šire
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-muted-foreground text-sm md:text-base">
            <div className="flex items-center gap-2">
              <Bus className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span>Moderni vozni park</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span>Široka mreža destinacija</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bus Gallery */}
      <section className="py-12 md:py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-foreground">Naš vozni park</h3>
          
          {busImages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {busImages.slice(0, 6).map((image, index) => (
                <Card key={index} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={image} 
                        alt={`Drina Bus vozilo ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <img src={logoImage} alt="Drina Bus Logo" className="h-16 w-auto mx-auto opacity-50" />
                        <p className="text-muted-foreground text-sm">Drina Bus vozilo</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 md:py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-foreground">Naše usluge</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <Card className="p-4 md:p-6">
              <CardContent className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Bus className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <h4 className="text-lg md:text-xl font-semibold text-foreground">Linijski prevoz</h4>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">
                  Redovni autobusni prevoz putnika na etabliranim linijama sa tačnim voznim redom i visokim standardima usluge.
                </p>
              </CardContent>
            </Card>

            <Card className="p-4 md:p-6">
              <CardContent className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                  </div>
                  <h4 className="text-lg md:text-xl font-semibold text-foreground">Vanlinijski prevoz</h4>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">
                  Specijalizovani turistički i ekskurzijski prevoz za organizovane grupe, kompanije i individualne klijente po zahtjevu.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 md:py-16 px-4">
        <div className="container mx-auto text-center space-y-6 md:space-y-8">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground">Kontaktirajte nas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50">
              <Phone className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <p className="font-medium text-foreground text-sm md:text-base">Telefon</p>
              <a href="tel:+38762888702" className="text-muted-foreground text-sm md:text-base hover:text-primary transition-colors">
                +387 62 888 702
              </a>
            </div>
            
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50">
              <Mail className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <p className="font-medium text-foreground text-sm md:text-base">Email</p>
              <a href="mailto:drinabus@hotmail.com" className="text-muted-foreground text-sm md:text-base hover:text-primary transition-colors">
                drinabus@hotmail.com
              </a>
            </div>
            
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50">
              <MapPin className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <p className="font-medium text-foreground text-sm md:text-base">Adresa</p>
              <p className="text-muted-foreground text-sm md:text-base text-center">
                Ustikolina bb, Bosna i Hercegovina
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-card/30">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={logoImage} alt="Drina Bus Logo" className="h-8 w-auto" />
            <span className="font-semibold text-foreground">Drina Bus</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2024 Drina Bus. Sva prava zadržana.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;