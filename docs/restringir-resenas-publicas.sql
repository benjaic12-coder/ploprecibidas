-- Endurecimiento preparado para aplicar manualmente.
-- La web usa testimonios.json y /api/reviews proyecta únicamente campos públicos.
-- Evita lectura directa de ids de pedido, rutas privadas y moderadores.
begin;
drop policy if exists reviews_public on public.plop_reviews;
commit;
