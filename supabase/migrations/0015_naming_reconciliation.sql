-- Pack §7 naming reconciliation: supplier_stock → stock_signals (canonical).
-- PostgREST callers that still use the old name keep working via a view.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'supplier_stock'
  ) and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'stock_signals'
  ) then
    execute 'alter table public.supplier_stock rename to stock_signals';
  end if;
end $$;

create or replace view public.supplier_stock as
  select * from public.stock_signals;

comment on table public.stock_signals is 'Pack §7 canonical name; formerly supplier_stock';
comment on view public.supplier_stock is 'Compatibility view over stock_signals';
