/**
 * Reconocimiento de columnas de un Excel/CSV traído por el cliente: busca la fila de títulos
 * comparando cada celda con los patrones de cada campo, y permite corregir el mapeo a mano.
 */
export interface SheetField<K extends string> {
  key: K;
  label: string;
  required?: boolean;
  /** Se compara con el título sin tildes y en minúsculas. */
  match: RegExp;
}

export interface SheetMapping<K extends string> {
  /** Índice de la fila de títulos, o null si el archivo empieza directo con los datos. */
  headerRow: number | null;
  columns: Record<K, number | null>;
}

export interface SheetRecord<K extends string> {
  /** Número de fila tal como se ve en Excel (1 = primera fila). */
  line: number;
  values: Record<K, string>;
}

export const normalizeHeader = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

/** Los campos se prueban en el orden dado: pon primero los patrones más específicos. */
export function detectSheetColumns<K extends string>(
  rows: string[][],
  fields: SheetField<K>[],
  fallback: Partial<Record<K, number>> = {},
): SheetMapping<K> {
  const empty = () => Object.fromEntries(fields.map((field) => [field.key, null])) as Record<K, number | null>;
  const required = fields.filter((field) => field.required);

  for (let index = 0; index < Math.min(rows.length, 15); index++) {
    const columns = empty();
    rows[index].forEach((cell, column) => {
      const text = normalizeHeader(cell);
      if (!text || /^[\d.,/\s-]+$/.test(text)) return;
      const field = fields.find((candidate) => columns[candidate.key] === null && candidate.match.test(text));
      if (field) columns[field.key] = column;
    });
    if (required.every((field) => columns[field.key] !== null)) return { headerRow: index, columns };
  }

  return { headerRow: null, columns: { ...empty(), ...fallback } };
}

export function readSheetRecords<K extends string>(rows: string[][], mapping: SheetMapping<K>): SheetRecord<K>[] {
  const keys = Object.keys(mapping.columns) as K[];
  const records: SheetRecord<K>[] = [];

  rows.forEach((cells, index) => {
    if (mapping.headerRow !== null && index <= mapping.headerRow) return;
    const values = Object.fromEntries(
      keys.map((key) => {
        const column = mapping.columns[key];
        return [key, column === null ? "" : (cells?.[column] ?? "").trim()];
      }),
    ) as Record<K, string>;
    if (Object.values<string>(values).every((value) => value === "")) return;
    records.push({ line: index + 1, values });
  });

  return records;
}

export function sheetColumnCount(rows: string[][]): number {
  return rows.reduce((max, cells) => Math.max(max, cells?.length ?? 0), 0);
}

export function columnLabel(index: number, header?: string): string {
  let letters = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  }
  return header ? `${letters} · ${header}` : `Columna ${letters}`;
}
