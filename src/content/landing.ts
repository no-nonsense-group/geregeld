import type { UiLocale } from "#/shared/i18n";

export const landingCopy = {
  nl: {
    meta: {
      title: "Geregeld — Bookings zonder ballast",
      description:
        "Eenvoudige bookingsoftware voor zelfstandige bedrijven. De eerste maand gratis, daarna alles inbegrepen voor €10 per maand.",
      socialDescription:
        "Bookings zonder ballast. De eerste maand gratis, daarna €10 per maand zonder kosten per booking.",
    },
    controls: {
      skip: "Naar de inhoud",
      home: "Geregeld home",
      language: "Taal kiezen",
    },
    deletionNotice:
      "Je bedrijf en gebruikersregistratie zijn definitief verwijderd.",
    navigation: {
      howItWorks: "Hoe het werkt",
      pricing: "Prijzen",
      about: "Over ons",
    },
    actions: {
      login: "Inloggen",
      getStarted: "Aan de slag",
      subject: "Aan de slag met Geregeld",
    },
    hero: {
      offer: "Eerste maand GRATIS, daarna €10",
      title: "Bookings, zonder gedoe.",
      description:
        "Voor kleine bedrijven die op afspraak werken. Stel je uren in, deel je link en laat klanten zelf boeken.",
    },
    demo: {
      label: "Tijdelijke plek voor de productdemo",
      status: "Demo volgt binnenkort",
    },
    overview: {
      title: "Wat is het?",
      howItWorks: {
        title: "Hoe het werkt",
        steps: [
          "Stel je beschikbaarheid in.",
          "Deel een bookinglink of integreer Geregeld in je app of website.",
          "Beheer bookings en klantgegevens op één plek.",
        ],
      },
      pricing: {
        title: "Prijzen",
        offer: "Eerste maand €0",
        price: "Daarna €10 per maand",
        detail: "Geen verborgen kosten. Maandelijks opzegbaar.",
      },
      about: {
        title: "Over ons",
        description:
          "Geregeld wordt gemaakt door No Nonsense Group. We bouwen duidelijke software die haar werk doet en verder uit de weg blijft.",
      },
    },
  },
  en: {
    meta: {
      title: "Geregeld — Booking without the bloat",
      description:
        "Simple booking software for independent businesses. Your first month is free, then everything is included for €10 a month.",
      socialDescription:
        "Booking without the bloat. Your first month is free, then €10 a month with no per-booking fees.",
    },
    controls: {
      skip: "Skip to content",
      home: "Geregeld home",
      language: "Choose language",
    },
    deletionNotice:
      "Your business and user registration have been permanently deleted.",
    navigation: {
      howItWorks: "How it works",
      pricing: "Pricing",
      about: "About us",
    },
    actions: {
      login: "Log in",
      getStarted: "Get started",
      subject: "Get started with Geregeld",
    },
    hero: {
      offer: "First month FREE, then €10",
      title: "Bookings, without the busywork.",
      description:
        "For small businesses that run on appointments. Set your hours, share your link, and let customers book for themselves.",
    },
    demo: {
      label: "Temporary product demo placeholder",
      status: "Demo coming soon",
    },
    overview: {
      title: "What is it?",
      howItWorks: {
        title: "How it works",
        steps: [
          "Set your availability.",
          "Share a booking link or integrate Geregeld into your app/site.",
          "Manage bookings and client details in one place.",
        ],
      },
      pricing: {
        title: "Pricing",
        offer: "First month €0",
        price: "Then €10 a month",
        detail: "No hidden costs. Cancel any month.",
      },
      about: {
        title: "About us",
        description:
          "Geregeld is made by No Nonsense Group. We build straightforward software that does its job and stays out of your way.",
      },
    },
  },
} as const satisfies Record<UiLocale, unknown>;
