"use client";

import { useState } from "react";

import { useAccounts } from "@/modules/accounting/application/use-accounts";
import type { Account } from "@/modules/accounting/domain/account.types";
import { useProducts } from "@/modules/products/application/use-products";
import type { Product } from "@/modules/products/domain/product.types";

import { SearchPickerModal } from "./search-picker-modal";
import { useDebouncedValue } from "./use-debounced-value";

interface LookupModalProps<T> {
  initialQuery?: string;
  onPick: (item: T, keepOpen: boolean) => void;
  onClose: () => void;
}

/** "Buscar Artículos (F2)". Montar solo mientras está abierto. */
export function ProductSearchModal({ initialQuery = "", onPick, onClose }: LookupModalProps<Product>) {
  const [query, setQuery] = useState(initialQuery);
  const search = useDebouncedValue(query.trim(), 250);
  const { data, isFetching } = useProducts({ search: search || undefined, status: "active", page: 1, perPage: 50 });

  return (
    <SearchPickerModal<Product>
      title="Buscar Artículos"
      placeholder="Código o descripción del artículo"
      query={query}
      onQueryChange={setQuery}
      items={data?.items ?? []}
      loading={isFetching}
      rowKey={(p) => p.id}
      onPick={onPick}
      onClose={onClose}
      columns={[
        { title: "Código", dataIndex: "code", width: 120 },
        { title: "Descripción", dataIndex: "description", ellipsis: true },
        { title: "UM", dataIndex: "unit_of_measure", width: 70 },
      ]}
    />
  );
}

/** "Buscar Cuentas (F2)": cuentas de movimiento activas. Montar solo mientras está abierto. */
export function AccountSearchModal({ initialQuery = "", onPick, onClose }: LookupModalProps<Account>) {
  const [query, setQuery] = useState(initialQuery);
  const search = useDebouncedValue(query.trim(), 250);
  const { data, isFetching } = useAccounts({
    search: search || undefined,
    only_leaves: true,
    only_active: true,
    page: 1,
    perPage: 50,
  });

  return (
    <SearchPickerModal<Account>
      title="Buscar Cuentas"
      placeholder="Código o nombre de la cuenta"
      query={query}
      onQueryChange={setQuery}
      items={data?.items ?? []}
      loading={isFetching}
      rowKey={(a) => a.id}
      onPick={onPick}
      onClose={onClose}
      columns={[
        { title: "Cuenta", dataIndex: "code", width: 110 },
        { title: "Nombre", dataIndex: "name", ellipsis: true },
      ]}
    />
  );
}
