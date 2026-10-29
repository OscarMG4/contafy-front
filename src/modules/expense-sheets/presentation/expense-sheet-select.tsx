"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, type SelectProps } from "antd";

import { useExpenseSheet, useExpenseSheets } from "../application/use-expense-sheets";
import { expenseSheetLabel, type ExpenseSheet } from "../domain/expense-sheet.types";

export interface ExpenseSheetSelectProps
  extends Omit<SelectProps<string>, "options" | "onSearch" | "showSearch" | "value" | "onChange" | "mode"> {
  /** Id de la planilla de gasto. */
  value?: string | null;
  onChange?: (value: string | null) => void;
  /** Se dispara al elegir una opción con la planilla completa. */
  onSelectExpenseSheet?: (sheet: ExpenseSheet) => void;
}

/**
 * Selector de planilla de gasto: solo lista planillas abiertas, con búsqueda en el servidor
 * (número, responsable o concepto). Compatible con Form.Item: el valor es el id.
 * Si el valor apunta a una planilla ya cerrada, se sigue mostrando su etiqueta.
 */
export function ExpenseSheetSelect({
  value,
  onChange,
  onSelectExpenseSheet,
  placeholder = "Buscar planilla abierta",
  ...rest
}: ExpenseSheetSelectProps) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const { data, isFetching } = useExpenseSheets({ search: debounced || undefined, status: "open", page: 1, perPage: 50 });

  const items = useMemo(() => data?.items ?? [], [data]);
  const inList = Boolean(value && items.some((item) => item.id === value));
  const { data: selected } = useExpenseSheet(value && !inList ? value : null);

  const options = useMemo(() => {
    const list: { value: string; label: string; item?: ExpenseSheet }[] = items.map((item) => ({
      value: item.id,
      label: expenseSheetLabel(item),
      item,
    }));
    if (value && !inList) {
      list.unshift(
        selected?.id === value
          ? {
              value,
              label: selected.status === "closed" ? `${expenseSheetLabel(selected)} (cerrada)` : expenseSheetLabel(selected),
              item: selected,
            }
          : { value, label: "Cargando…" },
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
        if (option?.item) onSelectExpenseSheet?.(option.item);
      }}
      notFoundContent={isFetching ? "Buscando…" : "Sin planillas abiertas"}
    />
  );
}
