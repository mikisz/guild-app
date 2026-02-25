-- Enable necessary extensions if not present
create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  display_name text not null,
  project_count int default 0 not null
);
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Function to handle new user signups automagically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- PROJECTS
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now() not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  website_url text not null,
  thumbnail_url text
);
alter table public.projects enable row level security;
create policy "Projects are viewable by everyone." on public.projects for select using (true);
create policy "Authenticated users can insert projects" on public.projects for insert with check (auth.uid() = user_id);
create policy "Users can update their own projects." on public.projects for update using (auth.uid() = user_id);
create policy "Users can delete their own projects." on public.projects for delete using (auth.uid() = user_id);

-- LIKES
create table if not exists public.likes (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now() not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  unique (user_id, project_id)
);
alter table public.likes enable row level security;
create policy "Likes are viewable by everyone" on public.likes for select using (true);
create policy "Authenticated users can insert likes" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users can delete their own likes" on public.likes for delete using (auth.uid() = user_id);

-- COMMENTS
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now() not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  text text not null
);
alter table public.comments enable row level security;
create policy "Comments are viewable by everyone" on public.comments for select using (true);
create policy "Authenticated users can insert comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can delete their own comments" on public.comments for delete using (auth.uid() = user_id);

-- PROJECT COUNT TRIGGERS
create or replace function public.update_project_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set project_count = project_count + 1 where id = new.user_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set project_count = project_count - 1 where id = old.user_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_project_added_or_removed on public.projects;
create trigger on_project_added_or_removed
  after insert or delete on public.projects
  for each row execute procedure public.update_project_count();

-- storage policies (make sure bucket name is 'thumbnails')
insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', true) on conflict do nothing;

create policy "Thumbnails are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'thumbnails' );

create policy "Authenticated users can upload thumbnails."
  on storage.objects for insert
  with check ( bucket_id = 'thumbnails' and auth.role() = 'authenticated' );
