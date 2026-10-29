"use client";

import { useMemo, useState } from "react";
import { DownloadOutlined, InboxOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Checkbox,
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
  SUPPLIER_IMPORT_FIELD_ORDER,
  SUPPLIER_IMPORT_FIELDS,
  SUPPLIER_TEMPLATE_URL,
  detectSupplierColumns,
  toSupplierImportRows,
  type SupplierImportMapping,
} from "../application/supplier-import-columns";
import { useImportSuppliers, usePreviewSupplierImport } from "../application/use-supplier-import";
import type {
  SupplierImportField,
  SupplierImportResult,
  SupplierImportResultRow,
  SupplierImportStatus,
} from "../domain/supplier-import.types";

const FIELDS = SUPPLIER_IMPORT_FIELD_ORDER.map((key) => SUPPLIER_IMPORT_FIELDS.find((field) => field.key === key)!);

const STATUS: Record<SupplierImportStatus, { label: string; color: string }> = {
  new: { label: "Nuevo", color: "success" },
  update: { label: "Se actualiza", color: "processing" },
  existing: { label: "Ya existe", color: "default" },
  error: { label: "Error", color: "error" },
};

type StatusFilter = "all" | SupplierImportStatus;

interface SupplierImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function SupplierImportModal({ open, onClose }: SupplierImportModalProps) {
  const { message } = App.useApp();
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheet, setSheet] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<SupplierImportMapping | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [result, setResult] = useState<SupplierImportResult | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const preview = usePreviewSupplierImport();
  const importSuppliers = useImportSuppliers();

  const rows = useMemo(() => (mapping ? toSupplierImportRows(sheet, mapping) : []), [sheet, mapping]);
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
    importSuppliers.reset();
  };

  const close = () => {
    reset();
    setUpdateExisting(false);
    onClose();
  };

  const validate = (nextMapping: SupplierImportMapping, nextSheet = sheet, nextUpdate = updateExisting) => {
    const missing = FIELDS.some((field) => field.required && nextMapping.columns[field.key] === null);
    const nextRows = toSupplierImportRows(nextSheet, nextMapping);
    if (missing || nextRows.length === 0) {
      setResult(null);
      return;
    }
    preview.mutate({ rows: nextRows, updateExisting: nextUpdate }, { onSuccess: setResult });
  };

  const handleFile = async (file: File) => {
    reset();
    setFileName(file.name);
    try {
      const data = await readSpreadsheet(file);
      const detected = detectSupplierColumns(data);
      setSheet(data);
      setMapping(detected);
      validate(detected, data);
    } catch (error) {
      setReadError(error instanceof Error ? error.message : "No se pudo leer el archivo.");
    }
  };

  const changeColumn = (key: SupplierImportField, column: number | null) => {
    if (!mapping) return;
    const next = { ...mapping, columns: { ...mapping.columns, [key]: column } };
    setMapping(next);
    setResult(null);
    validate(next);
  };

  const changeUpdateExisting = (checked: boolean) => {
    setUpdateExisting(checked);
    if (mapping) validate(mapping, sheet, checked);
  };

  const submit = () => {
    importSuppliers.mutate(
      { rows, updateExisting },
      {
        onSuccess: ({ message: text }) => {
          message.success(text);
          close();
        },
        onError: (error) => {
          message.error(ApiError.from(error).message);
          if (mapping) validate(mapping);
        },
      },
    );
  };

  const visibleRows = result ? result.rows.filter((row) => filter === "all" || row.status === filter) : [];
  const previewError = preview.error ? ApiError.from(preview.error).message : null;
  const toSave = result ? result.summary.new + result.summary.update : 0;

  const columns: TableProps<SupplierImportResultRow>["columns"] = [
    { title: "Fila", dataIndex: "line", width: 60 },
    { title: "Código", dataIndex: "code", width: 100, render: (code: string | null) => code ?? "—" },
    {
      title: "Documento",
      dataIndex: "document_number",
      width: 150,
      render: (number: string | null, row) => (
        <Flex vertical>
          <Typography.Text strong>{number ?? "—"}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {row.document_type ?? ""}
          </Typography.Text>
        </Flex>
      ),
    },
    { title: "Razón social", dataIndex: "business_name", render: (name: string | null) => name ?? "—" },
    {
      title: "Condición",
      dataIndex: "payment_term",
      width: 120,
      render: (term: string | null, row) =>
        term ? `${term}${row.credit_days ? ` ${row.credit_days} días` : ""}` : "—",
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 120,
      render: (status: SupplierImportStatus) => (
        <Tag color={STATUS[status].color} variant="filled">
          {STATUS[status].label}
        </Tag>
      ),
    },
    {
      title: "Observaciones",
      dataIndex: "messages",
      width: 300,
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
      title="Importar proveedores desde Excel"
      width={1100}
      destroyOnHidden
      mask={{ closable: false }}
      footer={
        <Flex justify="space-between" align="center" wrap gap={8}>
          <Checkbox checked={updateExisting} onChange={(e) => changeUpdateExisting(e.target.checked)}>
            Actualizar los proveedores que ya existen (solo con las celdas llenas)
          </Checkbox>
          <Flex gap={8}>
            <Button onClick={close}>Cancelar</Button>
            <Button
              type="primary"
              loading={importSuppliers.isPending}
              disabled={!result?.can_import || preview.isPending}
              onClick={submit}
            >
              {result ? `Importar ${toSave} ${toSave === 1 ? "proveedor" : "proveedores"}` : "Importar"}
            </Button>
          </Flex>
        </Flex>
      }
    >
      <Flex vertical gap={16}>
        <Alert
          type="info"
          showIcon
          title="Basta con el RUC: si dejas vacía la razón social, se completa con SUNAT (RUC) o RENIEC (DNI). Descarga la plantilla para ver todas las columnas."
          action={
            <Button
              type="primary"
              ghost
              icon={<DownloadOutlined />}
              href={SUPPLIER_TEMPLATE_URL}
              download="plantilla-proveedores.xlsx"
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
            <p className="ant-upload-text">Arrastra aquí el Excel (.xlsx) o CSV con los proveedores</p>
            <p className="ant-upload-hint">
              Los proveedores que ya existen (mismo RUC o documento) no se duplican. Verás una vista previa con el
              código que recibirá cada uno y los errores por fila.
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
                      <Col key={field.key} xs={12} md={8} lg={6}>
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
                <Statistic title="Filas" value={result.summary.total} />
              </Col>
              <Col span={5}>
                <Statistic
                  title="Nuevos"
                  value={result.summary.new}
                  styles={{ content: { color: "var(--ant-color-success)" } }}
                />
              </Col>
              <Col span={5}>
                <Statistic title="Se actualizan" value={result.summary.update} />
              </Col>
              <Col span={4}>
                <Statistic title="Ya existen" value={result.summary.existing} />
              </Col>
              <Col span={5}>
                <Statistic
                  title="Con errores"
                  value={result.summary.errors}
                  styles={result.summary.errors ? { content: { color: "var(--ant-color-error)" } } : undefined}
                />
              </Col>
            </Row>

            {result.summary.errors > 0 && (
              <Alert
                type="error"
                showIcon
                title={`Hay ${result.summary.errors} fila(s) con errores. Corrige el archivo y vuelve a subirlo; no se importa nada hasta que esté limpio.`}
              />
            )}

            <Segmented<StatusFilter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: `Todas (${result.summary.total})` },
                { value: "error", label: `Errores (${result.summary.errors})` },
                { value: "new", label: `Nuevos (${result.summary.new})` },
                { value: "update", label: `Se actualizan (${result.summary.update})` },
                { value: "existing", label: `Ya existen (${result.summary.existing})` },
              ]}
            />
          </>
        )}

        {(result || preview.isPending) && (
          <Table<SupplierImportResultRow>
            size="small"
            rowKey="line"
            columns={columns}
            dataSource={visibleRows}
            loading={preview.isPending}
            pagination={{ pageSize: 50, showSizeChanger: false, hideOnSinglePage: true }}
            scroll={{ y: 360 }}
          />
        )}
      </Flex>
    </Modal>
  );
}
