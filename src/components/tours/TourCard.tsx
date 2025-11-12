import { MapPin, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface TourCardProps {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  destination: string;
  tourType: string;
  durationDays: number;
  price: number | null;
  coverImageUrl: string | null;
  maxPassengers: number | null;
  featured?: boolean;
}

export const TourCard = ({
  slug,
  title,
  shortDescription,
  destination,
  tourType,
  durationDays,
  price,
  coverImageUrl,
  maxPassengers,
  featured
}: TourCardProps) => {
  const { t } = useLanguage();

  const typeLabels: Record<string, string> = {
    jednodnevni: t('tours.oneDay'),
    vikend: t('tours.weekend'),
    vise_dana: t('tours.multiDay'),
    sezonski: t('tours.seasonal')
  };

  return (
    <Link 
      to={`/ponude/${slug}`}
      className="group block bg-card rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={coverImageUrl || '/placeholder.svg'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Type Badge */}
        <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
          {typeLabels[tourType]}
        </div>
        {featured && (
          <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
            ⭐ Top
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <MapPin className="w-4 h-4" />
          <span>{destination}</span>
        </div>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {shortDescription}
        </p>

        {/* Info Row */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{durationDays} {durationDays === 1 ? t('tours.day') : t('tours.days')}</span>
            </div>
            {maxPassengers && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{maxPassengers}</span>
              </div>
            )}
          </div>
          
          {price && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">{t('tours.from')}</div>
              <div className="text-2xl font-bold text-primary">{price.toFixed(0)} KM</div>
            </div>
          )}
        </div>

        {/* CTA */}
        <button className="mt-4 w-full bg-primary text-primary-foreground py-2 rounded-md font-semibold hover:bg-primary/90 transition-colors">
          {t('tours.learnMore')}
        </button>
      </div>
    </Link>
  );
};
