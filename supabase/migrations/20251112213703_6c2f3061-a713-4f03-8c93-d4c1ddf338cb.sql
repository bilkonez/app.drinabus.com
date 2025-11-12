-- Create tour_packages table
CREATE TABLE public.tour_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  short_description text NOT NULL,
  full_description text,
  destination text NOT NULL,
  tour_type text NOT NULL CHECK (tour_type IN ('jednodnevni', 'vikend', 'vise_dana', 'sezonski')),
  duration_days integer NOT NULL,
  price numeric(10,2),
  price_note text,
  departure_city text DEFAULT 'Bijeljina',
  available_from date,
  available_to date,
  status text DEFAULT 'aktivan' CHECK (status IN ('aktivan', 'rasprodato', 'arhivirano')),
  featured boolean DEFAULT false,
  max_passengers integer,
  included_services text[],
  not_included text[],
  cover_image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create tour_images table
CREATE TABLE public.tour_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_package_id uuid REFERENCES public.tour_packages(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tour_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tour_packages
CREATE POLICY "admin_full_access_tours"
  ON public.tour_packages FOR ALL
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "public_view_active_tours"
  ON public.tour_packages FOR SELECT
  USING (status = 'aktivan');

-- RLS Policies for tour_images
CREATE POLICY "admin_full_access_tour_images"
  ON public.tour_images FOR ALL
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "public_view_tour_images"
  ON public.tour_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tour_packages
      WHERE id = tour_images.tour_package_id
      AND status = 'aktivan'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_tour_packages_updated_at
  BEFORE UPDATE ON public.tour_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Seed data with demo tours
INSERT INTO public.tour_packages (title, slug, short_description, full_description, destination, tour_type, duration_days, price, departure_city, status, featured, max_passengers, included_services, not_included, cover_image_url) VALUES
('Jednodnevni izlet - Plitvička jezera', 'plitvicka-jezera', 'Posjetite najljepši nacionalni park u Hrvatskoj', 'Dnevni izlet na Plitvička jezera uključuje vožnju modernim autobusom, razgledanje gornjih i donjih jezera, šetnju prelijepim stazama i vrijeme za ručak. Polazak u 6h ujutro, povratak oko 20h.', 'Plitvička jezera, Hrvatska', 'jednodnevni', 1, 45.00, 'Bijeljina', 'aktivan', true, 50, ARRAY['Prevoz autobusom', 'Vodič', 'Osiguranje putnika'], ARRAY['Ulaznica za park', 'Hrana i piće'], '/lovable-uploads/neoplan-cityliner-1.JPG'),
('Vikend u Beogradu', 'vikend-beograd', 'Dva dana u srcu Srbije - kultura, noćni život i gastronomija', 'Uživajte u vikend avanturi u Beogradu. Program uključuje obilazak Kalemegdana, Skadarlije, Hrama Svetog Save, slobodno vrijeme za shopping i večeru u tradicionalnom restoranu. Smještaj u hotelu 3*.', 'Beograd, Srbija', 'vikend', 2, 89.00, 'Bijeljina', 'aktivan', true, 40, ARRAY['Prevoz autobusom', 'Smještaj 2 noći', 'Doručak', 'Vodič', 'Osiguranje'], ARRAY['Ručkovi i večere', 'Ulaznice za muzeje'], '/lovable-uploads/neoplan-cityliner-2.JPG'),
('Pet dana u Istanbulu', 'istanbul-5-dana', 'Otkrijte magiju Istanbula - grad na dva kontinenta', 'Nezaboravno putovanje u Istanbul sa obilaskom svih glavnih atrakcija: Aja Sofija, Plava džamija, Topkapi palata, Grand Bazaar, vožnja Bosforom. Smještaj u hotelu 4* u centru grada. Program obuhvata 5 dana, 4 noći.', 'Istanbul, Turska', 'vise_dana', 5, 299.00, 'Bijeljina', 'aktivan', true, 45, ARRAY['Prevoz autobusom', 'Smještaj 4 noći u hotelu 4*', 'Doručak', 'Licencirani vodič', 'Osiguranje putnika', 'Vožnja Bosforom'], ARRAY['Ručkovi i večere', 'Ulaznice za muzeje i palate', 'Lični troškovi'], '/lovable-uploads/hero-bus-hd.jpg'),
('Božićna shopping tura - Beč', 'bozicni-bec', 'Shopping i božićna čarolija na bečkim pijacama', 'Trodnevni izlet u Beč tokom božićnih praznika. Posjetite čuvene božićne pijace, uživajte u shopping-u, razgledajte grad. Slobodno vrijeme za individualni program.', 'Beč, Austrija', 'sezonski', 3, 159.00, 'Bijeljina', 'aktivan', false, 50, ARRAY['Prevoz autobusom', 'Smještaj 2 noći', 'Doručak', 'Osiguranje'], ARRAY['Ručkovi i večere', 'Ulaznice', 'Shopping troškovi'], '/lovable-uploads/sprinter-mountain.jpg');