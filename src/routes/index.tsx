import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowRight,
	CalendarCheck,
	Check,
	Clock3,
	Moon,
	SlidersHorizontal,
	Sun,
} from "lucide-react";

import { landingCopy } from "#/content/landing";
import { uiLocales } from "#/shared/i18n";

export const Route = createFileRoute("/")({
	component: Home,
});

const featureIcons = [SlidersHorizontal, CalendarCheck, Clock3] as const;

function mailto(subject: string) {
	return `mailto:danielagg@outlook.com?subject=${encodeURIComponent(subject)}`;
}

function toggleTheme() {
	const root = document.documentElement;
	const dark = !root.classList.contains("dark");

	root.classList.toggle("dark", dark);
	localStorage.setItem("geregeld-theme", dark ? "dark" : "light");
}

function Home() {
	const { lang } = Route.useSearch();
	const copy = landingCopy[lang];

	return (
		<div className="min-h-screen overflow-hidden bg-background text-foreground">
			<a
				href="#main"
				className="sr-only z-50 rounded-full bg-foreground px-4 py-2 text-background focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
			>
				{copy.controls.skip}
			</a>

			<header className="relative z-20 border-border/70 border-b bg-background/85 backdrop-blur-xl">
				<div className="page-shell flex h-18 items-center justify-between gap-4">
					<a
						href={`/?lang=${lang}`}
						className="flex items-center gap-2.5 font-heading font-semibold text-lg tracking-tight"
						aria-label={copy.controls.home}
					>
						<span className="flex size-8 items-center justify-center rounded-[0.6rem] bg-foreground text-background">
							G
						</span>
						<span className="hidden xs:inline">Geregeld</span>
					</a>

					<nav
						className="hidden items-center gap-8 text-muted-foreground text-sm lg:flex"
						aria-label={copy.controls.navigation}
					>
						<a className="nav-link" href="#features">
							{copy.navigation.features}
						</a>
						<a className="nav-link" href="#how-it-works">
							{copy.navigation.how}
						</a>
						<a className="nav-link" href="#pricing">
							{copy.navigation.pricing}
						</a>
					</nav>

					<div className="flex items-center gap-2">
						<fieldset className="flex items-center rounded-full border bg-card p-0.5">
							<legend className="sr-only">{copy.controls.language}</legend>
							{uiLocales.map((locale) => (
								<a
									key={locale}
									href={`/?lang=${locale}`}
									aria-current={lang === locale ? "page" : undefined}
									className="rounded-full px-2.5 py-1.5 font-semibold text-[0.65rem] uppercase tracking-wide transition-colors aria-[current=page]:bg-foreground aria-[current=page]:text-background"
								>
									{locale}
								</a>
							))}
						</fieldset>

						<button
							type="button"
							className="flex size-9 items-center justify-center rounded-full border bg-card transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45"
							onClick={toggleTheme}
							aria-label={copy.controls.theme}
						>
							<Sun aria-hidden="true" className="size-4 dark:hidden" />
							<Moon aria-hidden="true" className="hidden size-4 dark:block" />
						</button>

						<a
							className="button button-small button-dark hidden sm:inline-flex"
							href="#pricing"
						>
							{copy.navigation.soon}
						</a>
					</div>
				</div>
			</header>

			<main id="main">
				<section className="relative border-border/70 border-b">
					<div className="landing-grid absolute inset-0 opacity-60" />
					<div className="page-shell relative grid min-h-[calc(100svh-4.5rem)] items-center gap-16 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
						<div className="max-w-3xl">
							<p className="eyebrow">
								<span className="size-1.5 rounded-full bg-primary" />
								{copy.hero.eyebrow}
							</p>
							<h1 className="mt-7 max-w-3xl font-heading font-semibold text-[clamp(3.4rem,8vw,7.7rem)] leading-[0.88] tracking-[-0.065em]">
								{copy.hero.title}
								<span className="mt-2 block text-primary">
									{copy.hero.accent}
								</span>
							</h1>
							<p className="mt-8 max-w-xl text-balance text-lg text-muted-foreground leading-relaxed sm:text-xl">
								{copy.hero.description}
							</p>
							<div className="mt-10 flex flex-col gap-3 sm:flex-row">
								<a className="button button-primary" href="#how-it-works">
									{copy.hero.primary}
									<ArrowRight aria-hidden="true" className="size-4" />
								</a>
								<a className="button button-ghost" href="#pricing">
									{copy.hero.secondary}
								</a>
							</div>
						</div>

						<div className="relative mx-auto w-full max-w-[34rem] lg:mx-0 lg:ml-auto">
							<div className="absolute -inset-10 rounded-full bg-primary/10 blur-3xl" />
							<div className="relative rotate-[1.5deg] rounded-[2rem] border border-foreground/10 bg-card p-3 shadow-[0_30px_80px_-35px_oklch(0.15_0.01_200/0.35)] sm:p-4">
								<div className="rounded-[1.35rem] border bg-background p-5 sm:p-7">
									<div className="flex items-start justify-between border-border border-b pb-5">
										<div>
											<p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.18em]">
												{copy.preview.today}
											</p>
											<p className="mt-1 font-heading font-semibold text-xl">
												{copy.preview.date}
											</p>
										</div>
										<span className="rounded-full bg-primary/10 px-3 py-1.5 font-medium text-primary text-xs">
											{copy.preview.count}
										</span>
									</div>

									<div className="mt-5 grid grid-cols-[3.5rem_1fr] gap-x-3 gap-y-3 text-sm">
										<span className="pt-4 text-muted-foreground">09:00</span>
										<div className="rounded-xl border border-primary/20 bg-primary/8 p-4">
											<div className="flex items-center justify-between gap-4">
												<p className="font-semibold">
													{copy.preview.serviceOne}
												</p>
												<p className="text-primary text-xs">
													{copy.preview.confirmed}
												</p>
											</div>
											<p className="mt-1 text-muted-foreground text-xs">
												45 min · Sophie
											</p>
										</div>

										<span className="pt-4 text-muted-foreground">11:30</span>
										<div className="rounded-xl border bg-card p-4">
											<div className="flex items-center justify-between gap-4">
												<p className="font-semibold">
													{copy.preview.serviceTwo}
												</p>
												<p className="text-muted-foreground text-xs">
													{copy.preview.confirmed}
												</p>
											</div>
											<p className="mt-1 text-muted-foreground text-xs">
												60 min · Mees
											</p>
										</div>

										<span className="pt-3 text-muted-foreground">14:00</span>
										<div className="rounded-xl border border-dashed bg-muted/35 px-4 py-3 text-muted-foreground">
											{copy.preview.available}
										</div>
									</div>
								</div>
							</div>

							<div className="absolute -right-3 -bottom-8 w-[15rem] -rotate-2 rounded-2xl border bg-foreground p-4 text-background shadow-xl sm:-right-7">
								<div className="flex items-center gap-3">
									<span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
										<Check
											aria-hidden="true"
											className="size-4"
											strokeWidth={3}
										/>
									</span>
									<div>
										<p className="font-semibold text-sm">
											{copy.preview.newBooking}
										</p>
										<p className="mt-0.5 text-background/60 text-xs">
											{copy.preview.automatic}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="page-shell relative border-border/70 border-t py-5">
						<p className="text-center font-medium text-muted-foreground text-xs uppercase tracking-[0.16em]">
							{copy.audience.map((audience, index) => (
								<span key={audience}>
									{index > 0 ? (
										<span className="mx-3 text-border">•</span>
									) : null}
									{audience}
								</span>
							))}
						</p>
					</div>
				</section>

				<section id="features" className="section-space">
					<div className="page-shell">
						<div className="section-heading">
							<p className="eyebrow">{copy.features.eyebrow}</p>
							<h2>{copy.features.title}</h2>
							<p>{copy.features.description}</p>
						</div>

						<div className="mt-14 grid overflow-hidden rounded-[1.6rem] border md:grid-cols-3">
							{copy.features.items.map((feature, index) => {
								const Icon = featureIcons[index];
								const number = String(index + 1).padStart(2, "0");

								return (
									<article
										key={feature.title}
										className={`group min-h-[19rem] p-7 sm:p-9 ${
											index > 0
												? "border-border border-t md:border-t-0 md:border-l"
												: ""
										}`}
									>
										<div className="flex items-center justify-between">
											<span className="flex size-11 items-center justify-center rounded-xl bg-muted text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
												{Icon ? (
													<Icon aria-hidden="true" className="size-5" />
												) : null}
											</span>
											<span className="font-heading font-medium text-border text-sm">
												{number}
											</span>
										</div>
										<h3 className="mt-16 font-heading font-semibold text-2xl tracking-tight">
											{feature.title}
										</h3>
										<p className="mt-3 max-w-sm text-muted-foreground leading-relaxed">
											{feature.copy}
										</p>
									</article>
								);
							})}
						</div>
					</div>
				</section>

				<section
					id="how-it-works"
					className="border-border border-y bg-foreground text-background"
				>
					<div className="page-shell section-space">
						<div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
							<div>
								<p className="eyebrow text-background/55">
									<span className="size-1.5 rounded-full bg-primary" />
									{copy.how.eyebrow}
								</p>
								<h2 className="mt-6 max-w-md font-heading font-semibold text-4xl tracking-[-0.04em] sm:text-5xl">
									{copy.how.title}
								</h2>
							</div>

							<div className="divide-y divide-background/15 border-background/15 border-y">
								{copy.how.steps.map((step, index) => (
									<article
										key={step.title}
										className="grid gap-3 py-7 sm:grid-cols-[4rem_1fr] sm:py-8"
									>
										<span className="font-medium text-primary text-sm">
											{String(index + 1).padStart(2, "0")}
										</span>
										<div>
											<h3 className="font-heading font-semibold text-xl">
												{step.title}
											</h3>
											<p className="mt-2 max-w-xl text-background/60 leading-relaxed">
												{step.copy}
											</p>
										</div>
									</article>
								))}
							</div>
						</div>
					</div>
				</section>

				<section id="pricing" className="section-space">
					<div className="page-shell">
						<div className="relative overflow-hidden rounded-[2rem] border bg-card px-6 py-16 sm:px-12 lg:px-16 lg:py-20">
							<div className="landing-grid absolute inset-0 opacity-50" />
							<div className="relative grid items-end gap-12 lg:grid-cols-[1fr_auto]">
								<div>
									<p className="eyebrow">
										<span className="size-1.5 rounded-full bg-primary" />
										{copy.pricing.eyebrow}
									</p>
									<h2 className="mt-6 max-w-2xl font-heading font-semibold text-4xl tracking-[-0.045em] sm:text-6xl">
										{copy.pricing.title}
										<span className="block text-muted-foreground">
											{copy.pricing.accent}
										</span>
									</h2>
									<p className="mt-6 max-w-xl text-muted-foreground leading-relaxed">
										{copy.pricing.description}
									</p>
								</div>

								<a
									className="button button-primary"
									href={mailto(copy.pricing.subject)}
								>
									{copy.pricing.cta}
									<ArrowRight aria-hidden="true" className="size-4" />
								</a>
							</div>
						</div>
					</div>
				</section>

				<section className="pb-24 sm:pb-32">
					<div className="page-shell text-center">
						<p className="eyebrow justify-center">{copy.closing.eyebrow}</p>
						<h2 className="mx-auto mt-6 max-w-4xl text-balance font-heading font-semibold text-5xl tracking-[-0.055em] sm:text-7xl">
							{copy.closing.title}
						</h2>
						<a
							className="button button-dark mt-10"
							href={mailto(copy.closing.subject)}
						>
							{copy.closing.cta}
							<ArrowRight aria-hidden="true" className="size-4" />
						</a>
					</div>
				</section>
			</main>

			<footer className="border-border border-t">
				<div className="page-shell flex flex-col gap-5 py-7 text-muted-foreground text-sm sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-2.5 text-foreground">
						<span className="flex size-7 items-center justify-center rounded-lg bg-foreground font-semibold text-background text-xs">
							G
						</span>
						<span className="font-heading font-semibold">Geregeld</span>
					</div>
					<p>{copy.footer}</p>
					<p>© 2026 No Nonsense Group</p>
				</div>
			</footer>
		</div>
	);
}
