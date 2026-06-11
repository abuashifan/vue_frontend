import { api } from '@/services/api'
import type { ApiResponse } from '@/types/api'
import type {
  AllocateVendorDepositPayload,
  AvailableVendorDepositsResponse,
  VendorPaymentContext,
} from './types'

export type AvailableVendorDepositParams = {
  vendor_id: string | number
  purchase_order_id?: string | number | null
  vendor_bill_id?: string | number | null
}

export async function getAvailableVendorDeposits(params: AvailableVendorDepositParams) {
  const response = await api.get<ApiResponse<AvailableVendorDepositsResponse>>('/purchase/vendor-deposits/available', { params })
  return response.data.data
}

export async function allocateVendorDepositToBill(
  depositId: string | number,
  billId: string | number,
  payload: AllocateVendorDepositPayload,
) {
  const response = await api.post<ApiResponse<unknown>>(
    `/purchase/vendor-deposits/${depositId}/allocate-to-bill/${billId}`,
    payload,
  )
  return response.data.data
}

export async function getVendorPaymentContext(vendorId: string | number) {
  const response = await api.get<ApiResponse<VendorPaymentContext>>('/purchase/payments/vendor-context', {
    params: { vendor_id: vendorId },
  })
  return response.data.data
}
