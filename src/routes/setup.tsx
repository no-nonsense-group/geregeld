import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/setup")({
  component: SetupPlaceholder,
});

function SetupPlaceholder() {
  const { lang } = Route.useSearch();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
      <section className="max-w-xl text-center">
        <p className="font-semibold text-primary text-sm uppercase tracking-[0.14em]">
          {lang === "nl" ? "Registratie voltooid" : "Registration complete"}
        </p>
        <h1 className="mt-4 font-heading font-semibold text-5xl tracking-[-0.055em]">
          {lang === "nl"
            ? "Nu je bedrijf instellen."
            : "Now set up your business."}
        </h1>
        <p className="mt-5 text-muted-foreground text-lg">
          {lang === "nl"
            ? "Dit is de volgende verticale slice."
            : "This is the next vertical slice."}
        </p>
      </section>
    </main>
  );
}
