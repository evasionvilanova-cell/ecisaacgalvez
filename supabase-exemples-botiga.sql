-- =============================================================
--  PRODUCTES D'EXEMPLE per provar la botiga
--  Supabase → SQL Editor → enganxa-ho → Run
--
--  Per esborrar-los després (només els d'exemple):
--    delete from public.productes where descripcio like 'Producte d''exemple%';
-- =============================================================
insert into public.productes (nom, categoria, preu, talles, descripcio, imatges, destacat, ordre) values
('Maillot oficial 2027', 'Maillots', 45.00, 'XS, S, M, L, XL, XXL',
 'Producte d''exemple — Maillot de màniga curta amb els colors del club. Teixit transpirable, cremallera completa i tres butxaques a l''esquena.',
 'images/botiga/maillot.svg', true, 1),
('Maillot infantil', 'Maillots', 35.00, '4, 6, 8, 10, 12, 14',
 'Producte d''exemple — La mateixa equipació oficial en talles per als més petits de l''escola.',
 'images/botiga/maillot.svg', false, 2),
('Culot curt amb tirants', 'Culots', 49.90, 'XS, S, M, L, XL, XXL',
 'Producte d''exemple — Culot amb badana de gel, tirants elàstics i acabat de silicona a les cames.',
 'images/botiga/culot.svg', false, 3),
('Equipació completa (maillot + culot)', 'Equipacions', 85.00, '6, 8, 10, 12, 14, XS, S, M, L, XL',
 'Producte d''exemple — Pack de maillot i culot oficials amb descompte respecte a comprar-los per separat.',
 E'images/botiga/equipacio.svg\nimages/botiga/maillot.svg\nimages/botiga/culot.svg', true, 0),
('Xandall del club', 'Xandalls', 55.00, '6, 8, 10, 12, 14, S, M, L, XL',
 'Producte d''exemple — Jaqueta i pantaló per a desplaçaments i escalfaments a les curses.',
 'images/botiga/xandall.svg', false, 4),
('Sudadera amb caputxa', 'Sudaderes', 32.00, '6, 8, 10, 12, 14, S, M, L, XL',
 'Producte d''exemple — Sudadera de cotó amb el logo de l''escola al pit.',
 'images/botiga/sudadera.svg', false, 5),
('Motxilla de l''escola', 'Motxilles', 25.00, '',
 'Producte d''exemple — Motxilla per portar la roba i el casc als entrenaments. Talla única.',
 'images/botiga/motxilla.svg', false, 6),
('Gorra de ciclisme', 'Complements', 12.00, '',
 'Producte d''exemple — Gorra de ciclisme tradicional. Talla única. Aquest exemple està marcat com a esgotat.',
 'images/botiga/gorra.svg', false, 7);

update public.productes set esgotat = true where nom = 'Gorra de ciclisme' and descripcio like 'Producte d''exemple%';
