import React from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
];

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1">
      <Globe size={14} className="text-muted-foreground" />
      {LANGUAGES.map((lang, i) => (
        <React.Fragment key={lang.code}>
          <button
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`text-xs font-medium transition-colors hover:text-foreground ${
              i18n.language.startsWith(lang.code) ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {lang.label}
          </button>
          {i < LANGUAGES.length - 1 && <span className="text-muted-foreground/40 text-xs">|</span>}
        </React.Fragment>
      ))}
    </div>
  );
};
