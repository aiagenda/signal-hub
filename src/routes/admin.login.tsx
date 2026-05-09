import { createFileRoute, redirect } from "@tanstack/react-router";

/** Korábbi magic-link bejelentkezés kikapcsolva — régi könyvjelzők ide kerülnek. */
export const Route = createFileRoute("/admin/login")({
  beforeLoad: () => {
    throw redirect({ to: "/admin", replace: true });
  },
});
