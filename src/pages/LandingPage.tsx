import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Mail, Instagram, MapPin, Users, Route, Calendar, X } from 'lucide-react';
import heroBackground from '@/assets/hero-river-bus.jpg';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { useLanguage } from '@/contexts/LanguageContext';

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

// Previously uploaded vehicle images mapping
const getVehicleImageFromUploads = (vehicle: Vehicle): string => {
  const brand = vehicle.brand?.trim();
  const model = vehicle.model?.trim();
  const registration = vehicle.registration?.trim();
  
  if (brand === 'Mercedes' && model === 'Sprinter') {
    return '/lovable-uploads/feb19f81-e937-43e1-b3f8-1b29065267b6.png';
  }
  if (brand === 'Neoplan' && model === 'Cityliner') {
    if (registration === 'A36-E-349') {
      return '/lovable-uploads/d35b41af-f340-499b-926a-af278cefaf0e.png';
    }
    if (registration === 'T17-M-331') {
      return '/lovable-uploads/8bb9aa36-5a2f-42ad-a745-79b983ddcf2a.png';
    }
  }
  if (brand === 'Otokar' && model === 'Sultan') {
    return '/lovable-uploads/6a6efc97-e912-4097-b4a0-48f7d46ec0d3.png';
  }
  if (brand === 'Mercedes' && model === 'Vito') {
    return '/lovable-uploads/5f35d25b-dac7-4c14-a056-aaa834f9d22f.png';
  }
  return '';
};

// Function to get object position for each vehicle to center them properly
const getVehicleImagePosition = (vehicle: Vehicle): string => {
  const brand = vehicle.brand?.trim();
  const model = vehicle.model?.trim();
  const registration = vehicle.registration?.trim();
  
  // Mercedes Vito - perfect positioning (70%)
  if (brand === 'Mercedes' && model === 'Vito') {
    return 'center 70%';
  }
  
  // Neoplan A36 - gurnut prema dolje (35%)
  if (brand === 'Neoplan' && model === 'Cityliner' && registration === 'A36-E-349') {
    return 'center 35%';
  }
  
  // Neoplan T17 - gurnut prema dolje i zumiran (75%)
  if (brand === 'Neoplan' && model === 'Cityliner' && registration === 'T17-M-331') {
    return 'center 75%';
  }
  
  // Default center positioning
  return 'center 50%';
};

const LandingPage = () => {
  const { t, language, setLanguage } = useLanguage();
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
      // Static uploaded images
      const staticImages: GalleryImage[] = [
        { url: '/lovable-uploads/feb19f81-e937-43e1-b3f8-1b29065267b6.png', alt: 'Mercedes Sprinter - Drina Bus' },
        { url: '/lovable-uploads/d35b41af-f340-499b-926a-af278cefaf0e.png', alt: 'Neoplan Cityliner - Drina Bus' },
        { url: '/lovable-uploads/8bb9aa36-5a2f-42ad-a745-79b983ddcf2a.png', alt: 'Neoplan Cityliner - Drina Bus' },
        { url: '/lovable-uploads/6a6efc97-e912-4097-b4a0-48f7d46ec0d3.png', alt: 'Otokar Sultan - Drina Bus' },
        { url: '/lovable-uploads/5f35d25b-dac7-4c14-a056-aaa834f9d22f.png', alt: 'Mercedes Vito - Drina Bus' },
        { url: '/lovable-uploads/1bc6f777-073d-4e8d-be07-8473954f5e95.png', alt: 'Autobus - Drina Bus' },
        { url: '/lovable-uploads/mercedes-sprinter-1.jpeg', alt: 'Mercedes Sprinter - Drina Bus' },
        { url: '/lovable-uploads/neoplan-cityliner-1.JPG', alt: 'Neoplan Cityliner - Drina Bus' },
        { url: '/lovable-uploads/mercedes-vito-1.jpeg', alt: 'Mercedes Vito - Drina Bus' },
        { url: '/lovable-uploads/mercedes-sprinter-2.jpeg', alt: 'Mercedes Sprinter - Drina Bus' },
        { url: '/lovable-uploads/neoplan-cityliner-2.JPG', alt: 'Neoplan Cityliner - Drina Bus' },
      ];

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

      const allImages = [...staticImages, ...vehicleImages, ...galleryImages].filter(img => img.url);
      setGalleryImages(allImages);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    }
  };

  const getVehicleDescription = (brand: string, model: string) => {
    if (brand === 'Neoplan' && model === 'Cityliner') {
      return t('vehicle.neoplan');
    }
    if (brand === 'Mercedes' && model === 'Sprinter') {
      return t('vehicle.sprinter');
    }
    if (brand === 'Otokar' && model === 'Sultan') {
      return t('vehicle.sultan');
    }
    if (brand === 'Mercedes' && model === 'Vito') {
      return t('vehicle.vito');
    }
    return t('vehicle.default');
  };

  // Adjust vehicle capacity (reduce by 1)
  const getAdjustedCapacity = (seats: number) => Math.max(1, seats - 1);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer"
            >
              <img 
                src="/lovable-uploads/drina-bus-logo-transparent.png" 
                alt="Drina Bus Logo" 
                className="h-12 w-auto drop-shadow-lg hover:opacity-90 transition-opacity"
              />
            </a>
            <div className="flex items-center gap-8">
              <a 
                href="#fleet" 
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg"
              >
                {t('nav.fleet')}
              </a>
              <a 
                href="#about" 
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg"
              >
                {t('nav.about')}
              </a>
              <a 
                href="#gallery" 
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg"
              >
                {t('nav.gallery')}
              </a>
              <a 
                href="#contact" 
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg"
              >
                {t('nav.contact')}
              </a>
              <button
                onClick={() => setLanguage(language === 'sr' ? 'en' : 'sr')}
                className="flex items-center gap-2 text-white hover:text-green-400 font-medium transition-colors duration-200 border-l border-white/30 pl-6 drop-shadow-lg"
              >
                <span className="text-sm">{language === 'sr' ? 'EN' : 'BH'}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <WhatsAppButton />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${heroBackground})`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70" />
        
        <div className="relative z-10 text-center text-white max-w-5xl mx-auto px-6 py-20">
          
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-bold mb-8 leading-tight text-shadow-lg">
            {t('hero.title')}
          </h1>
          
          <p className="text-2xl md:text-3xl lg:text-4xl font-light mb-12 text-white/95">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a 
              href="#fleet" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              {t('hero.viewFleet')}
            </a>
            <a 
              href="#contact" 
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-2 border-white/50 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              {t('hero.contact')}
            </a>
          </div>
        </div>

      </section>

      {/* Services Section */}
      <section className="py-20 px-6 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-repeat" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('services.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('services.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                  <Route className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('services.regular.title')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('services.regular.desc')}
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('services.charter.title')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('services.charter.desc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Fleet Section */}
      <section id="fleet" className="py-20 px-6 bg-gray-50 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('fleet.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('fleet.subtitle')}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('fleet.loading')}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* First row - 3 cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {vehicles.slice(0, 3).map((vehicle) => {
                  const vehicleImage = getVehicleImageFromUploads(vehicle);
                  const imagePosition = getVehicleImagePosition(vehicle);
                  
                  return (
                    <Card 
                      key={vehicle.id} 
                      className="group hover:shadow-xl transition-all duration-300 overflow-hidden w-full shadow-sm border-2 hover:border-green-200 rounded-lg"
                    >
                      <div className="aspect-video bg-gray-100 overflow-hidden rounded-t-lg">
                        {vehicleImage ? (
                          <img 
                            src={vehicleImage}
                            alt={`${vehicle.brand} ${vehicle.model} - Drina Bus`}
                            className={`w-full h-full object-cover transition-transform duration-300 ${
                              vehicle.registration === 'T17-M-331' ? 'group-hover:scale-135' : 'group-hover:scale-110'
                            }`}
                            style={{ objectPosition: imagePosition }}
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
                                    <p class="text-sm opacity-80">${t('fleet.busImage')}</p>
                                  </div>
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="text-4xl mb-2">🚌</div>
                              <p className="text-sm opacity-80">{t('fleet.busImage')}</p>
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
                            {getAdjustedCapacity(vehicle.seats)} {t('fleet.seats')}
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
              
              {/* Second row - 2 cards centered */}
              {vehicles.length > 3 && (
                <div className="flex justify-center">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-2xl">
                    {vehicles.slice(3, 5).map((vehicle) => {
                      const vehicleImage = getVehicleImageFromUploads(vehicle);
                      const imagePosition = getVehicleImagePosition(vehicle);
                      
                      return (
                        <Card 
                          key={vehicle.id} 
                          className="group hover:shadow-xl transition-all duration-300 overflow-hidden w-full shadow-sm border-2 hover:border-green-200 rounded-lg"
                        >
                          <div className="aspect-video bg-gray-100 overflow-hidden rounded-t-lg">
                            {vehicleImage ? (
                              <img 
                                src={vehicleImage}
                                alt={`${vehicle.brand} ${vehicle.model} - Drina Bus`}
                                className={`w-full h-full object-cover transition-transform duration-300 ${
                                  vehicle.registration === 'T17-M-331' ? 'group-hover:scale-125' : 'group-hover:scale-110'
                                }`}
                                style={{ objectPosition: imagePosition }}
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
                                        <p class="text-sm opacity-80">${t('fleet.busImage')}</p>
                                      </div>
                                    </div>
                                  `;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                                <div className="text-white text-center">
                                  <div className="text-4xl mb-2">🚌</div>
                                  <p className="text-sm opacity-80">{t('fleet.busImage')}</p>
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
                                {getAdjustedCapacity(vehicle.seats)} {t('fleet.seats')}
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
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 px-6 bg-white scroll-mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            {t('about.title')}
          </h2>
          <div className="prose prose-lg mx-auto text-gray-600 leading-relaxed">
            <p className="text-lg mb-6">
              {t('about.text1')}
            </p>
            <p className="text-lg">
              {t('about.text2')}
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 px-6 bg-gray-50 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('gallery.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('gallery.subtitle')}
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
      <section id="contact" className="py-20 px-6 bg-green-900 text-white scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('contact.title')}
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('contact.location')}</h3>
              <p className="opacity-90">{t('contact.addressValue')}</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('contact.phone')}</h3>
              <p className="opacity-90">+387 62 888 702</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('contact.email')}</h3>
              <p className="opacity-90">drinabus@hotmail.com</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Instagram className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('contact.instagram')}</h3>
              <p className="opacity-90">@drinabus</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-green-950 text-white text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="opacity-80">
            © 2025 Drina Bus – {t('footer.rights')}
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