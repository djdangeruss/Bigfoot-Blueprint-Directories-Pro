-- Reconcile the researched 61-record queue with the public Colombian-cuisine
-- scope. Google Place IDs may be retained. All status/cuisine decisions were
-- verified on 2026-07-19; excluded records remain preserved in the database.
BEGIN;

CREATE TEMP TABLE colrest_publication_scope (
  id integer PRIMARY KEY,
  title text NOT NULL,
  place_id text NOT NULL CHECK (place_id ~ '^ChI[A-Za-z0-9_-]+$'),
  include_public boolean NOT NULL,
  decision_reason text NOT NULL
) ON COMMIT DROP;

INSERT INTO colrest_publication_scope (id, title, place_id, include_public, decision_reason) VALUES
  (1, 'Pueblito Viejo', 'ChIJoaAOBI-42YgRXrWONAd9zGo', true, 'google_places_colombian_restaurant'),
  (2, 'Chuzitos Gourmet USA Doral', 'ChIJc5ncpAa72YgRLUo2yt7p5-E', true, 'documented_colombian_identity'),
  (3, 'Cafe Y Sabor', 'ChIJiayKJoe52YgR5t7qOdfuzU4', true, 'google_places_colombian_restaurant'),
  (4, 'Pepito''s Plaza', 'ChIJwTvwFga82YgRcA0C9rmSoiY', false, 'venezuelan_not_colombian'),
  (5, 'Don Matias Restaurant', 'ChIJT9FoeQS72YgRitytytM0oQY', true, 'google_places_colombian_restaurant'),
  (6, 'Luka Restaurant and Coffee', 'ChIJubrs_5m_2YgRVrimtCuhFWg', true, 'documented_colombian_identity'),
  (7, 'Pepitolandia', 'ChIJHY5v2fm72YgR2qxOPaUqkUM', false, 'venezuelan_not_colombian'),
  (8, 'Patacon Pisao', 'ChIJE2CNl3652YgRtlL1Raur20g', true, 'google_places_colombian_restaurant'),
  (9, 'La Esquina del Lechon', 'ChIJ_5FGlcS72YgRJl6biQppudA', false, 'cuban_not_colombian'),
  (10, 'Los Verdes - Doral', 'ChIJx_w5squ-2YgR8Em60X-f138', true, 'google_places_colombian_restaurant'),
  (11, 'Ruta 75', 'ChIJ7wbRgU-72YgRjM8TY09AG8A', true, 'google_places_colombian_restaurant'),
  (12, 'Brasa y Sazon Restaurant', 'ChIJxTQAdd662YgR1h_qHHL6AcM', true, 'google_places_colombian_restaurant'),
  (13, 'Kuba Cabana', 'ChIJUf1fSu-52YgRaxHFlXIWTXI', false, 'cuban_not_colombian'),
  (14, 'El Porton de la Flaca', 'ChIJzwUPm8u-2YgRjmcGeSAyuZc', true, 'google_places_colombian_restaurant'),
  (15, 'Mondongo''s Restaurante', 'ChIJi4iGGWS52YgRvl5hy4xtipk', true, 'google_places_colombian_restaurant'),
  (16, 'Las Olas Cafe', 'ChIJxz3gJfO02YgRV513QOFUKZo', false, 'cuban_not_colombian'),
  (17, 'Monserrate Restaurant', 'ChIJ4X_g41i52YgRQNmzjORR-nA', true, 'google_places_colombian_restaurant'),
  (18, 'Garden House', 'ChIJU8gUzIm12YgRwt0FTZZ2w5w', true, 'google_places_colombian_restaurant'),
  (19, 'Mofongo Restaurant Calle 8', 'ChIJ-WpYBfq22YgRSEtZyn3upS8', false, 'puerto_rican_not_colombian'),
  (20, 'Latin Cafe 2000', 'ChIJyTj4jDe32YgR_-gMvFZ1yZc', false, 'cuban_not_colombian'),
  (21, 'Palo Quemao', 'ChIJxdJ22oG32YgRoeNrlrfb_mM', true, 'google_places_colombian_restaurant'),
  (22, 'Las Caleñitas Restaurant & Bakery', 'ChIJXbl_pZC_2YgRdsEdsdj7wr8', true, 'google_places_colombian_restaurant'),
  (23, 'Alegria Latin Kitchen', 'ChIJ4eHS42S52YgRoCWihsjtlGo', true, 'google_places_colombian_restaurant'),
  (24, 'Bolivar colombian restaurant bar lounge', 'ChIJKYgbM4202YgRL2NO8GrgllU', true, 'documented_colombian_identity'),
  (25, 'Doggi''s Arepa Bar', 'ChIJd-Su-taz2YgRmveAkQtiWyI', false, 'venezuelan_not_colombian'),
  (26, 'El Rinconcito Paisa #2 Restaurant', 'ChIJFdAbvUa_2YgR2gazFbRgTYI', true, 'documented_colombian_identity'),
  (27, 'Sanpocho Restaurant', 'ChIJ6TnF0Yy22YgRL3K4EP03Hpk', true, 'google_places_colombian_restaurant'),
  (28, 'Fonda Sabaneta Calle 8', 'ChIJPzMmGoW32YgR1EnLn9VUl-w', true, 'documented_colombian_identity'),
  (29, 'El Nogal Latin Restaurant & Bar', 'ChIJMb3sF6C12YgRK-joRB5lCc0', true, 'google_places_colombian_restaurant'),
  (30, 'La Ventana - Colombian restaurant in Miami Beach', 'ChIJ7zncPI202YgRjUW6EjX8QoI', true, 'google_places_colombian_restaurant'),
  (31, 'El Patio 305 Restaurant', 'ChIJcTWLtVO22YgRvmOSB1NY_Uc', true, 'google_places_colombian_restaurant'),
  (32, 'Mi Fondita Colombian Restaurant', 'ChIJLxb0KD2l2YgRO49AoE_s8Y4', true, 'google_places_colombian_restaurant'),
  (33, 'Mi Colombia cafeteria Miami Beach', 'ChIJT2rHbuay2YgRfsErmiRgvMQ', true, 'google_places_colombian_restaurant'),
  (34, 'Pandebono Bakery', 'ChIJG3S_i1S42YgRB4Kygg89xRI', true, 'documented_colombian_identity'),
  (35, 'Saman', 'ChIJT_2wQ9S72YgRITHqaphbErQ', false, 'venezuelan_not_colombian'),
  (36, 'Manantial Market', 'ChIJ5w1S4LO52YgROiXPd4NZGpU', true, 'google_places_colombian_restaurant'),
  (37, 'Tres Monitos Bakery', 'ChIJkaDlMe662YgRISOE8XE9PcQ', true, 'google_places_colombian_restaurant'),
  (38, 'Caracas Bakery Doral', 'ChIJdW2PayK72YgRQ5wQIjzlYj4', false, 'venezuelan_not_colombian'),
  (39, 'Pollo Riko', 'ChIJQwXB3x272YgRKZV3QwfEkJ8', true, 'google_places_colombian_restaurant'),
  (40, 'Arepa Bar', 'ChIJ-5kgAk6x2YgRo5c3eyKUqPY', false, 'venezuelan_not_colombian'),
  (41, 'Pan Pa Ya', 'ChIJlWP4JKu-2YgRoRJn-D-LCpg', true, 'google_places_colombian_restaurant'),
  (42, 'Macondo Coffee Roasters - Doral', 'ChIJ22kr8Wm52YgRUfotnCRGmXU', true, 'documented_colombian_identity'),
  (43, 'EL PROPIO 305-MIA', 'ChIJOye6352x2YgRei6Hrft9Wi4', true, 'google_places_colombian_restaurant'),
  (44, 'Los Antojos Restaurant', 'ChIJz94YghSy2YgRTQIhZyeARLk', true, 'google_places_colombian_restaurant'),
  (45, 'Panaderia 20 De Julio', 'ChIJqXJWbCzC2YgR4bOj7PWrMm0', true, 'google_places_colombian_restaurant'),
  (46, 'Delicias Colombianas', 'ChIJjxOJTVPA2YgR15gG9mHZjPg', true, 'documented_colombian_identity'),
  (47, 'La Estacion Cafe', 'ChIJdzCvJYG22YgR1mRsVYwt4CA', true, 'google_places_colombian_restaurant'),
  (48, 'La casa de la Empanada El Buen Pan', 'ChIJGS9cXNW42YgRPxd2bsd3h-c', true, 'google_places_colombian_restaurant'),
  (49, 'Las Delicias Colombianas', 'ChIJJyNW0hSt2YgRtJxnPL8E3Qo', true, 'google_places_colombian_restaurant'),
  (50, 'Bamboo Restaurant', 'ChIJd9O94YG_2YgRICE6koEvs-o', true, 'google_places_colombian_restaurant'),
  (51, 'Bandeja Paisa Restaurant. Latin & Fast Food.', 'ChIJu9cgOCe52YgRdAsbDfuDoUk', true, 'google_places_colombian_restaurant'),
  (52, 'Mi Buñuelo Midtown', 'ChIJYZDq2cO32YgRzu8LOdQk4KM', true, 'google_places_colombian_restaurant'),
  (53, 'MiLina Cuisine Colombian Restaurant', 'ChIJ61Fc1GHJw4kRrRR3rxCsfBc', true, 'google_places_colombian_restaurant'),
  (54, 'Leo Pan Colombian Bakery', 'ChIJW-IiK-y52YgR6NixDxHksnQ', true, 'documented_colombian_identity'),
  (55, 'LAS DELICIAS RESTAURANT & BAKERY', 'ChIJDZ4LPwCz2YgRrguQ_CsbSCw', true, 'documented_colombian_identity'),
  (56, 'Andrés Carne de Res Miami', 'ChIJOZIFBwC12YgRieEn821YBic', true, 'documented_colombian_identity'),
  (57, 'Fonda Sabaneta', 'ChIJgzidk9PB2YgR96kB_TCaf0A', true, 'google_places_colombian_restaurant'),
  (58, 'NAHUEN Gourmet Market - Doral', 'ChIJhfPZz1S52YgRvZyPcVhfjcQ', false, 'argentinian_not_colombian'),
  (59, 'Mordisco Miami', 'ChIJTfS9SfS52YgRnx4gt06Lv3Q', false, 'venezuelan_not_colombian'),
  (60, 'El Machetico Miami', 'ChIJyRIpDlK52YgRKaUJEjiyM-E', true, 'google_places_colombian_restaurant'),
  (61, 'Mandy''s Juices', 'ChIJ40WUBx672YgRzaCliRtaws4', true, 'google_places_colombian_restaurant');

DO $$
DECLARE
  matched_count integer;
BEGIN
  SELECT count(*) INTO matched_count
    FROM entries e
    JOIN colrest_publication_scope s ON s.id = e.id AND s.title = e.title;
  IF matched_count <> 61 THEN
    RAISE EXCEPTION 'Expected 61 exact entry matches, found %', matched_count;
  END IF;
END $$;

UPDATE entries e
SET published = s.include_public,
    custom_fields = coalesce(e.custom_fields, '{}'::jsonb)
      || jsonb_build_object(
        'googlePlaceId', s.place_id,
        '_googleBusinessStatus', 'OPERATIONAL',
        '_directoryCuisineDecision', CASE WHEN s.include_public THEN 'included' ELSE 'excluded' END,
        '_directoryCuisineReason', s.decision_reason,
        '_directoryVerifiedAt', '2026-07-19'
      ),
    updated_at = now()
FROM colrest_publication_scope s
WHERE e.id = s.id AND e.title = s.title;

DO $$
DECLARE
  total_count integer;
  published_count integer;
  place_id_count integer;
  excluded_count integer;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE published),
         count(nullif(custom_fields->>'googlePlaceId', '')),
         count(*) FILTER (WHERE custom_fields->>'_directoryCuisineDecision' = 'excluded')
    INTO total_count, published_count, place_id_count, excluded_count
    FROM entries;
  IF total_count <> 61 OR published_count <> 48 OR place_id_count <> 61 OR excluded_count <> 13 THEN
    RAISE EXCEPTION 'Unexpected final state: total %, published %, Place IDs %, excluded %',
      total_count, published_count, place_id_count, excluded_count;
  END IF;
END $$;

COMMIT;
