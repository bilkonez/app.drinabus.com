import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Mail, Instagram, MapPin, Users, Route, Calendar, X } from 'lucide-react';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  registration: string;
  seats: number;
  is_operational?: boolean;
}

interface GalleryImage {
  url: string;
  alt: string;
}

// Storage vehicle images mapping
const getVehicleImageFromStorage = (vehicle: Vehicle): string => {
  if (vehicle.brand === 'Mercedes' && vehicle.model === 'Vito') {
    return supabase.storage.from('media').getPublicUrl('vehicles/mercedes_vito.jpg').data.publicUrl;
  }
  if (vehicle.brand === 'Neoplan' && vehicle.registration === 'T17-M-331') {
    return supabase.storage.from('media').getPublicUrl('vehicles/neoplan_t17m331.jpg').data.publicUrl;
  }
  if (vehicle.brand === 'Mercedes' && vehicle.model === 'Sprinter') {
    return supabase.storage.from('media').getPublicUrl('vehicles/mercedes_sprinter.jpg').data.publicUrl;
  }
  if (vehicle.brand === 'Neoplan' && vehicle.model === 'Cityliner') {
    return supabase.storage.from('media').getPublicUrl('vehicles/neoplan_tourliner.jpg').data.publicUrl;
  }
  if (vehicle.brand === 'Otokar' && vehicle.model === 'Sultan') {
    return supabase.storage.from('media').getPublicUrl('vehicles/otokar_sultan.jpg').data.publicUrl;
  }
  return '';
};

const LandingPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
    fetchGalleryImages();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, brand, model, registration, seats, is_operational')
        .eq('status', 'dostupno')
        .eq('is_operational', true) // Only show operational vehicles
        .order('brand');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGalleryImages = async () => {
    try {
      // Fetch images from both vehicles and gallery folders
      const [vehiclesRes, galleryRes] = await Promise.all([
        supabase.storage.from('media').list('vehicles', { limit: 100 }),
        supabase.storage.from('media').list('gallery', { limit: 500 })
      ]);

      const vehicleImages = (vehiclesRes.data || [])
        .filter(file => file.name.match(/\.(jpg|jpeg|png|webp)$/i))
        .map(file => ({
          url: supabase.storage.from('media').getPublicUrl(`vehicles/${file.name}`).data.publicUrl,
          alt: `Drina Bus - ${file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}`
        }));

      const galleryImages = (galleryRes.data || [])
        .filter(file => file.name.match(/\.(jpg|jpeg|png|webp)$/i))
        .map(file => ({
          url: supabase.storage.from('media').getPublicUrl(`gallery/${file.name}`).data.publicUrl,
          alt: `Drina Bus - ${file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}`
        }));

      const allImages = [...vehicleImages, ...galleryImages].filter(img => img.url);
      setGalleryImages(allImages);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    }
  };

  const getVehicleDescription = (brand: string, model: string) => {
    if (brand === 'Neoplan' && model === 'Cityliner') {
      return 'Luksuzni autobus za duga putovanja sa visokim komforom, klimatizovan i moderno opremljen.';
    }
    if (brand === 'Mercedes' && model === 'Sprinter') {
      return 'Kompaktni i udoban minibus, idealan za manje grupe i lokalni prevoz.';
    }
    if (brand === 'Otokar' && model === 'Sultan') {
      return 'Pouzdan i komforan autobus za srednje grupe, klimatizovan sa modernim sadržajima.';
    }
    if (brand === 'Mercedes' && model === 'Vito') {
      return 'Kompaktni i praktičan van, idealan za manje grupe do 8 putnika.';
    }
    return 'Udoban, klimatizovan i moderno opremljen autobus za Vaša putovanja.';
  };

  // Adjust vehicle capacity (reduce by 1)
  const getAdjustedCapacity = (seats: number) => Math.max(1, seats - 1);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${supabase.storage.from('media').getPublicUrl('hero/hero_bus.jpg').data.publicUrl})`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/40 to-black/50" />
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
          <div className="mb-8">
            <img 
              src="/lovable-uploads/6dd2d576-8aab-4bef-bf5a-0c7d8a00f49f.png" 
              alt="Drina Bus Logo" 
              className="h-24 w-auto mx-auto mb-6 drop-shadow-2xl"
            />
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Siguran i udoban prevoz putnika
          </h1>
          
          <p className="text-xl md:text-2xl lg:text-3xl font-light opacity-90 max-w-3xl mx-auto">
            Povezujemo ljude – lokalno i međunarodno
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Naše usluge
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Pružamo pouzdane usluge prevoza prilagođene vašim potrebama
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                  <Route className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Linijski prevoz</h3>
                <p className="text-gray-600 leading-relaxed">
                  Linijski prevoz putnika na lokalnim linijama. Pouzdane i redovne rute za 
                  svakodnevne potrebe naših putnika.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Vanlinijski prevoz</h3>
                <p className="text-gray-600 leading-relaxed">
                  Organizovani vanlinijski prevoz za ekskurzije, jednodnevne izlete, poslovna i 
                  turistička putovanja. Fleksibilni termini i destinacije.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Fleet Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Vozni park
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Moderni i sigurni autobusi za sva vaša putovanja
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Učitavanje voznog parka...</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 max-w-7xl mx-auto">
              {vehicles.slice(0, 5).map((vehicle, index) => {
                const vehicleImage = getVehicleImageFromStorage(vehicle);
                const isLastTwoCards = index >= 3;
                
                return (
                  <Card 
                    key={vehicle.id} 
                    className={`group hover:shadow-xl transition-all duration-300 overflow-hidden w-full shadow-sm border-2 hover:border-green-200 rounded-lg ${
                      isLastTwoCards ? 'lg:col-start-2 lg:max-w-sm lg:justify-self-center' : ''
                    } ${
                      vehicles.length === 5 && index === 3 ? 'lg:justify-self-end lg:mr-8' : ''
                    } ${
                      vehicles.length === 5 && index === 4 ? 'lg:justify-self-start lg:ml-8' : ''
                    }`}
                  >
                    <div className="aspect-video bg-gray-100 overflow-hidden rounded-t-lg">
                      {vehicleImage ? (
                        <img 
                          src={vehicleImage}
                          alt={`${vehicle.brand} ${vehicle.model} - Drina Bus`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          width="400"
                          height="225"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `
                              <div class="w-full h-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                                <div class="text-white text-center">
                                  <div class="text-4xl mb-2">🚌</div>
                                  <p class="text-sm opacity-80">Slika autobusa</p>
                                </div>
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="text-4xl mb-2">🚌</div>
                            <p className="text-sm opacity-80">Slika autobusa</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {vehicle.brand} {vehicle.model}
                        {vehicle.registration && vehicle.registration !== vehicle.model && (
                          <span className="text-sm font-normal text-gray-500 block">
                            {vehicle.registration}
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {getAdjustedCapacity(vehicle.seats)} sjedišta
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {getVehicleDescription(vehicle.brand, vehicle.model)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            O nama
          </h2>
          <div className="prose prose-lg mx-auto text-gray-600 leading-relaxed">
            <p className="text-lg mb-6">
              Drina Bus je porodična firma iz Ustikoline, specijalizovana za linijski i vanlinijski 
              prevoz putnika. Naša misija je pružiti sigurno, udobno i pristupačno putovanje, bilo da 
              se radi o svakodnevnim linijama ili posebnim putovanjima za grupe, ekskurzije i turiste.
            </p>
            <p className="text-lg">
              Sa dugogodišnjim iskustvom, modernim voznim parkom i profesionalnim vozačima, 
              Drina Bus je pouzdan partner na svakom putovanju.
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Galerija
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Pogledajte naš vozni park i udobnost naših autobusa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
              <div 
                key={index}
                className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
                onClick={() => setSelectedImage(image.url)}
              >
                <img 
                  src={image.url} 
                  alt={image.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  width="300"
                  height="300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGM0Y0RjYiLz48dGV4dCB4PSIxMDAiIHk9IjEwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzlDQTNBRiIgZm9udC1zaXplPSIxNCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPkRyaW5hIEJ1czwvdGV4dD48L3N2Zz4=';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-6 bg-green-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Kontakt
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Kontaktirajte nas za sve informacije o našim uslugama
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Lokacija</h3>
              <p className="opacity-90">Ustikolina, BiH</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Telefon</h3>
              <p className="opacity-90">+387 62 888 702</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Email</h3>
              <p className="opacity-90">drinabus@hotmail.com</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Instagram className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Instagram</h3>
              <p className="opacity-90">@drinabus</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-green-950 text-white text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="opacity-80">
            © 2025 Drina Bus – Sva prava zadržana.
          </p>
        </div>
      </footer>

      {/* Gallery Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="relative">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Drina Bus galerija"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;