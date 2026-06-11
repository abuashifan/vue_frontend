<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Landmark, RefreshCw, WalletCards } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import { usePermission } from '@/composables/usePermission'
import { toMoney } from '@/utils/money'
import {
  allocateCustomerDepositToInvoice,
  getAvailableCustomerDeposits,
  getSalesReceiptCustomerContext,
} from '@/features/sales/api'
import type { AvailableCustomerDeposit, OpenSalesInvoice } from '@/features/sales/types'

const props = defineProps<{
  customerId: string | number | null
  invoiceId?: string | number | null
  invoiceBalanceDue?: string | number | null
  salesOrderId?: string | number | null
  mode: 'invoice' | 'receipt'
  readonly?: boolean
  documentStatus?: string | null
}>()

const emit = defineEmits<{
  applied: [payload: { invoiceId: string | number; remainingBalance: number }]
  skipped: []
}>()

const { can } = usePermission()
const loading = ref(false)
const applying = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const skipped = ref(false)
const unappliedTotal = ref(0)
const deposits = ref<AvailableCustomerDeposit[]>([])
const openInvoices = ref<OpenSalesInvoice[]>([])
const selectedDepositId = ref<string>('')
const selectedInvoiceId = ref<string>('')
const applyAmount = ref<number>(0)

const selectedDeposit = computed(() => deposits.value.find((deposit) => String(deposit.id) === selectedDepositId.value) ?? null)
const selectedInvoice = computed(() => openInvoices.value.find((invoice) => String(invoice.invoice_id) === selectedInvoiceId.value) ?? null)
const hasCustomer = computed(() => props.customerId !== null && props.customerId !== undefined && props.customerId !== '')
const canAllocate = computed(() => {
  if (!can('sales.deposits.post')) return false
  if (props.mode === 'receipt') return !props.readonly && (can('sales.receipts.create') || can('sales.receipts.post'))
  const status = String(props.documentStatus ?? '').toLowerCase()
  return Boolean(props.invoiceId) && ['posted', 'partially_paid'].includes(status) && (can('sales.invoices.edit') || can('sales.invoices.post') || can('sales.deposits.post'))
})
const suggestedAmount = computed(() => {
  const depositBalance = Number(selectedDeposit.value?.remaining_amount ?? 0)
  const invoiceBalance = props.mode === 'invoice'
    ? Number(selectedInvoice.value?.balance_due ?? props.invoiceBalanceDue ?? 0)
    : Number(selectedInvoice.value?.balance_due ?? 0)
  const amount = Math.min(depositBalance, invoiceBalance)
  return Number.isFinite(amount) ? Math.max(0, amount) : depositBalance
})
const showPanel = computed(() => loading.value || error.value || deposits.value.length > 0 || skipped.value)

watch(
  () => [props.customerId, props.invoiceId, props.salesOrderId, props.mode] as const,
  () => {
    void load()
  },
  { immediate: true },
)

watch([selectedDepositId, selectedInvoiceId], () => {
  applyAmount.value = suggestedAmount.value
})

function todayDateValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeInvoiceForCurrentDetail() {
  if (!props.invoiceId) return []
  return [{
    invoice_id: Number(props.invoiceId),
    invoice_number: 'Current invoice',
    customer_id: Number(props.customerId),
    grand_total: 0,
    paid_amount: 0,
    returned_amount: 0,
    balance_due: Number(props.invoiceBalanceDue ?? 0),
    status: String(props.documentStatus ?? ''),
  }]
}

function resetSelection() {
  selectedDepositId.value = deposits.value[0] ? String(deposits.value[0].id) : ''
  selectedInvoiceId.value = props.invoiceId
    ? String(props.invoiceId)
    : openInvoices.value[0]
      ? String(openInvoices.value[0].invoice_id)
      : ''
  applyAmount.value = suggestedAmount.value
}

async function load() {
  error.value = null
  success.value = null
  skipped.value = false
  deposits.value = []
  openInvoices.value = []
  unappliedTotal.value = 0
  if (!hasCustomer.value) return

  loading.value = true
  try {
    if (props.mode === 'receipt') {
      const context = await getSalesReceiptCustomerContext(props.customerId as string | number)
      deposits.value = context.available_deposits ?? []
      openInvoices.value = context.open_invoices ?? []
      unappliedTotal.value = Number(context.unapplied_deposit_total ?? 0)
    } else {
      const available = await getAvailableCustomerDeposits({
        customer_id: props.customerId as string | number,
        sales_invoice_id: props.invoiceId ?? undefined,
        sales_order_id: props.salesOrderId ?? undefined,
      })
      deposits.value = available.deposits ?? []
      openInvoices.value = normalizeInvoiceForCurrentDetail()
      unappliedTotal.value = Number(available.unapplied_total ?? 0)
    }
    resetSelection()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to load customer deposits.'
  } finally {
    loading.value = false
  }
}

function markSkipped() {
  skipped.value = true
  emit('skipped')
}

async function applyDeposit() {
  const deposit = selectedDeposit.value
  const invoiceId = selectedInvoiceId.value
  const amount = Number(applyAmount.value)
  if (!deposit || !invoiceId || !Number.isFinite(amount) || amount <= 0) {
    error.value = 'Select a deposit, invoice, and amount greater than zero.'
    return
  }

  applying.value = true
  error.value = null
  success.value = null
  try {
    await allocateCustomerDepositToInvoice(deposit.id, invoiceId, {
      allocated_amount: amount,
      allocation_date: todayDateValue(),
      source_context: props.mode === 'receipt' ? 'sales_receipt' : 'sales_invoice',
      notes: props.mode === 'receipt' ? 'Applied during receipt entry' : 'Applied from sales invoice',
    })
    const remainingBalance = Math.max(0, Number(selectedInvoice.value?.balance_due ?? amount) - amount)
    success.value = `Deposit ${deposit.deposit_number} applied.`
    emit('applied', { invoiceId, remainingBalance })
    await load()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to apply customer deposit.'
  } finally {
    applying.value = false
  }
}
</script>

<template>
  <div v-if="showPanel" class="rounded-lg border border-cyan-200 bg-cyan-50/70 p-3">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2 text-sm font-black text-slate-950">
          <WalletCards class="h-4 w-4 text-[#1d81af]" />
          Customer Deposit
        </div>
        <p class="mt-1 text-xs font-semibold text-slate-600">
          Unapplied deposit: <span class="font-black text-slate-950">Rp {{ toMoney(unappliedTotal) }}</span>
        </p>
      </div>
      <BaseButton type="button" variant="secondary" size="sm" :loading="loading" @click="load">
        <RefreshCw class="h-4 w-4" />
        Refresh
      </BaseButton>
    </div>

    <p v-if="error" class="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{{ error }}</p>
    <p v-if="success" class="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{{ success }}</p>
    <p v-if="skipped" class="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Deposit masih belum dialokasikan.</p>

    <div v-if="deposits.length > 0" class="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_130px_auto] lg:items-end">
      <label class="min-w-0">
        <span class="mb-1 block text-[11px] font-bold text-slate-500">Deposit</span>
        <select v-model="selectedDepositId" class="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-800">
          <option v-for="deposit in deposits" :key="deposit.id" :value="String(deposit.id)">
            {{ deposit.deposit_number }} - Rp {{ toMoney(deposit.remaining_amount) }} ({{ deposit.match_strength === 'sales_order' ? 'Sales Order' : 'Customer' }})
          </option>
        </select>
      </label>

      <label class="min-w-0">
        <span class="mb-1 block text-[11px] font-bold text-slate-500">Open Invoice</span>
        <select v-model="selectedInvoiceId" class="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-800">
          <option v-for="invoice in openInvoices" :key="invoice.invoice_id" :value="String(invoice.invoice_id)">
            {{ invoice.invoice_number }} - Rp {{ toMoney(invoice.balance_due) }}
          </option>
        </select>
      </label>

      <label class="min-w-0">
        <span class="mb-1 block text-[11px] font-bold text-slate-500">Apply Amount</span>
        <input v-model.number="applyAmount" type="number" min="0" step="0.01" class="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-right text-sm font-black tabular-nums text-slate-900" />
      </label>

      <div class="flex min-w-0 flex-wrap gap-1.5">
        <BaseButton v-if="canAllocate" type="button" size="sm" :loading="applying" @click="applyDeposit">
          <Landmark class="h-4 w-4" />
          {{ mode === 'receipt' ? 'Apply Deposit & Continue Receipt' : 'Apply Deposit' }}
        </BaseButton>
        <BaseButton v-if="mode === 'receipt'" type="button" variant="secondary" size="sm" @click="markSkipped">
          Skip Deposit
        </BaseButton>
        <BaseButton v-if="mode === 'receipt'" type="button" variant="secondary" size="sm" @click="markSkipped">
          Receive Payment Only
        </BaseButton>
      </div>
    </div>

    <p v-else-if="!loading && !error" class="mt-2 text-xs font-semibold text-slate-600">No unapplied customer deposit available.</p>
    <p v-if="deposits.length > 0 && !canAllocate" class="mt-2 text-xs font-semibold text-slate-600">Deposit allocation is read-only for your current permissions.</p>
  </div>
</template>
