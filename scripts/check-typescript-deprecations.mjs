import path from "node:path";

import ts from "typescript";

const configPath = ts.findConfigFile(
  process.cwd(),
  ts.sys.fileExists,
  "tsconfig.json",
);

if (!configPath) {
  throw new Error("tsconfig.json not found");
}

const configFile = ts.readConfigFile(configPath, ts.sys.readFile);

if (configFile.error) {
  console.error(
    ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"),
  );
  process.exit(1);
}

const config = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  path.dirname(configPath),
);

const host = {
  getCompilationSettings: () => config.options,
  getCurrentDirectory: () => process.cwd(),
  getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
  getDirectories: ts.sys.getDirectories,
  getScriptFileNames: () => config.fileNames,
  getScriptSnapshot: (fileName) => {
    if (!ts.sys.fileExists(fileName)) {
      return undefined;
    }

    return ts.ScriptSnapshot.fromString(ts.sys.readFile(fileName) ?? "");
  },
  getScriptVersion: () => "0",
  directoryExists: ts.sys.directoryExists,
  fileExists: ts.sys.fileExists,
  readDirectory: ts.sys.readDirectory,
  readFile: ts.sys.readFile,
};

const service = ts.createLanguageService(host, ts.createDocumentRegistry());
const program = service.getProgram();
const diagnostics = [];

for (const fileName of config.fileNames) {
  const sourceFile = program?.getSourceFile(fileName);

  for (const diagnostic of service.getSuggestionDiagnostics(fileName)) {
    if (!diagnostic.reportsDeprecated) {
      continue;
    }

    const position =
      sourceFile && diagnostic.start !== undefined
        ? sourceFile.getLineAndCharacterOfPosition(diagnostic.start)
        : undefined;

    diagnostics.push({ diagnostic, fileName, position });
  }
}

if (diagnostics.length === 0) {
  console.log(
    `No deprecated TypeScript references in ${config.fileNames.length} files.`,
  );
  process.exit(0);
}

console.error("Deprecated TypeScript references:");

for (const { diagnostic, fileName, position } of diagnostics) {
  const relativePath = path.relative(process.cwd(), fileName);
  const line = (position?.line ?? 0) + 1;
  const character = (position?.character ?? 0) + 1;
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");

  console.error(
    `${relativePath}:${line}:${character} TS${diagnostic.code} ${message}`,
  );
}

process.exit(1);
