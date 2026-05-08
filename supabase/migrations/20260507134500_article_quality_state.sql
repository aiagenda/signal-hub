-- Publish state machine extension for articles.
alter type public.article_status add value if not exists 'quality_passed';
