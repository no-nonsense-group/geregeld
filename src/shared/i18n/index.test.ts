import { describe, expect, it } from "vitest";

import {
  type OrganizationTerminology,
  resolveBrowserUiLocale,
  resolveOrganizationTerm,
  resolvePreferredUiLocale,
  resolveUiLocale,
} from "./index";

describe("UI locale resolution", () => {
  it("accepts supported locales and falls back to Dutch", () => {
    expect(resolveUiLocale("en")).toBe("en");
    expect(resolveUiLocale("de")).toBe("nl");
    expect(resolveUiLocale(undefined)).toBe("nl");
  });
});

describe("browser locale resolution", () => {
  it("uses English only for English browsers", () => {
    expect(resolveBrowserUiLocale("en-US")).toBe("en");
    expect(resolveBrowserUiLocale("nl-NL")).toBe("nl");
    expect(resolveBrowserUiLocale("de-DE")).toBe("nl");
    expect(resolveBrowserUiLocale(undefined)).toBe("nl");
  });
});

describe("preferred locale resolution", () => {
  it("prefers an explicit URL locale over stored and browser values", () => {
    expect(resolvePreferredUiLocale("nl", "en", "en-US")).toBe("nl");
  });

  it("uses the stored preference when the URL has no locale", () => {
    expect(resolvePreferredUiLocale(undefined, "en", "nl-NL")).toBe("en");
  });

  it("falls back to the browser when no preference is stored", () => {
    expect(resolvePreferredUiLocale(undefined, undefined, "en-GB")).toBe("en");
  });
});

describe("organization terminology", () => {
  const terminology: OrganizationTerminology = {
    defaultLocale: "nl",
    translations: {
      nl: { bookingSingular: "afspraak" },
      en: { bookingSingular: "appointment" },
    },
  };

  it("supports arbitrary locale codes with language and default fallbacks", () => {
    expect(
      resolveOrganizationTerm(
        terminology,
        "en-GB",
        "bookingSingular",
        "booking",
      ),
    ).toBe("appointment");
    expect(
      resolveOrganizationTerm(terminology, "de", "bookingSingular", "booking"),
    ).toBe("afspraak");
    expect(
      resolveOrganizationTerm(terminology, "de", "clientPlural", "clients"),
    ).toBe("clients");
  });
});
