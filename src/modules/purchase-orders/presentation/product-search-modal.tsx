"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Input, Modal, Table, Typography } from "antd";

import { useProducts } from "@/modules/products/application/use-products";
import type { Product } from "@/modules/products/domain/product.types";

interface ProductSearchModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (product: Product) => void;
}

/**
 * "<<Buscar Artículos... (F2)": escribe código o descripción, flechas para moverte,
 * Enter agrega el artículo, Esc cierra.
 */
export function ProductSearchModal({ open, onClose, onPick }: ProductSearchModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Buscar Artículos"
      width={760}
      footer={null}
      destroyOnHidden
      focusable={{ focusTriggerAfterClose: false }}
      styles={{ body: { paddingTop: 8 } }}
    >
      {open && <ProductSearch onPick={onPick} />}
    </Modal>
  );
}

function ProductSearch({ onPick }: { onPick: (product: Product) => void }) {
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState("");
  const [highlight, setHighlight] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const { data, isFetching } = useProducts({ page: 1, perPage: 30, status: "active", search: search || undefined });
  const items = data?.items ?? [];
  const index = Math.min(highlight, Math.max(items.length - 1, 0));

  const onChange = (value: string) => {
    setTerm(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSearch(value.trim());
      setHighlight(0);
    }, 250);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight(Math.min(index + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight(Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      const product = items[index];
      if (product) onPick(product);
    }
  };

  return (
    <>
      <Input
        autoFocus
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Código o descripción del artículo"
        value={term}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        style={{ marginBottom: 8 }}
      />
      <Table<Product>
        size="small"
        bordered
        rowKey="id"
        loading={isFetching}
        dataSource={items}
        pagination={false}
        scroll={{ y: 320 }}
        onRow={(row, i) => ({
          onClick: () => setHighlight(i ?? 0),
          onDoubleClick: () => onPick(row),
          style: {
            cursor: "pointer",
            background: i === index ? "var(--cf-accent-soft)" : undefined,
          },
        })}
        columns={[
          { title: "Código", dataIndex: "code", width: 120 },
          { title: "Descripción", dataIndex: "description" },
          { title: "UM", dataIndex: "unit_of_measure", width: 70 },
        ]}
        locale={{ emptyText: search ? "Sin artículos que coincidan" : "Sin artículos" }}
      />
      <Typography.Text type="secondary" style={{ display: "block", marginTop: 8, fontSize: 12 }}>
        ↑ ↓ para moverse · Enter o doble clic para agregar · Esc para cerrar
      </Typography.Text>
    </>
  );
}
