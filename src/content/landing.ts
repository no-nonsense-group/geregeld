import type { UiLocale } from "#/shared/i18n";

export const landingCopy = {
	nl: {
		meta: {
			title: "Geregeld — Bookings zonder ballast",
			description:
				"Alleen wat je nodig hebt voor bookings en klantoverzicht. Betaal per gebruik en blijf vrij met API, MCP en veilige toegang voor je eigen agents.",
			socialDescription:
				"Je bookings, je klanten, je flow. Geen ballast. Betaal alleen voor wat je gebruikt.",
		},
		controls: {
			skip: "Naar de inhoud",
			home: "Geregeld home",
			language: "Taal kiezen",
		},
		navigation: {
			principles: "Hoe het werkt",
			cta: "Blijf op de hoogte",
		},
		hero: {
			title: "Bookings. Gewoon geregeld.",
			description:
				"Deel je beschikbaarheid, ontvang bookings en houd altijd overzicht over je klanten. Geen nieuwe werkwijze. Geen functiecircus.",
			primary: "Ik heb interesse",
			subject: "Interesse in Geregeld",
		},
		preview: {
			label: "Voorbeeld van je bookingsoverzicht",
			title: "Je overzicht",
			live: "Live",
			clients: "Klanten",
			bookings: "Bookings deze maand",
			today: "Vandaag",
			confirmed: "Bevestigd",
			newClient: "Nieuwe klant",
			footer: "Veilig toegankelijk via",
			entries: [
				{ time: "09:30", name: "Sophie van Dijk", service: "Knippen" },
				{ time: "11:00", name: "Mees de Boer", service: "Intake" },
				{ time: "14:30", name: "Nora Bakker", service: "Consult" },
			],
		},
		promise: {
			items: [
				{
					title: "Geen bloat",
					copy: "Beschikbaarheid, bookings en klanten. Elke functie verdient zijn plek.",
				},
				{
					title: "Betaal per gebruik",
					copy: "Geen groot pakket of vaste ballast. Je betaalt mee met wat je gebruikt.",
				},
				{
					title: "Altijd klantoverzicht",
					copy: "Elke booking bouwt aan één rustig en betrouwbaar overzicht van je klanten.",
				},
			],
		},
		open: {
			eyebrow: "Open by design",
			title: "Je data blijft in je eigen flow.",
			description:
				"Gebruik Geregeld direct, via de API, met MCP of vanuit je persoonlijke agents. Veilig, controleerbaar en zonder dat je nóg een tool hoeft te adopteren.",
			connectors: ["Open API", "MCP", "Persoonlijke agents"],
			note: "Jij bepaalt wie erbij kan en waarvoor.",
		},

	},
	en: {
		meta: {
			title: "Geregeld — Booking without the bloat",
			description:
				"Only what you need for bookings and client oversight. Pay as you go and stay open with API, MCP, and secure access for your own agents.",
			socialDescription:
				"Your bookings, your clients, your flow. No bloat. Pay only for what you use.",
		},
		controls: {
			skip: "Skip to content",
			home: "Geregeld home",
			language: "Choose language",
		},
		navigation: {
			principles: "How it works",
			cta: "Keep me posted",
		},
		hero: {
			title: "Booking. Simply handled.",
			description:
				"Share your availability, receive bookings, and always keep a clear view of your clients. No new workflow. No feature circus.",
			primary: "I’m interested",
			subject: "Interested in Geregeld",
		},
		preview: {
			label: "Example of your booking overview",
			title: "Your overview",
			live: "Live",
			clients: "Clients",
			bookings: "Bookings this month",
			today: "Today",
			confirmed: "Confirmed",
			newClient: "New client",
			footer: "Securely accessible through",
			entries: [
				{ time: "09:30", name: "Sophie van Dijk", service: "Haircut" },
				{ time: "11:00", name: "Mees de Boer", service: "Intake" },
				{ time: "14:30", name: "Nora Bakker", service: "Consult" },
			],
		},
		promise: {

			items: [
				{
					title: "No bloat",
					copy: "Availability, bookings, and clients. Every feature has to earn its place.",
				},
				{
					title: "Pay as you go",
					copy: "No oversized plan or fixed overhead. Your cost follows your actual use.",
				},
				{
					title: "Always know your clients",
					copy: "Every booking builds one calm, reliable overview of your clients.",
				},
			],
		},
		open: {
			eyebrow: "Open by design",
			title: "Your data stays in your flow.",
			description:
				"Use Geregeld directly, through the API, with MCP, or from your personal agents. Secure, controllable, and without adopting yet another tool.",
			connectors: ["Open API", "MCP", "Personal agents"],
			note: "You decide who gets access and what they can do.",
		},

	},
} as const satisfies Record<UiLocale, unknown>;
