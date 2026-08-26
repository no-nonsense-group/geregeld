import { LogOut } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import { signOutFn } from "#/contexts/identity/slices/current-user/functions";
import { cn } from "#/lib/utils";
import type { UiLocale } from "#/shared/i18n";
import { LanguagePicker } from "./language-picker";

const signOutCopy = {
  nl: { idle: "Uitloggen", pending: "Uitloggen..." },
  en: { idle: "Sign out", pending: "Signing out..." },
} as const satisfies Record<UiLocale, { idle: string; pending: string }>;

export function AppControls({
  authenticated,
  locale,
  className,
}: {
  authenticated: boolean;
  locale: UiLocale;
  className?: string;
}) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const copy = signOutCopy[locale];

  async function signOut() {
    setIsSigningOut(true);

    try {
      await signOutFn();
    } finally {
      window.location.assign(`/login?lang=${locale}`);
    }
  }

  return (
    <aside
      aria-label={locale === "nl" ? "Account en taal" : "Account and language"}
      className={cn("flex items-center gap-2", className)}
    >
      {authenticated ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={isSigningOut}
            onClick={signOut}
            className="rounded-lg px-2.5 font-normal text-muted-foreground hover:text-foreground sm:px-3"
          >
            <LogOut aria-hidden="true" />
            <span className="hidden sm:inline">
              {isSigningOut ? copy.pending : copy.idle}
            </span>
          </Button>
          <span className="h-6 w-px bg-border" aria-hidden="true" />
        </>
      ) : null}
      <LanguagePicker locale={locale} />
    </aside>
  );
}
