<script setup lang="ts">
import { AlertTriangle, CheckCircle2, X } from 'lucide-vue-next'

import BaseModal from '@/components/dialog/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
    confirmDisabled?: boolean
  }>(),
  {
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    danger: false,
    confirmDisabled: false,
  },
)

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div class="flex items-start gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
        :class="danger ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-[#cbeeff] bg-[#eef9fd] text-[#1684b5]'"
      >
        <AlertTriangle v-if="danger" class="h-5 w-5" />
        <CheckCircle2 v-else class="h-5 w-5" />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex min-w-0 items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Konfirmasi</p>
            <h2 class="mt-0.5 text-base font-black leading-6 text-slate-950">{{ title }}</h2>
          </div>
          <button
            type="button"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close dialog"
            @click="emit('close')"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <p class="mt-3 text-sm leading-6 text-slate-600">{{ message }}</p>
      </div>
    </div>

    <div class="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
      <BaseButton variant="secondary" size="sm" @click="emit('close')">{{ cancelLabel }}</BaseButton>
      <BaseButton
        :variant="danger ? 'danger' : 'primary'"
        size="sm"
        :disabled="confirmDisabled"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </BaseButton>
    </div>
  </BaseModal>
</template>
