import {
  detectSheetColumns,
  readSheetRecords,
  type SheetField,
  type SheetMapping,
} from "@/shared/lib/spreadsheet-columns";

import type { ChartImportInputRow } from "../domain/account.types";

export type ChartColumn = "code" | "name" | "parent" | "nature";

export type ChartColumnMapping = SheetMapping<ChartColumn>;

export const CHART_FIELDS: SheetField<ChartColumn>[] = [
  { key: "parent", label: "Cuenta padre", match: /padre|superior|parent/ },
  { key: "nature", label: "Naturaleza", match: /naturaleza|nature|^tipo/ },
  {
    key: "name",
    label: "Nombre",
    required: true,
    match: /nombre|descrip|denominaci|detalle|name/,
  },
  {
    key: "code",
    label: "Código",
    required: true,
    match: /codigo|^cod|cuenta|^nro|numero|^code|^cta/,
  },
];

/**
 * Reconoce la fila de títulos (Código / Nombre / Padre / Naturaleza) entre las primeras filas.
 * Si no hay títulos, asume columna A = código y B = nombre, como el listado de SiempreSoft o el PCGE en Excel.
 */
export function detectColumns(rows: string[][]): ChartColumnMapping {
  return detectSheetColumns(rows, CHART_FIELDS, { code: 0, name: 1 });
}

export function toImportRows(rows: string[][], mapping: ChartColumnMapping): ChartImportInputRow[] {
  const result: ChartImportInputRow[] = [];

  for (const { line, values } of readSheetRecords(rows, mapping)) {
    // Sin títulos, se saltan las líneas de encabezado o de texto antes del primer código.
    if (mapping.headerRow === null && result.length === 0 && !/\d/.test(values.code)) continue;
    const row: ChartImportInputRow = {
      line,
      code: values.code,
      name: values.name,
    };
    if (!row.code && !row.name) continue;
    if (mapping.columns.parent !== null) row.parent_code = values.parent || null;
    if (mapping.columns.nature !== null) row.nature = values.nature || null;
    result.push(row);
  }

  return result;
}

/** Plantilla Excel con ejemplos e instrucciones (generada en public/templates). */
export const CHART_TEMPLATE_URL = "/templates/plantilla-plan-de-cuentas.xlsx";
