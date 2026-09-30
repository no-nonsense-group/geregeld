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
      availabilityConfigured: "Deze week",
      availabilityNoUpcoming: "Geen toekomstige beschikbaarheid",
      availabilityPeriods: (count: number) =>
        `${count} ${count === 1 ? "periode" : "periodes"}`,
      defaultPeriod: "Standaardperiode",
      editAvailability: "Beschikbaarheid beheren",
      closeAvailability: "Editor sluiten",
      weekOverview: "Weekoverzicht",
      weekdaysShort: ["ma", "di", "wo", "do", "vr", "za", "zo"],
      availabilityEditor: {
        title: "Je beschikbaarheid",
        close: "Editor sluiten",
        description:
          "Stel je gebruikelijke tijden in, of wijzig een specifieke datum.",
        timeZoneOnly: "Tijdzone:",
        defaultDuration: "Standaard tijdvak",
        customDuration: "Aangepast",
        minutes: "minuten",
        saveDefault: "Standaardduur opslaan",
        saving: "Opslaan...",
        defaultWarning:
          "Bestaande periodes houden hun huidige duur. Deze standaard geldt alleen voor nieuwe periodes.",
        fullDayWarning:
          "Een periode van 24 uur beslaat de hele datum. Eén booking reserveert de hele datum.",
        weeklyTab: "Per week instellen",
        manualTab: "Specifieke datums",
        weeklyTitle: "Stel je gebruikelijke tijden in",
        weeklyDescription:
          "Kies de datums en de lengte van elk boekbaar tijdvak. Resterende tijd die korter is dan een volledig tijdvak blijft niet beschikbaar.",
        drawHint: "Sleep verticaal over een dag, of voeg een exacte tijd toe.",
        startDate: "Vanaf",
        endDate: "Tot en met",
        durationForRun: "Tijdvak in minuten",
        startTime: "Start",
        endTime: "Einde",
        day: "Dag",
        timeAxis: "Tijd",
        addRange: "Tijd toevoegen",
        exactRangeTitle: "Tijd toevoegen",
        exactRangeDescription: "Kies een dag en vul de begin- en eindtijd in.",
        exactRangeError:
          "Vul geldige tijden in. De eindtijd moet na de begintijd liggen.",
        cancel: "Annuleren",
        clearWeek: "Week wissen",
        periodsPreview: (count: number) =>
          `${count} ${count === 1 ? "periode" : "periodes"} per week`,
        bulkPreview: (count: number) =>
          `${count} ${count === 1 ? "periode" : "periodes"} worden aangemaakt`,
        applyWeekly: "Toepassen op datumbereik",
        applyingWeekly: "Beschikbaarheid aanmaken...",
        replacementConfirm:
          "Dit vervangt bestaande beschikbaarheid op de datums in dit bereik. Doorgaan?",
        manualTitle: "Periodes direct beheren",
        manualDescription:
          "Voeg één periode toe of pas bestaande toekomstige periodes aan.",
        date: "Datum",
        periodStart: "Starttijd",
        periodEnd: "Eindtijd",
        longPeriod: (duration: string) =>
          `Dit maakt één periode van ${duration}. Deze wordt niet opgesplitst.`,
        addPeriod: "Periode toevoegen",
        updatePeriod: "Wijzigingen opslaan",
        cancelEdit: "Annuleren",
        previousWeek: "Vorige week",
        nextWeek: "Volgende week",
        edit: "Wijzigen",
        remove: "Verwijderen",
        removeConfirm: "Deze beschikbaarheidsperiode verwijderen?",
        noPeriodsDay: "Geen periodes",
        setupComplete: "Je beschikbaarheid is opgeslagen.",
        errors: {
          invalid:
            "Controleer de datums en tijden. Periodes moeten in de toekomst liggen en binnen één datum blijven.",
          conflict: "Deze periode overlapt een bestaande periode.",
          bulkLimit:
            "Deze actie maakt meer dan 1.000 periodes. Kies een korter bereik, minder uren of een langere duur.",
          unavailable:
            "Je beschikbaarheid kan nu niet worden opgeslagen. Probeer het opnieuw.",
        },
      },
      timeZone: "Tijdzone",
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
      availabilityConfigured: "This week",
      availabilityNoUpcoming: "No upcoming availability",
      availabilityPeriods: (count: number) =>
        `${count} ${count === 1 ? "period" : "periods"}`,
      defaultPeriod: "Default period",
      editAvailability: "Manage availability",
      closeAvailability: "Close editor",
      weekOverview: "Weekly overview",
      weekdaysShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      availabilityEditor: {
        title: "Your availability",
        close: "Close editor",
        description: "Set your usual hours, or change a specific date.",
        timeZoneOnly: "Time zone:",
        defaultDuration: "Default time block",
        customDuration: "Custom",
        minutes: "minutes",
        saveDefault: "Save default duration",
        saving: "Saving...",
        defaultWarning:
          "Existing periods keep their current duration. This default applies only to new periods.",
        fullDayWarning:
          "A 24-hour period covers the entire date. One Booking will reserve the whole date.",
        weeklyTab: "Usual hours",
        manualTab: "Specific dates",
        weeklyTitle: "Set your usual hours",
        weeklyDescription:
          "Choose the dates and length of each bookable time block. Any leftover time shorter than a full block stays unavailable.",
        drawHint: "Drag vertically across a day, or add an exact time.",
        startDate: "From",
        endDate: "Through",
        durationForRun: "Time block in minutes",
        startTime: "Start",
        endTime: "End",
        day: "Day",
        timeAxis: "Time",
        addRange: "Add time",
        exactRangeTitle: "Add time",
        exactRangeDescription:
          "Choose a day, then enter the start and end time.",
        exactRangeError:
          "Enter valid times. The end time must be later than the start time.",
        cancel: "Cancel",
        clearWeek: "Clear week",
        periodsPreview: (count: number) =>
          `${count} ${count === 1 ? "period" : "periods"} per week`,
        bulkPreview: (count: number) =>
          `${count} ${count === 1 ? "period" : "periods"} will be created`,
        applyWeekly: "Apply to date range",
        applyingWeekly: "Creating availability...",
        replacementConfirm:
          "This replaces existing availability on dates in this range. Continue?",
        manualTitle: "Manage dated periods",
        manualDescription:
          "Add one period or edit existing future periods directly.",
        date: "Date",
        periodStart: "Start time",
        periodEnd: "End time",
        longPeriod: (duration: string) =>
          `This creates one ${duration} Availability Period. It will not be split.`,
        addPeriod: "Add period",
        updatePeriod: "Save changes",
        cancelEdit: "Cancel",
        previousWeek: "Previous week",
        nextWeek: "Next week",
        edit: "Edit",
        remove: "Remove",
        removeConfirm: "Remove this Availability Period?",
        noPeriodsDay: "No periods",
        setupComplete: "Your availability has been saved.",
        errors: {
          invalid:
            "Check the dates and times. Periods must start in the future and stay within one date.",
          conflict: "This period overlaps an existing period.",
          bulkLimit:
            "This action creates more than 1,000 periods. Choose a shorter range, fewer hours, or a longer duration.",
          unavailable:
            "Your availability cannot be saved right now. Try again.",
        },
      },
      timeZone: "Time zone",
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
