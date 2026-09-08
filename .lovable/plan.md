# Popravka domene drinabus.com

## Dijagnoza

Sajt je objavljen i radi na **drinabus.lovable.app** (potvrđeno, HTTP 200). Problem je isključivo u DNS-u domene **drinabus.com**:

- Nameserveri domene su promijenjeni i sada pokazuju na parking servis: `ns1.lander.d.parity.domains` / `ns2.lander.d.parity.domains`
- Zbog toga A zapis za `drinabus.com` vraća tuđe IP adrese (`104.219.250.37`, `2.59.170.20`) umjesto Lovable IP-a `185.158.133.1`
- Registar (Namecheap) još uvijek pokazuje stare nameservere (`dns101/dns102.registrar-servers.com`) — dakle delegacija je neusklađena
- SSL konekcija na drinabus.com pada jer ti serveri ne poslužuju sajt

Ovo se najčešće dešava kada domen istekne/parking servis preuzme DNS, ili ako je neko kod registrara promijenio nameservere. Ovo nije problem u kodu aplikacije — nema izmjena u projektu.

## Koraci za popravku (kod registrara — Namecheap)

1. Prijaviti se na Namecheap nalog gdje je registrovana domena drinabus.com
2. Provjeriti da je domen **aktivan i plaćen** (nije istekao) — parking nameserveri često ukazuju na isteklu domenu
3. U podešavanjima domene vratiti nameservere na **Namecheap BasicDNS** (`dns101.registrar-servers.com`, `dns102.registrar-servers.com`) — ili "Custom DNS" ako se koristi neki drugi DNS host
4. Kada nameserveri odgovaraju, postaviti DNS zapise:
   - **A zapis**: Host `@` → `185.158.133.1`
   - **A zapis**: Host `www` → `185.158.133.1`
   - **TXT zapis**: Host `_lovable` → vrijednost za verifikaciju (vidljiva u Lovable Project Settings → Domains)
5. Sačekati propagaciju (obično do 24h, najviše 72h)
6. Lovable automatski ponovo izdaje SSL certifikat — domen se vraća u status Active

## Šta radim ja nakon vaše izmjene

- Ponovo pokrećem provjeru statusa domene i potvrđujem da su zapisi ispravni
- Ako zapis "drifted" ostane, otvaram karticu za ponovno povezivanje domene u Lovable

## Napomena

- Do tada, sajt je dostupan na https://drinabus.lovable.app
- Nema promjena u kodu — ovo je isključivo podešavanje kod registrara domene
