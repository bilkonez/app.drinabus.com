import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bus, LogIn, Phone, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/logo.jpg";
import heroBusImage from "@/assets/hero-bus.jpg";

const Home = () => {
  const [images, setImages] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    // Load bus images from storage or use placeholders
    loadBusImages();
  }, [navigate]);

  const loadBusImages = async () => {
    try {
      // Try to load images from Supabase storage
      const { data, error } = await supabase.storage
        .from('media')
        .list('buses', { limit: 6 });

      if (error || !data || data.length === 0) {
        // Use placeholder images if no images in storage
        setImages([heroBusImage, heroBusImage, heroBusImage]);
        return;
      }

      // Get public URLs for the images
      const imageUrls = data.map(file => {
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(`buses/${file.name}`);
        return urlData.publicUrl;
      });

      setImages(imageUrls);
    } catch (error) {
      console.error('Error loading images:', error);
      // Fallback to hero image
      setImages([heroBusImage, heroBusImage, heroBusImage]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Drina Bus Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Drina Bus
              </h1>
              <p className="text-sm text-muted-foreground">Pouzdano putovanje</p>
            </div>
          </div>
          
          <Link to="/login">
            <Button>
              <LogIn className="h-4 w-4 mr-2" />
              Pristup sistemu
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Drina Bus
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Profesionalan autobusni prevoz kroz Bosnu i Hercegovinu i šire
            </p>
          </div>

          <div className="flex items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              <span>Moderni vozni park</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Široka mreža destinacija</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bus Gallery */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Naš vozni park</h3>
          
          {images.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.slice(0, 6).map((image, index) => (
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
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Naše usluge</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Bus className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-xl font-semibold">Linijski prevoz</h4>
                </div>
                <p className="text-muted-foreground">
                  Redovni autobusni prevoz putnika na utvrđenim linijama sa pouzdanim voznim redom.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-accent" />
                  </div>
                  <h4 className="text-xl font-semibold">Vanlinijski prevoz</h4>
                </div>
                <p className="text-muted-foreground">
                  Organizovani turistički i ekslurzivni prevoz za grupe i individualne klijente.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center space-y-8">
          <h3 className="text-3xl font-bold">Kontaktirajte nas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="flex flex-col items-center gap-2">
              <Phone className="h-8 w-8 text-primary" />
              <p className="font-medium">Telefon</p>
              <p className="text-muted-foreground">+387 XX XXX XXX</p>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <Mail className="h-8 w-8 text-primary" />
              <p className="font-medium">Email</p>
              <p className="text-muted-foreground">info@drinabus.ba</p>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <MapPin className="h-8 w-8 text-primary" />
              <p className="font-medium">Adresa</p>
              <p className="text-muted-foreground">Bosna i Hercegovina</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-card/30">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={logoImage} alt="Drina Bus Logo" className="h-8 w-auto" />
            <span className="font-semibold">Drina Bus</span>
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