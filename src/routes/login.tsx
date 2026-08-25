import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Mail } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "#/components/ui/button";
import { loginCopy } from "#/content/login";
import {
  completeLoginFn,
  requestLoginCodeFn,
} from "#/contexts/identity/slices/login/functions";
import { getOrganizationContextFn } from "#/contexts/organizations/slices/setup-organization/functions";

export const Route = createFileRoute("/login")({
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: async ({ deps }) => {
    const state = await getOrganizationContextFn();

    if (state.status === "setup-required") {
      throw redirect({ to: "/setup", search: { lang: deps.lang } });
    }

    if (state.status === "ready") {
      throw redirect({ to: "/dashboard", search: { lang: deps.lang } });
    }

    return { unavailable: state.status === "unavailable" };
  },
  head: ({ match }) => {
    const copy = loginCopy[match.search.lang];

    return {
      meta: [
        { title: copy.meta.title },
        { name: "description", content: copy.meta.description },
      ],
    };
  },
  component: LoginPage,
});

type LoginError =
  | "INVALID_INPUT"
  | "INVALID_CODE"
  | "EXPIRED_CODE"
  | "ATTEMPTS_EXCEEDED"
  | "NOT_REGISTERED"
  | "UNAVAILABLE";

function LoginPage() {
  const { lang } = Route.useSearch();
  const { unavailable } = Route.useLoaderData();
  const copy = loginCopy[lang];
  const navigate = useNavigate();
  const codeInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<LoginError | undefined>(
    unavailable ? "UNAVAILABLE" : undefined,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [developmentCode, setDevelopmentCode] = useState<string>();

  useEffect(() => {
    if (step === "code") {
      codeInput.current?.focus();
    }
  }, [step]);

  function errorMessage(value: LoginError): string {
    switch (value) {
      case "INVALID_INPUT":
        return copy.errors.invalidInput;
      case "INVALID_CODE":
        return copy.errors.invalidCode;
      case "EXPIRED_CODE":
        return copy.errors.expiredCode;
      case "ATTEMPTS_EXCEEDED":
        return copy.errors.attemptsExceeded;
      case "NOT_REGISTERED":
        return copy.errors.notRegistered;
      case "UNAVAILABLE":
        return copy.errors.unavailable;
    }
  }

  async function requestCode() {
    setError(undefined);
    setIsSubmitting(true);

    try {
      const result = await requestLoginCodeFn({ data: { email } });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setDevelopmentCode(
        "developmentCode" in result ? result.developmentCode : undefined,
      );
      setCode("");
      setStep("code");
    } catch {
      setError("UNAVAILABLE");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await requestCode();
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);

    try {
      const result = await completeLoginFn({ data: { email, code } });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      await navigate({ to: "/dashboard", search: { lang } });
    } catch {
      setError("UNAVAILABLE");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-5 py-6 text-foreground sm:px-8 sm:py-8">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_14%,oklch(0.91_0.055_149/0.72),transparent_34%),radial-gradient(circle_at_10%_90%,oklch(0.95_0.025_148/0.75),transparent_30%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <a
          href={`/?lang=${lang}`}
          className="w-fit font-heading font-semibold text-xl tracking-[-0.04em]"
          aria-label={copy.brandLabel}
        >
          Geregeld
        </a>

        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1fr_30rem] lg:py-16">
          <section className="max-w-2xl">
            <p className="font-semibold text-primary text-sm uppercase tracking-[0.14em]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-5 text-balance font-heading font-semibold text-5xl leading-[0.94] tracking-[-0.06em] sm:text-7xl">
              {step === "email" ? copy.title : copy.codeTitle}
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground leading-relaxed">
              {step === "email"
                ? copy.description
                : copy.codeDescription(email)}
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card/94 p-6 shadow-[0_30px_80px_-45px_oklch(0.23_0.035_151/0.4)] backdrop-blur sm:p-8">
            {step === "email" ? (
              <form onSubmit={submitEmail} noValidate>
                <label htmlFor="login-email" className="font-semibold text-sm">
                  {copy.emailLabel}
                </label>
                <div className="relative mt-2">
                  <Mail
                    aria-hidden="true"
                    className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={copy.emailPlaceholder}
                    aria-invalid={
                      error === "INVALID_INPUT" ||
                      error === "NOT_REGISTERED" ||
                      undefined
                    }
                    aria-describedby={error ? "login-error" : undefined}
                    className="h-13 w-full rounded-2xl border border-input bg-background pr-4 pl-12 outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/15"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={unavailable || isSubmitting}
                  className="mt-5 h-12 w-full font-semibold"
                >
                  {isSubmitting ? copy.requestingCode : copy.requestCode}
                </Button>
              </form>
            ) : (
              <form onSubmit={submitCode} noValidate>
                <label htmlFor="login-code" className="font-semibold text-sm">
                  {copy.codeLabel}
                </label>
                <input
                  ref={codeInput}
                  id="login-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  aria-invalid={
                    error === "INVALID_INPUT" ||
                    error === "INVALID_CODE" ||
                    undefined
                  }
                  aria-describedby={error ? "login-error" : undefined}
                  className="mt-2 h-16 w-full rounded-2xl border border-input bg-background px-4 text-center font-semibold text-3xl tracking-[0.32em] outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/15"
                />

                {developmentCode ? (
                  <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-muted-foreground text-xs">
                    {copy.developmentCode}: <strong>{developmentCode}</strong>
                  </p>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || code.length !== 6}
                  className="mt-5 h-12 w-full font-semibold"
                >
                  <Check aria-hidden="true" />
                  {isSubmitting ? copy.completing : copy.complete}
                </Button>
                <div className="mt-4 flex flex-col items-center gap-2 text-sm">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={requestCode}
                    className="font-semibold text-primary hover:underline disabled:opacity-50"
                  >
                    {isSubmitting ? copy.resending : copy.resend}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError(undefined);
                      setDevelopmentCode(undefined);
                    }}
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft aria-hidden="true" className="size-3.5" />
                    {copy.changeEmail}
                  </button>
                </div>
              </form>
            )}

            <div className="min-h-12 pt-4">
              {error ? (
                <p
                  id="login-error"
                  role="alert"
                  className="rounded-xl bg-destructive/10 px-3 py-2 text-destructive text-sm"
                >
                  {errorMessage(error)}
                </p>
              ) : null}
            </div>

            <p className="border-border border-t pt-5 text-center text-muted-foreground text-sm">
              {copy.registerPrompt}{" "}
              <a
                href={`/register?lang=${lang}`}
                className="font-semibold text-foreground hover:underline"
              >
                {copy.register}
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
