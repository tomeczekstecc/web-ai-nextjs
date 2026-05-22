import {
	buildWorkbook,
	workbookToBuffer,
	xlsxDownloadHeaders,
	type ExcelColumn,
} from "@/lib/excel";
import type { DashboardReviewItemsResponse } from "@/lib/api/domains/dashboard/contract";

type ReviewItem = DashboardReviewItemsResponse["items"][number];

const columns: ExcelColumn<ReviewItem>[] = [
	{ header: "ID", key: "id", width: 8 },
	{ header: "Tytuł", key: "header", width: 50 },
	{ header: "Typ", key: "type", width: 16 },
	{ header: "Status", key: "status", width: 16 },
	{ header: "Kwota", key: "target", width: 14 },
	{ header: "Termin", key: "limit", width: 14 },
	{ header: "Recenzent", key: "reviewer", width: 24 },
];

export async function GET(request: Request) {
	// Fetch the same data the list route returns. In a real app this would
	// call the domain query directly instead of going over HTTP.
	const origin = new URL(request.url).origin;
	const res = await fetch(`${origin}/api/dashboard/review-items`, {
		cache: "no-store",
	});
	if (!res.ok) {
		return new Response("Failed to load review items", { status: 502 });
	}
	const { items } = (await res.json()) as DashboardReviewItemsResponse;

	const workbook = buildWorkbook({
		sheetName: "Review items",
		columns,
		rows: items,
	});
	const buffer = await workbookToBuffer(workbook);

	const stamp = new Date().toISOString().slice(0, 10);
	return new Response(new Uint8Array(buffer), {
		headers: xlsxDownloadHeaders(`review-items-${stamp}.xlsx`),
	});
}
