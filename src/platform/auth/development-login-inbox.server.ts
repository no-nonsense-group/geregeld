import "@tanstack/react-start/server-only";

const codes = new Map<string, string>();

export function storeDevelopmentLoginCode(email: string, code: string): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The development login inbox is disabled");
  }

  codes.set(email, code);
}

export function getDevelopmentLoginCode(email: string): string | undefined {
  if (process.env.NODE_ENV === "production") {
    return undefined;
  }

  return codes.get(email);
}
