/**
 * Lee la primera hoja de un .xlsx o un .csv como matriz de textos, sin librerías externas:
 * el .xlsx es un zip de XML que se descomprime con DecompressionStream del navegador.
 */
export async function readSpreadsheet(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  const content = () =>
    file.arrayBuffer().catch(() => {
      throw new Error("No se pudo abrir el archivo. Si está abierto en Excel, ciérralo e inténtalo de nuevo.");
    });
  if (name.endsWith(".xlsx")) return readXlsx(await content());
  if (name.endsWith(".csv") || name.endsWith(".txt")) return parseCsv(decodeText(await content()));
  if (name.endsWith(".xls")) {
    throw new Error("El formato .xls antiguo no se puede leer. Guarda el archivo como .xlsx o .csv desde Excel.");
  }
  throw new Error("Sube un archivo .xlsx o .csv.");
}

/** Excel en Windows guarda los CSV en ANSI (Windows-1252); si no es UTF-8 válido se lee así. */
function decodeText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

export function parseCsv(text: string): string[][] {
  const firstLine = text.slice(0, text.indexOf("\n") >>> 0);
  const delimiter = [";", "\t", ","].reduce((best, candidate) =>
    firstLine.split(candidate).length > firstLine.split(best).length ? candidate : best,
  );

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.map((cells) => cells.map((value) => value.trim()));
}

async function readXlsx(buffer: ArrayBuffer): Promise<string[][]> {
  const entries = readZipDirectory(buffer);
  const text = async (path: string) => {
    const entry = entries.get(path);
    return entry ? inflate(buffer, entry) : null;
  };
  const xml = (source: string) => new DOMParser().parseFromString(source, "application/xml");
  const all = (node: Document | Element, tag: string) => Array.from(node.getElementsByTagNameNS("*", tag));

  const sheetPath = await firstSheetPath(text, xml, all);
  const sheetXml = await text(sheetPath);
  if (!sheetXml) throw new Error("El archivo Excel no tiene hojas.");

  const sharedXml = await text("xl/sharedStrings.xml");
  const shared = sharedXml
    ? all(xml(sharedXml), "si").map((si) =>
        all(si, "t")
          .map((t) => t.textContent ?? "")
          .join(""),
      )
    : [];

  const rows: string[][] = [];
  for (const rowNode of all(xml(sheetXml), "row")) {
    const rowIndex = Number(rowNode.getAttribute("r") ?? rows.length + 1) - 1;
    const cells: string[] = [];
    all(rowNode, "c").forEach((cellNode, position) => {
      const ref = cellNode.getAttribute("r");
      const column = ref ? columnIndex(ref) : position;
      const type = cellNode.getAttribute("t");
      const raw = all(cellNode, "v")[0]?.textContent ?? "";
      let value: string;
      if (type === "s") value = shared[Number(raw)] ?? "";
      else if (type === "inlineStr")
        value = all(cellNode, "t")
          .map((t) => t.textContent ?? "")
          .join("");
      else value = raw;
      cells[column] = value.trim();
    });
    rows[rowIndex] = Array.from(cells, (value) => value ?? "");
  }

  return Array.from(rows, (cells) => cells ?? []);
}

async function firstSheetPath(
  text: (path: string) => Promise<string | null>,
  xml: (source: string) => Document,
  all: (node: Document | Element, tag: string) => Element[],
): Promise<string> {
  const workbook = await text("xl/workbook.xml");
  const rels = await text("xl/_rels/workbook.xml.rels");
  const sheet = workbook ? all(xml(workbook), "sheet")[0] : undefined;
  const relationId = sheet?.getAttribute("r:id") ?? sheet?.getAttributeNS("*", "id");
  const target =
    rels && relationId
      ? all(xml(rels), "Relationship")
          .find((rel) => rel.getAttribute("Id") === relationId)
          ?.getAttribute("Target")
      : null;
  if (!target) return "xl/worksheets/sheet1.xml";
  return target.startsWith("/") ? target.slice(1) : `xl/${target}`;
}

function columnIndex(ref: string): number {
  const letters = ref.match(/^[A-Z]+/i)?.[0].toUpperCase() ?? "A";
  return [...letters].reduce((acc, letter) => acc * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

interface ZipEntry {
  method: number;
  compressedSize: number;
  localOffset: number;
}

function readZipDirectory(buffer: ArrayBuffer): Map<string, ZipEntry> {
  const view = new DataView(buffer);
  let end = buffer.byteLength - 22;
  while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < 0) throw new Error("El archivo no es un Excel válido (.xlsx).");

  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();
  const entries = new Map<string, ZipEntry>();

  for (let i = 0; i < count; i++) {
    const nameLength = view.getUint16(offset + 28, true);
    const name = decoder.decode(new Uint8Array(buffer, offset + 46, nameLength));
    entries.set(name, {
      method: view.getUint16(offset + 10, true),
      compressedSize: view.getUint32(offset + 20, true),
      localOffset: view.getUint32(offset + 42, true),
    });
    offset += 46 + nameLength + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
  }

  return entries;
}

async function inflate(buffer: ArrayBuffer, entry: ZipEntry): Promise<string> {
  const view = new DataView(buffer);
  const start =
    entry.localOffset +
    30 +
    view.getUint16(entry.localOffset + 26, true) +
    view.getUint16(entry.localOffset + 28, true);
  const data = new Uint8Array(buffer, start, entry.compressedSize);
  if (entry.method === 0) return new TextDecoder().decode(data);

  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}
