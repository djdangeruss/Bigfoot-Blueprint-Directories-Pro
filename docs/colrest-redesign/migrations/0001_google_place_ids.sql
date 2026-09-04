-- Instance-scoped, reversible metadata migration for dirmaster_colrest only.
-- Google Place IDs may be stored indefinitely. Photo names/media are resolved
-- at request time and must not be persisted or cached.
BEGIN;

CREATE TEMP TABLE colrest_place_ids (
  id integer PRIMARY KEY,
  title text NOT NULL,
  place_id text NOT NULL CHECK (place_id ~ '^ChI[A-Za-z0-9_-]+$')
) ON COMMIT DROP;

INSERT INTO colrest_place_ids (id, title, place_id) VALUES
  (1, 'Pueblito Viejo', 'ChIJoaAOBI-42YgRXrWONAd9zGo'),
  (2, 'Chuzitos Gourmet USA Doral', 'ChIJc5ncpAa72YgRLUo2yt7p5-E'),
  (5, 'Don Matias Restaurant', 'ChIJT9FoeQS72YgRitytytM0oQY'),
  (6, 'Luka Restaurant and Coffee', 'ChIJubrs_5m_2YgRVrimtCuhFWg'),
  (8, 'Patacon Pisao', 'ChIJE2CNl3652YgRtlL1Raur20g'),
  (11, 'Ruta 75', 'ChIJ7wbRgU-72YgRjM8TY09AG8A'),
  (13, 'Kuba Cabana', 'ChIJUf1fSu-52YgRaxHFlXIWTXI'),
  (14, 'El Porton de la Flaca', 'ChIJzwUPm8u-2YgRjmcGeSAyuZc'),
  (15, 'Mondongo''s Restaurante', 'ChIJi4iGGWS52YgRvl5hy4xtipk'),
  (17, 'Monserrate Restaurant', 'ChIJ4X_g41i52YgRQNmzjORR-nA'),
  (18, 'Garden House', 'ChIJU8gUzIm12YgRwt0FTZZ2w5w'),
  (19, 'Mofongo Restaurant Calle 8', 'ChIJ-WpYBfq22YgRSEtZyn3upS8'),
  (20, 'Latin Cafe 2000', 'ChIJyTj4jDe32YgR_-gMvFZ1yZc'),
  (21, 'Palo Quemao', 'ChIJxdJ22oG32YgRoeNrlrfb_mM'),
  (23, 'Alegria Latin Kitchen', 'ChIJ4eHS42S52YgRoCWihsjtlGo'),
  (24, 'Bolivar colombian restaurant bar lounge', 'ChIJKYgbM4202YgRL2NO8GrgllU'),
  (25, 'Doggi''s Arepa Bar', 'ChIJd-Su-taz2YgRmveAkQtiWyI'),
  (26, 'El Rinconcito Paisa #2 Restaurant', 'ChIJFdAbvUa_2YgR2gazFbRgTYI'),
  (27, 'Sanpocho Restaurant', 'ChIJ6TnF0Yy22YgRL3K4EP03Hpk'),
  (28, 'Fonda Sabaneta Calle 8', 'ChIJPzMmGoW32YgR1EnLn9VUl-w'),
  (29, 'El Nogal Latin Restaurant & Bar', 'ChIJMb3sF6C12YgRK-joRB5lCc0'),
  (31, 'El Patio 305 Restaurant', 'ChIJcTWLtVO22YgRvmOSB1NY_Uc'),
  (32, 'Mi Fondita Colombian Restaurant', 'ChIJLxb0KD2l2YgRO49AoE_s8Y4'),
  (33, 'Mi Colombia cafeteria Miami Beach', 'ChIJT2rHbuay2YgRfsErmiRgvMQ'),
  (34, 'Pandebono Bakery', 'ChIJG3S_i1S42YgRB4Kygg89xRI'),
  (36, 'Manantial Market', 'ChIJ5w1S4LO52YgROiXPd4NZGpU'),
  (37, 'Tres Monitos Bakery', 'ChIJkaDlMe662YgRISOE8XE9PcQ'),
  (39, 'Pollo Riko', 'ChIJQwXB3x272YgRKZV3QwfEkJ8'),
  (40, 'Arepa Bar', 'ChIJ-5kgAk6x2YgRo5c3eyKUqPY'),
  (42, 'Macondo Coffee Roasters - Doral', 'ChIJ22kr8Wm52YgRUfotnCRGmXU'),
  (43, 'EL PROPIO 305-MIA', 'ChIJOye6352x2YgRei6Hrft9Wi4');

DO $$
DECLARE
  matched_count integer;
BEGIN
  SELECT count(*) INTO matched_count
  FROM entries e
  JOIN colrest_place_ids m ON m.id = e.id AND m.title = e.title
  WHERE e.published = true;
  IF matched_count <> 31 THEN
    RAISE EXCEPTION 'Expected 31 exact published entry matches, found %', matched_count;
  END IF;
END $$;

UPDATE entries e
SET custom_fields = COALESCE(e.custom_fields, '{}'::jsonb)
  || jsonb_build_object('googlePlaceId', m.place_id),
    updated_at = now()
FROM colrest_place_ids m
WHERE e.id = m.id AND e.title = m.title AND e.published = true;

DO $$
DECLARE
  applied_count integer;
BEGIN
  SELECT count(*) INTO applied_count
  FROM entries e
  JOIN colrest_place_ids m ON m.id = e.id
  WHERE e.custom_fields->>'googlePlaceId' = m.place_id;
  IF applied_count <> 31 THEN
    RAISE EXCEPTION 'Expected 31 stored Place IDs, found %', applied_count;
  END IF;
END $$;

COMMIT;
