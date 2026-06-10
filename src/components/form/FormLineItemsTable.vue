<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import FormMoneyInput from '@/components/form/FormMoneyInput.vue'
import FormNumberInput from '@/components/form/FormNumberInput.vue'
import FormSelect, { type SelectOption } from '@/components/form/FormSelect.vue'
import FormTextInput from '@/components/form/FormTextInput.vue'

export type LineItemColumn = {
  key: string
  label: string
  type?: 'text' | 'number' | 'money' | 'select'
  options?: SelectOption[]
  placeholder?: string
}

const props = defineProps<{
  name: string
  rows: Record<string, unknown>[]
  columns: LineItemColumn[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
}>()

const autoAppendKeys = ['product_id', 'account_id', 'sales_invoice_id', 'vendor_bill_id']
const pendingAutoAppend = ref(false)
const autoAppendKey = computed(() => {
  const preferred = props.columns.find((column) => autoAppendKeys.includes(column.key))
  return preferred?.key ?? props.columns[0]?.key ?? ''
})

function hasValue(value: unknown) {
  if (value === null || value === undefined || value === '') return false
  if (typeof value === 'string') return value.trim() !== ''
  return true
}

async function maybeAppendRow(rowIndex: number) {
  if (props.readonly || pendingAutoAppend.value || rowIndex !== props.rows.length - 1) return
  await nextTick()
  const key = autoAppendKey.value
  const row = props.rows[rowIndex]
  if (!key || !row || !hasValue(row[key])) return
  pendingAutoAppend.value = true
  emit('add')
  await nextTick()
  pendingAutoAppend.value = false
}

async function removeRow(rowIndex: number) {
  const shouldRestoreBlank = props.rows.length <= 1
  emit('remove', rowIndex)
  if (shouldRestoreBlank) {
    await nextTick()
    emit('add')
  }
}
</script>

<template>
  <div class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div class="workspace-table-scroll min-w-0 overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
          <tr>
            <th class="w-14 px-3 py-2 text-center">No</th>
            <th v-for="column in columns" :key="column.key" class="px-3 py-2">{{ column.label }}</th>
            <th class="sticky right-0 w-20 bg-slate-50 px-3 py-2 text-right shadow-[-12px_0_18px_-18px_rgba(15,23,42,0.35)]">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="(_, rowIndex) in rows" :key="rowIndex" @change.capture="maybeAppendRow(rowIndex)">
            <td class="px-3 py-2 text-center align-top text-xs font-bold tabular-nums text-slate-500">
              {{ rowIndex + 1 }}
            </td>
            <td v-for="column in columns" :key="column.key" class="min-w-36 px-3 py-2 align-top">
              <FormSelect
                v-if="column.type === 'select'"
                :name="`${name}.${rowIndex}.${column.key}`"
                :options="column.options ?? []"
                :placeholder="column.placeholder ?? column.label"
                :disabled="readonly"
              />
              <FormNumberInput
                v-else-if="column.type === 'number'"
                :name="`${name}.${rowIndex}.${column.key}`"
                :placeholder="column.placeholder ?? column.label"
                :disabled="readonly"
              />
              <FormMoneyInput
                v-else-if="column.type === 'money'"
                :name="`${name}.${rowIndex}.${column.key}`"
                :placeholder="column.placeholder ?? column.label"
                :disabled="readonly"
              />
              <FormTextInput
                v-else
                :name="`${name}.${rowIndex}.${column.key}`"
                :placeholder="column.placeholder ?? column.label"
                :disabled="readonly"
              />
            </td>
            <td class="sticky right-0 bg-white px-3 py-2 text-right align-top shadow-[-12px_0_18px_-18px_rgba(15,23,42,0.35)]">
              <BaseButton v-if="!readonly" variant="secondary" size="sm" @click="removeRow(rowIndex)">Remove</BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
