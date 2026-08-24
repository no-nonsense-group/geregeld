import { createFileRoute } from "@tanstack/react-router";
import { Play } from "lucide-react";

import { landingCopy } from "#/content/landing";
import { uiLocales } from "#/shared/i18n";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { lang } = Route.useSearch();
  const copy = landingCopy[lang];
  const getStartedHref = `/register?lang=${lang}`;

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-foreground px-4 py-2 text-background focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        {copy.controls.skip}
      </a>

      <header className="relative z-20 border-border border-b bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] w-full max-w-[86rem] items-center gap-4 px-5 sm:px-8 lg:px-12">
          <a
            href={`/?lang=${lang}`}
            className="shrink-0 font-heading font-semibold text-xl tracking-[-0.04em]"
            aria-label={copy.controls.home}
          >
            Geregeld
          </a>

          <nav
            className="mx-auto hidden items-center gap-7 text-muted-foreground text-sm lg:flex"
            aria-label="Primary"
          >
            <a
              className="transition-colors hover:text-foreground"
              href="#how-it-works"
            >
              {copy.navigation.howItWorks}
            </a>
            <a
              className="transition-colors hover:text-foreground"
              href="#pricing"
            >
              {copy.navigation.pricing}
            </a>
            <a
              className="transition-colors hover:text-foreground"
              href="#about"
            >
              {copy.navigation.about}
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:ml-0">
            <fieldset className="flex items-center gap-2 pr-1 text-xs sm:gap-3 sm:text-sm">
              <legend className="sr-only">{copy.controls.language}</legend>
              {uiLocales.map((locale) => (
                <a
                  key={locale}
                  href={`/?lang=${locale}`}
                  aria-current={lang === locale ? "page" : undefined}
                  className="uppercase text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:font-semibold aria-[current=page]:text-foreground"
                >
                  {locale}
                </a>
              ))}
            </fieldset>
            <a
              className="hidden min-h-10 items-center justify-center rounded-full px-3 font-semibold text-sm transition-colors hover:bg-muted sm:inline-flex"
              href="/login"
            >
              {copy.actions.login}
            </a>
            <a
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-foreground px-4 font-semibold text-background text-sm transition-colors hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
              href={getStartedHref}
            >
              {copy.actions.getStarted}
            </a>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="relative border-border border-b bg-[radial-gradient(circle_at_82%_42%,oklch(0.91_0.055_149/0.68),transparent_34%)]">
          <div className="mx-auto grid min-h-[calc(100svh-4.5rem)] w-full max-w-[86rem] items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-12 lg:py-20">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-primary/25 bg-primary/9 px-3 py-1.5 font-semibold text-primary text-sm">
                {copy.hero.offer}
              </p>
              <h1 className="mt-7 max-w-3xl text-balance font-heading font-semibold text-[clamp(3.6rem,7vw,7rem)] leading-[0.88] tracking-[-0.07em]">
                {copy.hero.title}
              </h1>
              <p className="mt-8 max-w-xl text-pretty text-lg text-muted-foreground leading-relaxed sm:text-xl">
                {copy.hero.description}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 font-semibold text-primary-foreground text-sm transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
                  href={getStartedHref}
                >
                  {copy.actions.getStarted}
                </a>
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-background/70 px-6 font-semibold text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
                  href="/login"
                >
                  {copy.actions.login}
                </a>
              </div>
              <p className="mt-4 text-muted-foreground text-sm">
                {copy.hero.priceNote}
              </p>
            </div>

            <figure className="mx-auto w-full max-w-[44rem] lg:ml-auto">
              <div
                className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[0_32px_80px_-44px_oklch(0.23_0.035_151/0.3)]"
                role="img"
                aria-label={copy.demo.label}
              >
                <div
                  className="flex items-center gap-1.5 border-border border-b px-4 py-3"
                  aria-hidden="true"
                >
                  <span className="size-2 rounded-full bg-border" />
                  <span className="size-2 rounded-full bg-border" />
                  <span className="size-2 rounded-full bg-border" />
                </div>
                <div className="relative flex aspect-video items-center justify-center bg-[linear-gradient(145deg,oklch(0.965_0.016_148),oklch(0.91_0.04_149))] p-6 text-center">
                  <div
                    className="absolute inset-5 rounded-xl border border-foreground/8 bg-background/24"
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-foreground text-background shadow-lg">
                      <Play
                        aria-hidden="true"
                        className="ml-1 size-5 fill-current"
                      />
                    </span>
                    <p className="mt-5 font-heading font-semibold text-2xl tracking-[-0.04em] sm:text-3xl">
                      {copy.demo.title}
                    </p>
                    <p className="mt-2 text-foreground/58 text-sm">
                      {copy.demo.status}
                    </p>
                  </div>
                </div>
              </div>
              <figcaption className="mt-3 text-right text-muted-foreground text-xs">
                {copy.demo.duration}
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="bg-foreground text-background">
          <div className="mx-auto w-full max-w-[86rem] px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
            <div className="max-w-3xl">
              <p className="font-semibold text-primary text-sm uppercase tracking-[0.14em]">
                {copy.overview.eyebrow}
              </p>
              <h2 className="mt-4 text-balance font-heading font-semibold text-5xl leading-[0.96] tracking-[-0.055em] sm:text-7xl">
                {copy.overview.title}
              </h2>
            </div>

            <div className="mt-14 grid border-background/16 border-t lg:grid-cols-3">
              <article id="how-it-works" className="scroll-mt-24 py-9 lg:pr-10">
                <h3 className="font-heading font-semibold text-2xl tracking-[-0.04em]">
                  {copy.overview.howItWorks.title}
                </h3>
                <ol className="mt-8 space-y-5">
                  {copy.overview.howItWorks.steps.map((step, index) => (
                    <li
                      key={step}
                      className="flex gap-4 text-background/72 leading-relaxed"
                    >
                      <span className="font-semibold text-primary text-sm">
                        0{index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </article>

              <article
                id="pricing"
                className="scroll-mt-24 border-background/16 border-t py-9 lg:border-t-0 lg:border-l lg:px-10"
              >
                <h3 className="font-heading font-semibold text-2xl tracking-[-0.04em]">
                  {copy.overview.pricing.title}
                </h3>
                <p className="mt-8 font-heading font-semibold text-4xl text-primary tracking-[-0.05em] sm:text-5xl">
                  {copy.overview.pricing.offer}
                </p>
                <p className="mt-3 font-semibold text-lg">
                  {copy.overview.pricing.price}
                </p>
                <p className="mt-5 max-w-sm text-background/62 leading-relaxed">
                  {copy.overview.pricing.detail}
                </p>
              </article>

              <article
                id="about"
                className="scroll-mt-24 border-background/16 border-t py-9 lg:border-t-0 lg:border-l lg:pl-10"
              >
                <h3 className="font-heading font-semibold text-2xl tracking-[-0.04em]">
                  {copy.overview.about.title}
                </h3>
                <p className="mt-8 max-w-md text-background/72 text-lg leading-relaxed">
                  {copy.overview.about.description}
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="mx-auto flex w-full max-w-[86rem] flex-col gap-4 px-5 py-7 text-muted-foreground text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span className="font-heading font-semibold text-foreground">
            Geregeld
          </span>
          <p>© 2026 No Nonsense Group</p>
        </div>
      </footer>
    </div>
  );
}
