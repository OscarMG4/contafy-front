"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, type SelectProps } from "antd";

import { useAccounts } from "../application/use-accounts";

interface AccountCodeSelectProps extends Omit<SelectProps<string>, "options" | "onSearch" | "showSearch" | "value" | "onChange"> {
  value?: string | null;
  onChange?: (value: string | null) => void;
}

/**
 * Selector de cuenta de movimiento por código (búsqueda en el servidor).
 * El valor es el código de la cuenta (ej. "941", "791").
 */
export function AccountCodeSelect({ value, onChange, ...rest }: AccountCodeSelectProps) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const { data, isFetching } = useAccounts({
    search: debounced || undefined,
    only_leaves: true,
    only_active: true,
    page: 1,
    perPage: 50,
  });

  const options = useMemo(() => {
    const items = (data?.items ?? []).map((a) => ({ value: a.code, label: `${a.code} · ${a.name}` }));
    if (value && !items.some((o) => o.value === value)) items.unshift({ value, label: value });
    return items;
  }, [data, value]);

  return (
    <Select<string>
      {...rest}
      showSearch={{ filterOption: false, onSearch: setSearch }}
      allowClear
      loading={isFetching}
      value={value ?? undefined}
      options={options}
      onChange={(next) => onChange?.(next ?? null)}
      notFoundContent={isFetching ? "Buscando…" : "Sin cuentas"}
    />
  );
}
