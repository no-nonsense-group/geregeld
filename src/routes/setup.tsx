import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Building2, Check, ChevronDown, Clock3 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "#/components/ui/button";
import { organizationCopy } from "#/content/organization";
import {
  getOrganizationContextFn,
  setupOrganizationFn,
} from "#/contexts/organizations/slices/setup-organization/functions";

const fallbackTimeZones = ["Europe/Amsterdam", "Europe/London", "UTC"];
const timeZones =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : fallbackTimeZones;

export const Route = createFileRoute("/setup")({
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: async ({ deps }) => {
    const state = await getOrganizationContextFn();

    if (state.status === "unauthenticated") {
      throw redirect({ to: "/register", search: { lang: deps.lang } });
    }

    if (state.status === "ready") {
      throw redirect({ to: "/dashboard", search: { lang: deps.lang } });
    }

    return { unavailable: state.status === "unavailable" };
  },
  head: ({ match }) => {
    const copy = organizationCopy[match.search.lang].setup;

    return {
      meta: [
        { title: copy.meta.title },
        { name: "description", content: copy.meta.description },
      ],
    };
  },
  component: SetupPage,
});

type SetupError = "INVALID_INPUT" | "UNAVAILABLE";

function SetupPage() {
  const { lang } = Route.useSearch();
  const { unavailable } = Route.useLoaderData();
  const copy = organizationCopy[lang].setup;
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [timeZone, setTimeZone] = useState("Europe/Amsterdam");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<SetupError | undefined>(
    unavailable ? "UNAVAILABLE" : undefined,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && timeZones.includes(detected)) {
      setTimeZone(detected);
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);

    try {
      const result = await setupOrganizationFn({
        data: { name, timeZone, termsAccepted },
      });

      if (!result.ok) {
        if (result.error === "UNAUTHENTICATED") {
          await navigate({ to: "/register", search: { lang } });
          return;
        }

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
        >
          Geregeld
        </a>

        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1fr_30rem] lg:py-16">
          <section className="max-w-2xl">
            <p className="font-semibold text-primary text-sm uppercase tracking-[0.14em]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-5 text-balance font-heading font-semibold text-5xl leading-[0.94] tracking-[-0.06em] sm:text-7xl">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground leading-relaxed">
              {copy.description}
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card/94 p-6 shadow-[0_30px_80px_-45px_oklch(0.23_0.035_151/0.4)] backdrop-blur sm:p-8">
            <form onSubmit={submit} noValidate>
              <label
                htmlFor="organization-name"
                className="font-semibold text-sm"
              >
                {copy.nameLabel}
              </label>
              <div className="relative mt-2">
                <Building2
                  aria-hidden="true"
                  className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="organization-name"
                  type="text"
                  autoComplete="organization"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={copy.namePlaceholder}
                  aria-invalid={error === "INVALID_INPUT" || undefined}
                  aria-describedby={error ? "setup-error" : undefined}
                  className="h-13 w-full rounded-2xl border border-input bg-background pr-4 pl-12 outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/15"
                />
              </div>

              <label
                htmlFor="organization-time-zone"
                className="mt-5 block font-semibold text-sm"
              >
                {copy.timeZoneLabel}
              </label>
              <div className="relative mt-2">
                <Clock3
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
                />
                <select
                  id="organization-time-zone"
                  required
                  value={timeZone}
                  onChange={(event) => setTimeZone(event.target.value)}
                  aria-invalid={error === "INVALID_INPUT" || undefined}
                  aria-describedby="time-zone-hint"
                  className="h-13 w-full appearance-none rounded-2xl border border-input bg-background pr-10 pl-12 outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/15"
                >
                  {timeZones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground"
                />
              </div>
              <p
                id="time-zone-hint"
                className="mt-2 text-muted-foreground text-xs"
              >
                {copy.timeZoneHint}
              </p>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-muted/70 p-4 text-sm leading-relaxed">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                />
                <span>
                  {copy.termsBefore}{" "}
                  <a
                    href={`/terms?lang=${lang}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                  >
                    {copy.termsLink}
                  </a>
                  .
                </span>
              </label>

              <Button
                type="submit"
                size="lg"
                disabled={
                  unavailable ||
                  isSubmitting ||
                  name.trim().length === 0 ||
                  !termsAccepted
                }
                className="mt-5 h-12 w-full font-semibold"
              >
                <Check aria-hidden="true" />
                {isSubmitting ? copy.submitting : copy.submit}
              </Button>
            </form>

            <div className="min-h-16 pt-4">
              {error ? (
                <p
                  id="setup-error"
                  role="alert"
                  className="rounded-xl bg-destructive/10 px-3 py-2 text-destructive text-sm"
                >
                  {error === "INVALID_INPUT"
                    ? copy.errors.invalid
                    : copy.errors.unavailable}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
