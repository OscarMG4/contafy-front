"use client";

import { Button, Col, Form, Input, InputNumber, Modal, Row, type FormInstance } from "antd";

import type { DocumentFormValues } from "./document-model";

interface OptionsModalProps {
  form: FormInstance<DocumentFormValues>;
  open: boolean;
  onClose: () => void;
}

/**
 * "<<Otras Opciones...": ISC y descuento (detracción y clasificación van en la cabecera, como en SiempreSoft).
 * Se renderiza siempre (forceRender) para que sus campos sigan registrados en el formulario.
 */
export function OtherOptionsModal({ open, onClose }: OptionsModalProps) {
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
