import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'sr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  sr: {
    // Navigation
    'nav.fleet': 'Vozni park',
    'nav.about': 'O nama',
    'nav.gallery': 'Galerija',
    'nav.contact': 'Kontakt',
    
    // Hero
    'hero.title': 'Siguran i udoban prevoz',
    'hero.subtitle': 'Povezujemo ljude – lokalno i međunarodno',
    'hero.viewFleet': 'Pogledaj vozni park',
    'hero.contact': 'Kontaktirajte nas',
    
    // Services
    'services.title': 'Naše usluge',
    'services.subtitle': 'Pružamo pouzdane usluge prevoza prilagođene vašim potrebama',
    'services.regular.title': 'Linijski prevoz',
    'services.regular.desc': 'Linijski prevoz putnika na lokalnim linijama. Pouzdane i redovne rute za svakodnevne potrebe naših putnika.',
    'services.charter.title': 'Vanlinijski prevoz',
    'services.charter.desc': 'Organizovani vanlinijski prevoz za ekskurzije, jednodnevne izlete, poslovna i turistička putovanja. Fleksibilni termini i destinacije.',
    
    // Fleet
    'fleet.title': 'Vozni park',
    'fleet.subtitle': 'Moderni i sigurni autobusi za sva vaša putovanja',
    'fleet.loading': 'Učitavanje voznog parka...',
    'fleet.seats': 'sjedišta',
    'fleet.busImage': 'Slika autobusa',
    
    // Vehicle descriptions
    'vehicle.neoplan': 'Luksuzni autobus za duga putovanja sa visokim komforom, klimatizovan i moderno opremljen.',
    'vehicle.sprinter': 'Kompaktni i udoban minibus, idealan za manje grupe i lokalni prevoz.',
    'vehicle.sultan': 'Pouzdan i komforan autobus za srednje grupe, klimatizovan sa modernim sadržajima.',
    'vehicle.vito': 'Kompaktni i praktičan van, idealan za manje grupe do 8 putnika.',
    'vehicle.default': 'Udoban, klimatizovan i moderno opremljen autobus za Vaša putovanja.',
    
    // Gallery
    'gallery.title': 'Galerija',
    'gallery.subtitle': 'Pogledajte naš vozni park i udobnost naših autobusa',
    'gallery.loading': 'Učitavanje galerije...',
    'gallery.noImages': 'Trenutno nema dostupnih slika.',
    
    // About
    'about.title': 'O nama',
    'about.text1': 'Drina Bus je porodična firma iz Ustikoline, specijalizovana za linijski i vanlinijski prevoz putnika. Naša misija je pružiti sigurno, udobno i pristupačno putovanje, bilo da se radi o svakodnevnim linijama ili posebnim putovanjima za grupe, ekskurzije i turiste.',
    'about.text2': 'Sa dugogodišnjim iskustvom, modernim voznim parkom i profesionalnim vozačima, Drina Bus je pouzdan partner na svakom putovanju.',
    
    // Contact
    'contact.title': 'Kontakt',
    'contact.subtitle': 'Kontaktirajte nas za sve informacije o našim uslugama',
    'contact.location': 'Lokacija',
    'contact.phone': 'Telefon',
    'contact.email': 'Email',
    'contact.instagram': 'Instagram',
    'contact.addressValue': 'Ustikolina, BiH',
    
    // Footer
    'footer.rights': 'Sva prava zadržana.',
  },
  en: {
    // Navigation
    'nav.fleet': 'Fleet',
    'nav.about': 'About',
    'nav.gallery': 'Gallery',
    'nav.contact': 'Contact',
    
    // Hero
    'hero.title': 'Safe and comfortable transport',
    'hero.subtitle': 'Connecting people – locally and internationally',
    'hero.viewFleet': 'View our fleet',
    'hero.contact': 'Contact us',
    
    // Services
    'services.title': 'Our services',
    'services.subtitle': 'We provide reliable transport services tailored to your needs',
    'services.regular.title': 'Regular transport',
    'services.regular.desc': 'Regular passenger transport on local routes. Reliable and regular routes for daily needs of our passengers.',
    'services.charter.title': 'Charter transport',
    'services.charter.desc': 'Organized charter transport for excursions, day trips, business and tourist travels. Flexible schedules and destinations.',
    
    // Fleet
    'fleet.title': 'Our Fleet',
    'fleet.subtitle': 'Modern and safe buses for all your journeys',
    'fleet.loading': 'Loading fleet...',
    'fleet.seats': 'seats',
    'fleet.busImage': 'Bus image',
    
    // Vehicle descriptions
    'vehicle.neoplan': 'Luxury bus for long journeys with high comfort, air-conditioned and modernly equipped.',
    'vehicle.sprinter': 'Compact and comfortable minibus, ideal for smaller groups and local transport.',
    'vehicle.sultan': 'Reliable and comfortable bus for medium groups, air-conditioned with modern amenities.',
    'vehicle.vito': 'Compact and practical van, ideal for smaller groups up to 8 passengers.',
    'vehicle.default': 'Comfortable, air-conditioned and modernly equipped bus for your travels.',
    
    // Gallery
    'gallery.title': 'Gallery',
    'gallery.subtitle': 'View our fleet and the comfort of our buses',
    'gallery.loading': 'Loading gallery...',
    'gallery.noImages': 'No images available at the moment.',
    
    // About
    'about.title': 'About us',
    'about.text1': 'Drina Bus is a family business from Ustikolina, specialized in regular and charter passenger transport. Our mission is to provide safe, comfortable and affordable travel, whether for daily routes or special trips for groups, excursions and tourists.',
    'about.text2': 'With years of experience, modern fleet and professional drivers, Drina Bus is a reliable partner on every journey.',
    
    // Contact
    'contact.title': 'Contact',
    'contact.subtitle': 'Contact us for all information about our services',
    'contact.location': 'Location',
    'contact.phone': 'Phone',
    'contact.email': 'Email',
    'contact.instagram': 'Instagram',
    'contact.addressValue': 'Ustikolina, BiH',
    
    // Footer
    'footer.rights': 'All rights reserved.',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('sr');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['sr']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
