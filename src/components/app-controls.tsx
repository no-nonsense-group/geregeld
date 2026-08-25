import { LogOut } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import { signOutFn } from "#/contexts/identity/slices/current-user/functions";
import type { UiLocale } from "#/shared/i18n";
import { LanguagePicker } from "./language-picker";

const signOutCopy = {
  nl: { idle: "Uitloggen", pending: "Uitloggen..." },
  en: { idle: "Sign out", pending: "Signing out..." },
} as const satisfies Record<UiLocale, { idle: string; pending: string }>;

export function AppControls({
  authenticated,
  locale,
}: {
  authenticated: boolean;
  locale: UiLocale;
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
      className="fixed top-3 right-3 z-50 flex items-center gap-1 rounded-full border border-border bg-card/92 p-1 shadow-sm backdrop-blur-xl"
    >
      {authenticated ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isSigningOut}
          onClick={signOut}
          className="rounded-full"
        >
          <LogOut aria-hidden="true" />
          {isSigningOut ? copy.pending : copy.idle}
        </Button>
      ) : null}
      <LanguagePicker locale={locale} />
    </aside>
  );
}
