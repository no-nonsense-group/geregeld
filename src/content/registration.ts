import type { UiLocale } from "#/shared/i18n";

export const registrationCopy = {
  nl: {
    meta: {
      title: "Registreren — Geregeld",
      description: "Maak je Geregeld-gebruiker aan met je e-mailadres.",
    },
    brandLabel: "Terug naar Geregeld",
    title: "Maak je gebruiker aan.",
    description: "We sturen een eenmalige code naar je e-mailadres.",
    emailLabel: "E-mailadres",
    emailPlaceholder: "jij@bedrijf.nl",
    requestCode: "Stuur de code",
    requestingCode: "Code versturen…",
    codeTitle: "Controleer je e-mail.",
    codeDescription: (email: string) =>
      `Vul de zescijferige code in die we naar ${email} hebben gestuurd.`,
    codeLabel: "Eenmalige code",
    complete: "Registratie afronden",
    completing: "Controleren…",
    resend: "Nieuwe code sturen",
    resending: "Nieuwe code versturen…",
    changeEmail: "Ander e-mailadres gebruiken",
    developmentCode: "Lokale ontwikkelcode",
    loginPrompt: "Al geregistreerd?",
    login: "Inloggen",
    errors: {
      invalidInput: "Vul een geldig e-mailadres en een geldige code in.",
      invalidCode:
        "Deze code klopt niet. Controleer de code en probeer opnieuw.",
      expiredCode: "Deze code is verlopen. Vraag een nieuwe code aan.",
      attemptsExceeded:
        "Deze code is te vaak geprobeerd. Vraag een nieuwe code aan.",
      alreadyRegistered:
        "Dit e-mailadres is al geregistreerd. Ga naar inloggen om verder te gaan.",
      unavailable:
        "Registreren lukt nu niet. Probeer het over een paar minuten opnieuw.",
    },
  },
  en: {
    meta: {
      title: "Register — Geregeld",
      description: "Create your Geregeld user with your email address.",
    },
    brandLabel: "Back to Geregeld",
    title: "Create your user.",
    description: "We'll send a one-time code to your email.",
    emailLabel: "Email address",
    emailPlaceholder: "you@business.com",
    requestCode: "Send the code",
    requestingCode: "Sending code…",
    codeTitle: "Check your email.",
    codeDescription: (email: string) =>
      `Enter the six-digit code we sent to ${email}.`,
    codeLabel: "One-time code",
    complete: "Complete registration",
    completing: "Checking…",
    resend: "Send a new code",
    resending: "Sending a new code…",
    changeEmail: "Use another email address",
    developmentCode: "Local development code",
    loginPrompt: "Already registered?",
    login: "Log in",
    errors: {
      invalidInput: "Enter a valid email address and a valid code.",
      invalidCode: "That code is incorrect. Check it and try again.",
      expiredCode: "That code has expired. Request a new code.",
      attemptsExceeded:
        "That code was tried too many times. Request a new code.",
      alreadyRegistered:
        "This email is already registered. Go to log in to continue.",
      unavailable:
        "Registration is unavailable right now. Try again in a few minutes.",
    },
  },
} as const satisfies Record<UiLocale, unknown>;
