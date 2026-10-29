"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Flex, Input, Modal, Table, Typography, type InputRef, type TableColumnsType } from "antd";

import styles from "./document.module.css";

interface SearchPickerModalProps<T> {
  title: string;
  placeholder: string;
  query: string;
  items: T[];
  loading?: boolean;
  columns: TableColumnsType<T>;
  rowKey: (item: T) => string;
  onQueryChange: (query: string) => void;
  /** keepOpen = true con Shift+Enter / doble clic con Shift: agrega y sigue buscando. */
  onPick: (item: T, keepOpen: boolean) => void;
  onClose: () => void;
}

/**
 * Buscador modal tipo SiempreSoft: se escribe, flechas ↑/↓ para moverse, Enter agrega,
 * Shift+Enter agrega y deja la ventana abierta, Esc cierra.
 * El padre lo monta solo mientras está abierto.
 */
export function SearchPickerModal<T extends object>({
  title,
  placeholder,
  query,
  items,
  loading,
  columns,
  rowKey,
  onQueryChange,
  onPick,
  onClose,
}: SearchPickerModalProps<T>) {
  const [active, setActive] = useState(0);
  const inputRef = useRef<InputRef>(null);

  // Se monta al abrir (el padre lo renderiza condicionalmente): foco al buscador.
  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus({ cursor: "all" }), 80);
    return () => clearTimeout(id);
  }, []);

  const safeActive = Math.min(active, Math.max(items.length - 1, 0));

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(Math.min(safeActive + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(Math.max(safeActive - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      const item = items[safeActive];
      if (item) onPick(item, event.shiftKey);
    }
  };

  return (
    <Modal
      open
      title={title}
      onCancel={onClose}
      footer={null}
      width={760}
      destroyOnHidden
      styles={{ body: { paddingTop: 8 } }}
    >
      <Input
        ref={inputRef}
        prefix={<SearchOutlined />}
        placeholder={placeholder}
        value={query}
        allowClear
        onChange={(e) => {
          setActive(0);
          onQueryChange(e.target.value);
        }}
        onKeyDown={onKeyDown}
      />
      <Table<T>
        size="small"
        style={{ marginTop: 8 }}
        rowKey={rowKey}
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={false}
        scroll={{ y: 320 }}
        rowClassName={(_, index) => (index === safeActive ? styles.selectedRow : "")}
        onRow={(item, index) => ({
          onClick: () => setActive(index ?? 0),
          onDoubleClick: (e) => onPick(item, e.shiftKey),
          style: { cursor: "pointer" },
        })}
        locale={{ emptyText: loading ? "Buscando…" : "Sin resultados" }}
      />
      <Flex justify="space-between" style={{ marginTop: 8 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          ↑/↓ moverse · Enter agregar · Shift+Enter agregar y seguir · Esc cerrar
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {items.length} resultado(s)
        </Typography.Text>
      </Flex>
    </Modal>
  );
}
