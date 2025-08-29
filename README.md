🚌 Drina Bus Admin Panel

Drina Bus Admin Panel je web aplikacija razvijena putem Lovable
 i integrisana sa Supabase
, namijenjena za upravljanje autobuskom firmom Drina Bus (Ustikolina, BiH).
Aplikacija omogućava direktoru/administraciji da upravlja voznim parkom, uposlenicima, vožnjama, troškovima, podsjetnicima i izvještajima – sve kroz moderan i jednostavan interfejs.

🚀 Funkcionalnosti
🔐 Login & UI

Svijetla tema sa crno-zlatnim akcentima

Autentikacija putem Supabase Auth (email + lozinka)

Opcija “Zapamti me” (trajna sesija ako je čekirano)

Ako postoji aktivna sesija → preskok login-a

📅 Dashboard

Pregled aktivnih vožnji

Status vozila (dostupno / na servisu / zauzeto)

Podsjetnici na dokumente i rokove

Brza statistika: broj vožnji, troškovi, prihodi, profit

🔔 Reminder sistem

Automatski podsjetnici 30 dana prije isteka:

licence vozača

registracije vozila

tehnički pregled (godišnji i 6-mjesečni)

baždarenje tahografa

PP aparati

tahograf kartice uposlenika

🚍 Vozni park

Evidencija vozila (marka, model, registracija, status)

Podsjetnici na rokove (registracija, tehnički, PP aparat)

Servisi i održavanje (mali servisi, intervencije, troškovi, upload računa)

Kilometraža se ne prati (izbačeno polje)

👨‍💼 Uposlenici

Evidencija uposlenika sa statusima i ulogama

Rokovi za vozačke dozvole i tahograf kartice

Podsjetnici 30 dana ranije

🚌 Vožnje

Tipovi: linijski i vanlinijski (transfer vožnje uklonjene)

Polja: relacija, datumi, vozilo, vozač, ukupna cijena, napomene

Generisanje PDF dokumenata:

Ugovor o prevozu

Putni list

Potvrda o odmoru vozača

🔧 Održavanje

Unos rokova: registracija, tehnički pregled (godišnji + 6-mjesečni), tahograf, PP aparati

Mali servisi (ulje, filteri, ostale intervencije)

Upload dokumenata i računa

📊 Izvještaji & Analitika

Svakodnevno ažurirani izvještaji:

broj vožnji

prihodi (suma ukupnih cijena)

troškovi (gorivo, putarine, dnevnice, servisi)

profit (prihodi – troškovi)

Grafovi i tabele sa mogućnošću exporta u PDF/CSV

Insights sekcija: automatski uvidi i “zanimljive činjenice”

najskuplje vozilo po km

vozač sa najviše vožnji

ruta sa najvećim prihodom

troškovi servisa kao % prihoda

mjeseci kada više dokumenata ističe istovremeno

trendovi rasta/pada cijena vožnji

🛠️ Tehnologije

Lovable
 – low-code development platform

Supabase
 – baza podataka (PostgreSQL), autentikacija i storage

Frontend: Next.js/React (automatski generisan kroz Lovable)

Stil: moderni UI (svijetla tema + crno-zlatni akcenti)

Projekat razvijen za Drina Bus d.o.o.
Lokacija: Ustikolina, BiH
Kontakt: Bilal Ćurović
