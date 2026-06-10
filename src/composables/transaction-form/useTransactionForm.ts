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

  const isReadonly = computed(() => options.mode === 'detail')

  const draft = useTransactionDraftState(options.secondaryTabId, form)

  function normalizedResponseData(raw: unknown) {
    const res = raw as { data?: ApiResponse<Record<string, unknown>> }
    const data = res.data?.data
    return data && typeof data === 'object' ? normalizeDateFields(data, KNOWN_DATE_FIELDS) : null
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
    if (options.mode !== 'detail' && draft.hasDraft()) return
    loading.value = true
    error.value = null
    try {
      const raw = await options.config.apiService.get(options.entityId)
      const normalizedData = normalizedResponseData(raw)
      if (normalizedData) {
        form.setValues(normalizedData, false)
        ensureTrailingBlankLine()
        status.value = String(normalizedData.status ?? '')
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
      return
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
        form.resetForm({ values: savedData })
        status.value = String(savedData.status ?? '')
      } else {
        form.resetForm({ values: payload })
      }
      ensureTrailingBlankLine()
      draft.clearDraft()
      return true
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
