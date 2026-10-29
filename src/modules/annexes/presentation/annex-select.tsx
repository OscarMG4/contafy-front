"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, type SelectProps } from "antd";

import { useAnnex, useAnnexes } from "../application/use-annexes";
import type { Annex, AnnexType } from "../domain/annex.types";

export interface AnnexSelectProps
  extends Omit<SelectProps<string>, "options" | "onSearch" | "showSearch" | "value" | "onChange" | "mode"> {
  /** Id del anexo. */
  value?: string | null;
  onChange?: (value: string | null) => void;
  /** Se dispara al elegir una opción con el anexo completo. */
  onSelectAnnex?: (annex: Annex) => void;
  /** Restringe a un tipo de anexo. */
  type?: AnnexType;
  /** Por defecto solo lista anexos activos. */
  includeInactive?: boolean;
}

export const annexLabel = (annex: Pick<Annex, "code" | "name">) => `${annex.code} - ${annex.name}`;

/**
 * Selector de anexo con búsqueda en el servidor (código, nombre o documento).
 * Compatible con Form.Item: el valor es el id.
 */
export function AnnexSelect({
  value,
  onChange,
  onSelectAnnex,
  type,
  includeInactive = false,
  placeholder = "Buscar anexo",
  ...rest
}: AnnexSelectProps) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const { data, isFetching } = useAnnexes({
    search: debounced || undefined,
    type,
    only_active: !includeInactive,
    page: 1,
    perPage: 50,
  });

  const items = useMemo(() => data?.items ?? [], [data]);
  const inList = Boolean(value && items.some((item) => item.id === value));
  const { data: selected } = useAnnex(value && !inList ? value : null);

  const options = useMemo(() => {
    const list: { value: string; label: string; item?: Annex }[] = items.map((item) => ({
      value: item.id,
      label: annexLabel(item),
      item,
    }));
    if (value && !inList) {
      list.unshift(
        selected?.id === value ? { value, label: annexLabel(selected), item: selected } : { value, label: "Cargando…" },
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
        if (option?.item) onSelectAnnex?.(option.item);
      }}
      notFoundContent={isFetching ? "Buscando…" : "Sin anexos"}
    />
  );
}
