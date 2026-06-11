import { api } from '@/services/api'
import type { ApiResponse } from '@/types/api'
import type {
  AllocateCustomerDepositPayload,
  AvailableCustomerDepositsResponse,
  SalesReceiptCustomerContext,
} from './types'

export type AvailableCustomerDepositParams = {
  customer_id: string | number
  sales_order_id?: string | number | null
  sales_invoice_id?: string | number | null
}

export async function getAvailableCustomerDeposits(params: AvailableCustomerDepositParams) {
  const response = await api.get<ApiResponse<AvailableCustomerDepositsResponse>>('/sales/customer-deposits/available', { params })
  return response.data.data
}

export async function allocateCustomerDepositToInvoice(
  depositId: string | number,
  invoiceId: string | number,
  payload: AllocateCustomerDepositPayload,
) {
  const response = await api.post<ApiResponse<unknown>>(
    `/sales/customer-deposits/${depositId}/allocate-to-invoice/${invoiceId}`,
    payload,
  )
  return response.data.data
}

export async function getSalesReceiptCustomerContext(customerId: string | number) {
  const response = await api.get<ApiResponse<SalesReceiptCustomerContext>>('/sales/receipts/customer-context', {
    params: { customer_id: customerId },
  })
  return response.data.data
}
