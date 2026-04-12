-- schema for members
create table members (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  phone text not null,
  photo_url text,
  plan_type text not null, -- Monthly, Quarterly, Half Yearly, Annual
  joining_date date not null,
  expiry_date date not null,
  status text check (status in ('active', 'expiring_soon', 'expired')),
  qr_code_data text,
  created_at timestamp with time zone default now()
);

-- schema for plans (optional but recommended)
create table plans (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  duration_days int not null,
  price numeric not null
);

-- RLS (Row Level Security) - simplify for now but enable it
alter table members enable row level security;
alter table plans enable row level security;

-- simple policy for now: anyone can read/write (user should configure properly for production)
create policy "Allow all access to members" on members for all using (true);
create policy "Allow all access to plans" on plans for all using (true);
