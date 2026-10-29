"use client";

import { useMemo } from "react";
import { Select, type SelectProps } from "antd";

import { useSuppliers } from "@/modules/suppliers/application/use-suppliers";
import type { Supplier } from "@/modules/suppliers/domain/supplier.types";

type SupplierSelectProps = Omit<SelectProps<string>, "options" | "onChange" | "showSearch"> & {
  onChange?: (value: string | undefined, supplier?: Supplier) => void;
};

/** Hook compartido: proveedores activos (hasta 200) para selects con búsqueda local. */
export function useSupplierOptions() {
  const query = useSuppliers({ page: 1, perPage: 200, status: "active" });
  const suppliers = useMemo(() => query.data?.items ?? [], [query.data]);
  const options = useMemo(
    () =>
      suppliers.map((s) => ({
        value: s.id,
        label: `${s.document_number} · ${s.business_name}`,
      })),
    [suppliers],
  );
  return { suppliers, options, isLoading: query.isLoading };
}

/** Selector de proveedor con búsqueda por RUC / razón social (como el "..." de SiempreSoft). */
export function SupplierSelect({ onChange, placeholder = "RUC o razón social", ...props }: SupplierSelectProps) {
  const { suppliers, options, isLoading } = useSupplierOptions();

  return (
    <Select<string>
      showSearch={{ optionFilterProp: "label" }}
      placeholder={placeholder}
      loading={isLoading}
      options={options}
      popupMatchSelectWidth={false}
      onChange={(value) => onChange?.(value ?? undefined, suppliers.find((s) => s.id === value))}
      {...props}
    />
  );
}
