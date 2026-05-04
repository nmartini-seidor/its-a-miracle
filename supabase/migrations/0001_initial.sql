-- Mirakl Product Enrichment initial schema.
create extension if not exists pgcrypto;

create table if not exists public.mirakl_providers (id uuid primary key default gen_random_uuid(), provider_id text not null unique, shop_name text, shop_state text, raw_payload jsonb not null default '{}', last_synced_at timestamptz);
create table if not exists public.categories (id uuid primary key default gen_random_uuid(), code text not null unique, label text not null, parent_code text, source text not null default 'mirakl', created_at timestamptz not null default now());
create table if not exists public.category_attributes (id uuid primary key default gen_random_uuid(), category_code text not null references public.categories(code), code text not null, label text not null, data_type text not null default 'TEXT', is_required boolean not null default false, created_at timestamptz not null default now(), unique(category_code, code));
create table if not exists public.mirakl_value_lists (id uuid primary key default gen_random_uuid(), list_code text not null, value_code text not null, label text not null, raw_payload jsonb not null default '{}', unique(list_code, value_code));
create table if not exists public.products (id uuid primary key default gen_random_uuid(), source_sku text not null unique, title text not null, brand text, category_path text[] not null default '{}', ean text, status text not null default 'NEW', score integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.product_sources (id uuid primary key default gen_random_uuid(), product_id uuid references public.products(id) on delete cascade, provider_id text not null, provider_unique_identifier text not null, status text, source_hash text not null, raw_payload jsonb not null default '{}', errors jsonb not null default '[]', warnings jsonb not null default '[]', unique(provider_id, provider_unique_identifier));
create table if not exists public.product_baseline_snapshots (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, source_product_identifier text not null, mirakl_status text, category_code text, brand_code text, title text, description text, attributes jsonb not null default '{}', warnings jsonb not null default '[]', errors jsonb not null default '[]', source_hash text not null, captured_at timestamptz not null default now());
create table if not exists public.product_attribute_values (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, attribute_code text not null, value text, origin text not null check (origin in ('mirakl_baseline','source','accepted_candidate')), created_at timestamptz not null default now(), unique(product_id, attribute_code, origin));
create table if not exists public.quality_scores (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, score integer not null check (score between 0 and 100), band text not null, components jsonb not null default '{}', calculated_at timestamptz not null default now(), unique(product_id));
create table if not exists public.evidence_sources (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, source_type text not null, title text not null, url text, accessed_at timestamptz not null, excerpt text not null, confidence text not null check (confidence in ('high','medium','low')), created_at timestamptz not null default now());
create table if not exists public.enrichment_jobs (id uuid primary key default gen_random_uuid(), product_id uuid references public.products(id) on delete cascade, job_type text not null, status text not null default 'QUEUED', requested_by uuid, started_at timestamptz, completed_at timestamptz, error_summary text, created_at timestamptz not null default now());
create table if not exists public.enrichment_candidates (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, field_path text not null, current_value text, candidate_value text not null, confidence text not null check (confidence in ('high','medium','low')), status text not null check (status in ('proposed','accepted','rejected','needs_evidence')) default 'proposed', created_at timestamptz not null default now());
create table if not exists public.candidate_evidence_links (candidate_id uuid not null references public.enrichment_candidates(id) on delete cascade, evidence_source_id uuid not null references public.evidence_sources(id) on delete cascade, support_type text not null default 'direct', primary key(candidate_id, evidence_source_id));
create table if not exists public.external_research_runs (id uuid primary key default gen_random_uuid(), enrichment_job_id uuid references public.enrichment_jobs(id) on delete cascade, product_id uuid not null references public.products(id) on delete cascade, mission jsonb not null, allowed_sources jsonb not null default '[]', status text not null check (status in ('QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELLED')) default 'QUEUED', runner text not null default 'opencode-lightweb', summary text, error_summary text, started_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now());
create table if not exists public.review_decisions (id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.enrichment_candidates(id) on delete cascade, decision text not null check (decision in ('APPROVE','REJECT','REQUEST_MORE_EVIDENCE')), reason text, reviewed_by uuid, created_at timestamptz not null default now());
create table if not exists public.export_batches (id uuid primary key default gen_random_uuid(), status text not null default 'DRAFT_PREVIEW_ONLY', created_at timestamptz not null default now());
create table if not exists public.export_batch_items (id uuid primary key default gen_random_uuid(), export_batch_id uuid not null references public.export_batches(id) on delete cascade, candidate_id uuid not null references public.enrichment_candidates(id), row_payload jsonb not null default '{}');
create table if not exists public.import_attempts (id uuid primary key default gen_random_uuid(), export_batch_id uuid references public.export_batches(id), mirakl_import_id text, status text, submitted_at timestamptz);
create table if not exists public.audit_events (id uuid primary key default gen_random_uuid(), actor_type text not null, event_type text not null, entity_type text not null, entity_id uuid, metadata jsonb not null default '{}', created_at timestamptz not null default now());

create index if not exists products_source_sku_idx on public.products(source_sku);
create index if not exists product_sources_provider_identifier_idx on public.product_sources(provider_id, provider_unique_identifier);
create index if not exists enrichment_candidates_product_status_idx on public.enrichment_candidates(product_id, status);
create index if not exists evidence_sources_product_idx on public.evidence_sources(product_id);
create index if not exists audit_events_entity_idx on public.audit_events(entity_type, entity_id, created_at);

alter table public.mirakl_providers enable row level security;
alter table public.categories enable row level security;
alter table public.category_attributes enable row level security;
alter table public.mirakl_value_lists enable row level security;
alter table public.products enable row level security;
alter table public.product_sources enable row level security;
alter table public.product_baseline_snapshots enable row level security;
alter table public.product_attribute_values enable row level security;
alter table public.quality_scores enable row level security;
alter table public.evidence_sources enable row level security;
alter table public.enrichment_jobs enable row level security;
alter table public.enrichment_candidates enable row level security;
alter table public.candidate_evidence_links enable row level security;
alter table public.external_research_runs enable row level security;
alter table public.review_decisions enable row level security;
alter table public.export_batches enable row level security;
alter table public.export_batch_items enable row level security;
alter table public.import_attempts enable row level security;
alter table public.audit_events enable row level security;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_admin') then create role app_admin; end if;
  if not exists (select 1 from pg_roles where rolname = 'app_operator') then create role app_operator; end if;
  if not exists (select 1 from pg_roles where rolname = 'app_reviewer') then create role app_reviewer; end if;
  if not exists (select 1 from pg_roles where rolname = 'app_auditor') then create role app_auditor; end if;
  if not exists (select 1 from pg_roles where rolname = 'enrichment_service') then create role enrichment_service; end if;
end $$;

create policy "audited read products" on public.products for select using (true);
create policy "audited read categories" on public.categories for select using (true);
create policy "audited read attributes" on public.category_attributes for select using (true);
create policy "audited read evidence" on public.evidence_sources for select using (true);
create policy "audited read candidates" on public.enrichment_candidates for select using (true);
create policy "service writes research jobs" on public.external_research_runs for insert with check (current_user in ('enrichment_service','postgres'));
create policy "service writes candidates" on public.enrichment_candidates for insert with check (current_user in ('enrichment_service','postgres'));
create policy "reviewer appends decisions" on public.review_decisions for insert with check (current_user in ('app_admin','app_operator','app_reviewer','postgres'));
create policy "service writes audit" on public.audit_events for insert with check (current_user in ('enrichment_service','postgres'));
