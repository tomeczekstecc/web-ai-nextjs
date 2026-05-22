import {
	buildWorkbook,
	workbookToBuffer,
	xlsxDownloadHeaders,
	type ExcelColumn,
} from "@/lib/excel";

type ExportColumn = {
	header: string;
	key: string;
	width?: number;
};

type ExportBody = {
	filename?: string;
	sheetName?: string;
	columns: ExportColumn[];
	rows: Record<string, unknown>[];
};

const MAX_ROWS = 100_000;
const MAX_COLUMNS = 200;

export async function POST(request: Request) {
	let body: ExportBody;
	try {
		body = (await request.json()) as ExportBody;
	} catch {
		return new Response("Invalid JSON body", { status: 400 });
	}

	if (!body || !Array.isArray(body.columns) || !Array.isArray(body.rows)) {
		return new Response("columns and rows are required", { status: 400 });
	}
	if (body.columns.length === 0 || body.columns.length > MAX_COLUMNS) {
		return new Response("Invalid column count", { status: 400 });
	}
	if (body.rows.length > MAX_ROWS) {
		return new Response(`Too many rows (max ${MAX_ROWS})`, { status: 413 });
	}

	const columns: ExcelColumn<Record<string, unknown>>[] = body.columns.map(
		(column) => ({
			header: String(column.header ?? column.key),
			key: String(column.key),
			width: typeof column.width === "number" ? column.width : undefined,
			format: (value) => normalizeCell(value),
		}),
	);

	const workbook = buildWorkbook({
		sheetName: body.sheetName?.slice(0, 31) || "Sheet1",
		columns,
		rows: body.rows,
	});
	const buffer = await workbookToBuffer(workbook);

	const filename = sanitizeFilename(body.filename) || defaultFilename();
	return new Response(new Uint8Array(buffer), {
		headers: xlsxDownloadHeaders(filename),
	});
}

function normalizeCell(value: unknown) {
	if (value == null) return null;
	if (value instanceof Date) return value;
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return value;
	}
	// Arrays / objects — flatten to a readable string so the cell stays useful.
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function sanitizeFilename(input: string | undefined): string {
	if (!input) return "";
	return input.replace(/[\\/:*?"<>|\r\n]/g, "_").slice(0, 120);
}

function defaultFilename(): string {
	const stamp = new Date().toISOString().slice(0, 10);
	return `export-${stamp}.xlsx`;
}
