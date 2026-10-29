"use client";

import { useMemo, useState } from "react";
import { DownloadOutlined, InboxOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Col,
  Collapse,
  Flex,
  Modal,
  Row,
  Segmented,
  Select,
  Statistic,
  Table,
  Tag,
  Typography,
  Upload,
  type TableProps,
} from "antd";

import { ApiError } from "@/core/http/api-error";
import { readSpreadsheet } from "@/shared/lib/read-spreadsheet";
import { columnLabel, sheetColumnCount } from "@/shared/lib/spreadsheet-columns";

import {
  PURCHASE_IMPORT_FIELD_ORDER,
  PURCHASE_IMPORT_FIELDS,
  PURCHASE_TEMPLATE_URL,
  detectPurchaseColumns,
  toPurchaseImportRows,
  type PurchaseImportMapping,
} from "../application/purchase-import-columns";
import { useImportPurchases, usePreviewPurchaseImport } from "../application/use-purchase-import";
import type {
  PurchaseImportField,
  PurchaseImportResult,
  PurchaseImportResultRow,
} from "../domain/purchase-import.types";
import { formatCurrency } from "./document/document-model";

const FIELDS = PURCHASE_IMPORT_FIELD_ORDER.map((key) => PURCHASE_IMPORT_FIELDS.find((field) => field.key === key)!);

type StatusFilter = "all" | "ok" | "error";

interface PurchaseImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function PurchaseImportModal({ open, onClose }: PurchaseImportModalProps) {
  const { message } = App.useApp();
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheet, setSheet] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<PurchaseImportMapping | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseImportResult | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const preview = usePreviewPurchaseImport();
  const importPurchases = useImportPurchases();

  const rows = useMemo(() => (mapping ? toPurchaseImportRows(sheet, mapping) : []), [sheet, mapping]);
  const columnCount = useMemo(() => sheetColumnCount(sheet), [sheet]);
  const headers = mapping && mapping.headerRow !== null ? sheet[mapping.headerRow] : [];
  const missingRequired = mapping
    ? FIELDS.filter((field) => field.required && mapping.columns[field.key] === null)
    : [];

  const reset = () => {
    setFileName(null);
    setSheet([]);
    setMapping(null);
    setReadError(null);
    setResult(null);
    setFilter("all");
    preview.reset();
    importPurchases.reset();
  };

  const close = () => {
    reset();
    onClose();
  };

  const validate = (nextMapping: PurchaseImportMapping, nextSheet = sheet) => {
    const missing = FIELDS.some((field) => field.required && nextMapping.columns[field.key] === null);
    const nextRows = toPurchaseImportRows(nextSheet, nextMapping);
    if (missing || nextRows.length === 0) {
      setResult(null);
      return;
    }
    preview.mutate(nextRows, { onSuccess: setResult });
  };

  const handleFile = async (file: File) => {
    reset();
    setFileName(file.name);
    try {
      const data = await readSpreadsheet(file);
      const detected = detectPurchaseColumns(data);
      setSheet(data);
      setMapping(detected);
      validate(detected, data);
    } catch (error) {
      setReadError(error instanceof Error ? error.message : "No se pudo leer el archivo.");
    }
  };

  const changeColumn = (key: PurchaseImportField, column: number | null) => {
    if (!mapping) return;
    const next = { ...mapping, columns: { ...mapping.columns, [key]: column } };
    setMapping(next);
    setResult(null);
    validate(next);
  };

  const submit = () => {
    importPurchases.mutate(rows, {
      onSuccess: ({ message: text }) => {
        message.success(text);
        close();
      },
      onError: (error) => {
        message.error(ApiError.from(error).message);
        if (mapping) validate(mapping);
      },
    });
  };

  const visibleRows = result ? result.rows.filter((row) => filter === "all" || row.status === filter) : [];
  const previewError = preview.error ? ApiError.from(preview.error).message : null;
  const money = (value: string | null, row: PurchaseImportResultRow) =>
    value === null ? "—" : formatCurrency(value, row.currency ?? "PEN");

  const columns: TableProps<PurchaseImportResultRow>["columns"] = [
    { title: "Fila", dataIndex: "line", width: 60 },
    {
      title: "Comprobante",
      dataIndex: "document",
      width: 130,
      render: (document: string | null, row) => (
        <Flex vertical>
          <Typography.Text strong>{document ?? "—"}</Typography.Text>
          {row.issue_date && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {row.issue_date.split("-").reverse().join("/")}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: "Proveedor",
      dataIndex: "supplier_name",
      width: 260,
      render: (name: string | null, row) => (
        <Flex vertical style={{ minWidth: 0 }}>
          <Typography.Text ellipsis>
            {name ?? "—"}
            {row.new_supplier && (
              <Tag color="blue" variant="filled" style={{ marginLeft: 6 }}>
                Nuevo
              </Tag>
            )}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {row.supplier_document ?? ""}
          </Typography.Text>
        </Flex>
      ),
    },
    { title: "Cuenta", dataIndex: "account_code", width: 80 },
    {
      title: "Base",
      dataIndex: "taxable_base",
      width: 110,
      align: "right",
      render: money,
      responsive: ["lg"],
    },
    {
      title: "IGV",
      dataIndex: "igv",
      width: 100,
      align: "right",
      render: money,
      responsive: ["lg"],
    },
    {
      title: "Total",
      dataIndex: "total",
      width: 120,
      align: "right",
      render: money,
    },
    {
      title: "Neto a pagar",
      dataIndex: "payable",
      width: 120,
      align: "right",
      render: money,
      responsive: ["xl"],
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 90,
      render: (status: PurchaseImportResultRow["status"]) =>
        status === "ok" ? (
          <Tag color="success" variant="filled">
            Correcta
          </Tag>
        ) : (
          <Tag color="error" variant="filled">
            Error
          </Tag>
        ),
    },
    {
      title: "Observaciones",
      dataIndex: "messages",
      width: 280,
      render: (messages: string[], row) => (
        <Typography.Text type={row.status === "error" ? "danger" : "secondary"} style={{ fontSize: 12 }}>
          {messages.join(" ")}
        </Typography.Text>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={close}
      title="Importar compras desde Excel"
      width={1240}
      destroyOnHidden
      mask={{ closable: false }}
      footer={
        <Flex justify="space-between" align="center" wrap gap={8}>
          <Typography.Text type="secondary">
            Se registran como compras de gastos, con su asiento. Si una fila falla, no se registra ninguna.
          </Typography.Text>
          <Flex gap={8}>
            <Button onClick={close}>Cancelar</Button>
            <Button
              type="primary"
              loading={importPurchases.isPending}
              disabled={!result?.can_import || preview.isPending}
              onClick={submit}
            >
              {result
                ? `Registrar ${result.summary.ok} ${result.summary.ok === 1 ? "compra" : "compras"}`
                : "Registrar"}
            </Button>
          </Flex>
        </Flex>
      }
    >
      <Flex vertical gap={16}>
        <Alert
          type="info"
          showIcon
          title="Una fila por comprobante: fecha, tipo, serie, número, RUC, base imponible, IGV, total y cuenta de gasto. Descarga la plantilla para ver el formato."
          action={
            <Button
              type="primary"
              ghost
              icon={<DownloadOutlined />}
              href={PURCHASE_TEMPLATE_URL}
              download="plantilla-compras.xlsx"
            >
              Descargar plantilla Excel
            </Button>
          }
        />

        {!fileName && (
          <Upload.Dragger
            accept=".xlsx,.csv,.txt"
            showUploadList={false}
            multiple={false}
            beforeUpload={(file) => {
              void handleFile(file);
              return false;
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Arrastra aquí el Excel (.xlsx) o CSV con las compras</p>
            <p className="ant-upload-hint">
              Los proveedores que no existan se crean con la razón social del archivo o la de SUNAT. Antes de registrar
              verás cada comprobante con su IGV, total y neto a pagar calculados, y los errores por fila.
            </p>
          </Upload.Dragger>
        )}

        {fileName && (
          <Flex justify="space-between" align="center" wrap gap={8}>
            <Typography.Text>
              Archivo: <Typography.Text strong>{fileName}</Typography.Text>
              {mapping && ` · ${rows.length} filas con datos`}
              {mapping &&
                (mapping.headerRow !== null
                  ? ` · títulos en la fila ${mapping.headerRow + 1}`
                  : " · sin fila de títulos")}
            </Typography.Text>
            <Button icon={<ReloadOutlined />} onClick={reset}>
              Elegir otro archivo
            </Button>
          </Flex>
        )}

        {readError && <Alert type="error" showIcon title={readError} />}

        {mapping && (
          <Collapse
            size="small"
            defaultActiveKey={missingRequired.length > 0 ? ["columns"] : []}
            items={[
              {
                key: "columns",
                label:
                  missingRequired.length > 0
                    ? `Columnas del archivo — falta indicar: ${missingRequired.map((field) => field.label).join(", ")}`
                    : "Columnas del archivo (reconocidas automáticamente)",
                children: (
                  <Row gutter={[12, 8]}>
                    {FIELDS.map((field) => (
                      <Col key={field.key} xs={12} md={8} lg={6} xl={4}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {field.label}
                          {field.required ? " *" : ""}
                        </Typography.Text>
                        <Select
                          size="small"
                          style={{ width: "100%" }}
                          value={mapping.columns[field.key]}
                          allowClear
                          placeholder="No viene"
                          status={field.required && mapping.columns[field.key] === null ? "error" : undefined}
                          onChange={(value) => changeColumn(field.key, value ?? null)}
                          options={Array.from({ length: columnCount }, (_, index) => ({
                            value: index,
                            label: columnLabel(index, headers[index]),
                          }))}
                        />
                      </Col>
                    ))}
                  </Row>
                ),
              },
            ]}
          />
        )}

        {previewError && <Alert type="error" showIcon title={previewError} />}

        {result && (
          <>
            <Row gutter={12}>
              <Col span={5}>
                <Statistic title="Comprobantes" value={result.summary.total} />
              </Col>
              <Col span={5}>
                <Statistic
                  title="Correctos"
                  value={result.summary.ok}
                  styles={{ content: { color: "var(--ant-color-success)" } }}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="Con errores"
                  value={result.summary.errors}
                  styles={result.summary.errors ? { content: { color: "var(--ant-color-error)" } } : undefined}
                />
              </Col>
              <Col span={4}>
                <Statistic title="Proveedores nuevos" value={result.summary.new_suppliers} />
              </Col>
              <Col span={6}>
                <Statistic title="Total en soles" value={formatCurrency(result.summary.total_pen, "PEN")} />
              </Col>
            </Row>

            {result.summary.errors > 0 && (
              <Alert
                type="error"
                showIcon
                title={`Hay ${result.summary.errors} comprobante(s) con errores. Corrige el archivo y vuelve a subirlo; no se registra nada hasta que esté limpio.`}
              />
            )}

            <Segmented<StatusFilter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: `Todos (${result.summary.total})` },
                { value: "error", label: `Errores (${result.summary.errors})` },
                { value: "ok", label: `Correctos (${result.summary.ok})` },
              ]}
            />
          </>
        )}

        {(result || preview.isPending) && (
          <Table<PurchaseImportResultRow>
            size="small"
            rowKey="line"
            columns={columns}
            dataSource={visibleRows}
            loading={preview.isPending}
            pagination={{
              pageSize: 50,
              showSizeChanger: false,
              hideOnSinglePage: true,
            }}
            scroll={{ y: 360 }}
          />
        )}
      </Flex>
    </Modal>
  );
}
