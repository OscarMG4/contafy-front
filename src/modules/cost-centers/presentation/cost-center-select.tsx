"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, type SelectProps } from "antd";

import { useCostCenter, useCostCenters } from "../application/use-cost-centers";
import type { CostCenter } from "../domain/cost-center.types";

export interface CostCenterSelectProps
  extends Omit<SelectProps<string>, "options" | "onSearch" | "showSearch" | "value" | "onChange" | "mode"> {
  /** Id del centro de costo. */
  value?: string | null;
  onChange?: (value: string | null) => void;
  /** Se dispara al elegir una opción con el centro de costo completo. */
  onSelectCostCenter?: (costCenter: CostCenter) => void;
  /** Por defecto solo lista centros activos. */
  includeInactive?: boolean;
}

export const costCenterLabel = (costCenter: Pick<CostCenter, "code" | "name">) =>
  `${costCenter.code} - ${costCenter.name}`;

/**
 * Selector de centro de costo con búsqueda en el servidor (código o nombre).
 * Compatible con Form.Item: el valor es el id.
 */
export function CostCenterSelect({
  value,
  onChange,
  onSelectCostCenter,
  includeInactive = false,
  placeholder = "Buscar centro de costo",
  ...rest
}: CostCenterSelectProps) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const { data, isFetching } = useCostCenters({
    search: debounced || undefined,
    only_active: !includeInactive,
    page: 1,
    perPage: 50,
  });

  const items = useMemo(() => data?.items ?? [], [data]);
  const inList = Boolean(value && items.some((item) => item.id === value));
  const { data: selected } = useCostCenter(value && !inList ? value : null);

  const options = useMemo(() => {
    const list: { value: string; label: string; item?: CostCenter }[] = items.map((item) => ({
      value: item.id,
      label: costCenterLabel(item),
      item,
    }));
    if (value && !inList) {
      list.unshift(
        selected?.id === value ? { value, label: costCenterLabel(selected), item: selected } : { value, label: "Cargando…" },
      );
    }
    return list;
  }, [items, value, inList, selected]);

  return (
    <Select<string>
      allowClear
      placeholder={placeholder}
      {...rest}
      showSearch={{ filterOption: false, onSearch: setSearch }}
      loading={isFetching}
      value={value ?? undefined}
      options={options}
      onChange={(next) => {
        onChange?.(next ?? null);
        const option = options.find((o) => o.value === next);
        if (option?.item) onSelectCostCenter?.(option.item);
      }}
      notFoundContent={isFetching ? "Buscando…" : "Sin centros de costo"}
    />
  );
}
