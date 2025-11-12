import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Loader2, ChevronLeft, ChevronRight, MapPin, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';

interface TourPackage {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string | null;
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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    fetchFeaturedTours();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const fetchFeaturedTours = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tour_packages')
        .select('*')
        .eq('status', 'aktivan')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTours(data || []);
    } catch (error) {
      console.error('Error fetching featured tours:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const typeLabels: Record<string, string> = {
    jednodnevni: t('tours.oneDay'),
    vikend: t('tours.weekend'),
    vise_dana: t('tours.multiDay'),
    sezonski: t('tours.seasonal')
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
    <section className="py-20 px-6 bg-gradient-to-br from-background to-secondary/10 relative">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t('tours.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('tours.subtitle')}
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Embla Viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {tours.map((tour) => (
                <div key={tour.id} className="flex-[0_0_100%] min-w-0 px-4">
                  {/* Large Tour Card */}
                  <div className="max-w-5xl mx-auto bg-card rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500">
                    <div className="grid md:grid-cols-2 gap-0">
                      {/* Image Section */}
                      <div className="relative aspect-[4/3] md:aspect-auto overflow-hidden">
                        <img
                          src={tour.cover_image_url || '/placeholder.svg'}
                          alt={tour.title}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                        />
                        {/* Type Badge */}
                        <div className="absolute top-6 left-6 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                          {typeLabels[tour.tour_type] || tour.tour_type}
                        </div>
                        {/* Featured Badge */}
                        <div className="absolute top-6 right-6 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                          ⭐ Top ponuda
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-8 md:p-10 flex flex-col justify-between">
                        <div>
                          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                            {tour.title}
                          </h3>
                          
                          <div className="flex items-center gap-2 text-muted-foreground mb-6">
                            <MapPin className="w-5 h-5 text-primary" />
                            <span className="text-lg">{tour.destination}</span>
                          </div>

                          <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                            {tour.short_description}
                          </p>

                          {tour.full_description && (
                            <p className="text-muted-foreground mb-8 leading-relaxed line-clamp-3">
                              {tour.full_description}
                            </p>
                          )}
                        </div>

                        {/* Info & CTA */}
                        <div>
                          <div className="flex items-center gap-6 mb-6 pb-6 border-t border-border pt-6">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-primary" />
                              <span className="font-semibold">{tour.duration_days} {tour.duration_days === 1 ? t('tours.day') : t('tours.days')}</span>
                            </div>
                            {tour.max_passengers && (
                              <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                <span className="font-semibold">{tour.max_passengers}</span>
                              </div>
                            )}
                            {tour.price && (
                              <div className="ml-auto">
                                <div className="text-sm text-muted-foreground">{t('tours.from')}</div>
                                <div className="text-3xl font-bold text-primary">{tour.price.toFixed(0)} KM</div>
                              </div>
                            )}
                          </div>

                          <Link
                            to={`/ponude/${tour.slug}`}
                            className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg font-bold text-lg hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                          >
                            {t('tours.learnMore')}
                            <ArrowRight className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          {tours.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm hover:bg-background text-foreground p-3 md:p-4 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 border border-border"
                aria-label="Previous tour"
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm hover:bg-background text-foreground p-3 md:p-4 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 border border-border"
                aria-label="Next tour"
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {tours.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {tours.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === selectedIndex 
                      ? 'bg-primary w-8' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to tour ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <Link
            to="/ponude"
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-8 py-4 rounded-full font-semibold text-lg hover:bg-secondary/90 transition-all transform hover:scale-105 shadow-lg"
          >
            {t('tours.allTours')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
