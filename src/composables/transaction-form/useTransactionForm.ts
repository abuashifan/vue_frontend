import { computed, onMounted, ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'

import type { ApiResponse } from '@/types/api'
import { applyLaravelValidationErrors, toErrorMessage } from '@/composables/transaction-form/useTransactionValidation'
import { useTransactionDraftState } from '@/composables/transaction-form/useTransactionDraftState'
import { calculateTransactionTotals } from '@/composables/useTransactionLineCalculation'
import type { RuntimeTransactionFormConfig, TransactionFormMode } from '@/composables/transaction-form/types'
import { KNOWN_DATE_FIELDS, normalizeDateFields, prepareDateForPayload } from '@/utils/date'

export function useTransactionForm(options: {
  config: RuntimeTransactionFormConfig
  mode: TransactionFormMode
  secondaryTabId: string
  entityId?: string | number
}) {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const status = ref<string | null>(null)

  const form = useForm<Record<string, unknown>>({
    validationSchema: toTypedSchema(options.config.validationSchema),
    initialValues: options.config.makeEmptyValues(),
  })

  const lockedStatuses = new Set([
    'billed',
    'cancelled',
    'canceled',
    'closed',
    'converted',
    'delivered',
    'expired',
    'fully_allocated',
    'invoiced',
    'paid',
    'partially_allocated',
    'partially_billed',
    'partially_delivered',
    'partially_invoiced',
    'partially_paid',
    'partially_received',
    'posted',
    'received',
    'refunded',
    'rejected',
    'void',
    'voided',
  ])
  const linkedAmountFields = [
    'allocated_amount',
    'applied_down_payment_amount',
    'applied_vendor_deposit_amount',
    'paid_amount',
    'returned_amount',
  ]
  const linkedLineFields = [
    'allocated_amount',
    'billed_quantity',
    'delivered_quantity',
    'invoiced_quantity',
    'paid_amount',
    'received_quantity',
    'returned_quantity',
  ]
  const linkedRelationFields = [
    'deposits',
    'payments',
    'receipts',
    'invoices',
    'sales_invoices',
    'vendor_bills',
    'delivery_orders',
    'returns',
  ]

  function numericValue(value: unknown) {
    if (value === null || value === undefined || value === '') return 0
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  function hasLinkedProgress(values: Record<string, unknown>) {
    if (linkedAmountFields.some((field) => numericValue(values[field]) > 0)) return true
    if (linkedRelationFields.some((field) => Array.isArray(values[field]) && (values[field] as unknown[]).length > 0)) return true
    if (!Array.isArray(values.lines)) return false
    return values.lines.some((line) => {
      const row = asRecord(line)
      return linkedLineFields.some((field) => numericValue(row[field]) > 0)
    })
  }

  const isLocked = computed(() => {
    if (options.mode === 'create') return false
    const currentStatus = String(form.values.status ?? status.value ?? '').toLowerCase()
    return lockedStatuses.has(currentStatus) || hasLinkedProgress(form.values)
  })
  const isReadonly = computed(() => options.mode === 'detail' || isLocked.value)

  const draft = useTransactionDraftState(options.secondaryTabId, form)

  function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
  }

  function stringValue(value: unknown, fallback: string | null = null) {
    if (value === null || value === undefined || value === '') return fallback
    return String(value)
  }

  function numberValue(value: unknown, fallback = 0) {
    if (value === null || value === undefined || value === '') return fallback
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  function normalizeResponseLine(line: unknown) {
    const row = asRecord(line)
    const product = asRecord(row.product)
    const unit = asRecord(row.unit)
    const productCode = row.product_code ?? product.product_code ?? product.code ?? product.sku
    const productName = product.name ?? product.product_name ?? product.label
    const description = row.description ?? productName ?? ''
    const unitName = row.unit_name ?? unit.name ?? unit.unit_name ?? product.unit_name
    const unitId = row.unit_id ?? unit.id ?? product.unit_id
    const price = row.unit_price ?? row.estimated_unit_price ?? row.amount ?? 0

    return {
      ...row,
      product_id: stringValue(row.product_id ?? product.id, ''),
      product_code: stringValue(productCode, ''),
      description: String(description ?? ''),
      quantity: numberValue(row.quantity, 1),
      unit_id: stringValue(unitId),
      unit_name: stringValue(unitName),
      warehouse_id: stringValue(row.warehouse_id),
      department_id: stringValue(row.department_id),
      project_id: stringValue(row.project_id),
      quotation_line_id: stringValue(row.quotation_line_id),
      sales_order_line_id: stringValue(row.sales_order_line_id),
      delivery_order_line_id: stringValue(row.delivery_order_line_id),
      proforma_invoice_line_id: stringValue(row.proforma_invoice_line_id),
      purchase_request_line_id: stringValue(row.purchase_request_line_id),
      purchase_order_line_id: stringValue(row.purchase_order_line_id),
      vendor_bill_line_id: stringValue(row.vendor_bill_line_id),
      source_line_id: stringValue(row.source_line_id),
      unit_price: numberValue(price),
      estimated_unit_price: numberValue(row.estimated_unit_price ?? price),
      amount: numberValue(row.amount ?? row.line_total ?? price),
      discount_value: numberValue(row.discount_value),
      discount_amount: numberValue(row.discount_amount),
      tax_rate: numberValue(row.tax_rate),
      tax_amount: numberValue(row.tax_amount),
      line_total: numberValue(row.line_total),
    }
  }

  function normalizedResponseData(raw: unknown) {
    const res = raw as { data?: ApiResponse<Record<string, unknown>> }
    const data = res.data?.data
    if (!data || typeof data !== 'object') return null
    const normalized = normalizeDateFields(data, KNOWN_DATE_FIELDS)
    if (Array.isArray(normalized.lines)) {
      normalized.lines = normalized.lines.map((line) => normalizeResponseLine(line))
    }
    return normalized
  }

  function normalizeLineValue(value: unknown) {
    return value === '' || value === undefined ? null : value
  }

  function defaultLineValue() {
    const emptyValues = options.config.makeEmptyValues()
    const lines = emptyValues.lines
    return Array.isArray(lines) && lines[0] && typeof lines[0] === 'object'
      ? { ...(lines[0] as Record<string, unknown>) }
      : null
  }

  function hasLineValue(value: unknown) {
    if (value === null || value === undefined || value === '') return false
    if (typeof value === 'number') return Number.isFinite(value) && value > 0
    if (typeof value === 'string') return value.trim() !== '' && Number(value) !== 0
    return true
  }

  function isBlankLine(line: Record<string, unknown>) {
    const identityKeys = [
      'product_id',
      'sales_order_line_id',
      'purchase_order_line_id',
      'purchase_request_line_id',
      'quotation_line_id',
      'sales_invoice_line_id',
      'delivery_order_line_id',
      'vendor_bill_line_id',
      'source_line_id',
    ]
    if (identityKeys.some((key) => hasLineValue(line[key]))) return false
    if (typeof line.description === 'string' && line.description.trim() !== '') return false

    const amountKeys = [
      'amount',
      'unit_price',
      'estimated_unit_price',
      'discount_value',
      'discount_amount',
      'tax_rate',
      'tax_amount',
      'line_total',
      'gross_amount',
      'subtotal_after_discount',
    ]
    return !amountKeys.some((key) => hasLineValue(line[key]))
  }

  function ensureTrailingBlankLine() {
    if (isReadonly.value) return
    const blank = defaultLineValue()
    if (!blank) return
    const lines = Array.isArray(form.values.lines) ? (form.values.lines as Record<string, unknown>[]) : []
    if (lines.length === 0) {
      form.setFieldValue('lines', [blank], false)
      return
    }
    const lastLine = lines[lines.length - 1]
    if (lastLine && !isBlankLine(lastLine)) {
      form.setFieldValue('lines', [...lines, blank], false)
    }
  }

  function valuesWithTrailingBlankLine(values: Record<string, unknown>) {
    if (isReadonly.value || !Array.isArray(values.lines)) return values
    const blank = defaultLineValue()
    if (!blank) return values
    const lines = values.lines as Record<string, unknown>[]
    const lastLine = lines[lines.length - 1]
    if (!lastLine || isBlankLine(lastLine)) return values
    return { ...values, lines: [...lines, blank] }
  }

  function trimBlankLinesForValidation() {
    if (!Array.isArray(form.values.lines)) return
    const lines = form.values.lines as Record<string, unknown>[]
    const filledLines = lines.filter((line) => !isBlankLine(line))
    if (filledLines.length === lines.length) return
    form.setFieldValue('lines', filledLines.length > 0 ? filledLines : lines.slice(0, 1), false)
  }

  function makePayload() {
    const payload = { ...form.values }
    const priceField = options.config.lineProduct?.priceField ?? 'unit_price'
    for (const key of KNOWN_DATE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        payload[key] = prepareDateForPayload(payload[key])
      }
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'payment_term_id') && payload.payment_term_id === '') {
      payload.payment_term_id = null
    }

    if (Array.isArray(payload.lines)) {
      const totals = calculateTransactionTotals(payload.lines as Record<string, unknown>[], {
        priceField,
        headerDiscountType: payload.header_discount_type,
        headerDiscountValue: payload.header_discount_value,
        taxIncluded: payload.tax_included,
      })

      payload.lines = totals.lines.map((line) => ({
        ...line,
        product_id: normalizeLineValue(line.product_id),
        unit_id: normalizeLineValue(line.unit_id),
        warehouse_id: normalizeLineValue(line.warehouse_id),
        department_id: normalizeLineValue(line.department_id),
        project_id: normalizeLineValue(line.project_id),
        discount_type: line.discount_type || (Number(line.discount_value ?? 0) > 0 ? 'fixed_amount' : null),
      }))
      payload.subtotal = totals.subtotal_before_discount
      payload.subtotal_before_discount = totals.subtotal_before_discount
      payload.line_discount_total = totals.line_discount_total
      payload.header_discount_amount = totals.header_discount_amount
      payload.subtotal_after_discount = totals.subtotal_after_discount
      payload.discount_amount = totals.line_discount_total + totals.header_discount_amount
      payload.tax_amount = totals.tax_total
      payload.tax_total = totals.tax_total
      payload.grand_total = totals.grand_total
    }

    return payload
  }

  async function load() {
    if (options.mode === 'create') return
    if (options.entityId == null) return
    loading.value = true
    error.value = null
    try {
      const raw = await options.config.apiService.get(options.entityId)
      const normalizedData = normalizedResponseData(raw)
      if (normalizedData) {
        form.resetForm({ values: valuesWithTrailingBlankLine(normalizedData) })
        status.value = String(normalizedData.status ?? '')
        draft.clearDraft()
      }
    } catch (cause) {
      error.value = toErrorMessage(cause)
    } finally {
      loading.value = false
    }
  }

  async function save() {
    if (isReadonly.value) return
    error.value = null
    trimBlankLinesForValidation()
    const valid = await form.validate()
    if (!valid.valid) {
      ensureTrailingBlankLine()
      return false
    }

    loading.value = true
    try {
      const payload = makePayload()
      let raw: unknown
      if (options.mode === 'edit' && options.entityId != null) {
        raw = await options.config.apiService.update(options.entityId, payload)
      } else {
        raw = await options.config.apiService.create(payload)
      }
      const savedData = normalizedResponseData(raw)
      if (savedData) {
        form.resetForm({ values: valuesWithTrailingBlankLine(savedData) })
        status.value = String(savedData.status ?? '')
      } else {
        form.resetForm({ values: valuesWithTrailingBlankLine(payload) })
      }
      draft.clearDraft()
      return savedData ?? payload
    } catch (cause) {
      applyLaravelValidationErrors(form, (cause as { errors?: Record<string, string[]> } | null)?.errors)
      error.value = toErrorMessage(cause)
      return false
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  return {
    form,
    loading,
    error,
    status,
    isReadonly,
    load,
    save,
  }
}
