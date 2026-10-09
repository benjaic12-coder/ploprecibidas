create table if not exists public.product_catalog (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,63}$'),
  category text not null check (category in ('Combos','Marcos','Carteles','Lonas','Props','Bandas')),
  name text not null check (char_length(name) between 2 and 100),
  price integer not null check (price between 0 and 100000000),
  description text not null default '',
  badge text not null default '',
  image_url text not null,
  spec text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_catalog_active_order_idx
  on public.product_catalog (is_active, sort_order, category);

alter table public.product_catalog enable row level security;
revoke all on public.product_catalog from anon, authenticated;
grant all on public.product_catalog to service_role;

create or replace function public.touch_product_catalog_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists product_catalog_updated_at on public.product_catalog;
create trigger product_catalog_updated_at before update on public.product_catalog
for each row execute function public.touch_product_catalog_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 6291456, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 6291456,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

insert into public.product_catalog
  (id, category, name, price, description, badge, image_url, spec, sort_order)
values
  ('combo-1','Combos','Combo Inicio ideal',50000,'Marco selfie + cartel chico + 8 props.','Para arrancar con todo','catalog-photos/marco-selfie-castro.webp?v=51.0','Incluye: marco selfie · cartel chico · 8 props.',10),
  ('combo-2','Combos','Combo Fotos + banda',55000,'Marco selfie + banda + 8 props.','Para llevar tu carrera a las fotos','catalog-photos/banda-graduados.webp?v=51.0','Incluye: marco selfie · banda · 8 props.',20),
  ('combo-3','Combos','Combo Lona + props',34000,'Lona mediana + 8 props.','Simple, visual y completo','catalog-photos/lona-team-anriquez.webp?v=51.0','Incluye: lona mediana · 8 props.',30),
  ('combo-4','Combos','Combo Completo',76000,'Marco + banda + props + lona grande.','La experiencia Plop completa','catalog-photos/cartel-colgante-brit.webp?v=51.0','Incluye: marco · banda · props · lona grande.',40),
  ('combo-5','Combos','Combo Gran formato',54000,'Cartel grande + lona grande.','Para que se vea desde lejos','catalog-photos/lona-team-anriquez.webp?v=51.0','Incluye: cartel grande · lona grande.',50),
  ('marco-rectangular','Marcos','Marco selfie',35000,'Clásico y versátil para cualquier carrera.','Más pedido','catalog-photos/marco-selfie-rosa.webp?v=51.0','Formato selfie · diseño personalizado',110),
  ('marco-redondo','Marcos','Marco redondo',38000,'Marco circular de 90 × 90 cm. Un formato distinto para destacar.','Ideal para fotos','catalog-photos/marco-redondo.webp?v=51.0','Medida 90 × 90 cm · diseño personalizado',120),
  ('marco-nube','Marcos','Marco nube',38000,'Llamativo, delicado y personalizado.','Estilo suave','clean-product-assets/marco-nube-clean.webp?v=50.0','Diseño con forma de nube · personalizado',130),
  ('marco-forma','Marcos','Marco con forma',38000,'Original, divertido y único.','Único','catalog-photos/marco-forma.webp?v=51.0','Silueta especial · diseño a elección',140),
  ('cartel-chico','Carteles','Cartel colgante chico',7000,'Liviano y listo para colgar.','Económico','clean-product-assets/cartel-chico-clean.webp?v=52.0','Formato chico · frase, carrera y colores',210),
  ('cartel-mediano','Carteles','Cartel colgante mediano',12000,'El tamaño más elegido.','Más elegido','clean-product-assets/cartel-mediano-clean.webp?v=52.0','Formato mediano · frase, carrera y colores',220),
  ('cartel-grande','Carteles','Cartel colgante grande',30000,'Alta visibilidad para las fotos.','Alto impacto','clean-product-assets/cartel-grande-clean.webp?v=52.0','Formato grande · alta visibilidad',230),
  ('cartel-forma','Carteles','Cartel colgante con forma',22000,'Diseño personalizado con silueta especial.','Personalizable','clean-product-assets/cartel-grande-clean.webp?v=50.0','Silueta especial · diseño personalizado',240),
  ('lona-mediana','Lonas','Cartel de lona mediano',25000,'Ideal para auto, fiesta o fondo de fotos.','Versátil','clean-product-assets/lona-mediana-clean.webp?v=50.0','Formato mediano · fondo de fotos',310),
  ('lona-grande','Lonas','Cartel de lona grande',30000,'Vistoso, resistente y fácil de lucir.','Gran formato','catalog-photos/lona-team-anriquez.webp?v=52.0','Gran formato · fondo amplio para fotos',320),
  ('props-pack','Props','Pack de 8 props',12000,'Más variedad para todas las fotos.','Fotos divertidas','clean-product-assets/props-pack-clean.webp?v=50.0','Pack de 8 unidades · frases y diseños',410),
  ('props-unidad','Props','Prop individual',2000,'Una frase, meme, emoji o foto.','Por unidad','clean-product-assets/props-unidad-clean.webp?v=50.0','1 unidad · frase, meme, emoji o foto',420),
  ('banda','Bandas','Banda para graduados',12000,'Colores, carrera y frase a elección.','Imprescindible','catalog-photos/banda-graduados.webp?v=51.0','Colores, carrera y frase a elección',510)
on conflict (id) do nothing;
