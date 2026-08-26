import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { AppControls } from "#/components/app-controls";
import { AvailabilityEditor } from "#/components/availability-editor";
import { Brand } from "#/components/brand";
import { organizationCopy } from "#/content/organization";
import { getAvailabilityFn } from "#/contexts/availability/slices/manage-availability/functions";
import { resolveUiLocale } from "#/shared/i18n";

export const Route = createFileRoute("/_authenticated/availability")({
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: async ({ context, deps }) => {
    const state = context.organizationContext;

    if (state.status === "setup-required") {
      throw redirect({ to: "/setup", search: { lang: deps.lang } });
    }

    if (state.status !== "ready") {
      return {
        organization: undefined,
        availability: undefined,
        unavailable: true as const,
      };
    }

    const availability = await getAvailabilityFn({ data: {} });
    return {
      organization: state.organization,
      availability: availability.ok ? availability.value : undefined,
      unavailable: false as const,
    };
  },
  head: ({ match }) => {
    const copy =
      organizationCopy[resolveUiLocale(match.search.lang)].availability;
    return {
      meta: [
        { title: copy.meta.title },
        { name: "description", content: copy.meta.description },
      ],
    };
  },
  component: AvailabilityPage,
});

function AvailabilityPage() {
  const lang = resolveUiLocale(Route.useSearch().lang);
  const { organization, availability, unavailable } = Route.useLoaderData();
  const allCopy = organizationCopy[lang];
  const copy = allCopy.availability;
  const router = useRouter();

  if (unavailable || !organization || !availability) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
        <p role="alert" className="text-muted-foreground">
          {allCopy.unavailable}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-border border-b bg-card/80 backdrop-blur">
        <div className="mx-auto grid h-18 max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-5 sm:px-8">
          <a href={`/dashboard?lang=${lang}`} className="w-fit">
            <Brand />
          </a>
          <AppControls
            authenticated
            locale={lang}
            className="justify-self-end"
          />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          to="/dashboard"
          search={{ lang }}
          className="mb-7 inline-flex items-center gap-2 font-semibold text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {copy.back}
        </Link>

        <AvailabilityEditor
          initial={availability}
          copy={copy}
          lang={lang}
          timeZone={organization.timeZone}
          onSaved={() => router.invalidate()}
        />
      </div>
    </main>
  );
}
