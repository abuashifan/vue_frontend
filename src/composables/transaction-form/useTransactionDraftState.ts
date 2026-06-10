import { onMounted, watch } from 'vue'
import type { FormContext } from 'vee-validate'

import { useWorkspaceTabsStore } from '@/stores/workspaceTabsStore'
import { KNOWN_DATE_FIELDS, normalizeDateFields } from '@/utils/date'

function snapshot<T>(value: T): T {
  if (value == null || typeof value !== 'object') return value
  try {
    return structuredClone(value)
  } catch {
    return JSON.parse(JSON.stringify(value)) as T
  }
}

export function useTransactionDraftState(secondaryTabId: string, form: FormContext<Record<string, unknown>>) {
  const tabs = useWorkspaceTabsStore()

  function syncDraftState() {
    if (!secondaryTabId) return
    if (form.meta.value.dirty) {
      tabs.updateDraftState(secondaryTabId, snapshot(form.values))
      tabs.setSecondaryDirty(secondaryTabId, true)
      return
    }

    tabs.clearDraftState(secondaryTabId)
  }

  onMounted(() => {
    const draft = tabs.draftStateBySecondaryTabId[secondaryTabId] as Record<string, unknown> | undefined
    if (draft && typeof draft === 'object') {
      form.setValues(normalizeDateFields(snapshot(draft), KNOWN_DATE_FIELDS), false)
    }
  })

  watch(
    () => form.values,
    () => syncDraftState(),
    { deep: true },
  )

  watch(
    () => form.meta.value.dirty,
    () => syncDraftState(),
  )

  function clearDraft() {
    tabs.clearDraftState(secondaryTabId)
  }

  function hasDraft() {
    const draft = tabs.draftStateBySecondaryTabId[secondaryTabId]
    return draft != null && typeof draft === 'object'
  }

  return { clearDraft, hasDraft }
}
