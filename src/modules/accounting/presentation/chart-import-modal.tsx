"use client";

import { useMemo, useState } from "react";
import { DownloadOutlined, InboxOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Checkbox,
  Col,
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
  CHART_FIELDS,
  CHART_TEMPLATE_URL,
  detectColumns,
  toImportRows,
  type ChartColumn,
  type ChartColumnMapping,
} from "../application/chart-import-columns";
import { useImportChart, usePreviewChartImport } from "../application/use-accounts";
import type { ChartImportPlan, ChartImportRow, ChartImportStatus } from "../domain/account.types";

const STATUS: Record<ChartImportStatus, { label: string; color: string }> = {
  new: { label: "Nueva", color: "success" },
  existing: { label: "Ya existe", color: "default" },
  rename: { label: "Se renombra", color: "processing" },
  skipped: { label: "Omitida", color: "warning" },
  error: { label: "Error", color: "error" },
};

/** Orden en pantalla: Código, Nombre, Cuenta padre, Naturaleza. */
const COLUMN_FIELDS = (["code", "name", "parent", "nature"] as const).map((key) =>
  CHART_FIELDS.find((field) => field.key === key)!,
);

type StatusFilter = "all" | ChartImportStatus;

interface ChartImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChartImportModal({ open, onClose }: ChartImportModalProps) {
  const { message } = App.useApp();
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheet, setSheet] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ChartColumnMapping | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [updateNames, setUpdateNames] = useState(false);
  const [plan, setPlan] = useState<ChartImportPlan | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const preview = usePreviewChartImport();
  const importChart = useImportChart();

  const rows = useMemo(() => (mapping ? toImportRows(sheet, mapping) : []), [sheet, mapping]);
  const columnCount = useMemo(() => sheetColumnCount(sheet), [sheet]);
  const headers = mapping?.headerRow !== null && mapping ? sheet[mapping.headerRow] : [];

  const reset = () => {
    setFileName(null);
    setSheet([]);
    setMapping(null);
    setReadError(null);
    setPlan(null);
    setFilter("all");
    preview.reset();
    importChart.reset();
  };

  const close = () => {
    reset();
    setUpdateNames(false);
    onClose();
  };

  const validate = (nextMapping: ChartColumnMapping | null = mapping, nextSheet = sheet, nextUpdate = updateNames) => {
    if (!nextMapping) return;
    const nextRows = toImportRows(nextSheet, nextMapping);
    if (nextRows.length === 0) {
      setPlan(null);
      return;
    }
    preview.mutate({ rows: nextRows, updateNames: nextUpdate }, { onSuccess: (result) => setPlan(result) });
  };

  const handleFile = async (file: File) => {
    reset();
    setFileName(file.name);
    try {
      const data = await readSpreadsheet(file);
      const detected = detectColumns(data);
      setSheet(data);
      setMapping(detected);
      validate(detected, data);
    } catch (error) {
      setReadError(error instanceof Error ? error.message : "No se pudo leer el archivo.");
    }
  };

  const changeColumn = (key: ChartColumn, column: number | null) => {
    if (!mapping) return;
    const next = { ...mapping, columns: { ...mapping.columns, [key]: column } };
    setMapping(next);
    setPlan(null);
    if (next.columns.code !== null && next.columns.name !== null) validate(next);
  };

  const changeUpdateNames = (checked: boolean) => {
    setUpdateNames(checked);
    validate(mapping, sheet, checked);
  };

  const submit = () => {
    importChart.mutate(
      { rows, updateNames },
      {
        onSuccess: ({ message: text }) => {
          message.success(text);
          close();
        },
        onError: (error) => {
          message.error(ApiError.from(error).message);
          validate();
        },
      },
    );
  };

  const visibleRows = plan ? plan.rows.filter((row) => filter === "all" || row.status === filter) : [];
  const previewError = preview.error ? ApiError.from(preview.error).message : null;

  const columns: TableProps<ChartImportRow>["columns"] = [
    { title: "Fila", dataIndex: "line", width: 64 },
    {
      title: "Código",
      dataIndex: "code",
      width: 140,
      render: (code: string, row) => (
        <div style={{ paddingLeft: Math.max(0, (row.level ?? 1) - 1) * 12 }}>
          <Typography.Text strong={row.is_leaf}>{code}</Typography.Text>
        </div>
      ),
    },
    { title: "Nombre", dataIndex: "name", ellipsis: true },
    {
      title: "Padre",
      dataIndex: "parent_code",
      width: 90,
      render: (value: string | null) => value ?? "—",
    },
    { title: "Nivel", dataIndex: "level", width: 64, align: "center" },
    {
      title: "Naturaleza",
      dataIndex: "nature_label",
      width: 110,
      responsive: ["lg"],
    },
    {
      title: "Tipo",
      dataIndex: "is_leaf",
      width: 110,
      responsive: ["lg"],
      render: (leaf: boolean, row) =>
        row.status === "error" || row.status === "skipped" ? "—" : leaf ? "Movimiento" : "Agrupación",
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 120,
      render: (status: ChartImportStatus) => (
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
      title="Importar plan de cuentas"
      width={1180}
      destroyOnHidden
      mask={{ closable: false }}
      footer={
        <Flex justify="space-between" align="center" wrap gap={8}>
          <Checkbox checked={updateNames} disabled={!mapping} onChange={(e) => changeUpdateNames(e.target.checked)}>
            Actualizar el nombre de las cuentas que ya existen
          </Checkbox>
          <Flex gap={8}>
            <Button onClick={close}>Cancelar</Button>
            <Button
              type="primary"
              loading={importChart.isPending}
              disabled={!plan?.can_import || preview.isPending}
              onClick={submit}
            >
              {plan ? `Importar ${plan.summary.new} ${plan.summary.new === 1 ? "cuenta" : "cuentas"}` : "Importar"}
            </Button>
          </Flex>
        </Flex>
      }
    >
      <Flex vertical gap={16}>
        <Alert
          type="info"
          showIcon
          title="¿No tienes el archivo en el formato correcto? Descarga la plantilla Excel, copia ahí tus cuentas y súbela."
          action={
            <Button
              type="primary"
              ghost
              icon={<DownloadOutlined />}
              href={CHART_TEMPLATE_URL}
              download="plantilla-plan-de-cuentas.xlsx"
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
            <p className="ant-upload-text">Arrastra aquí el Excel (.xlsx) o CSV con el plan de cuentas</p>
            <p className="ant-upload-hint">
              Basta con dos columnas: código y nombre. El padre de cada cuenta se deduce del código (201111 cuelga de
              20111) y la naturaleza se hereda del padre. Las cuentas que ya existen no se duplican.
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
          <Row gutter={[12, 8]}>
            {COLUMN_FIELDS.map((field) => (
              <Col key={field.key} xs={12} md={6}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {field.label}
                  {field.required ? " *" : ""}
                </Typography.Text>
                <Select
                  style={{ width: "100%" }}
                  value={mapping.columns[field.key]}
                  allowClear={!field.required}
                  placeholder="No viene en el archivo"
                  onChange={(value) => changeColumn(field.key, value ?? null)}
                  options={Array.from({ length: columnCount }, (_, index) => ({
                    value: index,
                    label: columnLabel(index, headers[index]),
                  }))}
                />
              </Col>
            ))}
          </Row>
        )}

        {previewError && <Alert type="error" showIcon title={previewError} />}

        {plan && (
          <>
            <Row gutter={12}>
              <Col span={4}>
                <Statistic title="Filas" value={plan.summary.total} />
              </Col>
              <Col span={4}>
                <Statistic
                  title="Nuevas"
                  value={plan.summary.new}
                  styles={{ content: { color: "var(--ant-color-success)" } }}
                />
              </Col>
              <Col span={4}>
                <Statistic title="Ya existen" value={plan.summary.existing} />
              </Col>
              <Col span={4}>
                <Statistic title="Se renombran" value={plan.summary.rename} />
              </Col>
              <Col span={4}>
                <Statistic title="Omitidas" value={plan.summary.skipped} />
              </Col>
              <Col span={4}>
                <Statistic
                  title="Con errores"
                  value={plan.summary.errors}
                  styles={plan.summary.errors ? { content: { color: "var(--ant-color-error)" } } : undefined}
                />
              </Col>
            </Row>

            {plan.summary.errors > 0 && (
              <Alert
                type="error"
                showIcon
                title={`Hay ${plan.summary.errors} fila(s) con errores. Corrige el archivo y vuelve a subirlo; no se importa nada hasta que esté limpio.`}
              />
            )}

            {plan.subdivided.length > 0 && (
              <Alert
                type="warning"
                showIcon
                title="Estas cuentas de movimiento pasarán a tener subcuentas y ya no recibirán asientos:"
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {plan.subdivided.map((item) => (
                      <li key={item.code}>
                        <strong>{item.code}</strong> {item.name}
                        {item.system &&
                          (item.fallback_code
                            ? ` — los asientos automáticos usarán ${item.fallback_code}`
                            : " — la usan los asientos automáticos")}
                      </li>
                    ))}
                  </ul>
                }
              />
            )}

            {plan.summary.errors === 0 && !plan.can_import && (
              <Alert
                type="info"
                showIcon
                title="Todas las cuentas del archivo ya existen en el plan; no hay nada que importar."
              />
            )}

            <Segmented<StatusFilter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: `Todas (${plan.summary.total})` },
                { value: "error", label: `Errores (${plan.summary.errors})` },
                { value: "new", label: `Nuevas (${plan.summary.new})` },
                {
                  value: "existing",
                  label: `Ya existen (${plan.summary.existing})`,
                },
                {
                  value: "rename",
                  label: `Se renombran (${plan.summary.rename})`,
                },
                {
                  value: "skipped",
                  label: `Omitidas (${plan.summary.skipped})`,
                },
              ]}
            />
          </>
        )}

        {(plan || preview.isPending) && (
          <Table<ChartImportRow>
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
