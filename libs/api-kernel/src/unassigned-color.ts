/**
 * The yellow kept for Unassigned (user 2026-11-06): the Unassigned issue and claim are FFFF00, and no other issue or
 * claim may be given a yellow that looks like it. The app's pickers refuse such a colour already; this is the same
 * rule on the server, so an older app bundle, a venue box or a direct API call cannot save one either.
 *
 * The band matches the front end's isReservedUnassignedColor (evidence/components/issue-form/next-palette-color.ts):
 * hue 48°–68°, saturation ≥ 0.55, lightness 0.38–0.92 — bright to pale yellows. Amber / orange and olive are outside.
 * Colours arrive as hex with or without '#', 3 or 6 digits; anything else is not this rule's business (other
 * validators decide), so it passes here.
 *
 * Issues and claims that ALREADY have such a colour are kept (user's choice; the app flags them "Looks like
 * Unassigned"), so an update that leaves the colour as it is must pass: a create is checked on the body
 * (NotUnassignedYellow), an update by the service against the stored colour (isRefusedUnassignedYellowChange).
 */
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export const UNASSIGNED_COLOR_HEX = 'FFFF00';
export const RESERVED_UNASSIGNED_COLOR_MESSAGE = 'Yellow is kept for Unassigned. Choose another colour.';

/** `#RRGGBB` / `RRGGBB` / `#rgb` → upper-case `RRGGBB`; anything else → ''. */
export function normalizeColorHex(value: unknown): string {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(String(value ?? '').trim());
  if (!m) return '';
  return (m[1]!.length === 3 ? m[1]!.split('').map(ch => ch + ch).join('') : m[1]!).toUpperCase();
}

export function isReservedUnassignedColor(value: unknown): boolean {
  const hex = normalizeColorHex(value);
  if (!hex) return false;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r!, g!, b!);
  const min = Math.min(r!, g!, b!);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return false;
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g! - b!) / d) % 6 : max === g ? (b! - r!) / d + 2 : (r! - g!) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return h >= 48 && h <= 68 && s >= 0.55 && l >= 0.38 && l <= 0.92;
}

const isUnassignedName = (name: unknown): boolean => String(name ?? '').trim().toLowerCase() === 'unassigned';

/**
 * An update that must be refused: the new colour is in the Unassigned yellow, the record is not the Unassigned one,
 * and the colour is changing (an issue or claim that already had this colour keeps it). `stored` undefined = the
 * stored colour could not be read: the update is let through (the app refuses the pick already; a failed read must
 * not block an ordinary edit).
 */
export function isRefusedUnassignedYellowChange(next: unknown, stored: unknown | undefined, name: unknown): boolean {
  if (stored === undefined || isUnassignedName(name) || !isReservedUnassignedColor(next)) return false;
  return normalizeColorHex(next) !== normalizeColorHex(stored);
}

/**
 * On a colour field: refuse a colour in the Unassigned yellow, unless the record itself is the Unassigned one (its
 * name field — `cIName` for an issue, `cCategory` for a claim — reads "Unassigned"). With `idField`, a body that names
 * an existing record (an update) is left to the service, which compares with the stored colour. The 400 carries the
 * same words the app shows.
 */
export function NotUnassignedYellow(nameField: string, idField?: string, options?: ValidationOptions): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'notUnassignedYellow',
      target: object.constructor,
      propertyName: String(propertyName),
      constraints: [nameField, idField],
      options: { message: RESERVED_UNASSIGNED_COLOR_MESSAGE, ...options },
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const body = args.object as Record<string, unknown>;
          const [name, id] = args.constraints as [string, string | undefined];
          if (id && body[id]) return true;
          if (isUnassignedName(body[name])) return true;
          return !isReservedUnassignedColor(value);
        },
      },
    });
  };
}
