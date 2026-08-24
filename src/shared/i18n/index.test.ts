import { describe, expect, it } from "vitest";

import {
  type OrganizationTerminology,
  resolveBrowserUiLocale,
  resolveOrganizationTerm,
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
