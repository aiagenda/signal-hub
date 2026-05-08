-- Additional RSS sources for multi-category scouts (tool_radar, builder_insights, budapest_events, weekend).
-- Prerequisite: public.sources must exist — apply 20260429120000_budapest_signal_mvp.sql first (or `supabase db push`).
-- Disable or replace feeds in Dashboard if a URL returns 403/404 or blocks bots.

insert into public.sources (name, base_url, feed_url, category, active)
values
  (
    'Cloudflare Blog',
    'https://blog.cloudflare.com',
    'https://blog.cloudflare.com/rss/',
    'tool_radar',
    true
  ),
  (
    'Stack Overflow Blog',
    'https://stackoverflow.blog',
    'https://stackoverflow.blog/feed/',
    'tool_radar',
    true
  ),
  (
    'Y Combinator Blog',
    'https://www.ycombinator.com',
    'https://www.ycombinator.com/blog/rss/',
    'builder_insights',
    true
  ),
  (
    'Stripe Blog',
    'https://stripe.com',
    'https://stripe.com/blog/feed.rss',
    'builder_insights',
    true
  ),
  (
    'Telex — tech',
    'https://telex.hu',
    'https://telex.hu/rss/tech',
    'budapest_events',
    true
  ),
  (
    'HVG — tech',
    'https://hvg.hu',
    'https://hvg.hu/rss/tech',
    'budapest_events',
    true
  ),
  (
    'We Love Budapest',
    'https://welovebudapest.com',
    'https://welovebudapest.com/hu/rss',
    'weekend',
    true
  ),
  (
    'Funzine',
    'https://funzine.hu',
    'https://funzine.hu/feed/',
    'weekend',
    true
  );
