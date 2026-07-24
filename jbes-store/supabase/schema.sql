create extension if not exists "pgcrypto";

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  product_name text not null,
  minecraft_username text not null check (minecraft_username ~ '^[A-Za-z0-9_]{3,16}$'),
  amount_usd numeric(10, 2) not null check (amount_usd >= 0),
  amount_total numeric(10, 2) not null default 0 check (amount_total >= 0),
  currency text not null default 'USD' check (currency in ('USD', 'EUR', 'PLN', 'GBP')),
  payment_provider text not null check (payment_provider in ('stripe')),
  payment_method text not null check (payment_method in ('card', 'blik')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'cancelled')),
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'delivered', 'failed')),
  delivery_attempts integer not null default 0 check (delivery_attempts >= 0),
  delivery_command text not null,
  external_checkout_id text,
  external_payment_id text,
  last_delivery_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  delivered_at timestamptz
);

alter table public.orders
add column if not exists payment_method text not null default 'card' check (payment_method in ('card', 'blik'));

alter table public.orders
alter column payment_method drop default;

update public.orders
set payment_method = 'card'
where payment_method not in ('card', 'blik');

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%payment_method%'
  loop
    execute format('alter table public.orders drop constraint if exists %I', constraint_record.conname);
  end loop;
end $$;

alter table public.orders
add constraint orders_payment_method_check check (payment_method in ('card', 'blik'));

alter table public.orders
add column if not exists amount_total numeric(10, 2) not null default 0 check (amount_total >= 0);

alter table public.orders
add column if not exists currency text not null default 'USD' check (currency in ('USD', 'EUR', 'PLN', 'GBP'));

update public.orders
set amount_total = amount_usd
where amount_total = 0 and amount_usd > 0;

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_delivery_status_idx on public.orders (delivery_status);
create index if not exists orders_payment_method_idx on public.orders (payment_method);
create index if not exists orders_currency_idx on public.orders (currency);
create index if not exists orders_external_checkout_id_idx on public.orders (external_checkout_id);
create index if not exists orders_external_payment_id_idx on public.orders (external_payment_id);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  minecraft_username text not null check (minecraft_username ~ '^[A-Za-z0-9_]{3,16}$'),
  rating integer not null check (rating between 1 and 5),
  quote text not null check (char_length(trim(quote)) between 12 and 280),
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.reviews
add column if not exists rating integer not null default 5 check (rating between 1 and 5);

alter table public.reviews
add column if not exists quote text not null default 'Great server and smooth store experience.';

alter table public.reviews
add column if not exists is_visible boolean not null default true;

create index if not exists reviews_visible_created_at_idx on public.reviews (is_visible, created_at desc);
create index if not exists reviews_minecraft_username_idx on public.reviews (minecraft_username);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "No public order access" on public.orders;
create policy "No public order access"
on public.orders
for all
using (false)
with check (false);

drop policy if exists "No public review table access" on public.reviews;
create policy "No public review table access"
on public.reviews
for all
using (false)
with check (false);
