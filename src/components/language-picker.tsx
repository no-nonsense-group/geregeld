import { Menu } from "@base-ui/react/menu";
import { useLocation } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

import { type UiLocale, uiLocaleStorageKey, uiLocales } from "#/shared/i18n";

const localeDetails = {
  nl: {
    flagSrc: "/flags/netherlands.svg",
    label: "Nederlands"
  },
  en: {
    flagSrc: "/flags/united-kingdom.svg",
    label: "English"
  },
} as const satisfies Record<UiLocale, { flagSrc: string; label: string }>;

function storeLocalePreference(locale: UiLocale) {
  try {
    localStorage.setItem(uiLocaleStorageKey, locale);
  } catch {
    // The URL remains the source of truth when storage is unavailable.
  }
}

export function LanguagePicker({ locale }: { locale: UiLocale }) {
  const location = useLocation();
  const selectedLocale = localeDetails[locale];

  function hrefFor(nextLocale: UiLocale): string {
    const search = new URLSearchParams(location.searchStr);
    search.set("lang", nextLocale);
    return `${location.pathname}?${search.toString()}${location.hash}`;
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Language: ${selectedLocale.label}`}
        className="flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm transition-colors hover:bg-muted data-popup-open:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
      >
        <img src={selectedLocale.flagSrc} alt="" className="h-4.5 w-6" />
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner
          align="end"
          sideOffset={6}
          className="z-50 outline-hidden"
        >
          <Menu.Popup className="min-w-40 rounded-xl border border-border bg-popover p-1 text-popover-foreground outline-hidden">
            {uiLocales.map((nextLocale) => {
              const details = localeDetails[nextLocale];

              return (
                <Menu.LinkItem
                  key={nextLocale}
                  href={hrefFor(nextLocale)}
                  lang={nextLocale}
                  hrefLang={nextLocale}
                  aria-current={locale === nextLocale ? "page" : undefined}
                  label={details.label}
                  closeOnClick
                  onClick={() => storeLocalePreference(nextLocale)}
                  className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm outline-hidden transition-colors data-highlighted:bg-muted aria-[current=page]:font-semibold"
                >
                  <img
                    src={details.flagSrc}
                    alt=""
                    className="h-4.5 w-6"
                  />
                  {details.label}
                </Menu.LinkItem>
              );
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
