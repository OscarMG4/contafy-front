"use client";

import { useMemo, useState } from "react";
import { Select } from "antd";

import { useSuppliers } from "@/modules/suppliers/application/use-suppliers";
import type { Supplier } from "@/modules/suppliers/domain/supplier.types";

import { useDebouncedValue } from "./use-debounced-value";

interface SupplierSelectProps {
  id?: string;
  value?: string;
  onChange?: (value: string | undefined) => void;
  onSupplierChange?: (supplier: Supplier | null) => void;
  disabled?: boolean;
}

/** Proveedor buscable por RUC, código o razón social (búsqueda en el servidor). */
export function SupplierSelect({ id, value, onChange, onSupplierChange, disabled }: SupplierSelectProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Supplier | null>(null);
  const search = useDebouncedValue(query.trim(), 250);
  const { data, isFetching } = useSuppliers({ search: search || undefined, status: "active", page: 1, perPage: 30 });

  const suppliers = useMemo(() => {
    const items = data?.items ?? [];
    if (selected && selected.id === value && !items.some((s) => s.id === selected.id)) return [selected, ...items];
    return items;
  }, [data, selected, value]);

  const options = suppliers.map((s) => ({
    value: s.id,
    label: `${s.document_number} · ${s.business_name}`,
  }));

  return (
    <Select
      id={id}
      value={value}
      disabled={disabled}
      placeholder="RUC, código o razón social"
      showSearch={{ filterOption: false, onSearch: setQuery }}
      loading={isFetching}
      options={options}
      allowClear
      notFoundContent={isFetching ? "Buscando…" : "Sin proveedores"}
      onChange={(next: string | undefined) => {
        const supplier = suppliers.find((s) => s.id === next) ?? null;
        setSelected(supplier);
        setQuery("");
        onChange?.(next);
        onSupplierChange?.(supplier);
      }}
      optionRender={(option) => {
        const s = suppliers.find((x) => x.id === option.value);
        return s ? (
          <div style={{ lineHeight: 1.25 }}>
            <div>{s.business_name}</div>
            <div style={{ fontSize: 12, opacity: 0.65 }}>
              {s.code} · {s.document_number} · {s.payment_term_label}
              {s.payment_term === "credit" ? ` ${s.credit_days} días` : ""}
            </div>
          </div>
        ) : (
          option.label
        );
      }}
    />
  );
}
