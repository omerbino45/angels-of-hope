-- Angels of Hope: database setup for Supabase.
-- Paste this whole file into SQL Editor and click Run. It is safe to run again.
--
-- BEFORE YOU RUN IT: replace the two example.com emails in step 1 with the two real admin emails.
-- Do not commit the edited copy anywhere public.

-- 1. Who may manage the site. Only these two emails can read letters or edit families.
create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

delete from public.admins where email is not null;
insert into public.admins (email) values
  ('EDIT-ME-1@example.com'),
  ('EDIT-ME-2@example.com');

do $$
begin
  if exists (select 1 from public.admins where email like '%example.com') then
    raise exception 'Replace the two example.com emails at the top of the script with the real admin emails, then run it again.';
  end if;
end $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

-- 2. Families and the people who fell.
create sequence if not exists public.family_seq start 100;

create table if not exists public.families (
  id text primary key default ('f' || nextval('public.family_seq')),
  name text not null default '',
  accepts_letters boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.fallen (
  id uuid primary key default gen_random_uuid(),
  family_id text not null references public.families (id) on delete cascade,
  name text not null default '',
  city text not null default '',
  date text not null default '',
  izkor text check (izkor is null or izkor ~ '^https://(www\.)?izkor\.gov\.il/'),
  bio text,
  photo_path text,
  sort_order int not null default 0
);
create index if not exists fallen_family_idx on public.fallen (family_id);

-- 3. Letters. Anyone can send one, only admins can read it.
create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  family_id text not null,
  greeting text not null default '',
  text text not null default '' check (length(text) <= 30000),
  signature text not null default '' check (length(signature) <= 300),
  writer text not null check (length(writer) between 1 and 120),
  email text not null default '' check (length(email) <= 200),
  phone text not null default '' check (length(phone) <= 40),
  is_public boolean not null default false,
  status text not null default 'new' check (status in ('new', 'printed', 'delivered')),
  design jsonb not null check (octet_length(design::text) <= 600000),
  created_at timestamptz not null default now()
);
create index if not exists letters_family_idx on public.letters (family_id, created_at desc);

-- 4. Access rules.
alter table public.families enable row level security;
alter table public.fallen enable row level security;
alter table public.letters enable row level security;

drop policy if exists "anyone reads families" on public.families;
drop policy if exists "admins write families" on public.families;
drop policy if exists "anyone reads fallen" on public.fallen;
drop policy if exists "admins write fallen" on public.fallen;
drop policy if exists "anyone sends a letter" on public.letters;
drop policy if exists "admins read letters" on public.letters;
drop policy if exists "admins update letters" on public.letters;
drop policy if exists "admins delete letters" on public.letters;

create policy "anyone reads families" on public.families for select to anon, authenticated using (true);
create policy "admins write families" on public.families for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "anyone reads fallen" on public.fallen for select to anon, authenticated using (true);
create policy "admins write fallen" on public.fallen for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "anyone sends a letter" on public.letters for insert to anon, authenticated
  with check (
    status = 'new'
    and (
      family_id = 'general'
      or exists (select 1 from public.families f where f.id = family_id and f.accepts_letters)
    )
  );
create policy "admins read letters" on public.letters for select to authenticated using (public.is_admin());
create policy "admins update letters" on public.letters for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete letters" on public.letters for delete to authenticated using (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.families, public.fallen to anon, authenticated;
grant insert, update, delete on public.families, public.fallen to authenticated;
grant insert on public.letters to anon, authenticated;
grant select, update, delete on public.letters to authenticated;
grant usage on sequence public.family_seq to authenticated;

-- 5. Files. Photos of the fallen are public. Images that writers upload are private to admins.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('photos', 'photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('letter-images', 'letter-images', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins manage photos" on storage.objects;
drop policy if exists "anyone uploads letter images" on storage.objects;
drop policy if exists "admins manage letter images" on storage.objects;

create policy "admins manage photos" on storage.objects for all to authenticated
  using (bucket_id = 'photos' and public.is_admin())
  with check (bucket_id = 'photos' and public.is_admin());
create policy "anyone uploads letter images" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'letter-images');
create policy "admins manage letter images" on storage.objects for all to authenticated
  using (bucket_id = 'letter-images' and public.is_admin())
  with check (bucket_id = 'letter-images' and public.is_admin());

-- 6. The starting list of families (only when the table is empty, so editing later is never overwritten).
do $$
begin
  if not exists (select 1 from public.families) then
    insert into public.families (id, name, sort_order) values
    ('f1', 'משפחת הרשקוביץ', 1),
    ('f2', 'משפחת מרנץ', 2),
    ('f3', 'משפחת אביטבול', 3),
    ('f4', 'משפחת בן משה', 4),
    ('f5', 'משפחת קלמנזון', 5),
    ('f6', 'משפחת רובינשטיין', 6),
    ('f7', 'משפחת אלמליח', 7),
    ('f8', 'משפחת בן הרוש', 8),
    ('f9', 'משפחת פלד', 9),
    ('f10', 'משפחת שמיר', 10),
    ('f11', 'משפחת כהן', 11),
    ('f12', 'משפחת שני', 12),
    ('f13', 'משפחת מאיר', 13),
    ('f14', 'משפחת הרץ', 14),
    ('f15', 'משפחת סלוטקי', 15),
    ('f17', 'משפחת אליהו', 16),
    ('f18', 'משפחת פיזם', 17),
    ('f19', 'משפחת הרשקוביץ', 18),
    ('f20', 'משפחת פליישמן', 19),
    ('f21', 'משפחת מויאל', 20),
    ('f22', 'משפחת לובר', 21),
    ('f23', 'משפחת נולר', 22),
    ('f24', 'משפחת וינקלשטיין', 23),
    ('f25', 'משפחת פרידמן', 24),
    ('f26', 'משפחת גורדון', 25),
    ('f27', 'משפחת גניזת', 26),
    ('f28', 'משפחת גאלדור', 27),
    ('f29', 'משפחת שבתאי', 28),
    ('f30', 'משפחת מאיר יונג', 29),
    ('f31', 'משפחת נדלין', 30),
    ('f32', 'משפחת גבאי', 31),
    ('f33', 'משפחת מושיוף', 32),
    ('f34', 'משפחת זגייה', 33),
    ('f35', 'משפחת זירנשיין', 34);
    insert into public.fallen (family_id, name, city, date, izkor, sort_order) values
    ('f1', 'נתנאל הרשקוביץ', 'קדמת עדן', '10.10.24', 'https://www.izkor.gov.il/%D7%A0%D7%AA%D7%A0%D7%90%D7%9C%20%D7%94%D7%A8%D7%A9%D7%A7%D7%95%D7%91%D7%99%D7%A5/en_f65ec02fc7b3cfdf6203537e00f839d5', 0),
    ('f2', 'צבי מתיתיהו מרנץ', 'גבע אדם', '10.10.24', 'https://www.izkor.gov.il/%D7%A6%D7%91%D7%99%20%D7%9E%D7%AA%D7%99%D7%AA%D7%99%D7%94%D7%95%20%D7%9E%D7%A8%D7%A0%D7%A5/en_fa3ee0156459531ae671c2907a4fbba1', 0),
    ('f3', 'אליאב עמרם אביטבול', 'איתן', '26.10.24', 'https://www.izkor.gov.il/%D7%90%D7%9C%D7%99%D7%90%D7%91%20%D7%A2%D7%9E%D7%A8%D7%9D%20%D7%90%D7%91%D7%99%D7%98%D7%91%D7%95%D7%9C/en_d0113f1e3c459b18ced3a7d10e160ef8', 0),
    ('f4', 'מיכאל בן משה', 'אשקלון', '7.10.23', 'https://www.izkor.gov.il/%D7%9E%D7%99%D7%9B%D7%90%D7%9C%20%D7%91%D7%9F%20%D7%9E%D7%A9%D7%94/en_ce014d450eb35e0bcd4823895c83fd2f', 0),
    ('f5', 'אלחנן קלמנזון', 'עותניאל', '8.10.23', 'https://www.izkor.gov.il/%D7%90%D7%9C%D7%97%D7%A0%D7%9F%20%D7%9E%D7%90%D7%99%D7%A8%20%D7%A7%D7%9C%D7%9E%D7%A0%D7%96%D7%95%D7%9F/en_038713149fcf18c7183b9b1572606ea4', 0),
    ('f6', 'שגיא יעקב רובינשטיין', 'קיבוץ לביא', '8.12.24', 'https://www.izkor.gov.il/%D7%A9%D7%92%D7%99%D7%90%20%D7%99%D7%A2%D7%A7%D7%91%20%D7%A8%D7%95%D7%91%D7%99%D7%A0%D7%A9%D7%98%D7%99%D7%99%D7%9F/en_d651a562786e9a8eeb17e4ca2f6a4df5', 0),
    ('f7', 'גלעד אלמליח', 'ירושלים', '26.10.24', 'https://www.izkor.gov.il/%D7%92%D7%9C%D7%A2%D7%93%20%D7%90%D7%9C%D7%9E%D7%9C%D7%99%D7%97/en_714344606dc8a2ca759b9c9eae3ffabd', 0),
    ('f8', 'דניאל יעקב בן הרוש', 'צופים', '18.12.23', 'https://www.izkor.gov.il/%D7%93%D7%A0%D7%99%D7%90%D7%9C%20%D7%99%D7%A2%D7%A7%D7%91%20%D7%91%D7%9F%20%D7%94%D7%A8%D7%95%D7%A9/en_70331b9e79c41bd38bf6d0bd4c6c6284', 0),
    ('f9', 'יותם פלד', 'ראש העין', '17.8.24', 'https://www.izkor.gov.il/%D7%99%D7%95%D7%AA%D7%9D%20%D7%99%D7%A6%D7%97%D7%A7%20%D7%A4%D7%9C%D7%93/en_06c8ebeb5c706eedf08af5eba2029b5e', 0),
    ('f10', 'מרדכי (מוטי) שמיר', 'חוות יאיר', '7.10.23', 'https://www.izkor.gov.il/%D7%9E%D7%A8%D7%93%D7%9B%D7%99%20%D7%9E%D7%95%D7%98%D7%99%20%D7%A9%D7%9E%D7%99%D7%A8/en_4f5410b507b93bc27a7a61aaff2cd67a', 0),
    ('f11', 'אוריאל כהן', 'צור הדסה', '19.12.23', 'https://www.izkor.gov.il/%D7%90%D7%95%D7%A8%D7%99%D7%90%D7%9C%20%D7%9B%D7%94%D7%9F/en_00704ab7bfadfeba03c12c8ad45de408', 0),
    ('f12', 'גבריאל שני', 'עלי', '30.1.24', 'https://www.izkor.gov.il/%D7%92%D7%91%D7%A8%D7%99%D7%90%D7%9C%20%D7%A9%D7%A0%D7%99/en_b73ba2181790e6686d3084590251deb9', 0),
    ('f13', 'דוד מאיר', 'תקוע', '7.10.23', 'https://www.izkor.gov.il/%D7%93%D7%95%D7%93%20%D7%97%D7%99%D7%99%D7%9D%20%D7%9E%D7%90%D7%99%D7%A8/en_2d641888ac255414d0ad7c44b02a64b4', 0),
    ('f14', 'נחמן נתן הרץ', 'אלעזר', '6.5.24', 'https://www.izkor.gov.il/%D7%A0%D7%97%D7%9E%D7%9F%20%D7%A0%D7%AA%D7%9F%20%D7%94%D7%A8%D7%A5/en_efb6137fc074abdb13fdc75bc30f2ebc', 0),
    ('f15', 'ישי סלוטקי', 'יד בנימין', '7.10.23', 'https://www.izkor.gov.il/%D7%99%D7%A9%D7%99%20%D7%A1%D7%9C%D7%95%D7%98%D7%A7%D7%99/en_0628638115d328557b91ba5e90f42475', 0),
    ('f15', 'נועם סלוטקי', 'רחובות', '7.10.23', 'https://www.izkor.gov.il/%D7%A0%D7%95%D7%A2%D7%9D%20%D7%A1%D7%9C%D7%95%D7%98%D7%A7%D7%99/en_e9f6ae2cb4b7ac5693644e8937cdc44b', 1),
    ('f17', 'ידידה אליהו', 'רמת גלעד', '3.11.23', 'https://www.izkor.gov.il/%D7%99%D7%93%D7%99%D7%93%D7%99%D7%94%20%D7%90%D7%9C%D7%99%D7%94%D7%95/en_ee34efdcee8eb0a6db6b096ba3a15db8', 0),
    ('f18', 'שי אוריאל פיזם', 'עין הנציב', '15.12.23', 'https://www.izkor.gov.il/%D7%A9%D7%99%20%D7%90%D7%95%D7%A8%D7%99%D7%90%D7%9C%20%D7%A4%D7%99%D7%96%D7%9D/en_06c46f702e04d0593c5307811c6bdfeb', 0),
    ('f19', 'יוסף חיים הרשקוביץ', 'גוש עציון', '10.11.23', 'https://www.izkor.gov.il/%D7%99%D7%95%D7%A1%D7%A3%20%D7%97%D7%99%D7%99%D7%9D%20(%D7%99%D7%95%D7%A1%D7%99)%20%D7%94%D7%A8%D7%A9%D7%A7%D7%95%D7%91%D7%99%D7%A5/en_a3a9a56f86d8ed6a2a6dc5a4f1609ac5', 0),
    ('f20', 'ינון פליישמן', 'ירושלים', '29.10.23', 'https://www.izkor.gov.il/%D7%99%D7%A0%D7%95%D7%9F%20%D7%A4%D7%9C%D7%99%D7%99%D7%A9%D7%9E%D7%9F/en_1b6501df411f52a43a930f2e22880b2d', 0),
    ('f21', 'שאול מויאל', 'אלוני שילה', '26.10.24', 'https://www.izkor.gov.il/%D7%A9%D7%90%D7%95%D7%9C%20%D7%9E%D7%95%D7%99%D7%90%D7%9C/en_7a6dc36c69d4f40980c4b0b18d7d11e0', 0),
    ('f22', 'אלישע יהונתן לובר', 'יצהר', '25.10.23', 'https://www.izkor.gov.il/%D7%90%D7%9C%D7%99%D7%A9%D7%A2%20%D7%99%D7%94%D7%95%D7%A0%D7%AA%D7%9F%20%D7%9C%D7%95%D7%91%D7%A8/en_83f73f20264607d93c183c56aae2e6e1', 0),
    ('f23', 'נדב אלחנן נולר', 'ירושלים', '1.7.24', 'https://www.izkor.gov.il/%D7%A0%D7%93%D7%91%20%D7%90%D7%9C%D7%97%D7%A0%D7%9F%20%D7%A0%D7%95%D7%9C%D7%A8/en_95f055e3452c0945d267fb0f3d29919a', 0),
    ('f24', 'אלעד יעקב וינקלשטיין', 'עין הנציב', '6.01.25', 'https://www.izkor.gov.il/%D7%90%D7%9C%D7%A2%D7%93%20%D7%99%D7%A2%D7%A7%D7%91%20%D7%95%D7%99%D7%A0%D7%A7%D7%9C%D7%A9%D7%98%D7%99%D7%99%D7%9F/en_31750171b690c0f59b8232d96c0a9042', 0),
    ('f25', 'אברהם פרידמן', 'עין הנציב', '4.02.25', 'https://www.izkor.gov.il/%D7%90%D7%91%D7%A8%D7%94%D7%9D%20%D7%A6%D7%91%D7%99%20(%D7%A6%D7%91%D7%99%D7%A7%D7%94)%20%D7%A4%D7%A8%D7%99%D7%93%D7%9E%D7%9F/en_a3ea548ec9f6a2d115b9565fc956f41a', 0),
    ('f26', 'נפתלי יונה גורדון', 'ירושלים', '7.12.23', 'https://www.izkor.gov.il/%D7%A0%D7%A4%D7%AA%D7%9C%D7%99%20%D7%99%D7%95%D7%A0%D7%94%20%D7%92%D7%95%D7%A8%D7%93%D7%95%D7%9F/en_c5094c5229ada0f8d409c3dbfa9740f5', 0),
    ('f27', 'רוני גניזת', 'גבעת שמואל', '9.10.24', 'https://www.izkor.gov.il/%D7%A8%D7%95%D7%A0%D7%99%20%D7%92%D7%A0%D7%99%D7%96%D7%AA/en_cd0d87987564499740aeb36f7a73890c', 0),
    ('f28', 'עמר משה גאלדור', 'ירושלים', '19.11.24', 'https://www.izkor.gov.il/%D7%A2%D7%9E%D7%A8%20%D7%9E%D7%A9%D7%94%20%D7%92%D7%90%D7%9C%D7%93%D7%95%D7%A8/en_fb43c72e06abb297fdd46ac6245e332c', 0),
    ('f29', 'גיא שבתאי', 'ירושלים', '8.11.2024', 'https://www.izkor.gov.il/%D7%92%D7%99%D7%90%20%D7%A9%D7%91%D7%AA%D7%90%D7%99/en_4aca02273cdb803691932223a857c57d', 0),
    ('f30', 'עפר מאיר יונג', 'תל אביב', '4.2.2025', 'https://www.izkor.gov.il/%D7%A2%D7%A4%D7%A8%20%D7%99%D7%95%D7%A0%D7%92/en_510c021a8af53f2c24e78872ab557307', 0),
    ('f31', 'יעקב נדלין', 'אור עקיבא', '13.10.2023', 'https://www.izkor.gov.il/%D7%99%D7%A2%D7%A7%D7%91%20%D7%A0%D7%93%D7%9C%D7%99%D7%9F/en_1b33425ced48613dc74eecad95e54056', 0),
    ('f32', 'אלירז גבאי', 'באר יעקב', '30.12.2023', 'https://www.izkor.gov.il/%D7%90%D7%9C%D7%99%D7%A8%D7%96%20%D7%92%D7%91%D7%90%D7%99/en_94da08281a3b6373e76fd60b71a70997', 0),
    ('f33', 'רפאל אליאס מושיוף', 'תל אביב', '22.1.2024', 'https://www.izkor.gov.il/%D7%A8%D7%A4%D7%90%D7%9C%20%D7%90%D7%9C%D7%99%D7%90%D7%A1%20%D7%9E%D7%95%D7%A9%D7%99%D7%95%D7%A3/en_5ba0a15cfa1072e712bfa695926eaa83', 0),
    ('f34', 'דניאל קאסאו זגייה', 'ירושלים', '22.1.2024', 'https://www.izkor.gov.il/%D7%93%D7%A0%D7%99%D7%90%D7%9C%20%D7%A7%D7%90%D7%A1%D7%90%D7%95%20(%D7%93%D7%A0%D7%99)%20%D7%96%D7%92%D7%99%D7%99%D7%94/en_bfe3b481deac47a207f5cf02fb2ee92b', 0),
    ('f35', 'יבגני זירנשיין', 'זכרון יעקב', '8.12.2024', 'https://www.izkor.gov.il/%D7%99%D7%91%D7%92%D7%A0%D7%99%20%D7%96%D7%99%D7%A0%D7%A8%D7%A9%D7%99%D7%99%D7%9F/en_8fcf1fae60cd0343b5153585d006fc9a', 0);
  end if;
end $$;
