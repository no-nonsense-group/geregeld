import "@tanstack/react-start/server-only";

import { Resend } from "resend";

interface RegistrationEmailInput {
  readonly challengeId: string;
  readonly email: string;
  readonly code: string;
}

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required to send registration emails`);
  }

  return value;
}

export async function sendRegistrationEmail(
  input: RegistrationEmailInput,
): Promise<void> {
  const resend = new Resend(requiredEnvironmentVariable("RESEND_API_KEY"));
  const { error } = await resend.emails.send(
    {
      from: requiredEnvironmentVariable("RESEND_FROM_EMAIL"),
      to: input.email,
      subject: `${input.code} is je verificatiecode voor Geregeld`,
      text: `Je verificatiecode voor Geregeld is ${input.code}. De code verloopt over 5 minuten.`,
      html: [
        "<p>Je verificatiecode voor Geregeld is:</p>",
        `<p style="font-size: 32px; font-weight: 700; letter-spacing: 0.2em;">${input.code}</p>`,
        "<p>De code verloopt over 5 minuten.</p>",
      ].join(""),
    },
    { idempotencyKey: `registration-code/${input.challengeId}` },
  );

  if (error) {
    throw new Error(`Resend rejected the registration email: ${error.name}`);
  }
}
