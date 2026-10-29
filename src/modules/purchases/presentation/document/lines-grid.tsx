"use client";

import { Form, Input, InputNumber, Select, Table, Tooltip, Typography, type FormInstance, type TableColumnsType } from "antd";

import { CostCenterSelect } from "@/modules/cost-centers/presentation/cost-center-select";

import type { PurchaseKind } from "../../domain/purchase.types";
import {
  formatAmount,
  lineAmount,
  lineTax,
  usesItemLines,
  type DocumentFormValues,
  type DocumentLineValues,
} from "./document-model";
import styles from "./document.module.css";

interface Option {
  value: string;
  label: string;
}

interface LinesGridProps {
  form: FormInstance<DocumentFormValues>;
  kind: PurchaseKind;
  operationOptions: Option[];
  warehouseOptions: Option[];
  operationLocked: boolean;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  /** Código digitado en la fila (Enter o salir del campo) → buscar y completar la fila. */
  onCodeCommit: (index: number, code: string) => void;
}

interface FieldRow {
  key: number;
  name: number;
}

/** Id del input de una celda (para mover el foco desde el buscador). */
export function lineCellId(formName: string, index: number, field: keyof DocumentLineValues) {
  return `${formName}_lines_${index}_${field}`;
}

/**
 * Grilla de detalle editable (estilo "Detalle" de SiempreSoft).
 * Mercadería: Código | Descripción | UM | Cantidad | Precio | Importe | Operación | Almacén.
 * Gastos: Cód. Cuenta | Descripción Cuenta | Centro Costo | Descripción CC | Importe | Importe Afecto | Impuesto.
 * Costo adicional: además Descripción y Operación por línea.
 */
export function LinesGrid({
  form,
  kind,
  operationOptions,
  warehouseOptions,
  operationLocked,
  selectedIndex,
  onSelect,
  onCodeCommit,
}: LinesGridProps) {
  // preserve: incluye los datos de la fila que no tienen campo propio (nombre de cuenta, centro de costo…).
  const lines = (Form.useWatch("lines", { form, preserve: true }) ?? []) as DocumentLineValues[];
  const items = usesItemLines(kind);

  const codeField: keyof DocumentLineValues = items ? "productCode" : "accountCode";
  const idField: keyof DocumentLineValues = items ? "productId" : "accountId";

  const clearResolved = (index: number) => {
    const line = lines[index];
    if (!line?.[idField]) return;
    if (items) {
      form.setFieldValue(["lines", index, "productId"], undefined);
      form.setFieldValue(["lines", index, "productDescription"], undefined);
      form.setFieldValue(["lines", index, "unitOfMeasure"], undefined);
    } else {
      form.setFieldValue(["lines", index, "accountId"], undefined);
      form.setFieldValue(["lines", index, "accountName"], undefined);
    }
  };

  const codeColumn = {
    title: items ? "Código" : "Cuenta",
    key: "code",
    width: items ? 120 : 110,
    render: (_: unknown, field: FieldRow) => (
      <Form.Item name={[field.name, codeField]}>
        <Input
          title={items ? undefined : lines[field.name]?.accountName}
          size="small"
          placeholder={items ? "Código" : "Cuenta"}
          status={lines[field.name]?.[codeField] && !lines[field.name]?.[idField] ? "warning" : undefined}
          onChange={() => clearResolved(field.name)}
          onPressEnter={(e) => onCodeCommit(field.name, (e.target as HTMLInputElement).value)}
          onBlur={(e) => onCodeCommit(field.name, e.target.value)}
        />
      </Form.Item>
    ),
  };

  const operationColumn = {
    title: "Operación",
    key: "operationType",
    width: 210,
    render: (_: unknown, field: FieldRow) => (
      <Form.Item name={[field.name, "operationType"]}>
        <Select size="small" options={operationOptions} disabled={operationLocked} popupMatchSelectWidth={false} />
      </Form.Item>
    ),
  };

  const amountColumn = {
    title: "Importe",
    key: "amount",
    width: 120,
    align: "right" as const,
    render: (_: unknown, field: FieldRow) => (
      <span className={styles.readonlyCell} style={{ textAlign: "right" }}>
        {formatAmount(lineAmount(lines[field.name], kind))}
      </span>
    ),
  };

  const rowNumber = {
    title: "#",
    key: "n",
    width: 36,
    render: (_: unknown, field: FieldRow) => (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {field.name + 1}
      </Typography.Text>
    ),
  };

  const itemColumns: TableColumnsType<FieldRow> = [
    rowNumber,
    codeColumn,
    {
      title: "Descripción",
      key: "description",
      render: (_, field) => {
        const text = lines[field.name]?.productDescription;
        return (
          <Tooltip title={text}>
            <span className={styles.readonlyCell}>{text ?? ""}</span>
          </Tooltip>
        );
      },
    },
    {
      title: "UM",
      key: "um",
      width: 56,
      render: (_, field) => <span className={styles.readonlyCell}>{lines[field.name]?.unitOfMeasure ?? ""}</span>,
    },
    {
      title: "Cantidad",
      key: "quantity",
      width: 110,
      render: (_, field) => (
        <Form.Item name={[field.name, "quantity"]}>
          <InputNumber size="small" min={0} precision={5} style={{ width: "100%" }} controls={false} />
        </Form.Item>
      ),
    },
    {
      title: "Precio",
      key: "unitPrice",
      width: 120,
      render: (_, field) => (
        <Form.Item name={[field.name, "unitPrice"]}>
          <InputNumber size="small" min={0} precision={6} style={{ width: "100%" }} controls={false} />
        </Form.Item>
      ),
    },
    amountColumn,
    operationColumn,
    {
      title: "Almacén",
      key: "warehouseId",
      width: 170,
      render: (_, field) => (
        <Form.Item name={[field.name, "warehouseId"]}>
          <Select size="small" options={warehouseOptions} popupMatchSelectWidth={false} />
        </Form.Item>
      ),
    },
  ];

  const pricesIncludeTax = Form.useWatch("pricesIncludeTax", form) ?? true;
  const igvRate = Form.useWatch("igvRate", form) ?? 18;
  const headerOperation = Form.useWatch("defaultOperationType", form);
  const taxOf = (index: number) =>
    lineTax(
      lineAmount(lines[index], kind),
      operationLocked ? "non_taxed" : kind === "expense" ? headerOperation : lines[index]?.operationType,
      pricesIncludeTax,
      igvRate,
    );

  // Columnas del detalle de gastos como en SiempreSoft: Cód. Cuenta | Descripción Cuenta | Centro Costo | Descripción CC
  // | Importe | Importe Afecto | Impuesto. La operación es la de la cabecera.
  const accountColumns: TableColumnsType<FieldRow> = [
    rowNumber,
    { ...codeColumn, title: "Cód. Cuenta", width: 110 },
    {
      title: "Descripción Cuenta",
      key: "accountName",
      width: 200,
      render: (_, field) => {
        const text = lines[field.name]?.accountName;
        return (
          <Tooltip title={text}>
            <span className={styles.readonlyCell}>{text ?? ""}</span>
          </Tooltip>
        );
      },
    },
    {
      title: "Centro Costo",
      key: "costCenterId",
      width: 130,
      render: (_, field) => (
        <Form.Item name={[field.name, "costCenterId"]}>
          <CostCenterSelect
            size="small"
            allowClear
            placeholder="CC"
            popupMatchSelectWidth={280}
            labelRender={() => lines[field.name]?.costCenterCode ?? ""}
            onSelectCostCenter={(cc) => {
              form.setFieldValue(["lines", field.name, "costCenterCode"], cc.code);
              form.setFieldValue(["lines", field.name, "costCenterName"], cc.name);
            }}
            onChange={(value) => {
              form.setFieldValue(["lines", field.name, "costCenterId"], value ?? undefined);
              if (!value) {
                form.setFieldValue(["lines", field.name, "costCenterCode"], undefined);
                form.setFieldValue(["lines", field.name, "costCenterName"], undefined);
              }
            }}
          />
        </Form.Item>
      ),
    },
    {
      title: "Descripción CC",
      key: "costCenterName",
      width: 160,
      render: (_, field) => <span className={styles.readonlyCell}>{lines[field.name]?.costCenterName ?? ""}</span>,
    },
    ...(kind === "expense"
      ? []
      : [
          {
            title: "Descripción",
            key: "description",
            render: (_: unknown, field: FieldRow) => (
              <Form.Item name={[field.name, "description"]}>
                <Input size="small" maxLength={250} />
              </Form.Item>
            ),
          },
        ]),
    {
      title: "Importe",
      key: "unitPrice",
      width: 130,
      render: (_, field) => (
        <Form.Item name={[field.name, "unitPrice"]}>
          <InputNumber size="small" min={0} precision={2} style={{ width: "100%" }} controls={false} />
        </Form.Item>
      ),
    },
    {
      title: "Importe Afecto",
      key: "taxable",
      width: 120,
      align: "right",
      render: (_, field) => (
        <span className={styles.readonlyCell} style={{ textAlign: "right" }}>
          {formatAmount(taxOf(field.name).taxable)}
        </span>
      ),
    },
    {
      title: "Impuesto",
      key: "tax",
      width: 110,
      align: "right",
      render: (_, field) => (
        <span className={styles.readonlyCell} style={{ textAlign: "right" }}>
          {formatAmount(taxOf(field.name).tax)}
        </span>
      ),
    },
    ...(kind === "expense" ? [] : [operationColumn]),
  ];

  return (
    <Form.List name="lines">
      {(fields) => (
        <Table<FieldRow>
          className={styles.grid}
          size="small"
          bordered
          pagination={false}
          rowKey="key"
          dataSource={fields.map(({ key, name }) => ({ key, name }))}
          columns={items ? itemColumns : accountColumns}
          scroll={{ y: 230, x: items ? 1000 : 1060 }}
          rowClassName={(_, index) => (index === selectedIndex ? styles.selectedRow : "")}
          onRow={(_, index) => ({
            onClick: () => onSelect(index ?? 0),
            onFocus: () => onSelect(index ?? 0),
          })}
          locale={{ emptyText: "Sin líneas" }}
        />
      )}
    </Form.List>
  );
}
