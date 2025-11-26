-- Users managed by Supabase Auth

-- Medical Reports
create table if not exists reports (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid references auth.users(id) on delete cascade,
    filename text not null,
    storage_path text not null,
    text_content text,
    doc_type text,
    created_at timestamptz default now()
);

-- Temporary report sharing
create table if not exists share_sessions (
    id uuid primary key default gen_random_uuid(),
    report_id uuid references reports(id) on delete cascade,
    doctor_id uuid references auth.users(id) on delete cascade,
    patient_id uuid references auth.users(id) on delete cascade,
    expires_at timestamptz not null,
    is_active boolean default true,
    created_at timestamptz default now()
);
