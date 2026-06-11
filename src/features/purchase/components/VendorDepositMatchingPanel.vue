<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Landmark, RefreshCw, WalletCards } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import { usePermission } from '@/composables/usePermission'
import { toMoney } from '@/utils/money'
import {
  allocateVendorDepositToBill,
  getAvailableVendorDeposits,
  getVendorPaymentContext,
} from '@/features/purchase/api'
import type { AvailableVendorDeposit, OpenVendorBill } from '@/features/purchase/types'

const props = defineProps<{
  vendorId: string | number | null
  billId?: string | number | null
  billBalanceDue?: string | number | null
  purchaseOrderId?: string | number | null
  mode: 'bill' | 'payment'
  readonly?: boolean
  documentStatus?: string | null
}>()

const emit = defineEmits<{
  applied: [payload: { billId: string | number; remainingBalance: number }]
  skipped: []
}>()

const { can } = usePermission()
const loading = ref(false)
const applying = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const skipped = ref(false)
const unappliedTotal = ref(0)
const deposits = ref<AvailableVendorDeposit[]>([])
const openBills = ref<OpenVendorBill[]>([])
const selectedDepositId = ref<string>('')
const selectedBillId = ref<string>('')
const applyAmount = ref<number>(0)

const selectedDeposit = computed(() => deposits.value.find((deposit) => String(deposit.id) === selectedDepositId.value) ?? null)
const selectedBill = computed(() => openBills.value.find((bill) => String(bill.bill_id) === selectedBillId.value) ?? null)
const hasVendor = computed(() => props.vendorId !== null && props.vendorId !== undefined && props.vendorId !== '')
const canAllocate = computed(() => {
  if (!can('purchase.deposits.post')) return false
  if (props.mode === 'payment') return !props.readonly && (can('purchase.payments.create') || can('purchase.payments.post'))
  const status = String(props.documentStatus ?? '').toLowerCase()
  return Boolean(props.billId) && ['posted', 'partially_paid'].includes(status) && (can('purchase.bills.edit') || can('purchase.bills.post') || can('purchase.deposits.post'))
})
const suggestedAmount = computed(() => {
  const depositBalance = Number(selectedDeposit.value?.remaining_amount ?? 0)
  const billBalance = props.mode === 'bill'
    ? Number(selectedBill.value?.balance_due ?? props.billBalanceDue ?? 0)
    : Number(selectedBill.value?.balance_due ?? 0)
  return Math.max(0, Math.min(depositBalance, billBalance))
})
const showPanel = computed(() => loading.value || error.value || deposits.value.length > 0 || skipped.value)

watch(
  () => [props.vendorId, props.billId, props.purchaseOrderId, props.mode] as const,
  () => {
    void load()
  },
  { immediate: true },
)

watch([selectedDepositId, selectedBillId], () => {
  applyAmount.value = suggestedAmount.value
})

function todayDateValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeBillForCurrentDetail() {
  if (!props.billId) return []
  return [{
    bill_id: Number(props.billId),
    bill_number: 'Current bill',
    vendor_id: Number(props.vendorId),
    grand_total: 0,
    paid_amount: 0,
    returned_amount: 0,
    balance_due: Number(props.billBalanceDue ?? 0),
    status: String(props.documentStatus ?? ''),
  }]
}

function resetSelection() {
  selectedDepositId.value = deposits.value[0] ? String(deposits.value[0].id) : ''
  selectedBillId.value = props.billId
    ? String(props.billId)
    : openBills.value[0]
      ? String(openBills.value[0].bill_id)
      : ''
  applyAmount.value = suggestedAmount.value
}

async function load() {
  error.value = null
  success.value = null
  skipped.value = false
  deposits.value = []
  openBills.value = []
  unappliedTotal.value = 0
  if (!hasVendor.value) return

  loading.value = true
  try {
    if (props.mode === 'payment') {
      const context = await getVendorPaymentContext(props.vendorId as string | number)
      deposits.value = context.available_deposits ?? []
      openBills.value = context.open_bills ?? []
      unappliedTotal.value = Number(context.unapplied_deposit_total ?? 0)
    } else {
      const available = await getAvailableVendorDeposits({
        vendor_id: props.vendorId as string | number,
        vendor_bill_id: props.billId ?? undefined,
        purchase_order_id: props.purchaseOrderId ?? undefined,
      })
      deposits.value = available.deposits ?? []
      openBills.value = normalizeBillForCurrentDetail()
      unappliedTotal.value = Number(available.unapplied_total ?? 0)
    }
    resetSelection()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to load vendor deposits.'
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
  const billId = selectedBillId.value
  const amount = Number(applyAmount.value)
  if (!deposit || !billId || !Number.isFinite(amount) || amount <= 0) {
    error.value = 'Select a deposit, bill, and amount greater than zero.'
    return
  }

  applying.value = true
  error.value = null
  success.value = null
  try {
    await allocateVendorDepositToBill(deposit.id, billId, {
      allocated_amount: amount,
      allocation_date: todayDateValue(),
      source_context: props.mode === 'payment' ? 'vendor_payment' : 'vendor_bill',
      notes: props.mode === 'payment' ? 'Applied during payment entry' : 'Applied from vendor bill',
    })
    const remainingBalance = Math.max(0, Number(selectedBill.value?.balance_due ?? amount) - amount)
    success.value = `Vendor deposit ${deposit.deposit_number} applied.`
    emit('applied', { billId, remainingBalance })
    await load()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to apply vendor deposit.'
  } finally {
    applying.value = false
  }
}
</script>

<template>
  <div v-if="showPanel" class="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2 text-sm font-black text-slate-950">
          <WalletCards class="h-4 w-4 text-amber-700" />
          Vendor Deposit
        </div>
        <p class="mt-1 text-xs font-semibold text-slate-600">
          Unapplied vendor deposit: <span class="font-black text-slate-950">Rp {{ toMoney(unappliedTotal) }}</span>
        </p>
      </div>
      <BaseButton type="button" variant="secondary" size="sm" :loading="loading" @click="load">
        <RefreshCw class="h-4 w-4" />
        Refresh
      </BaseButton>
    </div>

    <p v-if="error" class="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{{ error }}</p>
    <p v-if="success" class="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{{ success }}</p>
    <p v-if="skipped" class="mt-2 rounded-lg border border-amber-300 bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900">Vendor deposit masih belum dialokasikan.</p>

    <div v-if="deposits.length > 0" class="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_130px_auto] lg:items-end">
      <label class="min-w-0">
        <span class="mb-1 block text-[11px] font-bold text-slate-500">Deposit</span>
        <select v-model="selectedDepositId" class="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-800">
          <option v-for="deposit in deposits" :key="deposit.id" :value="String(deposit.id)">
            {{ deposit.deposit_number }} - Rp {{ toMoney(deposit.remaining_amount) }} ({{ deposit.match_strength === 'purchase_order' ? 'Purchase Order' : 'Vendor' }})
          </option>
        </select>
      </label>

      <label class="min-w-0">
        <span class="mb-1 block text-[11px] font-bold text-slate-500">Open Bill</span>
        <select v-model="selectedBillId" class="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-800">
          <option v-for="bill in openBills" :key="bill.bill_id" :value="String(bill.bill_id)">
            {{ bill.bill_number }} - Rp {{ toMoney(bill.balance_due) }}
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
          {{ mode === 'payment' ? 'Apply Deposit & Continue Payment' : 'Apply Vendor Deposit' }}
        </BaseButton>
        <BaseButton v-if="mode === 'payment'" type="button" variant="secondary" size="sm" @click="markSkipped">
          Skip Deposit
        </BaseButton>
        <BaseButton v-if="mode === 'payment'" type="button" variant="secondary" size="sm" @click="markSkipped">
          Pay Bill Only
        </BaseButton>
      </div>
    </div>

    <p v-else-if="!loading && !error" class="mt-2 text-xs font-semibold text-slate-600">No unapplied vendor deposit available.</p>
    <p v-if="deposits.length > 0 && !canAllocate" class="mt-2 text-xs font-semibold text-slate-600">Vendor deposit allocation is read-only for your current permissions.</p>
  </div>
</template>
