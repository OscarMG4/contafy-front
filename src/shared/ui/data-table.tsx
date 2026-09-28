"use client";

import type { ReactNode } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Input, Table, type TableProps } from "antd";
import type { AnyObject } from "antd/es/_util/type";

import styles from "./data-table.module.css";

interface DataTableSearch {
  placeholder?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
}

export interface DataTableProps<T extends AnyObject> extends TableProps<T> {
  /** Filtros a la izquierda (Select, DatePicker, Checkbox, …). */
  filters?: ReactNode;
  /** Buscador flexible, al centro. */
  search?: DataTableSearch;
  /**
   * Botón primario / acciones a la derecha del buscador
   * (ej. “Nueva empresa”, “Nueva compra”).
   */
  action?: ReactNode;
  /** @deprecated Usa `action`. Se mantiene por compatibilidad. */
  extra?: ReactNode;
}

export function DataTable<T extends AnyObject>({
  search,
  filters,
  action,
  extra,
  className,
  size = "middle",
  scroll,
  dataSource,
  pagination,
  ...tableProps
}: DataTableProps<T>) {
  const toolbarAction = action ?? extra;
  const hasToolbar = Boolean(search || filters || toolbarAction);

  // Con paginación remota + keepPreviousData, Ant Design avisa si dataSource > pageSize.
  // Recortamos a la página actual mientras llega el fetch nuevo.
  const pageSize = typeof pagination === "object" && pagination ? pagination.pageSize : undefined;
  const safeDataSource =
    pageSize && Array.isArray(dataSource) && dataSource.length > pageSize
      ? dataSource.slice(0, pageSize)
      : dataSource;

  return (
    <div className={styles.root}>
      {hasToolbar && (
        <div className={styles.toolbar}>
          {filters && <div className={styles.filters}>{filters}</div>}
          {search && (
            <Input
              allowClear
              className={styles.search}
              prefix={<SearchOutlined />}
              placeholder={search.placeholder ?? "Buscar"}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value || undefined)}
            />
          )}
          {toolbarAction && <div className={styles.action}>{toolbarAction}</div>}
        </div>
      )}

      <div className={styles.tableCard}>
        <Table<T>
          size={size}
          scroll={{ x: "max-content", ...scroll }}
          className={[styles.table, className].filter(Boolean).join(" ")}
          dataSource={safeDataSource}
          pagination={pagination}
          {...tableProps}
        />
      </div>
    </div>
  );
}
