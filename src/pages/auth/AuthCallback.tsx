import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores";

// Handles Google OAuth redirect — loads session then routes to dashboard or onboarding
export default function AuthCallback() {
  const navigate = useNavigate();
  const { loadSession } = useAuthStore();

  useEffect(() => {
    let done = false;

    async function handleSession(session: { user: { id: string } }) {
      if (done) return;
      done = true;

      // Fetch profile to check if onboarding was already completed
      const { data: profile } = await supabase
        .from("profiles")
        .select("travel_interests")
        .eq("id", session.user.id)
        .single();

      const hasInterests = (profile?.travel_interests as string[] | null)?.length ?? 0;

      // Sync full auth state into the store
      await loadSession();

      navigate(hasInterests > 0 ? "/dashboard" : "/onboarding", { replace: true });
    }

    // 1. Check immediately — Supabase may have already exchanged the code
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) handleSession(session);
    });

    // 2. Also listen for auth state changes (covers slower code exchanges)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
          subscription.unsubscribe();
          await handleSession(session);
          return;
        }
        // No session on INITIAL_SESSION = no code in URL, go back to login
        if (event === "INITIAL_SESSION" && !session && !done) {
          subscription.unsubscribe();
          navigate("/login", { replace: true });
        }
      }
    );

    // Safety fallback: 10 seconds max
    const timeout = setTimeout(() => {
      if (!done) {
        subscription.unsubscribe();
        navigate("/login", { replace: true });
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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
