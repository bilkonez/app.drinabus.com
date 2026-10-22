import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Mail, Instagram, MapPin, Users, Route, Calendar, X, GraduationCap, Compass, Briefcase, Plane, HeartHandshake, Globe, Menu, MessageCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import heroBackground from '@/assets/hero-river-bus.jpg';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { FeaturedTours } from '@/components/tours/FeaturedTours';
import manLionCoachImage from '@/assets/man-lions-coach-new.jpg.asset.json';

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

  if (brand === 'MAN' && model === 'Lion Coach') {
    return `https://drinabus.lovable.app${manLionCoachImage.url}`;
  }
  
  if (brand === 'Mercedes' && model === 'Sprinter') {
    return '/lovable-uploads/feb19f81-e937-43e1-b3f8-1b29065267b6.png';
  }
  if (brand === 'Neoplan' && model === 'Cityliner') {
    if (registration === 'A36-E-349' || registration === 'A36-O-419') {
      return '/lovable-uploads/d35b41af-f340-499b-926a-af278cefaf0e.png';
    }
    if (registration === 'T17-M-331') {
      return '/lovable-uploads/neoplan-cityliner-t17.jpg';
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

  if (brand === 'MAN' && model === 'Lion Coach') {
    return 'center 58%';
  }
  
  // Mercedes Vito - perfect positioning (70%)
  if (brand === 'Mercedes' && model === 'Vito') {
    return 'center 70%';
  }
  
  // Neoplan A36 - gurnut prema dolje (55%)
  if (brand === 'Neoplan' && model === 'Cityliner' && (registration === 'A36-E-349' || registration === 'A36-O-419')) {
    return 'center 55%';
  }
  
  // Neoplan T17 - pomaknut udesno i zumiran
  if (brand === 'Neoplan' && model === 'Cityliner' && registration === 'T17-M-331') {
    return '55% center';
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
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchGalleryImages();
    
    // Parallax scroll effect
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Handle hash navigation on page load
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, brand, model, registration, seats, is_operational')
        .eq('status', 'dostupno')
        .eq('is_operational', true) // Only show operational vehicles
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fixed display order: MAN Lion Coach, Neoplan Cityliner, Otokar Sultan, Mercedes Sprinter, Mercedes Vito
      const orderMap: Record<string, number> = {
        'MAN|Lion Coach': 0,
        'Neoplan|Cityliner': 1,
        'Otokar|Sultan': 2,
        'Mercedes|Sprinter': 3,
        'Mercedes|Vito': 4,
      };
      const sorted = (data || []).sort((a, b) => {
        const ka = orderMap[`${a.brand?.trim()}|${a.model?.trim()}`] ?? 99;
        const kb = orderMap[`${b.brand?.trim()}|${b.model?.trim()}`] ?? 99;
        return ka - kb;
      });
      setVehicles(sorted);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGalleryImages = async () => {
    try {
      // Static uploaded images - show immediately
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
        { url: '/lovable-uploads/sprinter-mountain.jpg', alt: 'Mercedes Sprinter na planini - Drina Bus' },
      ];

      // Set static images immediately
      setGalleryImages(staticImages);

      // Fetch storage images in background (no need to wait)
      Promise.all([
        supabase.storage.from('media').list('vehicles', { limit: 100 }),
        supabase.storage.from('media').list('gallery', { limit: 500 })
      ]).then(([vehiclesRes, galleryRes]) => {
        const vehicleImages = (vehiclesRes.data || [])
          .filter(file => file.name.match(/\.(jpg|jpeg|png|webp)$/i))
          .map(file => ({
            url: supabase.storage.from('media').getPublicUrl(`vehicles/${file.name}`).data.publicUrl,
            alt: `Drina Bus - ${file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}`
          }));

        const galleryImagesFromStorage = (galleryRes.data || [])
          .filter(file => file.name.match(/\.(jpg|jpeg|png|webp)$/i))
          .map(file => ({
            url: supabase.storage.from('media').getPublicUrl(`gallery/${file.name}`).data.publicUrl,
            alt: `Drina Bus - ${file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}`
          }));

        const allImages = [...staticImages, ...vehicleImages, ...galleryImagesFromStorage].filter(img => img.url);
        if (allImages.length > staticImages.length) {
          setGalleryImages(allImages);
        }
      }).catch(() => {
        // Ignore errors, keep static images
      });
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    }
  };

  const getVehicleDescription = (brand: string, model: string) => {
    if (brand === 'MAN' && model === 'Lion Coach') {
      return t('vehicle.default');
    }
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
  const getAdjustedCapacity = (vehicle: Vehicle) => {
    if (vehicle.brand?.trim() === 'MAN' && vehicle.model?.trim() === 'Lion Coach') {
      return vehicle.seats;
    }
    return Math.max(1, vehicle.seats - 1);
  };

  const shouldShowRegistration = (vehicle: Vehicle) => (
    vehicle.registration && vehicle.registration !== 'REGISTRACIJA-NAKNADNO' && vehicle.registration !== vehicle.model
  );

  const services = [
    { icon: Route, key: 'regular' },
    { icon: GraduationCap, key: 'excursions' },
    { icon: Compass, key: 'dayTrips' },
    { icon: Briefcase, key: 'corporate' },
    { icon: Globe, key: 'international' },
    { icon: Plane, key: 'airport' },
  ];
  const navLink = "text-[13px] text-foreground/80 hover:text-foreground transition-colors";
  const navPill = "text-[13px] bg-primary text-primary-foreground px-4 py-1.5 rounded-full font-medium hover:bg-primary-glow transition-colors";

  const renderVehicle = (vehicle: Vehicle) => {
    const vehicleImage = getVehicleImageFromUploads(vehicle);
    const imagePosition = getVehicleImagePosition(vehicle);
    return (
      <div key={vehicle.id} className="group rounded-[28px] bg-card overflow-hidden transition-shadow duration-500 hover:shadow-elegant">
        <div className="aspect-[4/3] bg-secondary overflow-hidden">
          {vehicleImage ? (
            <img
              src={vehicleImage}
              alt={`${vehicle.brand} ${vehicle.model} - Drina Bus`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              style={{ objectPosition: imagePosition }}
              loading="lazy"
              width="400"
              height="300"
              onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">{t('fleet.busImage')}</div>
          )}
        </div>
        <div className="p-7">
          <p className="text-xs font-medium uppercase tracking-widest text-primary mb-2">
            {getAdjustedCapacity(vehicle)} {t('fleet.seats')}
          </p>
          <h3 className="text-2xl font-semibold text-foreground">{vehicle.brand} {vehicle.model}</h3>
          {shouldShowRegistration(vehicle) && (
            <p className="text-sm text-muted-foreground mt-1">{vehicle.registration}</p>
          )}
          <p className="text-muted-foreground text-[15px] leading-relaxed mt-3">
            {getVehicleDescription(vehicle.brand, vehicle.model)}
          </p>
        </div>
      </div>
    );
  };

  const SectionHead = ({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) => (
    <div className="text-center mb-14 md:mb-20">
      {eyebrow && <p className="text-primary font-medium mb-3">{eyebrow}</p>}
      <h2 className="text-4xl md:text-6xl font-semibold text-foreground tracking-tight">{title}</h2>
      {subtitle && <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto mt-4 leading-snug">{subtitle}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/75 backdrop-blur-xl backdrop-saturate-150 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <img src="/lovable-uploads/drina-bus-logo-transparent.png" alt="Drina Bus Logo" className="h-8 w-auto" />
          </a>
          <div className="hidden lg:flex items-center gap-7">
            <a href="#fleet" className={navLink}>{t('nav.fleet')}</a>
            <a href="#about" className={navLink}>{t('nav.about')}</a>
            <a href="#gallery" className={navLink}>{t('nav.gallery')}</a>
            <a href="#faq" className={navLink}>{t('nav.faq')}</a>
            <a href="/ponude" className={navPill}>{t('nav.tours')}</a>
            <a href="#cta" className={navPill}>{t('nav.booking')}</a>
            <button onClick={() => setLanguage(language === 'sr' ? 'en' : 'sr')} className={navLink}>
              {language === 'sr' ? 'EN' : 'BH'}
            </button>
          </div>
          <div className="lg:hidden flex items-center gap-4">
            <button onClick={() => setLanguage(language === 'sr' ? 'en' : 'sr')} className={navLink}>
              {language === 'sr' ? 'EN' : 'BH'}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-foreground" aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden px-6 pb-6 pt-2 flex flex-col animate-fade-in bg-background/95">
            {[['#fleet', 'nav.fleet'], ['#about', 'nav.about'], ['#gallery', 'nav.gallery'], ['#faq', 'nav.faq']].map(([href, key]) => (
              <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="text-2xl font-semibold text-foreground py-3 border-b border-border/60">
                {t(key)}
              </a>
            ))}
            <div className="flex gap-3 mt-5">
              <a href="/ponude" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center bg-primary text-primary-foreground py-3 rounded-full font-medium">{t('nav.tours')}</a>
              <a href="#cta" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center bg-secondary text-foreground py-3 rounded-full font-medium">{t('nav.booking')}</a>
            </div>
          </div>
        )}
      </nav>

      <WhatsAppButton />

      {/* Hero */}
      <section className="pt-32 md:pt-40 pb-12 px-6 bg-background">
        <div className="max-w-5xl mx-auto text-center animate-fade-in">
          <img src="/lovable-uploads/drina-bus-logo-transparent.png" alt="Drina Bus" className="h-14 md:h-20 w-auto mx-auto mb-8" />
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter text-foreground leading-[1.02]">
            {t('hero.title')}
          </h1>
          <p className="text-xl md:text-3xl text-muted-foreground mt-6 max-w-3xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <a href="#fleet" className="bg-primary text-primary-foreground px-7 py-3 rounded-full text-[17px] font-medium hover:bg-primary-glow transition-colors">
              {t('hero.viewFleet')}
            </a>
            <a href="/ponude" className="text-primary px-7 py-3 rounded-full text-[17px] font-medium ring-1 ring-primary hover:bg-primary hover:text-primary-foreground transition-colors">
              {t('hero.viewTours')} ›
            </a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-16 md:mt-20">
          <div className="rounded-[32px] overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-secondary">
            <img
              src="/lovable-uploads/1bc6f777-073d-4e8d-be07-8473954f5e95.png"
              alt="Drina Bus Fleet"
              className="w-full h-full object-cover"
              style={{ transform: `scale(${1 + Math.min(scrollY, 600) / 6000})` }}
            />
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 md:py-32 px-6 bg-secondary scroll-mt-14">
        <div className="max-w-6xl mx-auto">
          <SectionHead title={t('detailedServices.title')} subtitle={t('detailedServices.subtitle')} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map(({ icon: Icon, key }) => (
              <div key={key} className="bg-card rounded-[28px] p-8 md:p-10 transition-transform duration-500 hover:scale-[1.015]">
                <Icon className="h-9 w-9 text-primary mb-8" strokeWidth={1.5} />
                <h3 className="text-2xl font-semibold text-foreground mb-3">{t(`detailedServices.${key}.title`)}</h3>
                <p className="text-muted-foreground text-[15px] leading-relaxed">{t(`detailedServices.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FeaturedTours />

      {/* Fleet */}
      <section id="fleet" className="py-24 md:py-32 px-6 bg-secondary scroll-mt-14">
        <div className="max-w-6xl mx-auto">
          <SectionHead title={t('fleet.title')} subtitle={t('fleet.subtitle')} />
          {loading ? (
            <p className="text-center text-muted-foreground py-12">{t('fleet.loading')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {vehicles.map(renderVehicle)}
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 md:py-32 px-6 bg-background scroll-mt-14">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground mb-10">{t('about.title')}</h2>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-6">{t('about.text1')}</p>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">{t('about.text2')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-20">
            {[['15+', 'about.stats.experience'], ['2000+', 'about.stats.trips'], ['30+', 'about.stats.clients']].map(([n, k]) => (
              <div key={k}>
                <div className="text-6xl md:text-7xl font-semibold tracking-tighter text-foreground">{n}</div>
                <div className="text-muted-foreground mt-2">{t(k)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="py-24 md:py-32 px-6 bg-secondary scroll-mt-14">
        <div className="max-w-6xl mx-auto">
          <SectionHead title={t('gallery.title')} subtitle={t('gallery.subtitle')} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {galleryImages.map((image, index) => (
              <button
                key={index}
                className="aspect-square rounded-3xl overflow-hidden bg-card group"
                onClick={() => setSelectedImage(image.url)}
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  loading="lazy"
                  width="300"
                  height="300"
                  onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 md:py-32 px-6 bg-background scroll-mt-14">
        <div className="max-w-3xl mx-auto">
          <SectionHead title={t('faq.title')} subtitle={t('faq.subtitle')} />
          <Accordion type="single" collapsible className="border-t border-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b border-border">
                <AccordionTrigger className="text-left text-lg md:text-xl font-semibold text-foreground py-6 hover:no-underline">
                  {t(`faq.q${i}`)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  {t(`faq.a${i}`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="px-4 md:px-6 pb-6 bg-background scroll-mt-14">
        <div className="max-w-6xl mx-auto rounded-[36px] bg-foreground text-background py-20 md:py-28 px-6 text-center">
          <p className="text-primary-glow font-medium mb-4">✓ 15+ {t('cta.years')} · {t('cta.trusted')}</p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight">{t('cta.title')}</h2>
          <p className="text-lg md:text-2xl text-background/70 max-w-2xl mx-auto mt-5">{t('cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-12">
            <a href="tel:+38762888702" className="flex items-center gap-2 bg-background text-foreground px-7 py-3.5 rounded-full text-[17px] font-medium hover:opacity-90 transition-opacity min-w-[190px] justify-center">
              <Phone className="h-4 w-4" />{t('cta.callNow')}
            </a>
            <a
              href="https://wa.me/38762888702?text=Zdravo,%20želim%20da%20se%20informišem%20o%20vašim%20uslugama%20prevoza."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full text-[17px] font-medium hover:bg-primary-glow transition-colors min-w-[190px] justify-center"
            >
              <MessageCircle className="h-4 w-4" />WhatsApp
            </a>
            <a href="mailto:drinabus@hotmail.com" className="flex items-center gap-2 ring-1 ring-background/30 text-background px-7 py-3.5 rounded-full text-[17px] font-medium hover:bg-background/10 transition-colors min-w-[190px] justify-center">
              <Mail className="h-4 w-4" />{t('cta.email')}
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-6 bg-background scroll-mt-14">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground text-center">{t('contact.title')}</h2>
          <p className="text-lg text-muted-foreground text-center mt-3 mb-12">{t('contact.subtitle')}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              [MapPin, 'contact.location', t('contact.addressValue')],
              [Phone, 'contact.phone', '+387 62 888 702'],
              [Mail, 'contact.email', 'drinabus@hotmail.com'],
              [Instagram, 'contact.instagram', '@drinabus'],
            ].map(([Icon, k, v]: any) => (
              <div key={k} className="bg-secondary rounded-3xl p-6 md:p-8">
                <Icon className="h-6 w-6 text-primary mb-6" strokeWidth={1.5} />
                <p className="text-sm text-muted-foreground">{t(k)}</p>
                <p className="text-foreground font-medium mt-1 break-words">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 bg-secondary border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <img src="/lovable-uploads/drina-bus-logo-transparent.png" alt="Drina Bus" className="h-6 w-auto" />
          <p>© 2026 Drina Bus – {t('footer.rights')}</p>
        </div>
      </footer>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden rounded-3xl">
          {selectedImage && (
            <img src={selectedImage} alt="Drina Bus galerija" className="w-full h-auto max-h-[85vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;