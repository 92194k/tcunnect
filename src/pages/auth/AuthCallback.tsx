import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores";

/**
 * /auth/callback
 * Supabase redirects here after Google OAuth.
 * - If the user signed in via Google only (no password set), redirect to /set-password.
 * - Otherwise route to dashboard or onboarding based on profile.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { loadSession } = useAuthStore();

  useEffect(() => {
    let handled = false;

    async function finish(userId: string, identities: { provider: string }[]) {
      if (handled) return;
      handled = true;

      // If user has only a Google identity (no email/password identity), send to set-password
      const hasEmailIdentity = identities.some(
        (id) => id.provider === "email"
      );
      const hasGoogleIdentity = identities.some(
        (id) => id.provider === "google"
      );

      if (hasGoogleIdentity && !hasEmailIdentity) {
        navigate("/set-password", { replace: true });
        return;
      }

      await loadSession();

      const { data: profile } = await supabase
        .from("profiles")
        .select("travel_interests")
        .eq("id", userId)
        .single();

      const hasOnboarded = ((profile?.travel_interests as string[] | null)?.length ?? 0) > 0;
      navigate(hasOnboarded ? "/dashboard" : "/onboarding", { replace: true });
    }

    // First check: session may already be ready
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        finish(session.user.id, (session.user.identities ?? []) as { provider: string }[]);
      }
    });

    // Second check: listen for the exchange completing asynchronously
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        subscription.unsubscribe();
        finish(session.user.id, (session.user.identities ?? []) as { provider: string }[]);
        return;
      }
      if (event === "INITIAL_SESSION" && !session && !handled) {
        subscription.unsubscribe();
        navigate("/login", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-100 flex flex-col items-center justify-center gap-4">
      <div className="h-12 w-12 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-md">
        <Compass className="h-6 w-6" />
      </div>
      <div className="h-8 w-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-500 font-medium">Signing you in…</p>
    </div>
  );
}
