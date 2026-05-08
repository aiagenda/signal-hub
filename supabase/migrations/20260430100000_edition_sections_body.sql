-- Optional opening / framing copy per newsletter section (editorial voice).
alter table public.edition_sections
  add column if not exists body text;

comment on column public.edition_sections.body is 'Section intro or framing copy for the Budapest Signal edition builder UI.';
