"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalculatorOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { Alert, App, Button, Divider, Flex, Form, Tabs, Tooltip, Typography } from "antd";
import dayjs from "dayjs";

import { ApiError } from "@/core/http/api-error";
import { useHydrated } from "@/shared/lib/use-hydrated";
import { useCategories } from "@/modules/accounting/application/use-categories";
import type { Account } from "@/modules/accounting/domain/account.types";
import { accountsApi } from "@/modules/accounting/infrastructure/accounts.api";
import type { Product } from "@/modules/products/domain/product.types";
import { productsApi } from "@/modules/products/infrastructure/products.api";
import type { PurchaseOrder } from "@/modules/purchase-orders/domain/purchase-order.types";
import { usePaymentTerms } from "@/modules/suppliers/application/use-suppliers";
import type { Supplier } from "@/modules/suppliers/domain/supplier.types";
import { useTreasuryAccounts } from "@/modules/treasury/application/use-treasury";
import { useWarehouses } from "@/modules/warehouses/application/use-warehouses";
import { useEnterToNextField, useHotkeys } from "@/shared/lib/use-keyboard-entry";

import {
  useCreateAdditionalCostPurchase,
  useCreateExpensePurchase,
  useCreatePurchase,
  usePurchaseOperationTypes,
} from "../../application/use-purchases";
import {
  documentTypeOptionsFor,
  FEE_RECEIPT_DOCUMENT,
  FEE_RETENTION_DEFAULT_PERCENT,
  FEE_RETENTION_THRESHOLD_PEN,
  forcesNonTaxed,
  NON_TAXED_OPERATION,
  type Purchase,
  type PurchaseKind,
} from "../../domain/purchase.types";
import { AllocationTab } from "./allocation-tab";
import {
  applyPurchaseFieldErrors,
  filledLines,
  firstIncompleteLine,
  isBlankLine,
  lineAmount,
  lineIndexMap,
  manualAllocationsFrom,
  round2,
  tabOfField,
  toAdditionalCostInput,
  toExpenseInput,
  toMerchandiseInput,
  usesItemLines,
  type DocumentFormValues,
  type DocumentLineValues,
  type DocumentTabKey,
  type InstallmentValues,
} from "./document-model";
import { DocumentTotals } from "./document-totals";
import { HeaderFields } from "./header-fields";
import { lineCellId, LinesGrid } from "./lines-grid";
import { AccountSearchModal, ProductSearchModal } from "./lookup-modals";
import { ObservationsModal, OtherOptionsModal } from "./other-options-modal";
import { PaymentTab } from "./payment-tab";
import { PerceptionTab } from "./perception-tab";
import { ReceptionTab } from "./reception-tab";
import { useDocumentPreview } from "./use-document-preview";

const SUCCESS_LABEL: Record<PurchaseKind, string> = {
  merchandise: "Compra registrada",
  expense: "Gasto registrado",
  additional_cost: "Costo adicional registrado",
};

/** Campos que no afectan el cálculo: cambiarlos no relanza el preview. */
const NON_CALC_FIELDS = new Set([
  "series",
  "number",
  "supplierId",
  "beneficiaryDocument",
  "beneficiaryName",
  "accountingDate",
  "receptionDate",
  "receptionId",
  "receptionNumber",
  "paymentTerm",
  "creditDays",
  "accountingCategoryCode",
  "goodsServicesClass",
  "observations",
  "treasuryAccountId",
  "paymentMethod",
  "paymentReference",
  "installments",
  "modifiedDocumentType",
  "modifiedSeries",
  "modifiedNumber",
  "modifiedIssueDate",
  "defaultWarehouseId",
]);

interface PurchaseDocumentFormProps {
  kind: PurchaseKind;
  /** La pantalla está visible: activa atajos de teclado. */
  active: boolean;
  onDone: (purchase: Purchase) => void;
  onCancel: () => void;
}

function initialValues(kind: PurchaseKind): Partial<DocumentFormValues> {
  const today = dayjs();
  return {
    documentType: "01",
    currency: "PEN",
    paymentTerm: "cash",
    creditDays: 0,
    issueDate: today,
    accountingDate: today,
    receptionDate: today,
    defaultOperationType: "taxed_taxed",
    pricesIncludeTax: true,
    accountingCategoryCode: "invoices_payable",
    paymentMethod: "cash",
    iscAmount: 0,
    discountAmount: 0,
    allocationMethod: kind === "additional_cost" ? "by_quantity" : undefined,
    targetPurchaseIds: [],
    manualAllocations: {},
    installments: [],
    lines: [{ operationType: "taxed_taxed", quantity: undefined }],
  };
}

/**
 * Comprobante de Compra al estilo SiempreSoft (mercadería, gastos y costo adicional):
 * pestañas de cabecera + grilla de detalle + bloque de totales + Aceptar / Cancelar.
 */
export function PurchaseDocumentForm({ kind, active, onDone, onCancel }: PurchaseDocumentFormProps) {
  const [form] = Form.useForm<DocumentFormValues>();
  const { message, modal } = App.useApp();
  const formName = `purchaseDoc_${kind}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const items = usesItemLines(kind);

  const [initial] = useState(() => initialValues(kind));
  const [tab, setTab] = useState<DocumentTabKey>("general");
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [search, setSearch] = useState<{ index: number | null; query: string } | null>(null);
  const hydrated = useHydrated();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [observationsOpen, setObservationsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<{ message: string; details: string[] } | null>(null);
  const retentionTouched = useRef(false);
  const confirmOpen = useRef(false);
  const manualMatchesRef = useRef(false);
  const previousIssueDate = useRef(initial.issueDate);
  const pendingLookup = useRef<string | null>(null);

  const createMerchandise = useCreatePurchase();
  const createExpense = useCreateExpensePurchase();
  const createAdditionalCost = useCreateAdditionalCostPurchase();
  const submitting = createMerchandise.isPending || createExpense.isPending || createAdditionalCost.isPending;

  const { preview, error: previewError, loading: previewLoading, run, schedule, setManualMatches } =
    useDocumentPreview(form, kind);

  const { data: operationTypes } = usePurchaseOperationTypes();
  const { data: paymentTerms } = usePaymentTerms();
  const { data: warehousesPage } = useWarehouses({ page: 1, perPage: 200, status: "active" });
  const { data: categories } = useCategories();
  const { data: treasuryAccounts } = useTreasuryAccounts(true);

  const currency = Form.useWatch("currency", form) ?? "PEN";
  const documentType = Form.useWatch("documentType", form);
  const paymentTerm = Form.useWatch("paymentTerm", form);
  const watchedLines = Form.useWatch("lines", form) as DocumentLineValues[] | undefined;
  const allocationMethod = Form.useWatch("allocationMethod", form);
  const manualAllocations = Form.useWatch("manualAllocations", form);
  const targetPurchaseIds = Form.useWatch("targetPurchaseIds", form);

  const operationLocked = forcesNonTaxed(documentType);
  const childOpen = Boolean(search) || optionsOpen || observationsOpen;
  const hotkeysEnabled = active && !childOpen;

  useEnterToNextField(containerRef, hotkeysEnabled);

  const documentTypeOptions = useMemo(() => documentTypeOptionsFor(kind), [kind]);
  const operationOptions = useMemo(
    () => (operationTypes ?? []).map((o) => ({ value: o.value, label: o.label })),
    [operationTypes],
  );
  const warehouseOptions = useMemo(
    () => (warehousesPage?.items ?? []).map((w) => ({ value: w.id, label: w.name })),
    [warehousesPage],
  );
  const paymentTermOptions = useMemo(
    () => (paymentTerms ?? []).map((t) => ({ value: t.value, label: t.label })),
    [paymentTerms],
  );
  const categoryOptions = useMemo(
    () =>
      (categories ?? [])
        .filter((c) => c.active)
        .map((c) => ({ value: c.code, label: `${c.name} (${c.account_code})` })),
    [categories],
  );
  const accountsInCurrency = useMemo(
    () => (treasuryAccounts ?? []).filter((a) => a.active && a.currency === currency),
    [treasuryAccounts, currency],
  );

  const linesTotal = useMemo(
    () => round2((watchedLines ?? []).reduce((acc, line) => acc + lineAmount(line, kind), 0)),
    [watchedLines, kind],
  );

  // ---- defaults que dependen de catálogos -------------------------------------------------------

  useEffect(() => {
    if (!items || !warehousesPage?.items.length || form.getFieldValue("defaultWarehouseId")) return;
    const main = warehousesPage.items.find((w) => w.type === "main") ?? warehousesPage.items[0];
    form.setFieldValue("defaultWarehouseId", main.id);
    const lines = (form.getFieldValue("lines") ?? []) as DocumentLineValues[];
    form.setFieldValue(
      "lines",
      lines.map((l) => ({ ...l, warehouseId: l.warehouseId ?? main.id })),
    );
  }, [items, warehousesPage, form]);

  // Caja por defecto: primera activa en la moneda del documento.
  useEffect(() => {
    if (paymentTerm !== "cash" || !treasuryAccounts) return;
    const current = form.getFieldValue("treasuryAccountId") as string | undefined;
    if (current && accountsInCurrency.some((a) => a.id === current)) return;
    const first = accountsInCurrency[0];
    form.setFieldValue("treasuryAccountId", first?.id);
    if (first) form.setFieldValue("paymentMethod", first.type === "bank" ? "transfer" : "cash");
  }, [paymentTerm, currency, treasuryAccounts, accountsInCurrency, form]);

  // Retención 4ta sugerida (recibo por honorarios): 8 % si el total supera S/ 1,500.
  useEffect(() => {
    if (kind !== "expense" || documentType !== FEE_RECEIPT_DOCUMENT || !preview || retentionTouched.current) return;
    const suggested = Number(preview.totals.total_pen) > FEE_RETENTION_THRESHOLD_PEN ? FEE_RETENTION_DEFAULT_PERCENT : 0;
    if (form.getFieldValue("retentionPercent") !== suggested) {
      form.setFieldValue("retentionPercent", suggested);
      schedule();
    }
  }, [kind, documentType, preview, form, schedule]);

  // Reparto manual: el preview usa los montos manuales solo cuando cuadran con el monto a repartir.
  useEffect(() => {
    if (kind !== "additional_cost") return;
    const toAllocate = preview?.amountToAllocatePen != null ? Number(preview.amountToAllocatePen) : null;
    const sum = round2(
      manualAllocationsFrom({ manualAllocations, targetPurchaseIds }).reduce((acc, r) => acc + r.amountPen, 0),
    );
    const matches = allocationMethod === "manual" && toAllocate != null && sum > 0 && Math.abs(sum - toAllocate) < 0.005;
    if (matches !== manualMatchesRef.current) {
      manualMatchesRef.current = matches;
      setManualMatches(matches);
      schedule();
    }
  }, [kind, preview, manualAllocations, targetPurchaseIds, allocationMethod, setManualMatches, schedule]);

  // ---- líneas ---------------------------------------------------------------------------------

  const getLines = useCallback(() => (form.getFieldValue("lines") ?? []) as DocumentLineValues[], [form]);

  const blankLine = useCallback((): DocumentLineValues => {
    const forced = forcesNonTaxed(form.getFieldValue("documentType"));
    return {
      operationType: forced ? NON_TAXED_OPERATION : form.getFieldValue("defaultOperationType"),
      warehouseId: items ? form.getFieldValue("defaultWarehouseId") : undefined,
    };
  }, [form, items]);

  /** Siempre queda una fila en blanco al final (la fila "*" de SiempreSoft). */
  const ensureTrailingBlank = useCallback(() => {
    const lines = getLines();
    if (!lines.length || !isBlankLine(lines[lines.length - 1], kind)) {
      form.setFieldValue("lines", [...lines, blankLine()]);
    }
  }, [getLines, kind, form, blankLine]);

  const focusCell = useCallback(
    (index: number, field: keyof DocumentLineValues) => {
      setTimeout(() => {
        const el = document.getElementById(lineCellId(formName, index, field)) as HTMLInputElement | null;
        el?.focus();
        el?.select?.();
      }, 60);
    },
    [formName],
  );

  const applyProduct = useCallback(
    (index: number, product: Product) => {
      const line = getLines()[index] ?? {};
      const forced = forcesNonTaxed(form.getFieldValue("documentType"));
      form.setFieldValue(["lines", index], {
        ...line,
        productId: product.id,
        productCode: product.code,
        productDescription: product.description,
        unitOfMeasure: product.unit_of_measure,
        operationType: forced
          ? NON_TAXED_OPERATION
          : product.default_operation_type || form.getFieldValue("defaultOperationType"),
        warehouseId: line.warehouseId || form.getFieldValue("defaultWarehouseId"),
        quantity: line.quantity || 1,
      });
      ensureTrailingBlank();
      setSelectedLine(index);
      focusCell(index, "quantity");
      schedule();
    },
    [getLines, form, ensureTrailingBlank, focusCell, schedule],
  );

  const applyAccount = useCallback(
    (index: number, account: Account) => {
      const line = getLines()[index] ?? {};
      const forced = forcesNonTaxed(form.getFieldValue("documentType"));
      form.setFieldValue(["lines", index], {
        ...line,
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        description: line.description?.trim() ? line.description : account.name.toUpperCase(),
        operationType: forced ? NON_TAXED_OPERATION : line.operationType || form.getFieldValue("defaultOperationType"),
      });
      ensureTrailingBlank();
      setSelectedLine(index);
      focusCell(index, "description");
      schedule();
    },
    [getLines, form, ensureTrailingBlank, focusCell, schedule],
  );

  const targetIndexForNew = useCallback(() => {
    const lines = getLines();
    const blank = lines.findIndex((l) => isBlankLine(l, kind));
    return blank >= 0 ? blank : lines.length;
  }, [getLines, kind]);

  const onCodeCommit = useCallback(
    async (index: number, rawCode: string) => {
      const code = rawCode.trim();
      const line = getLines()[index];
      if (!code || !line || (items ? line.productId : line.accountId)) return;
      // Enter y blur llegan juntos: una sola búsqueda por fila/código.
      const lookupKey = `${index}:${code}`;
      if (pendingLookup.current === lookupKey) return;
      pendingLookup.current = lookupKey;
      try {
        if (items) {
          const page = await productsApi.list({ search: code, status: "active", page: 1, perPage: 10 });
          const exact = page.items.find((p) => p.code.toLowerCase() === code.toLowerCase());
          const match = exact ?? (page.items.length === 1 ? page.items[0] : undefined);
          if (match) applyProduct(index, match);
          else setSearch({ index, query: code });
        } else {
          const page = await accountsApi.list({ search: code, only_leaves: true, only_active: true, page: 1, perPage: 10 });
          const exact = page.items.find((a) => a.code === code);
          if (exact) applyAccount(index, exact);
          else setSearch({ index, query: code });
        }
      } catch {
        setSearch({ index, query: code });
      } finally {
        pendingLookup.current = null;
      }
    },
    [getLines, items, applyProduct, applyAccount],
  );

  const openSearch = useCallback(() => {
    const lines = getLines();
    const index = selectedLine != null && isBlankLine(lines[selectedLine], kind) ? selectedLine : null;
    setSearch({ index, query: "" });
  }, [getLines, selectedLine, kind]);

  const onSearchPick = (item: Product | Account, keepOpen: boolean) => {
    const index = search?.index ?? targetIndexForNew();
    if (items) applyProduct(index, item as Product);
    else applyAccount(index, item as Account);
    if (keepOpen) setSearch((s) => (s ? { ...s, index: null } : s));
    else setSearch(null);
  };

  const deleteSelected = () => {
    if (selectedLine == null) return;
    const lines = getLines().filter((_, i) => i !== selectedLine);
    form.setFieldValue("lines", lines);
    ensureTrailingBlank();
    setSelectedLine(lines.length ? Math.min(selectedLine, lines.length - 1) : null);
    schedule();
  };

  // ---- cambios de cabecera ----------------------------------------------------------------------

  const onValuesChange = (changed: Partial<DocumentFormValues>, all: DocumentFormValues) => {
    if ("documentType" in changed) {
      const forced = forcesNonTaxed(changed.documentType);
      const isFee = changed.documentType === FEE_RECEIPT_DOCUMENT;
      if (forced) {
        form.setFieldValue("defaultOperationType", NON_TAXED_OPERATION);
        form.setFieldValue("pricesIncludeTax", true);
        form.setFieldValue(
          "lines",
          getLines().map((l) => ({ ...l, operationType: NON_TAXED_OPERATION })),
        );
      }
      const category = form.getFieldValue("accountingCategoryCode");
      if (isFee) {
        form.setFieldValue("accountingCategoryCode", "fees_payable");
        form.setFieldValue("perceptionAmount", undefined);
      } else if (category === "fees_payable" || !category) {
        form.setFieldValue("accountingCategoryCode", "invoices_payable");
      }
      if (!isFee) form.setFieldValue("retentionPercent", undefined);
      retentionTouched.current = false;
    }
    if ("defaultOperationType" in changed && !forcesNonTaxed(all.documentType)) {
      form.setFieldValue(
        "lines",
        getLines().map((l) => ({ ...l, operationType: changed.defaultOperationType })),
      );
    }
    if ("defaultWarehouseId" in changed) {
      form.setFieldValue(
        "lines",
        getLines().map((l) => ({ ...l, warehouseId: changed.defaultWarehouseId })),
      );
    }
    if ("issueDate" in changed && changed.issueDate) {
      const prev = previousIssueDate.current;
      if (!all.accountingDate || (prev && all.accountingDate.isSame(prev, "day"))) {
        form.setFieldValue("accountingDate", changed.issueDate);
      }
      if (kind === "merchandise" && (!all.receptionDate || (prev && all.receptionDate.isSame(prev, "day")))) {
        form.setFieldValue("receptionDate", changed.issueDate);
      }
      previousIssueDate.current = changed.issueDate;
    }
    if ("paymentTerm" in changed && changed.paymentTerm === "cash") {
      form.setFieldValue("creditDays", 0);
    }
    if ("lines" in changed) ensureTrailingBlank();
    if (submitError) setSubmitError(null);

    if (Object.keys(changed).some((key) => !NON_CALC_FIELDS.has(key))) schedule();
  };

  const onSupplierChange = (supplier: Supplier | null) => {
    if (form.getFieldValue("purchaseOrderId")) form.setFieldValue("purchaseOrderId", undefined);
    if (!supplier) return;
    form.setFieldValue("paymentTerm", supplier.payment_term);
    form.setFieldValue("creditDays", supplier.payment_term === "cash" ? 0 : supplier.credit_days);
  };

  const onPickOrder = (order: PurchaseOrder | null) => {
    if (!order) return;
    const forced = forcesNonTaxed(form.getFieldValue("documentType"));
    const operationType = forced ? NON_TAXED_OPERATION : form.getFieldValue("defaultOperationType");
    const lines: DocumentLineValues[] = order.lines
      .map((l) => {
        const received = Number(l.received_quantity);
        const quantity = received > 0 ? received : Number(l.pending_quantity);
        return {
          productId: l.product_id,
          productCode: l.product_code,
          productDescription: l.product_description,
          unitOfMeasure: l.unit_of_measure ?? undefined,
          warehouseId: order.warehouse_id,
          quantity,
          unitPrice: Number(l.unit_price),
          operationType,
          purchaseOrderLineNumber: l.line_number,
        };
      })
      .filter((l) => l.quantity > 0);
    form.setFieldsValue({
      purchaseOrderId: order.id,
      defaultWarehouseId: order.warehouse_id,
      currency: order.currency,
      pricesIncludeTax: order.prices_include_tax,
      paymentTerm: order.payment_term,
      creditDays: order.payment_term === "cash" ? 0 : order.credit_days,
      lines,
    });
    ensureTrailingBlank();
    message.success(`O/C ${order.order_number}: ${lines.length} línea(s) cargadas`);
    schedule();
  };

  // ---- aceptar / cancelar --------------------------------------------------------------------

  const jumpTo = (target: DocumentTabKey | "options") => {
    if (target === "options") setOptionsOpen(true);
    else setTab(target === "reception" && kind === "expense" ? "general" : target);
  };

  const submit = async () => {
    if (submitting) return;
    try {
      await form.validateFields();
    } catch (err) {
      const first = (err as { errorFields?: { name: (string | number)[] }[] }).errorFields?.[0];
      if (first) jumpTo(tabOfField(first.name));
      return;
    }
    const values = form.getFieldsValue(true) as DocumentFormValues;
    if (!filledLines(values, kind).length) {
      message.warning(items ? "Agrega al menos un artículo (F2 para buscar)" : "Agrega al menos una cuenta (F2 para buscar)");
      return;
    }
    const incomplete = firstIncompleteLine(values, kind);
    if (incomplete) {
      setSelectedLine(incomplete - 1);
      message.warning(
        items
          ? `Completa artículo, cantidad y precio en la línea ${incomplete}`
          : `Completa cuenta, descripción e importe en la línea ${incomplete}`,
      );
      return;
    }
    if (kind === "additional_cost" && values.allocationMethod === "manual" && !manualMatchesRef.current) {
      setTab("reception");
      message.warning("El reparto manual debe sumar exactamente el monto a repartir (PEN)");
      return;
    }
    const installments = (values.installments ?? []).filter((i: InstallmentValues) => i?.dueDate && i.amount);
    if (values.paymentTerm !== "cash" && installments.length) {
      const fresh = await run();
      const sum = round2(installments.reduce((acc, i) => acc + (i.amount ?? 0), 0));
      if (fresh && Math.abs(sum - Number(fresh.charges.payable)) >= 0.005) {
        setTab("payment");
        message.warning("Las cuotas deben sumar el Neto a pagar");
        return;
      }
    }

    const onSuccess = (purchase: Purchase) => {
      message.success(`${SUCCESS_LABEL[kind]} · correlativo ${purchase.registration_code ?? "—"}`);
      onDone(purchase);
    };
    const onError = (error: unknown) => {
      const { unmapped, tab: errorTab } = applyPurchaseFieldErrors(form, error, lineIndexMap(values, kind));
      setSubmitError({ message: ApiError.from(error).message, details: unmapped });
      if (errorTab) jumpTo(errorTab);
    };

    if (kind === "merchandise") createMerchandise.mutate(toMerchandiseInput(values), { onSuccess, onError });
    else if (kind === "expense") createExpense.mutate(toExpenseInput(values), { onSuccess, onError });
    else createAdditionalCost.mutate(toAdditionalCostInput(values), { onSuccess, onError });
  };

  const requestCancel = () => {
    if (confirmOpen.current) return;
    if (!form.isFieldsTouched()) {
      onCancel();
      return;
    }
    confirmOpen.current = true;
    modal.confirm({
      title: "¿Descartar el comprobante?",
      content: "Se perderán los datos ingresados.",
      okText: "Descartar",
      okButtonProps: { danger: true },
      cancelText: "Seguir editando",
      onOk: onCancel,
      afterClose: () => {
        confirmOpen.current = false;
      },
    });
  };

  const calculate = async () => {
    const result = await run();
    if (!result) message.info(items ? "Completa artículo, cantidad y precio para calcular" : "Completa cuenta, descripción e importe para calcular");
  };

  useHotkeys(
    {
      F2: openSearch,
      F9: () => void calculate(),
      F10: () => void submit(),
      CtrlEnter: () => void submit(),
    },
    hotkeysEnabled,
  );

  // Esc = Cancelar. En captura, para no robarle el Esc a un desplegable abierto.
  useEffect(() => {
    if (!hotkeysEnabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || confirmOpen.current) return;
      const target = event.target as HTMLElement | null;
      if (target?.getAttribute("aria-expanded") === "true") return;
      if (document.querySelector(".ant-picker-dropdown:not(.ant-picker-dropdown-hidden)")) return;
      event.preventDefault();
      requestCancel();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  });

  // ---- render ---------------------------------------------------------------------------------

  const payable = preview ? Number(preview.charges.payable) : null;
  const showRetention = kind === "expense" && documentType === FEE_RECEIPT_DOCUMENT;
  const searchLabel = items ? "<<Buscar Artículos..." : "<<Buscar Cuentas...";
  const lines = watchedLines ?? [];
  const canDelete = selectedLine != null && selectedLine < lines.length && !isBlankLine(lines[selectedLine], kind);

  const tabs = [
    {
      key: "general",
      label: "Información General",
      forceRender: true,
      children: (
        <HeaderFields
          form={form}
          kind={kind}
          documentTypeOptions={documentTypeOptions}
          operationOptions={operationOptions}
          warehouseOptions={warehouseOptions}
          paymentTermOptions={paymentTermOptions}
          categoryOptions={categoryOptions}
          exchangeRate={preview?.exchangeRate}
          onSupplierChange={onSupplierChange}
        />
      ),
    },
    ...(kind === "merchandise"
      ? [{ key: "reception", label: "Recepción", forceRender: true, children: <ReceptionTab form={form} onPickOrder={onPickOrder} /> }]
      : kind === "additional_cost"
        ? [{ key: "reception", label: "Recepción y reparto", forceRender: true, children: <AllocationTab form={form} preview={preview} /> }]
        : []),
    {
      key: "payment",
      label: "Pago",
      forceRender: true,
      children: <PaymentTab form={form} accounts={accountsInCurrency} payable={payable} />,
    },
    {
      key: "perception",
      label: kind === "expense" ? "Percepción / Retención" : "Percepción",
      forceRender: true,
      children: (
        <PerceptionTab
          form={form}
          kind={kind}
          preview={preview}
          onRetentionTouched={() => {
            retentionTouched.current = true;
          }}
        />
      ),
    },
  ];

  return (
    <div ref={containerRef}>
      <Form<DocumentFormValues>
        form={form}
        name={formName}
        layout="horizontal"
        size="small"
        labelCol={{ flex: "130px" }}
        wrapperCol={{ flex: 1 }}
        labelWrap
        colon={false}
        initialValues={initial}
        onValuesChange={onValuesChange}
        onFinish={() => void submit()}
        scrollToFirstError={false}
      >
        {submitError && (
          <Alert
            type="error"
            showIcon
            closable={{ onClose: () => setSubmitError(null) }}
            style={{ marginBottom: 8 }}
            title={submitError.message}
            description={
              submitError.details.length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {submitError.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : undefined
            }
          />
        )}

        <Tabs
          size="small"
          activeKey={tab}
          onChange={(key) => setTab(key as DocumentTabKey)}
          items={tabs}
          style={{ marginBottom: 0 }}
        />

        <Divider titlePlacement="start" plain style={{ margin: "4px 0 8px" }}>
          Detalle
        </Divider>
        <LinesGrid
          form={form}
          kind={kind}
          operationOptions={operationOptions}
          warehouseOptions={warehouseOptions}
          operationLocked={operationLocked}
          selectedIndex={selectedLine}
          onSelect={setSelectedLine}
          onCodeCommit={(index, code) => void onCodeCommit(index, code)}
        />

        <Flex gap={12} align="flex-start" wrap style={{ marginTop: 8 }}>
          <Flex vertical gap={6} style={{ minWidth: 190 }}>
            <Tooltip title="F2">
              <Button icon={<SearchOutlined />} onClick={openSearch}>
                {searchLabel} (F2)
              </Button>
            </Tooltip>
            <Button icon={<DeleteOutlined />} onClick={deleteSelected} disabled={!canDelete}>
              Eliminar
            </Button>
            <Typography.Text type="secondary" style={{ fontSize: 11, maxWidth: 200 }}>
              Digite el {items ? "código del artículo" : "código de cuenta"} y presione Enter.
            </Typography.Text>
          </Flex>
          <div style={{ flex: 1, minWidth: 320 }}>
            <DocumentTotals
              preview={preview}
              linesTotal={linesTotal}
              currency={currency}
              loading={previewLoading}
              error={previewError}
              showRetention={showRetention}
            />
          </div>
        </Flex>

        <Flex justify="space-between" align="center" wrap gap={8} style={{ marginTop: 12 }}>
          <Flex gap={8}>
            <Button onClick={() => setOptionsOpen(true)}>&lt;&lt;Otras Opciones...</Button>
            <Button onClick={() => setObservationsOpen(true)}>Observaciones...</Button>
          </Flex>
          <Flex gap={8}>
            <Tooltip title="Recalcular totales (F9)">
              <Button icon={<CalculatorOutlined />} onClick={() => void calculate()} loading={previewLoading}>
                Calcular (F9)
              </Button>
            </Tooltip>
            <Tooltip title="Registrar el comprobante (F10 o Ctrl+Enter)">
              <Button type="primary" onClick={() => void submit()} loading={submitting}>
                Aceptar (F10)
              </Button>
            </Tooltip>
            <Tooltip title="Cerrar sin registrar (Esc)">
              <Button onClick={requestCancel}>Cancelar (Esc)</Button>
            </Tooltip>
          </Flex>
        </Flex>

        {hydrated && (
          <>
            <OtherOptionsModal form={form} open={optionsOpen} onClose={() => setOptionsOpen(false)} />
            <ObservationsModal open={observationsOpen} onClose={() => setObservationsOpen(false)} />
          </>
        )}
      </Form>

      {search &&
        (items ? (
          <ProductSearchModal initialQuery={search.query} onPick={onSearchPick} onClose={() => setSearch(null)} />
        ) : (
          <AccountSearchModal initialQuery={search.query} onPick={onSearchPick} onClose={() => setSearch(null)} />
        ))}
    </div>
  );
}
