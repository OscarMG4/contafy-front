"use client";

import { Card } from "antd";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/shared/ui/page-header";

import { DOCUMENT_TITLES } from "./document/purchase-document-modal";
import { PurchaseDocumentForm } from "./document/purchase-document-form";

/** Costo adicional (flete, estiba...) en pantalla completa: se reparte a compras de mercadería. */
export function AdditionalCostPurchaseForm() {
  const router = useRouter();
  const back = () => router.push("/purchases");

  return (
    <>
      <PageHeader
        eyebrow="Compras"
        title={DOCUMENT_TITLES.additional_cost}
        subtitle="Flete u otro servicio vinculado a mercadería · ajuste de kardex sin unidades"
      />
      <Card size="small">
        <PurchaseDocumentForm kind="additional_cost" active onCancel={back} onDone={back} />
      </Card>
    </>
  );
}
