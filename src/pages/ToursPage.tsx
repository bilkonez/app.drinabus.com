import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TourCard } from '@/components/tours/TourCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Filter, Loader2, Menu, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import drinaLogo from '@/assets/drina-bus-logo-new.png';

interface TourPackage {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  destination: string;
  tour_type: string;
  duration_days: number;
  price: number | null;
  cover_image_url: string | null;
  max_passengers: number | null;
  featured: boolean;
}

export default function ToursPage() {
  const { t, language, setLanguage } = useLanguage();
  const [tours, setTours] = useState<TourPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tour_packages')
        .select('*')
        .eq('status', 'aktivan')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTours(data || []);
    } catch (error) {
      console.error('Error fetching tours:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTours = tours.filter(tour => {
    if (filterType === 'all') return true;
    return tour.tour_type === filterType;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-gradient-to-r from-green-900/95 via-green-800/95 to-green-900/95 shadow-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img 
                src={drinaLogo} 
                alt="Drina Bus Logo" 
                className="h-12 w-auto drop-shadow-xl"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              <Link 
                to="/#services" 
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg"
              >
                {t('nav.services')}
              </Link>
              <Link 
                to="/#fleet" 
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg"
              >
                {t('nav.fleet')}
              </Link>
              <Link 
                to="/#about" 
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg"
              >
                {t('nav.about')}
              </Link>
              <Link 
                to="/#gallery" 
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg"
              >
                {t('nav.gallery')}
              </Link>
              <Link 
                to="/#faq" 
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg"
              >
                {t('nav.faq')}
              </Link>
              <Link 
                to="/#contact" 
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg"
              >
                {t('nav.contact')}
              </Link>
              <Link 
                to="/ponude" 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                {t('nav.tours')}
              </Link>
              <Link 
                to="/#cta" 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                {t('nav.booking')}
              </Link>
              <button
                onClick={() => setLanguage(language === 'sr' ? 'en' : 'sr')}
                className="flex items-center gap-2 text-white hover:text-green-400 font-medium transition-colors duration-200 border-l border-white/30 pl-6 drop-shadow-lg"
              >
                <span className="text-sm">{language === 'sr' ? 'EN' : 'BH'}</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-4">
              <button
                onClick={() => setLanguage(language === 'sr' ? 'en' : 'sr')}
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg"
              >
                <span className="text-sm">{language === 'sr' ? 'EN' : 'BH'}</span>
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-green-400 transition-colors duration-200"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 flex flex-col gap-4 animate-fade-in">
              <Link 
                to="/#services" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg py-2"
              >
                {t('nav.services')}
              </Link>
              <Link 
                to="/#fleet" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg py-2"
              >
                {t('nav.fleet')}
              </Link>
              <Link 
                to="/#about" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg py-2"
              >
                {t('nav.about')}
              </Link>
              <Link 
                to="/#gallery" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg py-2"
              >
                {t('nav.gallery')}
              </Link>
              <Link 
                to="/#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg py-2"
              >
                {t('nav.faq')}
              </Link>
              <Link 
                to="/#contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:text-green-400 font-medium transition-colors duration-200 drop-shadow-lg py-2"
              >
                {t('nav.contact')}
              </Link>
              <Link 
                to="/ponude" 
                onClick={() => setMobileMenuOpen(false)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg text-center"
              >
                {t('nav.tours')}
              </Link>
              <Link 
                to="/#cta" 
                onClick={() => setMobileMenuOpen(false)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg text-center"
              >
                {t('nav.booking')}
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground py-32 mt-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
            {t('tours.title')}
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            {t('tours.subtitle')}
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="bg-card border-b border-border py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="w-5 h-5" />
              <span className="font-semibold">{t('tours.filter')}</span>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('tours.allTypes')}</SelectItem>
                <SelectItem value="jednodnevni">{t('tours.oneDay')}</SelectItem>
                <SelectItem value="vikend">{t('tours.weekend')}</SelectItem>
                <SelectItem value="vise_dana">{t('tours.multiDay')}</SelectItem>
                <SelectItem value="sezonski">{t('tours.seasonal')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Tours Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredTours.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">{t('tours.noResults')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTours.map((tour) => (
                <TourCard
                  key={tour.id}
                  id={tour.id}
                  slug={tour.slug}
                  title={tour.title}
                  shortDescription={tour.short_description}
                  destination={tour.destination}
                  tourType={tour.tour_type}
                  durationDays={tour.duration_days}
                  price={tour.price}
                  coverImageUrl={tour.cover_image_url}
                  maxPassengers={tour.max_passengers}
                  featured={tour.featured}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
