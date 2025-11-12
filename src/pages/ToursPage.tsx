import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TourCard } from '@/components/tours/TourCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Filter, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const { t } = useLanguage();
  const [tours, setTours] = useState<TourPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

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
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground py-20">
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
