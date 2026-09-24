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
    // Supabase automatically exchanges the OAuth code in the URL.
    // We listen for SIGNED_IN which fires once the session is ready.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          subscription.unsubscribe();

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
          return;
        }

        // If no session arrives within a reasonable time, fall back to login
        if (event === "INITIAL_SESSION" && !session) {
          subscription.unsubscribe();
          navigate("/login", { replace: true });
        }
      }
    );

    // Safety fallback: if nothing fires in 8 seconds, redirect to login
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      navigate("/login", { replace: true });
    }, 8000);

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
