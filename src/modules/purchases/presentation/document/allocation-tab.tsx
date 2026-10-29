"use client";

import { useMemo } from "react";
import { Alert, Button, Col, DatePicker, Flex, Form, Input, InputNumber, Row, Select, Table, Typography, type FormInstance } from "antd";
import dayjs from "dayjs";

import { useAllocationMethods, usePurchases, usePurchasesDetails } from "../../application/use-purchases";
import type { MerchandisePurchaseLine, Purchase } from "../../domain/purchase.types";
import { formatAmount, round2, type DocumentFormValues } from "./document-model";
import type { DocumentPreview } from "./use-document-preview";

interface AllocationTabProps {
  form: FormInstance<DocumentFormValues>;
  preview: DocumentPreview | null;
}

interface TargetLine {
  key: string;
  purchaseId: string;
  purchaseLabel: string;
  lineNumber: number;
  productCode: string;
  productDescription: string;
  quantity: number;
}

const purchaseLabel = (p: Pick<Purchase, "series" | "number">) => `${p.series}-${p.number}`;

/** Pestaña "Recepción y reparto" del costo adicional (flete, estiba...). */
export function AllocationTab({ form, preview }: AllocationTabProps) {
  const targetPurchaseIds = (Form.useWatch("targetPurchaseIds", form) ?? []) as string[];
  const allocationMethod = Form.useWatch("allocationMethod", form);
  const manual = (Form.useWatch("manualAllocations", form) ?? {}) as Record<string, number | null | undefined>;
  const { data: allocationMethods } = useAllocationMethods();
  const { data: merchandisePage, isFetching } = usePurchases({
    page: 1,
    perPage: 100,
    kind: "merchandise",
    status: "registered",
  });
  const detailQueries = usePurchasesDetails(targetPurchaseIds);

  const details = useMemo(
    () => detailQueries.map((q) => q.data).filter((p): p is Purchase => Boolean(p)),
    [detailQueries],
  );

  const targetLines: TargetLine[] = useMemo(
    () =>
      details.flatMap((p) =>
        p.lines
          .filter((l): l is MerchandisePurchaseLine => l.line_kind === "item")
          .map((l) => ({
            key: `${p.id}:${l.line_number}`,
            purchaseId: p.id,
            purchaseLabel: purchaseLabel(p),
            lineNumber: l.line_number,
            productCode: l.product_code,
            productDescription: l.product_description,
            quantity: Number(l.quantity),
          })),
      ),
    [details],
  );

  const lineByKey = useMemo(() => new Map(targetLines.map((l) => [l.key, l])), [targetLines]);

  const merchandiseOptions = useMemo(
    () =>
      (merchandisePage?.items ?? []).map((p) => ({
        value: p.id,
        label: `${p.registration_code ?? "—"} · ${purchaseLabel(p)} · ${p.supplier_business_name}`,
        receptionDate: p.reception_date,
      })),
    [merchandisePage],
  );

  const toAllocate = preview?.amountToAllocatePen != null ? Number(preview.amountToAllocatePen) : null;
  const manualSum = round2(targetLines.reduce((acc, l) => acc + Number(manual[l.key] ?? 0), 0));
  const manualDiff = toAllocate == null ? null : round2(toAllocate - manualSum);

  const spreadByQuantity = () => {
    if (toAllocate == null || !targetLines.length) return;
    const totalQty = targetLines.reduce((acc, l) => acc + l.quantity, 0);
    if (totalQty <= 0) return;
    let assigned = 0;
    const next: Record<string, number> = {};
    targetLines.forEach((l, i) => {
      const amount = i === targetLines.length - 1 ? round2(toAllocate - assigned) : round2((toAllocate * l.quantity) / totalQty);
      assigned = round2(assigned + amount);
      next[l.key] = amount;
    });
    form.setFieldValue("manualAllocations", next);
  };

  const showPreviewAllocations = Boolean(preview?.allocations?.length) && (allocationMethod !== "manual" || preview?.manualApplied);

  return (
    <>
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Form.Item
            name="targetPurchaseIds"
            label="Compras de mercadería"
            rules={[{ required: true, message: "Selecciona al menos una compra de mercadería" }]}
          >
            <Select
              mode="multiple"
              loading={isFetching}
              showSearch={{ optionFilterProp: "label" }}
              options={merchandiseOptions}
              placeholder="Compras a las que se imputa el costo"
              onChange={(ids: string[]) => {
                const first = merchandiseOptions.find((o) => o.value === ids[0]);
                if (first?.receptionDate) form.setFieldValue("receptionDate", dayjs(first.receptionDate));
              }}
            />
          </Form.Item>
          <Form.Item name="allocationMethod" label="Método de reparto" rules={[{ required: true }]}>
            <Select options={(allocationMethods ?? []).map((m) => ({ value: m.value, label: m.label }))} />
          </Form.Item>
        </Col>
        <Col xs={24} lg={12}>
          <Form.Item
            name="receptionDate"
            label="Fecha de recepción"
            rules={[{ required: true }]}
            extra="Fecha del ajuste de kardex. Se sugiere la de la mercadería vinculada."
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="receptionNumber" label="Nro. Recepción">
            <Input placeholder="Opcional" maxLength={40} />
          </Form.Item>
        </Col>
      </Row>

      {allocationMethod === "by_weight" && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 8 }}
          title="Por peso usa el peso unitario (kg) de cada artículo × cantidad. Si algún artículo no tiene peso, regístralo en Artículos."
        />
      )}

      {allocationMethod === "manual" && targetPurchaseIds.length > 0 && (
        <>
          <Flex justify="space-between" align="center" wrap gap={8} style={{ marginBottom: 8 }}>
            <Typography.Text strong>Reparto manual por línea</Typography.Text>
            <Flex gap={12} align="center" wrap>
              <Typography.Text>
                A repartir PEN: <strong>{toAllocate == null ? "— (calcule, F9)" : formatAmount(toAllocate)}</strong>
              </Typography.Text>
              <Typography.Text type={manualDiff === 0 ? "success" : manualDiff == null ? "secondary" : "warning"}>
                Asignado: <strong>{formatAmount(manualSum)}</strong>
                {manualDiff != null && manualDiff !== 0 ? ` (falta ${formatAmount(manualDiff)})` : ""}
              </Typography.Text>
              <Button size="small" onClick={spreadByQuantity} disabled={toAllocate == null || !targetLines.length}>
                Repartir por cantidad
              </Button>
            </Flex>
          </Flex>
          <Table<TargetLine>
            size="small"
            bordered
            pagination={false}
            rowKey="key"
            loading={detailQueries.some((q) => q.isLoading)}
            dataSource={targetLines}
            scroll={{ y: 220 }}
            columns={[
              { title: "Compra", dataIndex: "purchaseLabel", width: 130 },
              { title: "Línea", dataIndex: "lineNumber", width: 60 },
              {
                title: "Artículo",
                key: "product",
                ellipsis: true,
                render: (_, l) => `${l.productCode} · ${l.productDescription}`,
              },
              { title: "Cantidad", dataIndex: "quantity", width: 100, align: "right", render: (q: number) => formatAmount(q, 2) },
              {
                title: "Importe a asignar (S/)",
                key: "amount",
                width: 170,
                render: (_, l) => (
                  <Form.Item name={["manualAllocations", l.key]} style={{ marginBottom: 0 }}>
                    <InputNumber size="small" min={0} precision={2} style={{ width: "100%" }} controls={false} />
                  </Form.Item>
                ),
              },
            ]}
          />
        </>
      )}

      {showPreviewAllocations && preview && (
        <>
          <Flex justify="space-between" style={{ margin: "12px 0 8px" }} wrap gap={8}>
            <Typography.Text strong>Reparto calculado</Typography.Text>
            <Typography.Text>
              A repartir PEN: <strong>{formatAmount(preview.amountToAllocatePen)}</strong>
            </Typography.Text>
          </Flex>
          <Table
            size="small"
            pagination={false}
            rowKey={(r) => `${r.target_purchase_id}-${r.target_line_number}`}
            dataSource={preview.allocations}
            scroll={{ y: 200 }}
            columns={[
              {
                title: "Compra",
                key: "purchase",
                width: 130,
                render: (_, r) => lineByKey.get(`${r.target_purchase_id}:${r.target_line_number}`)?.purchaseLabel ?? "…",
              },
              { title: "Línea", dataIndex: "target_line_number", width: 60 },
              {
                title: "Artículo",
                key: "product",
                ellipsis: true,
                render: (_, r) => {
                  const line = lineByKey.get(`${r.target_purchase_id}:${r.target_line_number}`);
                  return line ? `${line.productCode} · ${line.productDescription}` : "…";
                },
              },
              {
                title: "Monto PEN",
                dataIndex: "allocated_amount_pen",
                align: "right",
                width: 120,
                render: (v: string) => formatAmount(v),
              },
            ]}
          />
        </>
      )}
    </>
  );
}
