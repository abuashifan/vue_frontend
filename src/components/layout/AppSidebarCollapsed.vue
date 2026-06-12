<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import {
  Archive,
  BadgeCheck,
  BookOpenCheck,
  Box,
  Boxes,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Contact,
  FileCheck2,
  FileText,
  FolderKanban,
  Landmark,
  Layers3,
  Package,
  PackageCheck,
  PackagePlus,
  PanelLeftOpen,
  ReceiptText,
  Scale,
  ScrollText,
  Settings2,
  ShieldCheck,
  Tags,
  Truck,
  Users,
  WalletCards,
  Warehouse,
  X,
} from 'lucide-vue-next'

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

const cardIconByItemId: Record<string, Component> = {
  coa: ScrollText,
  contacts: Contact,
  'payment-terms': FileCheck2,
  units: Scale,
  departments: Landmark,
  projects: FolderKanban,
  'account-mappings': Settings2,
  journals: ClipboardList,
  'fiscal-closing': BookOpenCheck,
  'period-locks': ShieldCheck,
  'sales-quotations': FileText,
  'sales-orders': ClipboardCheck,
  'delivery-orders': Truck,
  'proforma-invoices': ReceiptText,
  'sales-invoices': FileCheck2,
  'customer-deposits': WalletCards,
  'sales-receipts': BadgeCheck,
  'sales-returns': PackageCheck,
  'purchase-requests': FileText,
  'purchase-orders': ClipboardCheck,
  'goods-receipts': Truck,
  'vendor-bills': ReceiptText,
  'vendor-deposits': WalletCards,
  'vendor-payments': BadgeCheck,
  'purchase-returns': PackageCheck,
  'cash-bank-accounts': Landmark,
  'cash-receipts': WalletCards,
  'cash-payments': ReceiptText,
  'bank-transfers': Layers3,
  'bank-reconciliation': BadgeCheck,
  products: Box,
  'product-categories': Tags,
  warehouses: Warehouse,
  'stock-balances': Archive,
  'stock-movements': PackagePlus,
  'stock-adjustments': Settings2,
  'stock-opnames': Boxes,
  'company-settings': Building2,
  'access-company-users': Users,
  'access-roles': ShieldCheck,
  'access-user-permissions': ClipboardCheck,
  'access-invitations': Contact,
  'access-audit': FileCheck2,
}

type CardTone = {
  card: string
  icon: string
}

type FloatingMenuSection = {
  id: string
  label: string | null
  children: SidebarMenuItem[]
}

const fallbackCardTone: CardTone = {
  card: 'border-emerald-300 bg-emerald-50 text-emerald-950 hover:border-emerald-500 hover:shadow-emerald-900/15',
  icon: 'text-emerald-600',
}

const cardTones: CardTone[] = [
  fallbackCardTone,
  {
    card: 'border-sky-300 bg-sky-50 text-sky-950 hover:border-sky-500 hover:shadow-sky-900/15',
    icon: 'text-sky-600',
  },
  {
    card: 'border-violet-300 bg-violet-50 text-violet-950 hover:border-violet-500 hover:shadow-violet-900/15',
    icon: 'text-violet-600',
  },
  {
    card: 'border-amber-300 bg-amber-50 text-amber-950 hover:border-amber-500 hover:shadow-amber-900/15',
    icon: 'text-amber-600',
  },
  {
    card: 'border-rose-300 bg-rose-50 text-rose-950 hover:border-rose-500 hover:shadow-rose-900/15',
    icon: 'text-rose-600',
  },
]

function cardTone(item: SidebarMenuItem, index: number) {
  const moduleOffset =
    {
      'master-data': 0,
      'general-ledger': 3,
      sales: 1,
      purchase: 4,
      'cash-bank': 2,
      inventory: 0,
      'settings-access': 3,
    }[item.module] ?? 0

  return cardTones[(index + moduleOffset) % cardTones.length] ?? fallbackCardTone
}

function cardIcon(item: SidebarMenuItem) {
  return cardIconByItemId[item.id] ?? Package
}

const floatingMenuSections = computed<FloatingMenuSection[]>(() => {
  const module = floatingModule.value
  if (!module) return []

  const moduleKey = module.key
  const sections: FloatingMenuSection[] = []
  let flatItems: SidebarMenuItem[] = []

  function pushFlatItems() {
    if (flatItems.length === 0) return
    sections.push({
      id: `${moduleKey}-items`,
      label: null,
      children: flatItems,
    })
    flatItems = []
  }

  for (const node of module.items) {
    if (isSidebarMenuSection(node)) {
      pushFlatItems()
      sections.push({
        id: node.id,
        label: node.label,
        children: node.children,
      })
      continue
    }

    flatItems.push(node)
  }

  pushFlatItems()
  return sections
})

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
    class="fixed z-40 hidden w-[min(760px,calc(100vw-7rem))] overflow-y-auto rounded-md border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/20 lg:block"
  >
    <div class="flex items-center justify-between gap-4">
      <h3 class="text-2xl font-normal text-slate-700">
        {{ floatingModule?.label }}
      </h3>
      <button
        type="button"
        class="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        @click="emit('setFloating', null)"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
    <div class="mt-4 h-px w-full bg-gradient-to-r from-[#b4db24] via-sky-400 to-transparent" />

    <div class="mt-5 space-y-5">
      <section v-for="section in floatingMenuSections" :key="section.id" class="space-y-3">
        <p v-if="section.label" class="text-xs font-bold uppercase tracking-wide text-slate-400">
          {{ section.label }}
        </p>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(124px,1fr))] gap-3">
          <button
            v-for="(item, index) in section.children"
            :key="item.id"
            type="button"
            :class="
              cn(
                'group flex min-h-28 flex-col items-center justify-center gap-3 rounded-md border px-3 py-4 text-center text-sm font-medium leading-snug transition hover:-translate-y-0.5 hover:shadow-lg',
                cardTone(item, index).card,
                activeHref === item.href ? 'ring-2 ring-[#b4db24] ring-offset-2' : '',
              )
            "
            :aria-current="activeHref === item.href ? 'page' : undefined"
            @click="emit('openItem', item)"
          >
            <component
              :is="cardIcon(item)"
              :class="cn('h-8 w-8 transition group-hover:scale-105', cardTone(item, index).icon)"
              stroke-width="1.8"
            />
            <span>{{ item.label }}</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
