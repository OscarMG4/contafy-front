"use client";

import { useMemo } from "react";
import { Button, Col, Form, Input, InputNumber, Modal, Row, Select, type FormInstance } from "antd";

import { useDetractions, useGoodsServicesClassifications } from "../../application/use-purchases";
import type { DocumentFormValues } from "./document-model";

interface OptionsModalProps {
  form: FormInstance<DocumentFormValues>;
  open: boolean;
  onClose: () => void;
}

/**
 * "<<Otras Opciones...": ISC, descuento, detracción y clasificación de bienes y servicios.
 * Se renderiza siempre (forceRender) para que sus campos sigan registrados en el formulario.
 */
export function OtherOptionsModal({ form, open, onClose }: OptionsModalProps) {
  const { data: detractions } = useDetractions();
  const { data: classifications } = useGoodsServicesClassifications();

  const detractionOptions = useMemo(
    () =>
      (detractions ?? []).map((entry) => ({
        value: entry.code,
        label: `${entry.code} · ${entry.description}`,
        percent: Number(entry.meta?.percentage ?? 0),
      })),
    [detractions],
  );

  return (
    <Modal
      open={open}
      title="Otras Opciones"
      onCancel={onClose}
      forceRender
      width={640}
      footer={
        <Button type="primary" onClick={onClose}>
          Aceptar
        </Button>
      }
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="iscAmount" label="ISC">
            <InputNumber min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="discountAmount" label="Descuento">
            <InputNumber min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item name="detractionCode" label="Detracción">
            <Select
              allowClear
              showSearch={{ optionFilterProp: "label" }}
              placeholder="Sin detracción"
              options={detractionOptions}
              popupMatchSelectWidth={false}
              onChange={(code) => {
                const option = detractionOptions.find((o) => o.value === code);
                form.setFieldValue("detractionPercent", option?.percent ?? null);
              }}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="detractionPercent" label="% Detracción">
            <InputNumber min={0} max={100} precision={4} style={{ width: "100%" }} disabled />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="goodsServicesClass" label="Clasificación bien / servicio">
            <Select
              allowClear
              placeholder="Tabla 30 SUNAT (opcional)"
              options={(classifications ?? []).map((c) => ({ value: c.code, label: `${c.code} · ${c.description}` }))}
              popupMatchSelectWidth={false}
            />
          </Form.Item>
        </Col>
      </Row>
    </Modal>
  );
}

/** "Observaciones...". */
export function ObservationsModal({ open, onClose }: Omit<OptionsModalProps, "form">) {
  return (
    <Modal
      open={open}
      title="Observaciones"
      onCancel={onClose}
      forceRender
      footer={
        <Button type="primary" onClick={onClose}>
          Aceptar
        </Button>
      }
    >
      <Form.Item name="observations" style={{ marginBottom: 0 }} wrapperCol={{ span: 24 }}>
        <Input.TextArea rows={5} maxLength={1000} showCount placeholder="Notas internas del comprobante" />
      </Form.Item>
    </Modal>
  );
}
