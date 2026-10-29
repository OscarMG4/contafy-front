"use client";

import { Form, Input, InputNumber, Select, Table, Tooltip, Typography, type FormInstance, type TableColumnsType } from "antd";

import type { PurchaseKind } from "../../domain/purchase.types";
import { formatAmount, lineAmount, usesItemLines, type DocumentFormValues, type DocumentLineValues } from "./document-model";
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
 * Gastos / costo adicional: Cuenta | Nombre | Descripción | Importe | Operación.
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
  const lines = (Form.useWatch("lines", form) ?? []) as DocumentLineValues[];
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

  const accountColumns: TableColumnsType<FieldRow> = [
    rowNumber,
    codeColumn,
    {
      title: "Nombre cuenta",
      key: "accountName",
      width: 180,
      render: (_, field) => {
        const text = lines[field.name]?.accountName;
        return (
          <Tooltip title={text}>
            <Typography.Text type="secondary" className={styles.readonlyCell}>
              {text ?? ""}
            </Typography.Text>
          </Tooltip>
        );
      },
    },
    {
      title: "Descripción",
      key: "description",
      render: (_, field) => (
        <Form.Item name={[field.name, "description"]}>
          <Input size="small" maxLength={250} />
        </Form.Item>
      ),
    },
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
    operationColumn,
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
          scroll={{ y: 230, x: items ? 1000 : 900 }}
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
