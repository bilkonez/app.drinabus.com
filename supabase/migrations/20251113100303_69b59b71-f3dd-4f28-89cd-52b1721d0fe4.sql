-- Insert Zagreb Advent tour package
INSERT INTO public.tour_packages (
  title,
  slug,
  short_description,
  full_description,
  destination,
  tour_type,
  duration_days,
  price,
  price_note,
  max_passengers,
  departure_city,
  available_from,
  available_to,
  featured,
  status,
  cover_image_url,
  included_services,
  not_included
) VALUES (
  'Jednodnevni Izlet u Zagreb - Adventska Čarolija',
  'zagreb-advent',
  'Jednodnevni izlet u Zagreb za vrijeme adventske čarolije. Polazak iz Goražda sa ukrcajem u Ustikolini i Sarajevu.',
  E'**1. DAN – GORAŽDE – USTIKOLINA – SARAJEVO – ZAGREB**\n\nPolazak iz Goražda u ranim jutarnjim satima, s ukrcajem putnika u Ustikolini i Sarajevu.\nPutovanje modernim turističkim autobusom prema Zagrebu uz pauze po potrebi grupe.\n\nPo dolasku u Zagreb, slijedi dolazak u Arena Centar, jedan od najvećih i najpoznatijih tržnih centara u Hrvatskoj.\nSlobodno vrijeme za kupovinu, odmor, kafu ili ručak u nekom od restorana u sklopu centra.\n\nNakon shoppinga, polazak prema centru Zagreba i iskrcaj putnika u blizini Glavnog kolodvora.\nSlijedi slobodno vrijeme za obilazak Trga bana Jelačića, Katedrale, Zrinjevca, Tomislavca i drugih adventskih lokacija.\nUživanje u prazničnoj atmosferi, svjetlosnim dekoracijama i brojnim božićnim kućicama uz tople napitke i tradicionalne delicije.\n\nU dogovoreno vrijeme (oko 18:00 sati) okupljanje grupe na istom mjestu i polazak za Bosnu i Hercegovinu.\nPauze po potrebi grupe. Dolazak u večernjim satima.\n\n**NAPOMENE:**\n\n- Polazak garantovan uz minimalan broj prijavljenih putnika\n- Putnici su obavezni posjedovati važeću ličnu kartu ili pasoš za prelazak granice\n- Organizator zadržava pravo izmjene redoslijeda obilazaka u skladu s vremenskim uslovima i gužvama u saobraćaju\n\n**📞 Informacije i rezervacije:**\nDrina Bus\n📱 062 888 702\n📧 drinabus@hotmail.com\n📲 Instagram: @drinabus',
  'Zagreb, Hrvatska',
  'jednodnevni',
  1,
  75,
  'Cijena po osobi',
  45,
  'Goražde',
  '2025-11-19',
  '2025-11-19',
  true,
  'aktivan',
  '/src/assets/zagreb-advent-cover.png',
  ARRAY[
    'Prevoz modernim turističkim autobusom',
    'Usluge vodiča / pratioca grupe',
    'Kompletnu organizaciju putovanja'
  ],
  ARRAY[
    'Lične troškove putnika',
    'Putno zdravstveno osiguranje (preporučuje se)'
  ]
);