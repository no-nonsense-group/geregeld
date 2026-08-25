import { afterEach, beforeEach, expect, it, vi } from "vitest";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    readonly emails = { send };
  },
}));

import { sendRegistrationEmail } from "./resend-registration-email.server";

beforeEach(() => {
  process.env.RESEND_API_KEY = "re_test";
  process.env.RESEND_FROM_EMAIL = "Geregeld <registratie@mail.example.com>";
  send.mockReset();
  send.mockResolvedValue({ data: { id: "email-1" }, error: null });
});

afterEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
});

it("sends the six-digit registration code through Resend", async () => {
  await sendRegistrationEmail({
    challengeId: "challenge-1",
    email: "owner@example.com",
    code: "123456",
  });

  expect(send).toHaveBeenCalledWith(
    expect.objectContaining({
      from: "Geregeld <registratie@mail.example.com>",
      to: "owner@example.com",
      subject: "123456 is je verificatiecode voor Geregeld",
      text: expect.stringContaining("123456"),
      html: expect.stringContaining("123456"),
    }),
    { idempotencyKey: "registration-code/challenge-1" },
  );
});

it("rejects a Resend API error", async () => {
  send.mockResolvedValue({
    data: null,
    error: { name: "daily_quota_exceeded", message: "Daily quota exceeded" },
  });

  await expect(
    sendRegistrationEmail({
      challengeId: "challenge-1",
      email: "owner@example.com",
      code: "123456",
    }),
  ).rejects.toThrow(
    "Resend rejected the registration email: daily_quota_exceeded",
  );
});
