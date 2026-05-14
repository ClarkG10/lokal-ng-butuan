import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/admin";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast({ title: "Welcome back", variant: "success" });
      // Fade out before navigating
      setIsExiting(true);
      setTimeout(() => navigate(from, { replace: true }), 600);
    } catch {
      toast({ title: "Sign-in failed", description: "Check your credentials and try again.", variant: "error" });
      setSubmitting(false);
    }
  };

  // Fade out on logout (if there's a way to trigger it)
  useEffect(() => {
    // Optional: handle logout redirect with fade-out
    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <div className={`relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12 transition-opacity duration-600 ${isExiting ? "opacity-0" : "opacity-100"}`}>
      {/* Subtle background accent */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-green/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-brand-green/3 blur-3xl" />

      {/* Brand mark */}
      

      {/* Card */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-brand-green to-brand-green/60" />

        <div className="p-8">
          <div className="relative mb-10 flex flex-col items-center text-center opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
       
        <p className="font-display text-2xl font-bold tracking-tight text-gray-900">Admin Portal</p>
        <p className="mt-1 text-sm text-gray-500">Lokal ng Butuan City Platform</p>
      </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Sign in</h1>
          <p className="mt-1.5 text-sm text-gray-500">Enter your admin credentials to continue.</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-gray-200 focus-visible:border-brand-green focus-visible:ring-brand-green/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-gray-200 pr-10 focus-visible:border-brand-green focus-visible:ring-brand-green/20"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-6 w-full bg-brand-green text-white hover:bg-brand-green/90"
              disabled={submitting}
              loading={submitting}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>

      <p className="relative mt-7 text-sm text-gray-500 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
        <Link to="/" className="font-medium text-gray-700 underline transition-colors hover:text-gray-900">
          ← Back to website
        </Link>
      </p>
    </div>
  );
}

