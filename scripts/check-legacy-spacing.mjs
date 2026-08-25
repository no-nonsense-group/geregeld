import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const assetsDirectory = join(process.cwd(), ".output", "public", "assets");
const assetNames = await readdir(assetsDirectory);
const mainCssName = assetNames.find((name) => /^styles-.*\.css$/.test(name));
const legacyCssName = assetNames.find((name) =>
  /^legacy-spacing-.*\.css$/.test(name),
);

if (!mainCssName || !legacyCssName) {
  throw new Error("The built CSS assets needed for the compatibility check are missing.");
}

const [mainCss, legacyCss] = await Promise.all([
  readFile(join(assetsDirectory, mainCssName), "utf8"),
  readFile(join(assetsDirectory, legacyCssName), "utf8"),
]);

const missingSelectors = [];
let checkedSelectorCount = 0;
const rulePattern = /([^{}]+)\{([^{}]+)\}/g;

for (const match of mainCss.matchAll(rulePattern)) {
  const selector = match[1].trim();
  const declarations = match[2];
  const needsResolvedSpacing = declarations.includes("calc(var(--spacing)");
  const needsPhysicalCentering =
    selector === ".mx-auto" && declarations.includes("margin-inline:auto");

  if (needsResolvedSpacing || needsPhysicalCentering) {
    checkedSelectorCount += 1;

    if (!legacyCss.includes(`${selector}{`)) {
      missingSelectors.push(selector);
    }
  }
}

const calculatedLineHeights = [
  ...mainCss.matchAll(/(--text-[\w-]+--line-height):calc\(/g),
].map((match) => match[1]);
const missingLineHeights = calculatedLineHeights.filter(
  (property) => !legacyCss.includes(`${property}:`),
);

if (missingSelectors.length || missingLineHeights.length) {
  const missing = [...missingSelectors, ...missingLineHeights]
    .map((value) => `  - ${value}`)
    .join("\n");
  throw new Error(`Legacy CSS fallbacks are missing for:\n${missing}`);
}

console.log(
  `Legacy CSS covers ${checkedSelectorCount + calculatedLineHeights.length} generated compatibility-sensitive rules.`,
);
