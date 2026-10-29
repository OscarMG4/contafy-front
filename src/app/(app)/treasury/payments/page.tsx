import { Suspense } from "react";

import { SupplierPaymentsView } from "@/modules/treasury/presentation/supplier-payments-view";

/** La vista lee ?supplier_id= con useSearchParams: va dentro de Suspense. */
export default function SupplierPaymentsPage() {
  return (
    <Suspense>
      <SupplierPaymentsView />
    </Suspense>
  );
}
