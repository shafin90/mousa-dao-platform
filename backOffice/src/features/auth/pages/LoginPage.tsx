import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Bus, Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/shared/components/ui/LanguageSwitcher";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isAuthenticated, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/[0.07] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/[0.06] via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/[0.04] via-transparent to-transparent pointer-events-none" />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 mb-4">
            <Bus size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("app.name")}</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">{t("auth.login.title")}</p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border rounded-2xl p-7 shadow-xl shadow-black/5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={t("auth.login.email")}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.login.emailPlaceholder")}
              leftIcon={<Mail size={16} />}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="password">{t("auth.login.password")}</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border bg-background/50 px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground/60 hover:border-ring/50 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring pl-10 pr-10"
                  placeholder={t("auth.login.passwordPlaceholder")}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Lock size={16} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" isLoading={loading} className="w-full gap-2">
              {loading ? t("common.signingIn") : t("common.signIn")}
              {!loading && <ArrowRight size={16} />}
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-muted-foreground">
          Trusted by transport companies across West Africa
        </p>
      </div>
      <div className="fixed bottom-6 right-6">
        <LanguageSwitcher />
      </div>
    </div>
  );
};

export default LoginPage;
