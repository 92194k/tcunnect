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
    async function handle() {
      // Let Supabase pick up the OAuth tokens from the URL hash
      const { data } = await supabase.auth.getSession();

      if (!data.session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      // Fetch profile to check if onboarding was already completed
      const { data: profile } = await supabase
        .from("profiles")
        .select("travel_interests")
        .eq("id", data.session.user.id)
        .single();

      const hasInterests = (profile?.travel_interests as string[] | null)?.length ?? 0;

      // Sync full auth state
      await loadSession();

      // Route based on completion
      navigate(hasInterests > 0 ? "/dashboard" : "/onboarding", { replace: true });
    }

    handle();
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
