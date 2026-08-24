export const uiLocales = ["nl", "en"] as const;

export type UiLocale = (typeof uiLocales)[number];

export const defaultUiLocale: UiLocale = "nl";

export function resolveUiLocale(value: unknown): UiLocale {
  return uiLocales.find((locale) => locale === value) ?? defaultUiLocale;
}

export function resolveBrowserUiLocale(value: string | undefined): UiLocale {
  const language = value?.toLowerCase().split("-")[0];

  return language === "en" ? "en" : defaultUiLocale;
}

export const organizationTermKeys = [
  "bookingSingular",
  "bookingPlural",
  "bookAction",
  "serviceSingular",
  "servicePlural",
  "clientSingular",
  "clientPlural",
] as const;

export type OrganizationTermKey = (typeof organizationTermKeys)[number];

export interface OrganizationTerminology {
  readonly defaultLocale: string;
  readonly translations: Readonly<
    Record<
      string,
      Readonly<Partial<Record<OrganizationTermKey, string>>> | undefined
    >
  >;
}

export function resolveOrganizationTerm(
  terminology: OrganizationTerminology,
  locale: string,
  key: OrganizationTermKey,
  fallback: string,
): string {
  const language = locale.split("-")[0];

  return (
    terminology.translations[locale]?.[key] ??
    (language ? terminology.translations[language]?.[key] : undefined) ??
    terminology.translations[terminology.defaultLocale]?.[key] ??
    fallback
  );
}
