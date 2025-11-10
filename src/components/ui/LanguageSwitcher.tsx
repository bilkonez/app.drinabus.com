import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-6 right-6 z-50">
      <Button
        onClick={() => setLanguage(language === 'sr' ? 'en' : 'sr')}
        variant="outline"
        size="sm"
        className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg gap-2"
      >
        <Globe className="h-4 w-4" />
        <span className="font-semibold">{language === 'sr' ? 'EN' : 'SR'}</span>
      </Button>
    </div>
  );
};

export default LanguageSwitcher;
