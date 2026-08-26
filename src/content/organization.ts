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
      availability: "Beschikbaarheid",
      availabilityValue: "Nog niet ingesteld",
      availabilityEmpty: "Kies wanneer klanten bij je kunnen boeken.",
      availabilityConfigured: (count: number) =>
        `${count} ${count === 1 ? "dag" : "dagen"} open`,
      availabilityNoUpcoming: "Deze week gesloten",
      availabilityClosed: "Klanten kunnen in je gewone week niet boeken.",
      today: "Vandaag",
      editAvailability: "Beschikbaarheid aanpassen",
      setAvailability: "Beschikbaarheid instellen",
      nextClosed: (date: string) => `Gesloten op ${date}`,
      nextChanged: (date: string) => `Andere tijden op ${date}`,
      dayRange: (from: string, to: string) => `${from} tot en met ${to}`,
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
      settings: "Bedrijfsinstellingen",
    },
    availability: {
      meta: {
        title: "Beschikbaarheid | Geregeld",
        description: "Kies wanneer klanten bij je kunnen boeken.",
      },
      back: "Terug naar dashboard",
      title: "Wanneer kunnen klanten boeken?",
      setupDescription:
        "Kies je dagen en tijden. Je kunt ze daarna per dag aanpassen.",
      setupDays: "Op welke dagen kunnen klanten boeken?",
      from: "Van",
      until: "Tot",
      setAvailability: "Beschikbaarheid instellen",
      timeZone: "Tijden in",
      yourWeek: "Jouw week",
      available: "Beschikbaar",
      closed: "Gesloten",
      addAnotherTime: "Nog een tijd toevoegen",
      removeTime: "Tijd verwijderen",
      saveChanges: "Wijzigingen opslaan",
      saving: "Opslaan...",
      saved: "Wijzigingen opgeslagen.",
      specificDates: "Specifieke datums",
      changeDates: "Datums aanpassen",
      date: "Datum",
      endDateOptional: "Einddatum (optioneel)",
      canBook: "Kunnen klanten boeken?",
      yes: "Ja",
      no: "Nee",
      restoreUsualHours: "Gebruik de uren van deze week",
      confirm: "Bevestigen",
      cancel: "Sluiten",
      discardChanges: "Je hebt niet-opgeslagen wijzigingen. Toch weggaan?",
      nextClosed: (date: string) => `Gesloten op ${date}`,
      nextChanged: (date: string) => `Andere tijden op ${date}`,
      errors: {
        invalid: "Controleer de dagen en tijden. Tijden mogen niet overlappen.",
        unavailable:
          "Je wijzigingen kunnen nu niet worden opgeslagen. Probeer het opnieuw.",
      },
    },
    settings: {
      meta: {
        title: "Bedrijfsinstellingen | Geregeld",
        description: "Beheer je bedrijfsgegevens en abonnement.",
      },
      back: "Terug naar dashboard",
      title: "Bedrijfsinstellingen",
      description:
        "Werk je openbare bedrijfsnaam, tijdzone en overige instellingen bij.",
      details: {
        title: "Bedrijfsgegevens",
        description:
          "Je bedrijfsnaam is zichtbaar voor klanten. Je tijdzone bepaalt hoe Geregeld je lokale tijden interpreteert.",
        nameLabel: "Naam van je bedrijf",
        namePlaceholder: "Bijvoorbeeld Studio Noord",
        timeZoneLabel: "Tijdzone",
        timeZoneHint:
          "Boekingstijden blijven op dezelfde lokale kloktijden staan wanneer je dit wijzigt.",
        save: "Wijzigingen opslaan",
        saving: "Wijzigingen opslaan...",
        saved: "Je bedrijfsgegevens zijn opgeslagen.",
        errors: {
          invalid: "Controleer de bedrijfsnaam en tijdzone.",
          unavailable:
            "Je bedrijfsgegevens kunnen nu niet worden opgeslagen. Probeer het opnieuw.",
        },
      },
      timeZoneDialog: {
        title: "Tijdzone wijzigen?",
        description:
          "Je bestaande bookings behouden hun geplande moment. Je boekingstijden en datumafwijkingen behouden hun lokale kloktijden en gebruiken voortaan de nieuwe tijdzone.",
        cancel: "Niet wijzigen",
        confirm: "Tijdzone wijzigen",
      },
      team: {
        title: "Teamleden",
        badge: "In aanbouw",
        description:
          "Naast de eigenaar kun je straks maximaal vijf teamleden uitnodigen.",
        emailLabel: "E-mailadres",
        emailPlaceholder: "teamlid@voorbeeld.nl",
        invite: "Uitnodigen",
      },
      subscription: {
        title: "Abonnement",
        description:
          "Je kunt je abonnement straks opzeggen en Geregeld blijven gebruiken tot het einde van je betaalperiode.",
        cancel: "Abonnement opzeggen",
        dialog: {
          title: "Abonnement opzeggen?",
          description:
            "Je toegang blijft actief tot het einde van je huidige betaalperiode. Daarna wordt het abonnement niet verlengd.",
          back: "Abonnement behouden",
          confirm: "Opzegging bevestigen",
        },
        preview:
          "Opzeggen is nog niet gekoppeld aan facturatie. Er is niets gewijzigd.",
      },
      danger: {
        title: "Gevarenzone",
        description:
          "Verwijder je bedrijf, alle bijbehorende gegevens en je gebruikersregistratie permanent.",
        delete: "Bedrijf verwijderen",
        dialog: {
          title: "Bedrijf definitief verwijderen?",
          description:
            "Dit verwijdert je bedrijf, boekingstijden, bookings, gebruikersregistratie en actieve sessies. Je wordt uitgelogd. Dit kan niet ongedaan worden gemaakt.",
          acknowledge:
            "Ik begrijp dat mijn bedrijf en gebruikersregistratie permanent worden verwijderd.",
          back: "Annuleren",
          confirm: "Alles definitief verwijderen",
          deleting: "Alles verwijderen...",
          error:
            "Je bedrijf kon niet worden verwijderd. Er is niets gewijzigd. Probeer het opnieuw.",
        },
      },
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
      availability: "Availability",
      availabilityValue: "Not set yet",
      availabilityEmpty: "Choose when customers can book with you.",
      availabilityConfigured: (count: number) =>
        `${count} ${count === 1 ? "day" : "days"} open`,
      availabilityNoUpcoming: "Closed this week",
      availabilityClosed: "Customers cannot book during your usual week.",
      today: "Today",
      editAvailability: "Change availability",
      setAvailability: "Set availability",
      nextClosed: (date: string) => `Closed on ${date}`,
      nextChanged: (date: string) => `Different hours on ${date}`,
      dayRange: (from: string, to: string) => `${from} to ${to}`,
      closeAvailability: "Close editor",
      weekOverview: "Weekly overview",
      weekdaysShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      availabilityEditor: {
        title: "Bookable hours",
        close: "Close editor",
        description:
          "Set when clients can book. Service duration is handled separately.",
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
        saved: "Your bookable hours have been saved.",
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
            "Your bookable hours cannot be saved right now. Try again.",
        },
      },
      settings: "Business settings",
    },
    availability: {
      meta: {
        title: "Availability | Geregeld",
        description: "Choose when customers can book with you.",
      },
      back: "Back to dashboard",
      title: "When can customers book?",
      setupDescription:
        "Choose your days and times. You can adjust individual days afterwards.",
      setupDays: "Which days can customers book?",
      from: "From",
      until: "Until",
      setAvailability: "Set availability",
      timeZone: "Times in",
      yourWeek: "Your week",
      available: "Available",
      closed: "Closed",
      addAnotherTime: "Add another time",
      removeTime: "Remove time",
      saveChanges: "Save changes",
      saving: "Saving...",
      saved: "Changes saved.",
      specificDates: "Specific dates",
      changeDates: "Change dates",
      date: "Date",
      endDateOptional: "End date (optional)",
      canBook: "Can customers book?",
      yes: "Yes",
      no: "No",
      restoreUsualHours: "Use this week's hours",
      confirm: "Confirm",
      cancel: "Close",
      discardChanges: "You have unsaved changes. Leave anyway?",
      nextClosed: (date: string) => `Closed on ${date}`,
      nextChanged: (date: string) => `Different hours on ${date}`,
      errors: {
        invalid: "Check the days and times. Times cannot overlap.",
        unavailable: "Your changes cannot be saved right now. Try again.",
      },
    },
    settings: {
      meta: {
        title: "Business settings | Geregeld",
        description: "Manage your business details and subscription.",
      },
      back: "Back to dashboard",
      title: "Business settings",
      description:
        "Update your public business name, time zone, and other settings.",
      details: {
        title: "Business details",
        description:
          "Your business name is visible to clients. Your time zone determines how Geregeld interprets your local times.",
        nameLabel: "Business name",
        namePlaceholder: "For example, Studio North",
        timeZoneLabel: "Time zone",
        timeZoneHint:
          "Bookable hours keep the same local clock times when you change this.",
        save: "Save changes",
        saving: "Saving changes...",
        saved: "Your business details have been saved.",
        errors: {
          invalid: "Check the business name and time zone.",
          unavailable:
            "Your business details cannot be saved right now. Try again.",
        },
      },
      timeZoneDialog: {
        title: "Change time zone?",
        description:
          "Existing bookings keep their scheduled moments. Bookable hours and date exceptions keep their local clock times and will use the new time zone.",
        cancel: "Keep current time zone",
        confirm: "Change time zone",
      },
      team: {
        title: "Team members",
        badge: "Under construction",
        description:
          "You will be able to invite up to five team members in addition to the Owner.",
        emailLabel: "Email address",
        emailPlaceholder: "team-member@example.com",
        invite: "Invite",
      },
      subscription: {
        title: "Subscription",
        description:
          "You will be able to cancel your subscription and keep using Geregeld until the end of your billing period.",
        cancel: "Cancel subscription",
        dialog: {
          title: "Cancel subscription?",
          description:
            "Your access will remain active until the end of your current billing period. The subscription will not renew after that.",
          back: "Keep subscription",
          confirm: "Confirm cancellation",
        },
        preview:
          "Cancellation is not connected to billing yet. Nothing has changed.",
      },
      danger: {
        title: "Danger zone",
        description:
          "Permanently delete your business, all associated data, and your user registration.",
        delete: "Delete business",
        dialog: {
          title: "Permanently delete this business?",
          description:
            "This deletes your business, bookable hours, bookings, user registration, and active sessions. You will be signed out. This cannot be undone.",
          acknowledge:
            "I understand that my business and user registration will be permanently deleted.",
          back: "Cancel",
          confirm: "Permanently delete everything",
          deleting: "Deleting everything...",
          error:
            "Your business could not be deleted. Nothing has changed. Try again.",
        },
      },
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
