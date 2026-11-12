-- Records which extraction run produced the values on a submission.
--
-- Without these columns the review screen cannot tell an empty field that the
-- extraction deliberately left blank ("not printed on the packaging") from one
-- that was never filled in at all. They are also what makes a stored result
-- interpretable later: the model slug is pinned, and the prompt is versioned
-- and hashed, so a disagreement about a field can be traced to one run.
--
-- Safe to run more than once.

alter table public.photo_submissions
  add column if not exists extraction_model           text,
  add column if not exists extraction_prompt_version  text,
  add column if not exists extraction_prompt_sha256   text,
  add column if not exists extracted_at               timestamptz;

comment on column public.photo_submissions.extraction_model is
  'Pinned provider/model slug used for the extraction, e.g. google/gemini-2.5-flash. Never a floating alias.';

comment on column public.photo_submissions.extraction_prompt_version is
  'Version of the extraction instructions, e.g. medical-label-v5-boxhawk.';

comment on column public.photo_submissions.extraction_prompt_sha256 is
  'SHA-256 of the exact prompt text sent, so a prompt edit cannot go unnoticed.';

comment on column public.photo_submissions.extracted_at is
  'When the extraction that produced the current values ran. Null means no extraction has been recorded, and the review screen then shows no AI provenance.';

-- Finding the submissions that predate a prompt or model change.
create index if not exists photo_submissions_extracted_at_idx
  on public.photo_submissions (extracted_at desc nulls last);
