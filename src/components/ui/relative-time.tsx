import { cn } from "@/lib/utils";
import { formatDateTime, formatRelative } from "@/lib/format/date";

/**
 * Renders a date as a human-readable relative time in Polish (e.g.
 * „minutę temu", „2 godziny temu", „za 3 dni") inside a semantic `<time>`
 * element. The absolute ISO timestamp is always exposed via `dateTime`
 * and `title`, so screen readers and hovering users still get the precise
 * value — satisfying the "Date Format — ISO by Default" rule.
 *
 * Server component on purpose: the value is computed once at render time.
 * If you need the relative label to *tick* (refresh every minute as time
 * passes), wrap it in a client component that re-renders on an interval —
 * but in most read-only views this is unnecessary.
 *
 * @example
 *   <RelativeTime value={item.updatedAt} />
 *   // → <time dateTime="2026-05-31 14:23" title="2026-05-31 14:23">
 *   //     2 godziny temu
 *   //   </time>
 */
export interface RelativeTimeProps
	extends Omit<React.ComponentProps<"time">, "dateTime" | "title" | "children"> {
	value: string | number | Date | null | undefined;
	/** Fallback rendered when the value is null/invalid. Defaults to `null`. */
	fallback?: React.ReactNode;
}

export function RelativeTime({
	value,
	fallback = null,
	className,
	...props
}: RelativeTimeProps) {
	const iso = formatDateTime(value);
	const relative = formatRelative(value);

	if (!iso) return <>{fallback}</>;

	return (
		<time
			dateTime={iso}
			title={iso}
			className={cn("tabular-nums", className)}
			{...props}
		>
			{relative}
		</time>
	);
}
