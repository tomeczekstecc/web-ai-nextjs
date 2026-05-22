import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { pl } from "date-fns/locale";

/**
 * App-wide date formatting helpers.
 *
 * Default display format is ISO 8601 short: `YYYY-MM-DD` (`2026-05-31`).
 * See `context/ui-patterns.md` → "Date Format — ISO by Default" for the
 * full rule, exceptions, and rationale.
 *
 * Always import from here instead of calling `toLocaleDateString`,
 * `Intl.DateTimeFormat`, or inline `${y}-${m}-${d}` template strings.
 */

export const ISO_DATE_FORMAT = "yyyy-MM-dd";
export const ISO_DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm";

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
	if (value == null || value === "") return null;
	const date =
		typeof value === "string"
			? parseISO(value)
			: value instanceof Date
				? value
				: new Date(value);
	return isValid(date) ? date : null;
}

/**
 * Format a date as `YYYY-MM-DD`. Returns an empty string for invalid input.
 *
 * @example
 * formatDate("2026-05-31T10:00:00Z") // "2026-05-31"
 * formatDate(new Date())             // "2026-05-31"
 * formatDate(null)                   // ""
 */
export function formatDate(value: DateInput): string {
	const date = toDate(value);
	return date ? format(date, ISO_DATE_FORMAT) : "";
}

/**
 * Format a date as `YYYY-MM-DD HH:mm` in local time. Returns an empty string
 * for invalid input.
 */
export function formatDateTime(value: DateInput): string {
	const date = toDate(value);
	return date ? format(date, ISO_DATE_TIME_FORMAT) : "";
}

/**
 * Render a relative date in Polish (e.g. "minutę temu", "około godziny temu",
 * "2 godziny temu", "za 3 dni"). Per the ISO rule, every caller of this helper
 * **must** also surface the absolute ISO timestamp in a `title` attribute or
 * tooltip — use {@link formatDateTime} for that, or just use the
 * `<RelativeTime>` component which wires both automatically.
 *
 * @example
 * <span title={formatDateTime(value)}>
 *   {formatRelative(value)}
 * </span>
 */
export function formatRelative(value: DateInput): string {
	const date = toDate(value);
	return date
		? formatDistanceToNow(date, { addSuffix: true, locale: pl })
		: "";
}
