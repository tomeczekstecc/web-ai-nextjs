import "server-only";

import ExcelJS from "exceljs";

/**
 * Server-only ExcelJS helpers.
 *
 * Always import from server code (route handlers, server actions, server
 * components). The `server-only` import guards against accidental client
 * bundling — ExcelJS is ~900 KB and must never ship to the browser.
 */

export type ExcelColumn<TRow> = {
	header: string;
	key: keyof TRow & string;
	width?: number;
	/** Optional formatter applied to the cell value. */
	format?: (value: TRow[keyof TRow & string], row: TRow) => ExcelJS.CellValue;
};

export type BuildSheetOptions<TRow> = {
	sheetName: string;
	columns: ExcelColumn<TRow>[];
	rows: TRow[];
};

/**
 * Build a single-sheet workbook with a styled header row and auto-filter.
 * Returns the workbook so callers can add more sheets before serialising.
 */
export function buildWorkbook<TRow>(
	options: BuildSheetOptions<TRow>,
): ExcelJS.Workbook {
	const workbook = new ExcelJS.Workbook();
	workbook.creator = "app";
	workbook.created = new Date();

	addSheet(workbook, options);
	return workbook;
}

/** Add an additional sheet to an existing workbook. */
export function addSheet<TRow>(
	workbook: ExcelJS.Workbook,
	{ sheetName, columns, rows }: BuildSheetOptions<TRow>,
): ExcelJS.Worksheet {
	const sheet = workbook.addWorksheet(sheetName);

	sheet.columns = columns.map((column) => ({
		header: column.header,
		key: column.key,
		width: column.width ?? Math.max(12, column.header.length + 2),
	}));

	for (const row of rows) {
		const values: Record<string, ExcelJS.CellValue> = {};
		for (const column of columns) {
			const raw = row[column.key];
			values[column.key] = column.format
				? column.format(raw, row)
				: (raw as ExcelJS.CellValue);
		}
		sheet.addRow(values);
	}

	styleHeader(sheet);
	sheet.autoFilter = {
		from: { row: 1, column: 1 },
		to: { row: 1, column: columns.length },
	};
	sheet.views = [{ state: "frozen", ySplit: 1 }];

	return sheet;
}

function styleHeader(sheet: ExcelJS.Worksheet): void {
	const header = sheet.getRow(1);
	header.font = { bold: true, color: { argb: "FFFFFFFF" } };
	header.alignment = { vertical: "middle", horizontal: "left" };
	header.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FF1F2937" }, // slate-800
	};
	header.height = 22;
	header.commit();
}

/** Serialise a workbook to a `Buffer` for HTTP responses. */
export async function workbookToBuffer(
	workbook: ExcelJS.Workbook,
): Promise<Buffer> {
	const arrayBuffer = await workbook.xlsx.writeBuffer();
	return Buffer.from(arrayBuffer);
}

export const XLSX_CONTENT_TYPE =
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Build standard download headers for an .xlsx response. */
export function xlsxDownloadHeaders(filename: string): HeadersInit {
	const safe = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
	return {
		"Content-Type": XLSX_CONTENT_TYPE,
		"Content-Disposition": `attachment; filename="${encodeURIComponent(safe)}"`,
		"Cache-Control": "no-store",
	};
}
