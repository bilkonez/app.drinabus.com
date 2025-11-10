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
    'nav.services': 'Usluge',
    'nav.fleet': 'Vozni park',
    'nav.about': 'O nama',
    'nav.gallery': 'Galerija',
    'nav.faq': 'FAQ',
    'nav.contact': 'Kontakt',
    
    // Hero
    'hero.title': 'Siguran i udoban prevoz',
    'hero.subtitle': 'Povezujemo ljude – lokalno i međunarodno',
    'hero.viewFleet': 'Pogledaj vozni park',
    'hero.contact': 'Kontaktirajte nas',
    
    // Detailed Services
    'detailedServices.title': 'Naše usluge',
    'detailedServices.subtitle': 'Pružamo širok spektar usluga prevoza prilagođenih vašim potrebama',
    'detailedServices.regular.title': 'Linijski prevoz',
    'detailedServices.regular.desc': 'Linijski prevoz putnika na lokalnim linijama. Pouzdane i redovne rute za svakodnevne potrebe naših putnika.',
    'detailedServices.excursions.title': 'Školske ekskurzije',
    'detailedServices.excursions.desc': 'Organizujemo školske ekskurzije sa licenciranim vozačima i modernim autobusima. Sigurnost i udobnost vaše djece su naš prioritet.',
    'detailedServices.dayTrips.title': 'Jednodnevni izleti',
    'detailedServices.dayTrips.desc': 'Savršeno za grupne izlete, team building događaje ili turistička obilaženja. Fleksibilne rute prema vašim željama.',
    'detailedServices.corporate.title': 'Korporativni prevoz',
    'detailedServices.corporate.desc': 'Profesionalan prevoz za vaše zaposlene, klijente ili događaje. Redovni ili povremeni aranžmani prema potrebi.',
    'detailedServices.international.title': 'Međunarodni charter',
    'detailedServices.international.desc': 'Prevoz do Hrvatske, Srbije, Slovenije, Crne Gore, Albanije, Makedonije i drugih evropskih destinacija. Iskusni vozači i komforni autobusi.',
    'detailedServices.airport.title': 'Airport transfer',
    'detailedServices.airport.desc': 'Pouzdan transfer do/sa aerodroma. Dostupni 24/7 sa praćenjem leta i prilagođenim rasporedom.',
    
    // FAQ
    'faq.title': 'Najčešća pitanja',
    'faq.subtitle': 'Odgovori na pitanja koja nam najčešće postavljaju',
    'faq.q1': 'Kako mogu rezervisati prevoz?',
    'faq.a1': 'Rezervacije možete izvršiti telefonskim putem na +387 62 888 702 ili putem email-a na drinabus@hotmail.com. Preporučujemo rezervaciju najmanje 7 dana unaprijed za najbolju dostupnost.',
    'faq.q2': 'Koji su načini plaćanja?',
    'faq.a2': 'Prihvatamo gotovinsko plaćanje i bankarske transfere. Za dugoročne aranžmane nudimo posebne uslove plaćanja.',
    'faq.q3': 'Da li su svi autobusi klimatizovani?',
    'faq.a3': 'Da, svi naši autobusi su moderno opremljeni sa klimatizacijom, udobnim sjedištima i prostorom za prtljag. Veći autobusi također imaju toalet.',
    'faq.q4': 'Da li mogu otkazati rezervaciju?',
    'faq.a4': 'Otkazivanje rezervacije je besplatno u dogovoru sa nama.',
    'faq.q5': 'Da li nudite usluge za međunarodni prevoz?',
    'faq.a5': 'Da, nudimo prevoz do većine balkanskih i evropskih destinacija uključujući Hrvatsku, Srbiju, Sloveniju, Crnu Goru, Albaniju, Makedoniju i druge zemlje. Imamo iskusne vozače sa svim potrebnim dozvolama.',
    
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
    'vehicle.default': 'Udoban, klimatizovan i moderno opremljen autobus za vaša putovanja.',
    
    // Gallery
    'gallery.title': 'Galerija',
    'gallery.subtitle': 'Pogledajte naš vozni park i udobnost naših autobusa',
    'gallery.loading': 'Učitavanje galerije...',
    'gallery.noImages': 'Trenutno nema dostupnih slika.',
    
    // About
    'about.title': 'O nama',
    'about.text1': 'Drina Bus je porodična firma iz Ustikoline, Bosna i Hercegovina, specijalizovana za linijski i vanlinijski prevoz putnika. Ponosni smo što svojim uslugama povezujemo ljude širom Bosne i Hercegovine i regiona. Naša misija je pružiti sigurno, udobno i pristupačno putovanje, bilo da se radi o svakodnevnim linijama ili posebnim putovanjima za grupe, ekskurzije i turiste.',
    'about.text2': 'Sa dugogodišnjim iskustvom u transportnoj industriji Bosne i Hercegovine, modernim voznim parkom i profesionalnim vozačima, Drina Bus je pouzdan partner na svakom putovanju.',
    'about.stats.experience': 'godina iskustva',
    'about.stats.trips': 'završenih vožnji',
    'about.stats.clients': 'aktivnih klijenata',
    
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
    'nav.services': 'Services',
    'nav.fleet': 'Fleet',
    'nav.about': 'About',
    'nav.gallery': 'Gallery',
    'nav.faq': 'FAQ',
    'nav.contact': 'Contact',
    
    // Hero
    'hero.title': 'Safe and comfortable transport',
    'hero.subtitle': 'Connecting people – locally and internationally',
    'hero.viewFleet': 'View our fleet',
    'hero.contact': 'Contact us',
    
    // Detailed Services
    'detailedServices.title': 'Our Services',
    'detailedServices.subtitle': 'We provide a wide range of transport services tailored to your needs',
    'detailedServices.regular.title': 'Regular Transport',
    'detailedServices.regular.desc': 'Regular passenger transport on local routes. Reliable and regular routes for daily needs of our passengers.',
    'detailedServices.excursions.title': 'School Excursions',
    'detailedServices.excursions.desc': 'We organize school excursions with licensed drivers and modern buses. Safety and comfort of your children are our priority.',
    'detailedServices.dayTrips.title': 'Day Trips',
    'detailedServices.dayTrips.desc': 'Perfect for group outings, team building events or tourist sightseeing. Flexible routes according to your wishes.',
    'detailedServices.corporate.title': 'Corporate Transport',
    'detailedServices.corporate.desc': 'Professional transport for your employees, clients or events. Regular or occasional arrangements as needed.',
    'detailedServices.international.title': 'International Charter',
    'detailedServices.international.desc': 'Transport to Croatia, Serbia, Slovenia, Montenegro, Albania, North Macedonia and other European destinations. Experienced drivers and comfortable buses.',
    'detailedServices.airport.title': 'Airport Transfer',
    'detailedServices.airport.desc': 'Reliable transfer to/from airports. Available 24/7 with flight tracking and flexible scheduling.',
    
    // FAQ
    'faq.title': 'Frequently Asked Questions',
    'faq.subtitle': 'Answers to the most common questions',
    'faq.q1': 'How can I book transport?',
    'faq.a1': 'You can make reservations by phone at +387 62 888 702 or by email at drinabus@hotmail.com. We recommend booking at least 7 days in advance for best availability.',
    'faq.q2': 'What payment methods do you accept?',
    'faq.a2': 'We accept cash payments and bank transfers. For long-term arrangements, we offer special payment terms.',
    'faq.q3': 'Are all buses air-conditioned?',
    'faq.a3': 'Yes, all our buses are modernly equipped with air conditioning, comfortable seats and luggage space. Larger buses also have toilets.',
    'faq.q4': 'Can I cancel my reservation?',
    'faq.a4': 'Reservation cancellation is free by agreement with us.',
    'faq.q5': 'Do you offer international transport services?',
    'faq.a5': 'Yes, we offer transport to most Balkan and European destinations including Croatia, Serbia, Slovenia, Montenegro, Albania, North Macedonia and other countries. We have experienced drivers with all necessary permits.',
    
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
    'about.text1': 'Drina Bus is a family business from Ustikolina, Bosnia and Herzegovina, specialized in regular and charter passenger transport. We are proud to connect people throughout Bosnia and Herzegovina and the region with our services. Our mission is to provide safe, comfortable and affordable travel, whether for daily routes or special trips for groups, excursions and tourists.',
    'about.text2': 'With years of experience in the transport industry of Bosnia and Herzegovina, modern fleet and professional drivers, Drina Bus is a reliable partner on every journey.',
    'about.stats.experience': 'years of experience',
    'about.stats.trips': 'completed trips',
    'about.stats.clients': 'active clients',
    
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
