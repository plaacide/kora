insert into public.roadmap_items (title, description, status, eta_label, is_official)
select
  'Contenu métier bilingue (FR/EN)',
  'L''interface est déjà en français et en anglais, mais le contenu des templates — noms de dossiers, consignes, exigences de la checklist — n''existe qu''en français. Un investisseur anglophone lit donc une checklist en français. En V1 : templates et checklists traduits, suivant la langue de chaque lecteur.',
  'planned', 'V1', true
where not exists (
  select 1 from public.roadmap_items where title = 'Contenu métier bilingue (FR/EN)'
);
