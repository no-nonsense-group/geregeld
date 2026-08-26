import type { UiLocale } from "#/shared/i18n";

export const loginCopy = {
  nl: {
    meta: {
      title: "Inloggen - Geregeld",
      description: "Log in bij Geregeld met een eenmalige code.",
    },
    brandLabel: "Terug naar Geregeld",
    title: "Log in bij Geregeld.",
    description: "We sturen een eenmalige code naar je e-mailadres.",
    emailLabel: "E-mailadres",
    emailPlaceholder: "jij@bedrijf.nl",
    requestCode: "Stuur de code",
    requestingCode: "Code versturen...",
    codeTitle: "Controleer je e-mail.",
    codeDescription: (email: string) =>
      `Vul de zescijferige code in die we naar ${email} hebben gestuurd.`,
    codeLabel: "Eenmalige code",
    complete: "Inloggen",
    completing: "Controleren...",
    resend: "Nieuwe code sturen",
    resending: "Nieuwe code versturen...",
    changeEmail: "Ander e-mailadres gebruiken",
    developmentCode: "Lokale ontwikkelcode",
    registerPrompt: "Nog niet geregistreerd?",
    register: "Registreren",
    errors: {
      invalidInput: "Vul een geldig e-mailadres en een geldige code in.",
      invalidCode:
        "Deze code klopt niet. Controleer de code en probeer opnieuw.",
      expiredCode: "Deze code is verlopen. Vraag een nieuwe code aan.",
      attemptsExceeded:
        "Deze code is te vaak geprobeerd. Vraag een nieuwe code aan.",
      notRegistered:
        "Dit e-mailadres is niet geregistreerd. Registreer je eerst.",
      unavailable:
        "Inloggen lukt nu niet. Probeer het over een paar minuten opnieuw.",
    },
  },
  en: {
    meta: {
      title: "Log in - Geregeld",
      description: "Log in to Geregeld with a one-time code.",
    },
    brandLabel: "Back to Geregeld",
    title: "Log in to Geregeld.",
    description: "We'll send a one-time code to your email.",
    emailLabel: "Email address",
    emailPlaceholder: "you@business.com",
    requestCode: "Send the code",
    requestingCode: "Sending code...",
    codeTitle: "Check your email.",
    codeDescription: (email: string) =>
      `Enter the six-digit code we sent to ${email}.`,
    codeLabel: "One-time code",
    complete: "Log in",
    completing: "Checking...",
    resend: "Send a new code",
    resending: "Sending a new code...",
    changeEmail: "Use another email address",
    developmentCode: "Local development code",
    registerPrompt: "Not registered yet?",
    register: "Register",
    errors: {
      invalidInput: "Enter a valid email address and a valid code.",
      invalidCode: "That code is incorrect. Check it and try again.",
      expiredCode: "That code has expired. Request a new code.",
      attemptsExceeded:
        "That code was tried too many times. Request a new code.",
      notRegistered: "This email is not registered. Register first.",
      unavailable:
        "Login is unavailable right now. Try again in a few minutes.",
    },
  },
} as const satisfies Record<UiLocale, unknown>;
