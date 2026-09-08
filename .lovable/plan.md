# Popravka domene drinabus.com — status

## Trenutno stanje (nakon uplate)

- Nameserveri vraćeni na registrar (Namecheap): `pdns1/pdns2.registrar-servers.com` — parking servis uklonjen
- `www.drinabus.com` → `185.158.133.1` (Lovable) — ispravno
- Objе adrese (drinabus.com i www.drinabus.com) odgovaraju HTTP 200 i poslužuju Drina Bus sajt — potvrđeno učitavanje naslova stranice

## Preostali korak (preporuka)

- Korijenski A zapis (`@` → drinabus.com) kod nekih DNS resolvera još vraća stare parking IP adrese (`104.219.250.37`, `2.59.170.20`) — vjerovatno radi se o propagaciji/cache-u, ali za svaki slučaj:
  - U Namecheap DNS podešavanjima provjeriti da **A zapis za host `@`** pokazuje na `185.158.133.1`
- Lovable automatski obnavlja SSL certifikat; status domene vraća se u Active

## Šta radim ja

- Nakon kratkog vremena ponovo provjeravam A zapis za korijensku domenu i potvrđujem da svugdje pokazuje na Lovable

## Napomena

- Nema promjena u kodu — problem je bio u DNS-u domene (parking nameserveri nakon isteka), sada riješen uplatom
