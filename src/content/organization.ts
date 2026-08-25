import type { UiLocale } from "#/shared/i18n";

export const organizationCopy = {
  nl: {
    setup: {
      meta: {
        title: "Bedrijf instellen | Geregeld",
        description: "Stel je bedrijf in om Geregeld te gaan gebruiken.",
      },
      eyebrow: "Registratie voltooid",
      title: "Nu je bedrijf instellen.",
      description:
        "Vul de naam in die je klanten zien. We gebruiken je tijdzone om bookings op het juiste tijdstip te tonen.",
      nameLabel: "Naam van je bedrijf",
      namePlaceholder: "Bijvoorbeeld Studio Noord",
      timeZoneLabel: "Tijdzone",
      timeZoneHint: "Je kunt dit later wijzigen.",
      termsBefore: "Ik ga akkoord met de",
      termsLink: "algemene voorwaarden",
      submit: "Bedrijf aanmaken",
      submitting: "Bedrijf aanmaken...",
      errors: {
        invalid:
          "Controleer de bedrijfsnaam, tijdzone en je akkoord met de voorwaarden.",
        unavailable:
          "Je bedrijf kan nu niet worden aangemaakt. Probeer het zo opnieuw.",
      },
    },
    dashboard: {
      meta: {
        title: "Dashboard | Geregeld",
        description: "Beheer je bookings en beschikbaarheid.",
      },
      eyebrow: "Dashboard",
      title: (name: string) => `Welkom bij ${name}.`,
      description:
        "Je bedrijf is aangemaakt. Bookings en je beschikbaarheid beheer je straks hier.",
      bookings: "Bookings",
      bookingsValue: "0 vandaag",
      bookingsEmpty: "Nieuwe bookings verschijnen hier.",
      availability: "Beschikbaarheid",
      availabilityValue: "Nog niet ingesteld",
      availabilityEmpty: "Beschikbaarheid instellen wordt de volgende stap.",
      timeZone: "Tijdzone",
    },
    terms: {
      meta: {
        title: "Algemene voorwaarden | Geregeld",
        description: "De algemene voorwaarden van Geregeld.",
      },
      eyebrow: "Juridisch",
      title: "Algemene voorwaarden",
      todo: "TODO: voeg hier de algemene voorwaarden toe.",
      back: "Terug naar Geregeld",
    },
    unavailable: "Geregeld kan je bedrijfsgegevens nu niet laden.",
  },
  en: {
    setup: {
      meta: {
        title: "Set up your business | Geregeld",
        description: "Set up your business to start using Geregeld.",
      },
      eyebrow: "Registration complete",
      title: "Now set up your business.",
      description:
        "Enter the name your clients will see. We use your time zone to show bookings at the right time.",
      nameLabel: "Business name",
      namePlaceholder: "For example, Studio North",
      timeZoneLabel: "Time zone",
      timeZoneHint: "You can change this later.",
      termsBefore: "I agree to the",
      termsLink: "terms and conditions",
      submit: "Create business",
      submitting: "Creating business...",
      errors: {
        invalid:
          "Check the business name, time zone, and your acceptance of the terms.",
        unavailable:
          "Your business cannot be created right now. Try again in a moment.",
      },
    },
    dashboard: {
      meta: {
        title: "Dashboard | Geregeld",
        description: "Manage your bookings and availability.",
      },
      eyebrow: "Dashboard",
      title: (name: string) => `Welcome to ${name}.`,
      description:
        "Your business is set up. Bookings and availability controls will live here.",
      bookings: "Bookings",
      bookingsValue: "0 today",
      bookingsEmpty: "New bookings will appear here.",
      availability: "Availability",
      availabilityValue: "Not set yet",
      availabilityEmpty: "Setting your availability is the next step.",
      timeZone: "Time zone",
    },
    terms: {
      meta: {
        title: "Terms and conditions | Geregeld",
        description: "The Geregeld terms and conditions.",
      },
      eyebrow: "Legal",
      title: "Terms and conditions",
      todo: "TODO: add the terms and conditions here.",
      back: "Back to Geregeld",
    },
    unavailable: "Geregeld cannot load your business details right now.",
  },
} as const satisfies Record<UiLocale, unknown>;
