import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowRight,
	Braces,
	Check,
	CircleDollarSign,
	ListChecks,
	ShieldCheck,
	UsersRound,
} from "lucide-react";

import { landingCopy } from "#/content/landing";
import { uiLocales } from "#/shared/i18n";

export const Route = createFileRoute("/")({
	component: Home,
});

const promiseIcons = [ListChecks, CircleDollarSign, UsersRound] as const;

function mailto(subject: string) {
	return `mailto:danielagg@outlook.com?subject=${encodeURIComponent(subject)}`;
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

			<header className="relative z-20 border-border border-b bg-background/90 backdrop-blur-xl">
				<div className="page-shell flex h-16 items-center justify-between gap-4">
					<a
						href={`/?lang=${lang}`}
						className="flex items-center gap-2.5 font-heading font-semibold text-lg tracking-[-0.03em]"
						aria-label={copy.controls.home}
					>
						<span className="brand-mark" aria-hidden="true">
							G
						</span>
						Geregeld
					</a>

					<nav
						className="hidden items-center gap-7 text-muted-foreground text-sm md:flex"
						aria-label="Primary"
					>
						<a className="nav-link" href="#promise">
							{copy.navigation.principles}
						</a>

					</nav>

					<div className="flex items-center gap-2 sm:gap-3">
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

			
					</div>
				</div>
			</header>

			<main id="main">
				<section className="hero-surface relative border-border border-b">
					<div className="soft-grid absolute inset-0" />
					<div className="page-shell relative grid min-h-[calc(100svh-4rem)] items-center gap-16 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-20">
						<div className="max-w-3xl">

							<h1 className="mt-7 max-w-3xl text-balance font-heading font-semibold text-[clamp(3.6rem,8vw,7.8rem)] leading-[0.86] tracking-[-0.072em]">
								{copy.hero.title}
							</h1>
							<p className="mt-8 max-w-2xl text-pretty text-lg text-muted-foreground leading-relaxed sm:text-xl">
								{copy.hero.description}
							</p>

							<div className="mt-9 flex flex-col gap-3 sm:flex-row">
								<a
									className="button button-primary"
									href={mailto(copy.hero.subject)}
								>
									{copy.hero.primary}
									<ArrowRight aria-hidden="true" className="size-4" />
								</a>

							</div>


						</div>

						<div className="relative mx-auto w-full max-w-[35rem] lg:ml-auto">
							<div className="preview-glow absolute -inset-16" />
							<section
								className="overview-card relative"
								aria-label={copy.preview.label}
							>
								<div className="flex items-center justify-between border-border border-b px-5 py-4 sm:px-6">
									<div className="flex items-center gap-3">
										<span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
											<UsersRound aria-hidden="true" className="size-4" />
										</span>
										<p className="font-heading font-semibold tracking-[-0.02em]">
											{copy.preview.title}
										</p>
									</div>
									<span className="inline-flex items-center gap-2 rounded-full bg-primary/9 px-3 py-1.5 font-semibold text-primary text-xs">
										<span className="status-dot size-1.5" />
										{copy.preview.live}
									</span>
								</div>

								<div className="grid grid-cols-2 gap-px border-border border-b bg-border">
									<div className="bg-card p-5 sm:p-6">
										<p className="text-muted-foreground text-xs">
											{copy.preview.clients}
										</p>
										<p className="mt-2 font-heading font-semibold text-3xl tracking-[-0.05em]">
											148
										</p>
									</div>
									<div className="bg-card p-5 sm:p-6">
										<p className="text-muted-foreground text-xs">
											{copy.preview.bookings}
										</p>
										<p className="mt-2 font-heading font-semibold text-3xl tracking-[-0.05em]">
											32
										</p>
									</div>
								</div>

								<div className="p-5 sm:p-6">
									<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.16em]">
										{copy.preview.today}
									</p>
									<div className="mt-3 divide-y divide-border">
										{copy.preview.entries.map((entry, index) => (
											<div
												key={entry.time}
												className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 py-3.5"
											>
												<span className="font-medium text-muted-foreground text-xs">
													{entry.time}
												</span>
												<div className="min-w-0">
													<p className="truncate font-semibold text-sm">
														{entry.name}
													</p>
													<p className="mt-0.5 text-muted-foreground text-xs">
														{entry.service}
													</p>
												</div>
												<span className="hidden rounded-full border border-primary/20 bg-primary/7 px-2.5 py-1 font-medium text-primary text-[0.65rem] xs:block">
													{index === 2
														? copy.preview.newClient
														: copy.preview.confirmed}
												</span>
											</div>
										))}
									</div>
								</div>

								<div className="flex flex-wrap items-center gap-2 border-border border-t bg-muted/55 px-5 py-4 text-muted-foreground text-xs sm:px-6">
									<ShieldCheck
										aria-hidden="true"
										className="size-4 text-primary"
									/>
									<span>{copy.preview.footer}</span>
									<span className="font-semibold text-foreground">
										API · MCP · Agents
									</span>
								</div>
							</section>
						</div>
					</div>
				</section>

				<section id="promise" className="section-space">
					<div className="page-shell">
						

						<div className="mt-14 grid overflow-hidden rounded-[1.5rem] border bg-card md:grid-cols-3">
							{copy.promise.items.map((item, index) => {
								const Icon = promiseIcons[index];

								return (
									<article
										key={item.title}
										className={`p-7 sm:p-8 ${index > 0 ? "border-border border-t md:border-t-0 md:border-l" : ""}`}
									>
										<span className="flex size-10 items-center justify-center rounded-xl bg-primary/9 text-primary">
											{Icon ? (
												<Icon aria-hidden="true" className="size-5" />
											) : null}
										</span>
										<h3 className="mt-10 font-heading font-semibold text-2xl tracking-[-0.035em]">
											{item.title}
										</h3>
										<p className="mt-3 max-w-sm text-muted-foreground leading-relaxed">
											{item.copy}
										</p>
									</article>
								);
							})}
						</div>

						<div id="open" className="open-panel mt-6">
							<div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
								<div>
									<p className="eyebrow text-primary">{copy.open.eyebrow}</p>
									<h2 className="mt-5 max-w-2xl text-balance font-heading font-semibold text-4xl leading-[1] tracking-[-0.05em] sm:text-6xl">
										{copy.open.title}
									</h2>
									<p className="mt-5 max-w-xl text-foreground/65 leading-relaxed sm:text-lg">
										{copy.open.description}
									</p>
								</div>

								<div className="rounded-[1.25rem] border border-foreground/10 bg-background/55 p-4 sm:p-5">
									<div className="flex items-center gap-2 border-foreground/10 border-b pb-4 font-semibold text-sm">
										<Braces
											aria-hidden="true"
											className="size-4 text-primary"
										/>
										Geregeld.connect()
									</div>
									<div className="mt-4 flex flex-wrap gap-2">
										{copy.open.connectors.map((connector) => (
											<span
												key={connector}
												className="rounded-full border border-foreground/10 bg-background px-3 py-2 font-semibold text-xs"
											>
												{connector}
											</span>
										))}
									</div>
									<p className="mt-5 flex items-center gap-2 text-foreground/60 text-xs">
										<ShieldCheck
											aria-hidden="true"
											className="size-4 text-primary"
										/>
										{copy.open.note}
									</p>
								</div>
							</div>
						</div>

						
					</div>
				</section>
			</main>

			<footer>
				<div className="page-shell flex flex-col gap-4 py-7 text-muted-foreground text-sm sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-2.5 text-foreground">
						<span
							className="brand-mark size-7 rounded-lg text-xs"
							aria-hidden="true"
						>
							G
						</span>
						<span className="font-heading font-semibold">Geregeld</span>
					</div>
					<p>© 2026 No Nonsense Group</p>
				</div>
			</footer>
		</div>
	);
}
