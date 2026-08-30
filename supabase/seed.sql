-- Optional sample data for local UI checks.
-- Run after schema.sql. Safe to run more than once for this sample household name.

insert into households (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Home')
on conflict (id) do nothing;

insert into settings (household_id, total_budget)
values ('00000000-0000-0000-0000-000000000001', 800000)
on conflict (household_id) do update set total_budget = excluded.total_budget;

insert into categories (id, household_id, type, name, budget_amount, sort_order)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'appliance', '冷蔵庫', 180000, 1),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'appliance', '洗濯機', 128000, 2),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'furniture', 'ベッド', 92000, 1),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'furniture', 'ソファ', 78000, 2)
on conflict (id) do nothing;

insert into items (id, household_id, category_id, name, maker, model_number, price, url, image_url, shop_name, memo, status)
values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'スリム冷蔵庫 406L', 'Hitachi', 'R-HWS47', 180000, 'https://example.com/fridge', 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=300&auto=format&fit=crop', '量販店', '幅が合う', 'selected'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'ドラム式洗濯乾燥機', 'Toshiba', 'TW-127', 128000, 'https://example.com/washer', 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=300&auto=format&fit=crop', '量販店', '乾燥重視', 'selected'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '収納付きベッド', 'Nitori', 'BD-LOW', 92000, 'https://example.com/bed', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=300&auto=format&fit=crop', 'Nitori', '寝室に合う', 'selected'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', '2人掛けソファ', 'Muji', 'SF-2', 78000, 'https://example.com/sofa', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop', 'Muji', '座り心地が良い', 'selected')
on conflict (id) do nothing;
