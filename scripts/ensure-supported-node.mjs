const [major] = process.versions.node.split(".").map(Number);

const supported = major === 24;

if (!supported) {
	console.error(
		[
			`Unsupported Node.js version: ${process.versions.node}.`,
			"Geregeld requires Node 24.",
			"Run `nvm install` followed by `nvm use`, then retry.",
		].join("\n"),
	);
	process.exit(1);
}
