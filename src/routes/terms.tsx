import { createFileRoute } from "@tanstack/react-router";

import { organizationCopy } from "#/content/organization";
import { resolveUiLocale } from "#/shared/i18n";

export const Route = createFileRoute("/terms")({
  head: ({ match }) => {
    const copy = organizationCopy[resolveUiLocale(match.search.lang)].terms;

    return {
      meta: [
        { title: copy.meta.title },
        { name: "description", content: copy.meta.description },
      ],
    };
  },
  component: TermsPage,
});

function TermsPage() {
  const lang = resolveUiLocale(Route.useSearch().lang);
  const copy = organizationCopy[lang].terms;

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <a
          href={`/?lang=${lang}`}
          className="font-heading font-semibold text-xl tracking-[-0.04em]"
        >
          Geregeld
        </a>

        <article className="mt-16 rounded-3xl border border-border bg-card p-7 sm:p-10">
          <p className="font-semibold text-primary text-sm uppercase tracking-[0.14em]">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 font-heading font-semibold text-4xl tracking-[-0.05em] sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-8 rounded-2xl bg-muted p-5 text-muted-foreground">
            {copy.todo}
          </p>
        </article>

        <a
          href={`/?lang=${lang}`}
          className="mt-8 inline-block font-semibold text-sm hover:underline"
        >
          {copy.back}
        </a>
      </div>
    </main>
  );
}
