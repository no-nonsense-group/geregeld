const [major] = process.versions.node.split(".").map(Number);

const supported = major === 26;

if (!supported) {
	console.error(
		[
			`Unsupported Node.js version: ${process.versions.node}.`,
			"Geregeld requires Node 26.",
			"Run `nvm install` followed by `nvm use`, then retry `bun run dev`.",
		].join("\n"),
	);
	process.exit(1);
}
