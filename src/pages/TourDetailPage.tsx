import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, MapPin, Calendar, Users, Phone, Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';
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
  price_note: string | null;
  departure_city: string;
  max_passengers: number | null;
  included_services: string[] | null;
  not_included: string[] | null;
  cover_image_url: string | null;
}

export default function TourDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [tour, setTour] = useState<TourPackage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchTour();
    }
  }, [slug]);

  const fetchTour = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tour_packages')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'aktivan')
        .single();

      if (error) throw error;
      setTour(data);
    } catch (error) {
      console.error('Error fetching tour:', error);
      navigate('/ponude');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tour) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[400px] overflow-hidden">
        <img
          src={tour.cover_image_url || '/placeholder.svg'}
          alt={tour.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Back Button */}
        <Link
          to="/ponude"
          className="absolute top-8 left-8 bg-background/90 backdrop-blur-sm text-foreground px-4 py-2 rounded-full flex items-center gap-2 hover:bg-background transition-colors shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('tours.backToTours')}</span>
        </Link>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Destination */}
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4">{tour.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5" />
                <span className="text-lg">{tour.destination}</span>
              </div>
            </div>

            {/* Short Description */}
            <p className="text-xl text-muted-foreground">{tour.short_description}</p>

            {/* Full Description */}
            {tour.full_description && (
              <div className="prose prose-lg max-w-none">
                <p className="text-foreground leading-relaxed whitespace-pre-line">
                  {tour.full_description}
                </p>
              </div>
            )}

            {/* Included Services */}
            {tour.included_services && tour.included_services.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  {t('tours.included')}
                </h3>
                <ul className="space-y-2">
                  {tour.included_services.map((service, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Not Included */}
            {tour.not_included && tour.not_included.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                  {t('tours.notIncluded')}
                </h3>
                <ul className="space-y-2">
                  {tour.not_included.map((service, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <XCircle className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column - Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-card border border-border rounded-lg p-6 shadow-lg space-y-6">
              {/* Price */}
              {tour.price && (
                <div className="text-center pb-6 border-b border-border">
                  <div className="text-sm text-muted-foreground mb-1">{t('tours.from')}</div>
                  <div className="text-4xl font-bold text-primary">{tour.price.toFixed(0)} KM</div>
                  {tour.price_note && (
                    <div className="text-xs text-muted-foreground mt-2">{tour.price_note}</div>
                  )}
                </div>
              )}

              {/* Quick Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t('tours.travelDate')}</div>
                    <div className="font-semibold text-foreground">
                      {format(new Date(tour.available_from), 'd. MMMM yyyy.', { locale: bs })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t('tours.departureCity')}</div>
                    <div className="font-semibold text-foreground">{tour.departure_city}</div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3 pt-6 border-t border-border">
                <a
                  href={`https://wa.me/38765400789?text=${encodeURIComponent(`Poštovani, zanima me ponuda: ${tour.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white py-3 rounded-md font-semibold transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </a>
                
                <a
                  href="tel:+38765400789"
                  className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-3 rounded-md font-semibold hover:bg-secondary/90 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {t('cta.phone')}
                </a>

                <a
                  href="mailto:info@drinabus.com"
                  className="w-full flex items-center justify-center gap-2 border border-border text-foreground py-3 rounded-md font-semibold hover:bg-accent transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {t('cta.email')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
