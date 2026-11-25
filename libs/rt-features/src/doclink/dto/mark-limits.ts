import { ValidateBy, ValidationOptions, buildMessage } from 'class-validator';

/**
 * Size limits for Mark (QFact / Fact / DocLink) writes. Day 3 live load QA (2026-10-29) stored a 1 MB
 * selection and a 200 KB note, which made every MarkNav reply for that session 1.5 MB and slowed parallel
 * reads to 6–16 s. A real selection is a few lines; a five-page selection is ~15,000 characters.
 */
export const MARK_LIMITS = {
  selectedText: 100_000,   // jOT
  note: 50_000,            // jT / jTexts
  coordinateText: 5_000,   // jCordinates[].text (one transcript line, or a short drawing label)
  coordinates: 500,        // jCordinates rows
  issues: 20_000,          // jIssues / jIssue JSON
  users: 100_000,          // jUsers JSON (share list)
  links: 20_000,           // jDl JSON
} as const;

/**
 * A string field that carries a JSON array (jT, jOT, jIssues, jUsers, jDl): at most `maxLength` characters,
 * and either empty, "null" or a JSON array. A malformed value used to reach the SP and answer 201
 * `msg -1 "not inserted"`; it is now a 400 that names the field.
 */
export function IsJsonArrayString(maxLength: number, options?: ValidationOptions): PropertyDecorator {
  return ValidateBy({
    name: 'isJsonArrayString',
    constraints: [maxLength],
    validator: {
      validate(value: unknown): boolean {
        if (value === undefined || value === null) return true;
        if (typeof value !== 'string' || value.length > maxLength) return false;
        const trimmed = value.trim();
        if (trimmed === '' || trimmed === 'null') return true;
        try {
          return Array.isArray(JSON.parse(trimmed));
        } catch {
          return false;
        }
      },
      defaultMessage: buildMessage(
        prefix => `${prefix}$property must be a JSON array of at most $constraint1 characters`,
        options,
      ),
    },
  }, options);
}
