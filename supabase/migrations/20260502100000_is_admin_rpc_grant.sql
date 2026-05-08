-- Allow authenticated clients to call is_admin() for the admin UI gate (JWT + profiles + admin_emails).

grant execute on function public.is_admin() to authenticated;

comment on function public.is_admin() is 'PostgREST rpc: true if auth.uid() has profiles.role=admin or JWT email is in admin_emails.';
