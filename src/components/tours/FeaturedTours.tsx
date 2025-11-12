import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TourCard } from './TourCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export const FeaturedTours = () => {
  const { t } = useLanguage();
  const [tours, setTours] = useState<TourPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedTours();
  }, []);

  const fetchFeaturedTours = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tour_packages')
        .select('*')
        .eq('status', 'aktivan')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      setTours(data || []);
    } catch (error) {
      console.error('Error fetching featured tours:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 px-6 bg-gradient-to-br from-background to-secondary/10">
        <div className="container mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (tours.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-6 bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            {t('tours.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('tours.subtitle')}
          </p>
        </div>

        {/* Tours Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
          {tours.map((tour) => (
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

        {/* View All Button */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <Link
            to="/ponude"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg"
          >
            {t('tours.allTours')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
