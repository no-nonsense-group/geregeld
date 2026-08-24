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
      offer: "1 maand gratis voor iedereen",
      title: "Bookings. Gewoon geregeld.",
      description:
        "Rustige bookingsoftware voor zelfstandige bedrijven. Snel te begrijpen, prettig om elke dag te gebruiken.",
      priceNote: "Daarna €10 per maand. Geen kosten per booking.",
    },
    demo: {
      label: "Tijdelijke plek voor de productdemo",
      title: "Bekijk hoe Geregeld werkt",
      status: "Demo volgt binnenkort",
      duration: "Producttour · 2 min",
    },
    overview: {
      eyebrow: "Geregeld in het kort",
      title: "Alles wat je moet weten.",
      howItWorks: {
        title: "Hoe het werkt",
        steps: [
          "Stel je beschikbaarheid in.",
          "Deel je persoonlijke bookinglink.",
          "Beheer bookings en klantgegevens op één plek.",
        ],
      },
      pricing: {
        title: "Prijzen",
        offer: "Eerste maand €0",
        price: "Daarna €10 per maand",
        detail:
          "Alles inbegrepen. Geen kosten per booking. Maandelijks opzegbaar. Of €100 per jaar.",
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
      offer: "1 month free for everyone",
      title: "Booking. Simply handled.",
      description:
        "Calm booking software for independent businesses. Quick to understand and pleasant to use every day.",
      priceNote: "Then €10 a month. No per-booking fees.",
    },
    demo: {
      label: "Temporary product demo placeholder",
      title: "See how Geregeld works",
      status: "Demo coming soon",
      duration: "Product tour · 2 min",
    },
    overview: {
      eyebrow: "Geregeld at a glance",
      title: "Everything you need to know.",
      howItWorks: {
        title: "How it works",
        steps: [
          "Set your availability.",
          "Share your personal booking link.",
          "Manage bookings and client details in one place.",
        ],
      },
      pricing: {
        title: "Pricing",
        offer: "First month €0",
        price: "Then €10 a month",
        detail:
          "Everything included. No per-booking fees. Cancel any month. Or €100 a year.",
      },
      about: {
        title: "About us",
        description:
          "Geregeld is made by No Nonsense Group. We build straightforward software that does its job and stays out of your way.",
      },
    },
  },
} as const satisfies Record<UiLocale, unknown>;
