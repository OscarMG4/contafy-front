import {
  detectSheetColumns,
  readSheetRecords,
  type SheetField,
  type SheetMapping,
} from "@/shared/lib/spreadsheet-columns";

import type { PurchaseImportField, PurchaseImportInputRow } from "../domain/purchase-import.types";

/**
 * Títulos que reconocemos en el Excel de compras. El orden importa: «Tipo doc» antes que «RUC / doc. proveedor»,
 * y este antes que «Número» y «Razón social del proveedor».
 */
export const PURCHASE_IMPORT_FIELDS: SheetField<PurchaseImportField>[] = [
  { key: "due_date", label: "Fecha vencimiento", match: /venc/ },
  {
    key: "accounting_date",
    label: "Fecha contable",
    match: /fecha.*contab|f\.? ?contab|periodo/,
  },
  {
    key: "issue_date",
    label: "Fecha emisión",
    required: true,
    match: /fecha|emision|f\.? ?emis/,
  },
  {
    key: "document_type",
    label: "Tipo doc.",
    required: true,
    match: /tipo.*(doc|comp)|^t\.? ?doc|^td$|^tipo$/,
  },
  {
    key: "supplier_document",
    label: "RUC proveedor",
    required: true,
    match: /ruc|dni|doc.*prov|nro.*doc|documento/,
  },
  {
    key: "supplier_name",
    label: "Razón social",
    match: /razon|proveedor|nombre|denominacion/,
  },
  { key: "series", label: "Serie", required: true, match: /serie/ },
  {
    key: "number",
    label: "Número",
    match: /^n(u|o)?m(ero)?|^nro|^no\.?$|correlativo|^n°/,
  },
  { key: "currency", label: "Moneda", match: /moneda|^mon$/ },
  { key: "retention_percent", label: "% Retención", match: /retenc/ },
  { key: "non_taxed", label: "No gravado", match: /no grav|inafect|exoner/ },
  {
    key: "taxable_base",
    label: "Base imponible",
    match: /base|valor.*compra|gravad|afecto|subtotal/,
  },
  { key: "igv", label: "IGV", match: /igv|i\.g\.v|impuesto/ },
  { key: "total", label: "Total", match: /total|importe|precio/ },
  {
    key: "account_code",
    label: "Cuenta gasto",
    required: true,
    match: /cuenta|cta/,
  },
  {
    key: "description",
    label: "Glosa",
    match: /glosa|descrip|concepto|detalle/,
  },
  { key: "credit_days", label: "Días crédito", match: /dias/ },
  {
    key: "payment_term",
    label: "Condición",
    match: /condici|forma.*pago|contado|credito$/,
  },
];

/** Orden en que se muestran los selectores de columna (igual que la plantilla). */
export const PURCHASE_IMPORT_FIELD_ORDER: PurchaseImportField[] = [
  "issue_date",
  "document_type",
  "series",
  "number",
  "supplier_document",
  "supplier_name",
  "currency",
  "taxable_base",
  "igv",
  "non_taxed",
  "total",
  "account_code",
  "description",
  "payment_term",
  "credit_days",
  "due_date",
  "accounting_date",
  "retention_percent",
];

export type PurchaseImportMapping = SheetMapping<PurchaseImportField>;

export function detectPurchaseColumns(rows: string[][]): PurchaseImportMapping {
  return detectSheetColumns(rows, PURCHASE_IMPORT_FIELDS);
}

export function toPurchaseImportRows(rows: string[][], mapping: PurchaseImportMapping): PurchaseImportInputRow[] {
  return readSheetRecords(rows, mapping).map(({ line, values }) => {
    const row: PurchaseImportInputRow = { line };
    for (const [key, value] of Object.entries(values) as [PurchaseImportField, string][]) {
      if (mapping.columns[key] !== null && value !== "") row[key] = value;
    }
    return row;
  });
}

export const PURCHASE_TEMPLATE_URL = "/templates/plantilla-compras.xlsx";
