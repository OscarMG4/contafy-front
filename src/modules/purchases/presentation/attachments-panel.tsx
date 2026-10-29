"use client";

import { DeleteOutlined, DownloadOutlined, InboxOutlined, PaperClipOutlined } from "@ant-design/icons";
import { Alert, App, Button, Flex, Popconfirm, Table, Tooltip, Typography, Upload } from "antd";
import dayjs from "dayjs";

import {
  useDeleteAttachment,
  useDownloadAttachment,
  usePurchaseAttachments,
  useUploadAttachments,
} from "../application/use-attachments";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_EXTENSIONS,
  formatFileSize,
  validateAttachmentFile,
  type PurchaseAttachment,
} from "../domain/attachment.types";

export { useUploadPendingAttachments } from "../application/use-attachments";

export interface AttachmentsPanelProps {
  /** Compra ya guardada: lista/sube/descarga/elimina en el servidor. Sin id: solo junta archivos pendientes. */
  purchaseId?: string | null;
  pendingFiles: File[];
  onPendingFilesChange: (files: File[]) => void;
  readOnly?: boolean;
}

const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

/** Pestaña "Archivos" de la compra (PDF/XML del comprobante, guías, fotos…), como en SiempreSoft. */
export function AttachmentsPanel({ purchaseId, pendingFiles, onPendingFilesChange, readOnly }: AttachmentsPanelProps) {
  const { message } = App.useApp();
  const serverMode = Boolean(purchaseId);
  const { data: attachments, isLoading } = usePurchaseAttachments(purchaseId);
  const upload = useUploadAttachments(purchaseId);
  const remove = useDeleteAttachment(purchaseId);
  const download = useDownloadAttachment();

  /** Valida en cliente (mismas reglas que el backend) y descarta lo inválido avisando. */
  const acceptFiles = (files: File[]): File[] => {
    const errors = files.map(validateAttachmentFile).filter((e): e is string => e !== null);
    errors.forEach((e) => message.error(e));
    return files.filter((f) => validateAttachmentFile(f) === null);
  };

  const handleSelected = (files: File[]) => {
    const valid = acceptFiles(files);
    if (valid.length === 0) return;

    if (!serverMode) {
      onPendingFilesChange([...pendingFiles, ...valid.filter((f) => !pendingFiles.some((p) => sameFile(p, f)))]);
      return;
    }

    upload.mutate(valid, {
      onSuccess: (created) =>
        message.success(created.length === 1 ? "Archivo adjuntado" : `${created.length} archivos adjuntados`),
      onError: (error) => message.error(error.message),
    });
  };

  const dragger = !readOnly && (
    <Upload.Dragger
      accept={ATTACHMENT_ACCEPT}
      multiple
      showUploadList={false}
      disabled={upload.isPending}
      // antd llama beforeUpload por cada archivo; procesamos la selección completa una sola vez.
      beforeUpload={(file, list) => {
        if (file === list[0]) handleSelected(list);
        return false;
      }}
      style={{ marginBottom: 12 }}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">
        {upload.isPending ? "Subiendo archivos…" : "Arrastra aquí los archivos o haz clic para elegirlos"}
      </p>
      <p className="ant-upload-hint">
        {ATTACHMENT_EXTENSIONS.join(", ").toUpperCase()} · máximo 10 MB por archivo
      </p>
    </Upload.Dragger>
  );

  if (!serverMode) {
    return (
      <div>
        {dragger}
        <Alert
          type="info"
          showIcon
          title="Los archivos se subirán al guardar la compra."
          style={{ marginBottom: 12 }}
        />
        <Table<File>
          size="small"
          pagination={false}
          rowKey={(f) => `${f.name}-${f.size}-${f.lastModified}`}
          locale={{ emptyText: "Sin archivos" }}
          dataSource={pendingFiles}
          columns={[
            {
              title: "Archivo",
              dataIndex: "name",
              ellipsis: true,
              render: (name: string) => (
                <Typography.Text>
                  <PaperClipOutlined /> {name}
                </Typography.Text>
              ),
            },
            { title: "Tamaño", dataIndex: "size", width: 100, align: "right", render: (v: number) => formatFileSize(v) },
            ...(readOnly
              ? []
              : [
                  {
                    title: "",
                    key: "actions",
                    width: 56,
                    align: "center" as const,
                    render: (_: unknown, file: File) => (
                      <Tooltip title="Quitar">
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => onPendingFilesChange(pendingFiles.filter((p) => !sameFile(p, file)))}
                        />
                      </Tooltip>
                    ),
                  },
                ]),
          ]}
        />
      </div>
    );
  }

  return (
    <div>
      {dragger}
      <Table<PurchaseAttachment>
        size="small"
        pagination={false}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: "Sin archivos adjuntos" }}
        dataSource={attachments ?? []}
        columns={[
          {
            title: "Archivo",
            dataIndex: "original_name",
            ellipsis: true,
            render: (name: string, row) => (
              <Button
                type="link"
                size="small"
                icon={<PaperClipOutlined />}
                style={{ paddingInline: 0 }}
                onClick={() => download.mutate(row, { onError: (error) => message.error(error.message) })}
              >
                {name}
              </Button>
            ),
          },
          { title: "Tamaño", dataIndex: "size", width: 90, align: "right", render: (v: number) => formatFileSize(v) },
          {
            title: "Subido",
            dataIndex: "created_at",
            width: 140,
            render: (d: string | null) => (d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "—"),
          },
          {
            title: "",
            key: "actions",
            width: readOnly ? 48 : 88,
            align: "center",
            render: (_, row) => (
              <Flex gap={4} justify="center">
                <Tooltip title="Descargar">
                  <Button
                    size="small"
                    type="text"
                    icon={<DownloadOutlined />}
                    loading={download.isPending && download.variables?.id === row.id}
                    onClick={() => download.mutate(row, { onError: (error) => message.error(error.message) })}
                  />
                </Tooltip>
                {!readOnly && (
                  <Popconfirm
                    title="¿Eliminar este archivo?"
                    okText="Eliminar"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                    onConfirm={() =>
                      remove.mutateAsync(row.id).then(
                        () => message.success("Archivo eliminado"),
                        (error: Error) => message.error(error.message),
                      )
                    }
                  >
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                )}
              </Flex>
            ),
          },
        ]}
      />
    </div>
  );
}
