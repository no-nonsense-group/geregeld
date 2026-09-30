import { Schema } from "effect";
import { z } from "zod";

export const bookingModeSchema = z.enum(["appointments", "tables", "rooms"]);
export type BookingMode = z.infer<typeof bookingModeSchema>;
const name = z.string().trim().min(1).max(80);
const duration = z.number().int().min(1).max(1440);
export const bookingChangeSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("mode"), mode: bookingModeSchema }),
  z.object({
    action: z.literal("resource"),
    id: z.uuid().optional(),
    name,
    kind: z.enum(["tables", "rooms"]),
    capacity: z.number().int().min(1).max(1000),
    active: z.boolean(),
  }),
  z.object({
    action: z.literal("service"),
    id: z.uuid().optional(),
    name,
    durationMinutes: duration,
    active: z.boolean(),
  }),
]);
export type BookingChange = z.infer<typeof bookingChangeSchema>;
export interface BookableResource {
  readonly id: string;
  readonly name: string;
  readonly kind: "tables" | "rooms";
  readonly capacity: number;
  readonly active: boolean;
}
export interface BookableService {
  readonly id: string;
  readonly name: string;
  readonly durationMinutes: number;
  readonly active: boolean;
}
export interface BookingSetup {
  readonly mode: BookingMode | null;
  readonly resources: ReadonlyArray<BookableResource>;
  readonly services: ReadonlyArray<BookableService>;
}
export class BookingSetupUnavailable extends Schema.TaggedError<BookingSetupUnavailable>()(
  "BookingSetupUnavailable",
  {},
) {}
export class InvalidBookingChange extends Schema.TaggedError<InvalidBookingChange>()(
  "InvalidBookingChange",
  {},
) {}
