import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Loader2, ChevronLeft, ChevronRight, MapPin, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { format } from 'date-fns';
import { bs } from 'date-fns/locale';

interface TourPackage {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string | null;
  destination: string;
  tour_type: string;
  duration_days: number;
  available_from: string;
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
    <section className="py-24 md:py-32 px-4 md:px-6 bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
      </div>

      <div className="container mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-4">
            <span>🌍</span>
            <span>{t('tours.featured')}</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-semibold text-foreground mb-4 md:mb-5 tracking-tight">
            {t('tours.title')}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4 leading-relaxed">
            {t('tours.subtitle')}
          </p>
          <div className="mt-6 flex justify-center">
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Embla Viewport */}
          <div className="overflow-hidden pb-6" ref={emblaRef}>
            <div className="flex">
              {tours.map((tour) => (
                <div key={tour.id} className="flex-[0_0_100%] min-w-0 px-2 md:px-4 pb-4">
                  {/* Tour Card with fixed height like Zagreb card */}
                  <div className="max-w-3xl mx-auto bg-secondary rounded-[32px] overflow-hidden transition-all duration-500 flex flex-col relative z-10">
                    {/* Image Section - fixed height to ensure content below is visible */}
                    <div className="relative h-56 md:h-80 overflow-hidden flex-shrink-0">
                      <img
                        src={tour.cover_image_url || '/placeholder.svg'}
                        alt={tour.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      {/* Type Badge */}
                      <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-primary/95 backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold shadow-lg">
                        {typeLabels[tour.tour_type]}
                      </div>
                      {/* Featured Badge */}
                      <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-accent/95 backdrop-blur-sm text-accent-foreground px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold shadow-lg flex items-center gap-1.5">
                        <span className="text-yellow-400">⭐</span>
                        <span className="hidden sm:inline">{t('tours.featured')}</span>
                        <span className="sm:hidden">Top</span>
                      </div>
                    </div>

                    {/* Content Section - all info below image */}
                    <div className="p-7 md:p-10 flex flex-col flex-1">
                      {/* Title and Description */}
                      <div className="mb-4 flex-shrink-0">
                        <h3 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {tour.title}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm md:text-base truncate">{tour.destination}</span>
                        </div>

                        <p className="text-muted-foreground text-sm md:text-base leading-relaxed line-clamp-2">
                          {tour.short_description}
                        </p>
                      </div>

                      {/* Info Grid - Date and Price */}
                      <div className="grid grid-cols-2 gap-3 mb-4 flex-shrink-0">
                        {/* Date */}
                        <div className="flex items-center gap-2 p-4 bg-card rounded-2xl">
                          <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs text-muted-foreground">{t('tours.startDate')}</div>
                            <div className="text-sm font-semibold truncate">{format(new Date(tour.available_from), 'd. MMM', { locale: bs })}</div>
                          </div>
                        </div>

                        {/* Price */}
                        {tour.price && (
                          <div className="flex items-center gap-2 p-4 bg-card rounded-2xl">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-muted-foreground">{t('tours.from')}</div>
                              <div className="text-lg md:text-xl font-bold text-primary truncate">{tour.price.toFixed(0)} KM</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CTA Button - pushed to bottom */}
                      <Link 
                        to={`/ponude/${tour.slug}`}
                        className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 px-6 rounded-full font-medium text-base hover:bg-primary-glow transition-all duration-300 hover:gap-3 group/btn mt-auto"
                      >
                        <span>{t('tours.learnMore')}</span>
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
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
                className="absolute left-1 md:left-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background text-foreground p-2 md:p-3 rounded-full shadow-elegant transition-all duration-300 z-10"
                aria-label="Previous tour"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-1 md:right-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background text-foreground p-2 md:p-3 rounded-full shadow-elegant transition-all duration-300 z-10"
                aria-label="Next tour"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </>
          )}
        </div>

        {/* Dots Navigation */}
        {tours.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {tours.map((_, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === selectedIndex 
                    ? 'bg-primary w-6 md:w-8' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2'
                }`}
                aria-label={`Go to tour ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-8 md:mt-12">
          <Link
            to="/ponude"
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 md:px-8 py-3 md:py-4 rounded-full font-medium text-sm md:text-base transition-all duration-300 hover:gap-3"
          >
            <span>{t('tours.viewAll')}</span>
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
