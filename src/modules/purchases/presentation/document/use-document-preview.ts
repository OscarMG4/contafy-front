"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormInstance } from "antd";

import { ApiError } from "@/core/http/api-error";

import type {
  AdditionalCostPurchasePreview,
  CostAllocation,
  PurchaseCharges,
  PurchaseKind,
  PurchaseTotals,
} from "../../domain/purchase.types";
import { purchasesApi } from "../../infrastructure/purchases.api";
import { toPreviewInput, type DocumentFormValues } from "./document-model";

export interface DocumentPreview {
  totals: PurchaseTotals;
  charges: PurchaseCharges;
  exchangeRate: string;
  amountToAllocatePen?: string;
  allocations?: CostAllocation[];
  /** true si el reparto mostrado es el manual (cuadrado) y no uno provisional por cantidad. */
  manualApplied?: boolean;
}

const DEBOUNCE_MS = 400;

/**
 * Totales del comprobante calculados por el back (endpoint preview), con debounce.
 * Ignora respuestas viejas si el usuario siguió escribiendo.
 */
export function useDocumentPreview(form: FormInstance<DocumentFormValues>, kind: PurchaseKind) {
  const [preview, setPreview] = useState<DocumentPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualMatches = useRef(false);

  const run = useCallback(async (): Promise<DocumentPreview | null> => {
    if (timer.current) clearTimeout(timer.current);
    const values = form.getFieldsValue(true) as DocumentFormValues;
    const request = toPreviewInput(values, kind, manualMatches.current);
    const id = ++seq.current;
    if (!request) {
      setPreview(null);
      setError(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    try {
      let result: DocumentPreview;
      if (request.kind === "merchandise") {
        const data = await purchasesApi.preview(request.input as Parameters<typeof purchasesApi.preview>[0]);
        result = { totals: data.totals, charges: data.charges, exchangeRate: data.exchange_rate };
      } else if (request.kind === "expense") {
        const data = await purchasesApi.previewExpense(
          request.input as Parameters<typeof purchasesApi.previewExpense>[0],
        );
        result = { totals: data.totals, charges: data.charges, exchangeRate: data.exchange_rate };
      } else {
        const input = request.input as Parameters<typeof purchasesApi.previewAdditionalCost>[0];
        const data: AdditionalCostPurchasePreview = await purchasesApi.previewAdditionalCost(input);
        result = {
          totals: data.totals,
          charges: data.charges,
          exchangeRate: data.exchange_rate,
          amountToAllocatePen: data.amount_to_allocate_pen,
          allocations: data.allocations,
          manualApplied: input.allocationMethod === "manual",
        };
      }
      if (id !== seq.current) return result;
      setPreview(result);
      setError(null);
      return result;
    } catch (err) {
      if (id === seq.current) setError(ApiError.from(err).message);
      return null;
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [form, kind]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void run(), DEBOUNCE_MS);
  }, [run]);

  /** El formulario avisa si el reparto manual ya cuadra con el monto a repartir. */
  const setManualMatches = useCallback((value: boolean) => {
    manualMatches.current = value;
  }, []);

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    seq.current++;
    setPreview(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { preview, error, loading, run, schedule, reset, setManualMatches };
}
