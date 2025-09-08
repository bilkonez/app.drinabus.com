import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Bus, Route, Users, Phone, Mail, MapPin, Instagram } from "lucide-react";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  seats: number;
  registration: string;
}

const LandingPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [heroImageUrl, setHeroImageUrl] = useState<string>("");

  useEffect(() => {
    fetchVehicles();
    loadHeroImage();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, brand, model, seats, registration')
        .eq('status', 'dostupno')
        .order('brand', { ascending: true });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const loadHeroImage = async () => {
    try {
      // Try to load a hero image from storage
      const { data: files } = await supabase.storage
        .from('media')
        .list('buses', { limit: 1 });

      if (files && files.length > 0) {
        const { data } = supabase.storage
          .from('media')
          .getPublicUrl(`buses/${files[0].name}`);
        setHeroImageUrl(data.publicUrl);
      }
    } catch (error) {
      console.error('Error loading hero image:', error);
    }
  };

  const getVehicleDescription = (brand: string, model: string) => {
    if (brand === "Neoplan" && model === "Cityliner") {
      return "Luksuzni međugradski autobus sa vrhunskim komforom, klimatizacijom i ergonomskim sjedištima.";
    }
    if (brand === "Otokar" && model === "Sultan") {
      return "Moderan autobus idealan za srednje rute, opremljen sa klimatizacijom i udobnim sjedištima.";
    }
    if (brand === "Mercedes" && model === "Sprinter") {
      return "Kompaktni autobus za manje grupe, potpuno klimatizovan sa komfortnim sjedištima.";
    }
    if (brand === "Mercedes" && model === "Vito") {
      return "Mali kombi vozilo za transportovanje manjih grupa sa maksimalnim komforom.";
    }
    return "Kvalitetan i udoban prevoz sa modernom opremom i klimatizacijom.";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-emerald-900"
        style={{
          backgroundImage: heroImageUrl 
            ? `linear-gradient(rgba(16, 185, 129, 0.8), rgba(5, 150, 105, 0.8)), url(${heroImageUrl})`
            : 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
        }}
      >
        <div className="container mx-auto px-4 text-center text-white">
          <div className="mb-8">
            <img 
              src="/lovable-uploads/6dd2d576-8aab-4bef-bf5a-0c7d8a00f49f.png" 
              alt="Drina Bus Logo" 
              className="h-20 md:h-32 mx-auto mb-6"
            />
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Siguran i udoban prevoz putnika
          </h1>
          
          <p className="text-xl md:text-2xl lg:text-3xl font-light mb-8 max-w-4xl mx-auto">
            Povezujemo ljude – lokalno i međunarodno
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 text-lg">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Phone className="h-5 w-5" />
              <span>+387 62 888 702</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <MapPin className="h-5 w-5" />
              <span>Ustikolina, BiH</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-emerald-900 mb-4">
              Naše usluge
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Pružamo kvalitetne usluge prevoza prilagođene vašim potrebama
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="hover:shadow-xl transition-shadow duration-300 border-emerald-200">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Route className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-900 mb-4">
                  Linijski prevoz
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Linijski prevoz putnika na lokalnim linijama. Pouzdane i redovne rute 
                  za svakodnevne potrebe naših putnika.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow duration-300 border-emerald-200">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bus className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-900 mb-4">
                  Vanlinijski prevoz
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Organizovani vanlinijski prevoz za ekskurzije, jednodnevne izlete, 
                  poslovna i turistička putovanja. Fleksibilni termini i destinacije.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Fleet Section */}
      <section className="py-20 bg-emerald-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-emerald-900 mb-4">
              Vozni park
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Moderni i bezbjedni autobusi za sve vaše putničke potrebe
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="hover:shadow-xl transition-shadow duration-300 border-emerald-200 bg-white">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bus className="h-8 w-8 text-emerald-600" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-emerald-900 mb-2 text-center">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-800">
                      {vehicle.seats} sjedišta
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-center leading-relaxed text-sm">
                    {getVehicleDescription(vehicle.brand, vehicle.model)}
                  </p>
                  
                  <div className="mt-4 text-center">
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {vehicle.registration}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-emerald-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Kontakt
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Kontaktirajte nas za sve informacije o našim uslugama
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Lokacija</h3>
              <p className="opacity-90">Ustikolina, BiH</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Telefon</h3>
              <p className="opacity-90">+387 62 888 702</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Email</h3>
              <p className="opacity-90">drinabus@hotmail.com</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Instagram className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Instagram</h3>
              <p className="opacity-90">@drinabus</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-emerald-950 text-white text-center">
        <div className="container mx-auto px-4">
          <p className="opacity-80">
            © 2025 Drina Bus – Sva prava zadržana.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;