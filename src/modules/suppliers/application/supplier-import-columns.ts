import {
  detectSheetColumns,
  readSheetRecords,
  type SheetField,
  type SheetMapping,
} from "@/shared/lib/spreadsheet-columns";

import type { SupplierImportField, SupplierImportInputRow } from "../domain/supplier-import.types";

/** Títulos reconocidos. «Tipo doc» va antes que «Nro doc» y este antes que la razón social. */
export const SUPPLIER_IMPORT_FIELDS: SheetField<SupplierImportField>[] = [
  { key: "document_type", label: "Tipo doc.", match: /tipo.*doc|^t\.? ?doc|^td$|^tipo$/ },
  {
    key: "document_number",
    label: "RUC / Nro. doc.",
    required: true,
    match: /ruc|dni|nro.*doc|num.*doc|documento|^doc/,
  },
  { key: "trade_name", label: "Nombre comercial", match: /comercial/ },
  { key: "business_name", label: "Razón social", match: /razon|nombre|proveedor|denominacion|apellidos/ },
  { key: "address", label: "Dirección", match: /direcc|domicilio/ },
  { key: "email", label: "Email", match: /mail|correo/ },
  { key: "phone", label: "Teléfono", match: /telef|celular|movil|fono/ },
  { key: "credit_days", label: "Días crédito", match: /dias/ },
  { key: "payment_term", label: "Condición", match: /condici|forma.*pago|credito$|contado/ },
];

export const SUPPLIER_IMPORT_FIELD_ORDER: SupplierImportField[] = [
  "document_type",
  "document_number",
  "business_name",
  "trade_name",
  "address",
  "email",
  "phone",
  "payment_term",
  "credit_days",
];

export type SupplierImportMapping = SheetMapping<SupplierImportField>;

/** Sin títulos se asume A = RUC y B = razón social. */
export function detectSupplierColumns(rows: string[][]): SupplierImportMapping {
  return detectSheetColumns(rows, SUPPLIER_IMPORT_FIELDS, { document_number: 0, business_name: 1 });
}

export function toSupplierImportRows(rows: string[][], mapping: SupplierImportMapping): SupplierImportInputRow[] {
  return readSheetRecords(rows, mapping).map(({ line, values }) => {
    const row: SupplierImportInputRow = { line };
    for (const [key, value] of Object.entries(values) as [SupplierImportField, string][]) {
      if (mapping.columns[key] !== null && value !== "") row[key] = value;
    }
    return row;
  });
}

export const SUPPLIER_TEMPLATE_URL = "/templates/plantilla-proveedores.xlsx";
