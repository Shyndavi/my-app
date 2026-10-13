
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import Dashboard from "./Dashboard";

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("Unable to check login session:", error.message);
        setSession(null);
      } else {
        setSession(data.session);
      }

      setCheckingSession(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setCheckingSession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checkingSession) {
    return (
      <main className="login-page">
        <p>Loading Campus Notes Hub...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <Login
        onLogin={(newSession) => {
          setSession(newSession);
        }}
      />
    );
  }

  return <Dashboard key={session.user.id} />;
}
