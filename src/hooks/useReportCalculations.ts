"use client";

import { useMemo } from "react";

interface ReportInputs {
  tax_preparation_fees: number;
  bookkeeping_fees: number;
  insurance_commissions: number;
  notary_copy_fax_fees: number;
  translation_document_fees: number;
  other_service_fees: number;
  royalty_percentage: number;
  advertising_percentage: number;
}

export function useReportCalculations(inputs: ReportInputs) {
  return useMemo(() => {
    const total_gross =
      inputs.tax_preparation_fees +
      inputs.bookkeeping_fees +
      inputs.insurance_commissions +
      inputs.notary_copy_fax_fees +
      inputs.translation_document_fees +
      inputs.other_service_fees;

    const royalty_fee = total_gross * inputs.royalty_percentage;
    const advertising_fee = total_gross * inputs.advertising_percentage;
    const total_fees_due = royalty_fee + advertising_fee;
    const total_percentage =
      inputs.royalty_percentage + inputs.advertising_percentage;

    return {
      total_gross,
      royalty_fee,
      advertising_fee,
      total_fees_due,
      total_percentage,
    };
  }, [
    inputs.tax_preparation_fees,
    inputs.bookkeeping_fees,
    inputs.insurance_commissions,
    inputs.notary_copy_fax_fees,
    inputs.translation_document_fees,
    inputs.other_service_fees,
    inputs.royalty_percentage,
    inputs.advertising_percentage,
  ]);
}
