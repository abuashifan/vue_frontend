export type VendorDepositMatchStrength = 'purchase_order' | 'vendor_only'

export type AvailableVendorDeposit = {
  id: number
  deposit_number: string
  deposit_date: string | null
  vendor_id: number
  amount: number
  allocated_amount: number
  remaining_amount: number
  purchase_order_id?: number | null
  purchase_order_number?: string | null
  match_strength: VendorDepositMatchStrength
}

export type OpenVendorBill = {
  bill_id: number
  bill_number: string
  bill_date?: string | null
  due_date?: string | null
  vendor_id: number
  vendor_name?: string | null
  grand_total: number
  paid_amount: number
  returned_amount?: number
  balance_due: number
  status: string
}

export type AvailableVendorDepositsResponse = {
  vendor_id: number
  unapplied_total: number
  deposits: AvailableVendorDeposit[]
}

export type VendorPaymentContext = {
  vendor_id: number
  gross_ap_outstanding: number
  official_ap_balance: number
  unapplied_deposit_total: number
  net_vendor_exposure: number
  open_bills: OpenVendorBill[]
  available_deposits: AvailableVendorDeposit[]
}

export type AllocateVendorDepositPayload = {
  allocated_amount: number
  allocation_date?: string
  source_context?: 'vendor_bill' | 'vendor_payment'
  notes?: string
}
