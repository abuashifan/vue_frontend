<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Building2, PanelLeftOpen, X, ChevronRight } from 'lucide-vue-next'

import {
  isSidebarMenuSection,
  type SidebarMenuGroup,
  type SidebarMenuItem,
} from '@/navigation/sidebar'
import { cn } from '@/utils/cn'

const props = defineProps<{
  modules: SidebarMenuGroup[]
  activeModuleKey: string
  activeHref: string
  floatingModuleKey: string | null
}>()

const emit = defineEmits<{
  activateModule: [moduleKey: string]
  setFloating: [moduleKey: string | null]
  expand: []
  openItem: [item: SidebarMenuItem]
}>()

const collapsedSidebarWidth = 80
const floatingMargin = 16
const sidebarRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const activeAnchorRef = ref<HTMLElement | null>(null)
const floatingTop = ref(96)
const floatingLeft = ref(collapsedSidebarWidth + floatingMargin)

const floatingModule = computed(
  () => props.modules.find((module) => module.key === props.floatingModuleKey) ?? null,
)
const floatingPanelStyle = computed(() => ({
  left: `${floatingLeft.value}px`,
  top: `${floatingTop.value}px`,
  maxHeight: `calc(100vh - ${floatingMargin * 2}px)`,
}))

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function calculateFloatingPanelPosition(anchorElement: HTMLElement, panelHeight: number) {
  const anchorRect = anchorElement.getBoundingClientRect()
  const availableBottom = Math.max(
    floatingMargin,
    window.innerHeight - panelHeight - floatingMargin,
  )
  return {
    left: collapsedSidebarWidth + floatingMargin,
    top: clamp(
      anchorRect.top + anchorRect.height / 2 - panelHeight / 2,
      floatingMargin,
      availableBottom,
    ),
  }
}

function updateFloatingPosition() {
  const anchor = activeAnchorRef.value
  if (!anchor || !props.floatingModuleKey) return

  const panelHeight = panelRef.value?.offsetHeight ?? 0
  const position = calculateFloatingPanelPosition(anchor, panelHeight)
  floatingLeft.value = position.left
  floatingTop.value = position.top
}

async function onModuleClick(moduleKey: string, event: MouseEvent) {
  activeAnchorRef.value = event.currentTarget as HTMLElement
  emit('activateModule', moduleKey)
  await nextTick()
  updateFloatingPosition()
}

function eventPath(event: Event) {
  return typeof event.composedPath === 'function' ? event.composedPath() : []
}

function isEventInside(element: HTMLElement | null, event: Event) {
  if (!element) return false

  const path = eventPath(event)
  return path.length > 0 ? path.includes(element) : element.contains(event.target as Node | null)
}

function isEventOnSidebarControl(event: Event) {
  const path = eventPath(event)
  if (path.length > 0) {
    return path.some(
      (target) => target instanceof HTMLElement && target.dataset.sidebarFloatingControl === 'true',
    )
  }

  return (
    event.target instanceof HTMLElement &&
    event.target.closest('[data-sidebar-floating-control="true"]') != null
  )
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!props.floatingModuleKey) return
  if (isEventInside(panelRef.value, event)) return
  if (isEventInside(sidebarRef.value, event) && isEventOnSidebarControl(event)) return

  emit('setFloating', null)
}

function onWindowReposition() {
  updateFloatingPosition()
}

watch(
  () => props.floatingModuleKey,
  async (moduleKey) => {
    if (!moduleKey) return
    await nextTick()
    updateFloatingPosition()
  },
)

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  window.addEventListener('resize', onWindowReposition)
  window.addEventListener('scroll', onWindowReposition, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  window.removeEventListener('resize', onWindowReposition)
  window.removeEventListener('scroll', onWindowReposition, true)
})
</script>

<template>
  <aside
    ref="sidebarRef"
    class="app-viewport hidden w-20 shrink-0 flex-col items-center bg-[#06131e] py-4 text-white shadow-2xl shadow-slate-950/30 lg:flex"
  >
    <div class="grid h-12 w-12 place-items-center rounded-2xl bg-[#b4db24] text-[#06131e]">
      <Building2 class="h-6 w-6" />
    </div>
    <button
      type="button"
      data-sidebar-floating-control="true"
      class="mt-5 rounded-2xl p-3 text-white/60 hover:bg-white/10 hover:text-white"
      @click="emit('expand')"
    >
      <PanelLeftOpen class="h-5 w-5" />
    </button>
    <div class="mt-6 flex flex-1 flex-col gap-2">
      <button
        v-for="module in modules"
        :key="module.key"
        type="button"
        data-sidebar-floating-control="true"
        :title="module.label"
        :class="
          cn(
            'grid h-12 w-12 place-items-center rounded-2xl transition',
            activeModuleKey === module.key || floatingModuleKey === module.key
              ? 'bg-[#b4db24] text-[#06131e]'
              : 'text-white/60 hover:bg-white/10 hover:text-white',
          )
        "
        @click="onModuleClick(module.key, $event)"
      >
        <component :is="module.icon" class="h-5 w-5" />
      </button>
    </div>
  </aside>

  <div
    v-if="floatingModuleKey"
    ref="panelRef"
    :style="floatingPanelStyle"
    class="fixed z-40 hidden w-72 overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/15 lg:block"
  >
    <div class="mb-3 flex items-center justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Submenu</p>
        <h3 class="font-bold text-slate-950">
          {{ floatingModule?.label }}
        </h3>
      </div>
      <button
        type="button"
        class="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        @click="emit('setFloating', null)"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <div class="space-y-1">
      <template v-for="node in floatingModule?.items ?? []" :key="node.id">
        <div v-if="isSidebarMenuSection(node)" class="space-y-1 pt-2 first:pt-0">
          <p class="px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {{ node.label }}
          </p>
          <button
            v-for="item in node.children"
            :key="item.id"
            type="button"
            :class="
              cn(
                'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold hover:bg-[#f7fbe9] hover:text-[#48580e]',
                activeHref === item.href ? 'bg-[#f7fbe9] text-[#48580e]' : 'text-slate-600',
              )
            "
            :aria-current="activeHref === item.href ? 'page' : undefined"
            @click="emit('openItem', item)"
          >
            {{ item.label }}
            <ChevronRight class="h-4 w-4 shrink-0" />
          </button>
        </div>
        <button
          v-else
          type="button"
          :class="
            cn(
              'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold hover:bg-[#f7fbe9] hover:text-[#48580e]',
              activeHref === node.href ? 'bg-[#f7fbe9] text-[#48580e]' : 'text-slate-600',
            )
          "
          :aria-current="activeHref === node.href ? 'page' : undefined"
          @click="emit('openItem', node)"
        >
          {{ node.label }}
          <ChevronRight class="h-4 w-4 shrink-0" />
        </button>
      </template>
    </div>
  </div>
</template>
