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
          "Maak losse periodes met een weekpatroon of voeg ze direct aan een datum toe.",
        timeZoneOnly: "Alle tijden gebruiken uitsluitend de bedrijfstijdzone.",
        defaultDuration: "Standaardduur van een periode",
        customDuration: "Aangepast",
        minutes: "minuten",
        saveDefault: "Standaardduur opslaan",
        saving: "Opslaan...",
        defaultWarning:
          "Bestaande periodes houden hun huidige duur. Deze standaard geldt alleen voor nieuwe periodes.",
        fullDayWarning:
          "Een periode van 24 uur beslaat de hele datum. Eén booking reserveert de hele datum.",
        weeklyTab: "Per week instellen",
        manualTab: "Handmatig toevoegen",
        weeklyTitle: "Teken je gebruikelijke week",
        weeklyDescription:
          "Sleep omlaag in een dagkolom. We vullen je selectie met volledige periodes en laten een onvolledig restant leeg.",
        drawHint: "Sleep verticaal over een dag, of voeg een exacte tijd toe.",
        startDate: "Vanaf",
        endDate: "Tot en met",
        durationForRun: "Duur voor deze periodes",
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
        description:
          "Create dated periods with a weekly pattern or add them directly to a date.",
        timeZoneOnly: "Every time uses the Organization time zone only.",
        defaultDuration: "Default Availability Period duration",
        customDuration: "Custom",
        minutes: "minutes",
        saveDefault: "Save default duration",
        saving: "Saving...",
        defaultWarning:
          "Existing periods keep their current duration. This default applies only to new periods.",
        fullDayWarning:
          "A 24-hour period covers the entire date. One Booking will reserve the whole date.",
        weeklyTab: "Set weekly availability",
        manualTab: "Add periods manually",
        weeklyTitle: "Draw your usual week",
        weeklyDescription:
          "Drag down a day column. We fill your selection with complete periods and leave an incomplete remainder empty.",
        drawHint: "Drag vertically across a day, or add an exact time.",
        startDate: "From",
        endDate: "Through",
        durationForRun: "Duration for these periods",
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
