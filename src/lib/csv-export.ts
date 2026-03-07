/**
 * Parse a CSV row handling quoted values
 */
export function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(current.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
      current = "";
    } else if (c !== "\n" && c !== "\r") {
      current += c;
    }
  }
  result.push(current.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
  return result;
}

/**
 * Escape a CSV cell value (handles commas, quotes, newlines)
 */
function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert rows to CSV string and trigger download
 */
export function downloadCsv(headers: string[], rows: (string | number | null | undefined)[][], filename: string) {
  const headerRow = headers.map(escapeCsvCell).join(",");
  const dataRows = rows.map((row) => row.map((cell) => escapeCsvCell(String(cell ?? ""))).join(","));
  const csv = [headerRow, ...dataRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
