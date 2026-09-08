# Slika za Neoplan A36-O-419 — dijagnoza i rješenje

## Dijagnoza (potvrđena)

- Kod sadrži ispravno mapiranje: `A36-O-419` → slika `d35b41af-...png` (dodano ranije)
- Baza podataka sadrži tačnu registraciju `A36-O-419` za Neoplan Cityliner
- Slika postoji i učitava se na sajtu (HTTP 200)
- **Ali**: objavljena verzija sajta (drinabus.com) NE sadrži ovu ispravku — provjerom objavljene JS datoteke potvrđeno da registracija `A36-O-419` ne postoji u njoj (0 pogodaka)

**Zaključak**: Ispravka je napravljena u kodu, ali sajt nakon toga nije ponovo objavljen. Frontend izmjene postaju vidljive tek nakon klika na "Update" u Publish dijalogu.

## Rješenje

1. Ponovo objaviti sajt (Publish → Update) — time objavljena verzija dobija sve najnovije izmjene, uključujući mapiranje slike za A36-O-419
2. Nakon objave potvrditi da se slika prikazuje na drinabus.com u sekciji voznog parka

## Napomena

- Nema izmjena koda — samo ponovna objava
- Ako želite, mogu pokrenuti objavu — samo potvrdite
