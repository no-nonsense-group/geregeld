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
      titleLead: "Welkom bij",
      description: "Beheer je beschikbaarheid en bookings.",
      bookings: "Bookings",
      bookingsValue: "0 vandaag",
      bookingsEmpty: "Nieuwe bookings verschijnen hier.",
      availability: "Boekingstijden",
      availabilityValue: "Nog niet ingesteld",
      availabilityEmpty: "Stel in wanneer klanten bij je kunnen boeken.",
      availabilityConfigured: (count: number) =>
        `${count} ${count === 1 ? "dag" : "dagen"} open`,
      availabilityNoUpcoming: "Deze week gesloten",
      availabilitySchedule: "Reguliere tijden en datumafwijkingen",
      editAvailability: "Boekingstijden beheren",
      closeAvailability: "Editor sluiten",
      weekOverview: "Weekoverzicht",
      weekdaysShort: ["ma", "di", "wo", "do", "vr", "za", "zo"],
      availabilityEditor: {
        title: "Boekingstijden",
        close: "Editor sluiten",
        description:
          "Stel in wanneer klanten kunnen boeken. De duur van een dienst bepalen we apart.",
        timeZoneOnly: "Alle tijden gebruiken de tijdzone van je bedrijf.",
        regularTab: "Reguliere tijden",
        exceptionsTab: "Datumafwijkingen",
        regularTitle: "Je gebruikelijke week",
        regularDescription:
          "Deze tijden herhalen iedere week totdat je ze wijzigt.",
        serviceFit:
          "Klanten zien alleen begintijden waarop hun gekozen dienst volledig past.",
        open: "Open",
        closed: "Gesloten",
        addHours: "Tijden toevoegen",
        removeHours: "Tijden verwijderen",
        saveRegular: "Reguliere tijden opslaan",
        saving: "Opslaan...",
        saved: "Je boekingstijden zijn opgeslagen.",
        exceptionsTitle: "Afwijkende datums",
        exceptionsDescription:
          "Sluit een dag of gebruik andere tijden voor een feestdag, vakantie of een eenmalige wijziging.",
        date: "Datum",
        closedAllDay: "Hele dag gesloten",
        differentHours: "Andere tijden",
        addException: "Afwijking opslaan",
        updateException: "Wijziging opslaan",
        cancel: "Annuleren",
        upcomingExceptions: "Komende afwijkingen",
        noExceptions: "Geen komende afwijkingen.",
        exceptionClosed: "Gesloten",
        edit: "Wijzigen",
        remove: "Verwijderen",
        removeConfirm:
          "Deze datumafwijking verwijderen en de reguliere tijden weer gebruiken?",
        errors: {
          invalid:
            "Controleer de datum en tijden. Tijden moeten binnen één dag liggen en mogen niet overlappen.",
          unavailable:
            "Je boekingstijden kunnen nu niet worden opgeslagen. Probeer het opnieuw.",
        },
      },
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
      titleLead: "Welcome to",
      description: "Manage your availability and bookings.",
      bookings: "Bookings",
      bookingsValue: "0 today",
      bookingsEmpty: "New bookings will appear here.",
      availability: "Booking hours",
      availabilityValue: "Not set yet",
      availabilityEmpty: "Set when customers can book with you.",
      availabilityConfigured: (count: number) =>
        `${count} ${count === 1 ? "day" : "days"} open`,
      availabilityNoUpcoming: "Closed this week",
      availabilitySchedule: "Regular hours and date exceptions",
      editAvailability: "Manage booking hours",
      closeAvailability: "Close editor",
      weekOverview: "Weekly overview",
      weekdaysShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      availabilityEditor: {
        title: "Booking hours",
        close: "Close editor",
        description:
          "Set when customers can book. Service duration is handled separately.",
        timeZoneOnly: "All times use your business time zone.",
        regularTab: "Regular hours",
        exceptionsTab: "Date exceptions",
        regularTitle: "Your usual week",
        regularDescription:
          "These hours repeat every week until you change them.",
        serviceFit:
          "Customers only see start times where their chosen service fits in full.",
        open: "Open",
        closed: "Closed",
        addHours: "Add hours",
        removeHours: "Remove hours",
        saveRegular: "Save regular hours",
        saving: "Saving...",
        saved: "Your booking hours have been saved.",
        exceptionsTitle: "Different hours for specific dates",
        exceptionsDescription:
          "Close a date or use different hours for a holiday, time off, or a one-off change.",
        date: "Date",
        closedAllDay: "Closed all day",
        differentHours: "Different hours",
        addException: "Save exception",
        updateException: "Save changes",
        cancel: "Cancel",
        upcomingExceptions: "Upcoming exceptions",
        noExceptions: "No upcoming exceptions.",
        exceptionClosed: "Closed",
        edit: "Edit",
        remove: "Remove",
        removeConfirm:
          "Remove this date exception and use the regular hours again?",
        errors: {
          invalid:
            "Check the date and times. Hours must stay within one day and cannot overlap.",
          unavailable:
            "Your booking hours cannot be saved right now. Try again.",
        },
      },
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
