import { TanStackDevtools } from "@tanstack/react-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { AppControls } from "#/components/app-controls";
import { landingCopy } from "#/content/landing";
import type { RouterContext } from "#/router";
import { resolveUiLocale, uiLocaleStorageKey } from "#/shared/i18n";
import legacySpacingCss from "../legacy-spacing.css?url";
import appCss from "../styles.css?url";

const localeScript = `try {
	const url = new URL(location.href);
	const requested = url.searchParams.get("lang");
	const isSupported = (value) => value === "nl" || value === "en";
	let stored;

	try {
		stored = localStorage.getItem(${JSON.stringify(uiLocaleStorageKey)});
	} catch {}

	const browserLanguage = (navigator.languages?.[0] ?? navigator.language).toLowerCase().split("-")[0];
	const locale = isSupported(requested)
		? requested
		: isSupported(stored)
			? stored
			: browserLanguage === "en" ? "en" : "nl";

	try {
		localStorage.setItem(${JSON.stringify(uiLocaleStorageKey)}, locale);
	} catch {}

	if (!isSupported(requested)) {
		url.searchParams.set("lang", locale);

		if (locale === "en") {
			location.replace(url);
		} else {
			history.replaceState(history.state, "", url);
		}
	}
} catch {}`;

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: (search: Record<string, unknown>) => ({
    lang: resolveUiLocale(search.lang),
  }),
  head: ({ match }) => {
    const copy = landingCopy[resolveUiLocale(match.search.lang)];

    return {
      meta: [
        {
          charSet: "utf-8",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        {
          title: copy.meta.title,
        },
        {
          name: "description",
          content: copy.meta.description,
        },
        {
          property: "og:title",
          content: copy.meta.title,
        },
        {
          property: "og:description",
          content: copy.meta.socialDescription,
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          property: "og:image",
          content: "/og.png",
        },
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        {
          name: "twitter:title",
          content: copy.meta.title,
        },
        {
          name: "twitter:description",
          content: copy.meta.socialDescription,
        },
        {
          name: "twitter:image",
          content: "/og.png",
        },
      ],
      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
        {
          rel: "stylesheet",
          href: legacySpacingCss,
        },
      ],
    };
  },
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { lang } = Route.useSearch();
  const authenticated = useRouterState({
    select: (state) =>
      state.matches.some((match) => match.routeId === "/_authenticated"),
  });

  return (
    <html
      lang={lang}
      className="scheme-light scroll-smooth font-sans motion-reduce:scroll-auto"
      suppressHydrationWarning
    >
      <head>
        <script>{localeScript}</script>
        <HeadContent />
      </head>
      <body className="min-w-80 bg-background text-foreground [text-rendering:optimizeLegibility]">
        <AppControls authenticated={authenticated} locale={lang} />
        {children}
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
