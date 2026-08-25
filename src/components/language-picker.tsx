import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

import { type UiLocale, uiLocaleStorageKey, uiLocales } from "#/shared/i18n";

const localeDetails = {
  nl: {
    fallback: "NL",
    flagSrc: "/flags/netherlands.svg",
    label: "Nederlands",
  },
  en: {
    fallback: "EN",
    flagSrc: "/flags/united-kingdom.svg",
    label: "English",
  },
} as const satisfies Record<
  UiLocale,
  { fallback: string; flagSrc: string; label: string }
>;

function storeLocalePreference(locale: UiLocale) {
  try {
    localStorage.setItem(uiLocaleStorageKey, locale);
  } catch {
    // The URL remains the source of truth when storage is unavailable.
  }
}

export function LanguagePicker({ locale }: { locale: UiLocale }) {
  const location = useLocation();

  useEffect(() => {
    storeLocalePreference(locale);
  }, [locale]);

  function hrefFor(nextLocale: UiLocale): string {
    const search = new URLSearchParams(location.searchStr);
    search.set("lang", nextLocale);
    return `${location.pathname}?${search.toString()}${location.hash}`;
  }

  return (
    <fieldset className="flex items-center gap-0.5">
      <legend className="sr-only">Language</legend>
      {uiLocales.map((nextLocale) => {
        const details = localeDetails[nextLocale];

        return (
          <a
            key={nextLocale}
            href={hrefFor(nextLocale)}
            lang={nextLocale}
            hrefLang={nextLocale}
            aria-label={details.label}
            aria-current={locale === nextLocale ? "page" : undefined}
            title={details.label}
            onClick={() => storeLocalePreference(nextLocale)}
            className="grid size-9 place-items-center rounded-full leading-none transition hover:bg-muted aria-[current=page]:bg-foreground/9 aria-[current=page]:ring-1 aria-[current=page]:ring-foreground/15"
          >
            <span className="sr-only">{details.label}</span>
            <span
              aria-hidden="true"
              className="relative grid h-[1.125rem] w-6 place-items-center font-semibold text-[0.6rem] tracking-[-0.02em]"
            >
              {details.fallback}
              <img
                src={details.flagSrc}
                alt=""
                className="absolute inset-0 size-full"
              />
            </span>
          </a>
        );
      })}
    </fieldset>
  );
}
