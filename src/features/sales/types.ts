export type CustomerDepositMatchStrength = 'sales_order' | 'customer_only'

export type AvailableCustomerDeposit = {
  id: number
  deposit_number: string
  deposit_date: string | null
  customer_id: number
  amount: number
  allocated_amount: number
  remaining_amount: number
  sales_order_id?: number | null
  sales_order_number?: string | null
  match_strength: CustomerDepositMatchStrength
}

export type OpenSalesInvoice = {
  invoice_id: number
  invoice_number: string
  invoice_date?: string | null
  due_date?: string | null
  customer_id: number
  customer_name?: string | null
  grand_total: number
  paid_amount: number
  returned_amount?: number
  balance_due: number
  status: string
}

export type AvailableCustomerDepositsResponse = {
  customer_id: number
  unapplied_total: number
  deposits: AvailableCustomerDeposit[]
}

export type SalesReceiptCustomerContext = {
  customer_id: number
  gross_ar_outstanding: number
  official_ar_balance: number
  unapplied_deposit_total: number
  net_customer_exposure: number
  open_invoices: OpenSalesInvoice[]
  available_deposits: AvailableCustomerDeposit[]
}

export type AllocateCustomerDepositPayload = {
  allocated_amount: number
  allocation_date?: string
  source_context?: 'sales_invoice' | 'sales_receipt'
  notes?: string
}
