import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Button } from "#/components/ui/button";
import { greetingQueryOptions } from "#/contexts/system/slices/get-greeting/query";

export const Route = createFileRoute("/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(greetingQueryOptions),
	component: Home,
});

function Home() {
	const { data } = useSuspenseQuery(greetingQueryOptions);

	return (
		<main className="flex min-h-screen items-center justify-center p-6">
			<section className="w-full max-w-lg space-y-6 rounded-xl border bg-card p-8 text-card-foreground shadow-sm">
				<div className="space-y-2">
					<p className="font-medium text-primary text-sm">Geregeld</p>
					<h1 className="font-heading font-semibold text-3xl tracking-tight">
						{data.message}
					</h1>
					<p className="text-muted-foreground">
						TanStack Start, TanStack Query, Effect, and shadcn/ui are ready.
					</p>
				</div>

				<Button type="button">Scaffold ready</Button>
			</section>
		</main>
	);
}
