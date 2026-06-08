<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { useRouter } from 'vue-router'
import {
  Banknote,
  BookOpen,
  BookOpenCheck,
  Boxes,
  ClipboardList,
  FileBarChart2,
  FileSearch,
  FileText,
  Landmark,
  LineChart,
  PackageSearch,
  ReceiptText,
  Search,
  TrendingUp,
  WalletCards,
} from 'lucide-vue-next'

import GeneralLedgerWorkspaceContent from '@/pages/reports/general-ledger/GeneralLedgerWorkspaceContent.vue'
import TrialBalanceWorkspaceContent from '@/pages/accounting/trial-balance/TrialBalanceWorkspaceContent.vue'
import FinancialStatementWorkspace from '@/features/reports/financial-statements/FinancialStatementWorkspace.vue'
import CustomerSummaryPage from '@/pages/sales/CustomerSummaryPage.vue'
import OpenInvoicesPage from '@/pages/sales/OpenInvoicesPage.vue'
import ArAgingPage from '@/pages/sales/ArAgingPage.vue'
import ArReconciliationPage from '@/pages/sales/ArReconciliationPage.vue'
import VendorSummaryPage from '@/pages/purchase/VendorSummaryPage.vue'
import OpenBillsPage from '@/pages/purchase/OpenBillsPage.vue'
import ApAgingPage from '@/pages/purchase/ApAgingPage.vue'
import ApReconciliationPage from '@/pages/purchase/ApReconciliationPage.vue'
import CashBankAccountStatementPage from '@/pages/cash-bank/CashBankAccountStatementPage.vue'
import {
  reportMenuSections,
  type SidebarMenuItem,
  type SidebarMenuSection,
} from '@/navigation/sidebar'
import { useAuthStore } from '@/stores/authStore'
import { useWorkspaceTabsStore } from '@/stores/workspaceTabsStore'
import { cn } from '@/utils/cn'

type CardTone = {
  card: string
  icon: string
}

const REPORTS_PRIMARY_ID = '/reports'
const router = useRouter()
const auth = useAuthStore()
const tabs = useWorkspaceTabsStore()
const activeSectionId = ref(reportMenuSections[0]?.id ?? '')

const search = computed({
  get: () => tabs.getListState(REPORTS_PRIMARY_ID).search,
  set: (value) => tabs.patchListState(REPORTS_PRIMARY_ID, { search: value }),
})

const reportComponentByPath: Record<string, Component> = {
  '/reports/balance-sheet': FinancialStatementWorkspace,
  '/reports/profit-loss': FinancialStatementWorkspace,
  '/reports/cash-flow': FinancialStatementWorkspace,
  '/reports/financial-summary': FinancialStatementWorkspace,
  '/reports/general-ledger': GeneralLedgerWorkspaceContent,
  '/reports/general-ledger-detail': GeneralLedgerWorkspaceContent,
  '/accounting/trial-balance': TrialBalanceWorkspaceContent,
  '/sales/ar/customer-summary': CustomerSummaryPage,
  '/sales/ar/open-invoices': OpenInvoicesPage,
  '/sales/ar/aging': ArAgingPage,
  '/sales/ar/reconciliation': ArReconciliationPage,
  '/purchase/ap/vendor-summary': VendorSummaryPage,
  '/purchase/ap/open-bills': OpenBillsPage,
  '/purchase/ap/aging': ApAgingPage,
  '/purchase/ap/reconciliation': ApReconciliationPage,
  '/cash-bank/account-statement': CashBankAccountStatementPage,
}

const reportIconByItemId: Record<string, Component> = {
  'balance-sheet': Landmark,
  'profit-loss': TrendingUp,
  'cash-flow': WalletCards,
  'financial-summary': FileBarChart2,
  'general-ledger': BookOpen,
  'general-ledger-detail': FileSearch,
  'trial-balance': BookOpenCheck,
  'customer-summary': ReceiptText,
  'customer-ledger': ClipboardList,
  'ar-aging': LineChart,
  'open-invoices': FileText,
  'ar-reconciliation': Banknote,
  'vendor-summary': ReceiptText,
  'vendor-ledger': ClipboardList,
  'ap-aging': LineChart,
  'open-bills': FileText,
  'ap-reconciliation': Banknote,
  'stock-balance-report': Boxes,
  'stock-movement-report': PackageSearch,
  'stock-card': ClipboardList,
  'valuation-report': FileBarChart2,
  'low-stock-report': Boxes,
  'negative-stock-report': PackageSearch,
  'cash-bank-account-statement': WalletCards,
}

const reportSectionIconById: Record<string, Component> = {
  'financial-reports': Landmark,
  'general-ledger-reports': BookOpen,
  'sales-reports': ReceiptText,
  'purchase-reports': ClipboardList,
  'receivable-reports': WalletCards,
  'payable-reports': Banknote,
  'inventory-reports': Boxes,
  'order-financing-reports': PackageSearch,
  'other-reports': FileText,
  'audit-reports': FileSearch,
  'fixed-asset-reports': Landmark,
  'tax-reports': ReceiptText,
  'department-reports': FileBarChart2,
  'project-reports': LineChart,
  'manufacturing-reports': Boxes,
  'saved-reports': BookOpenCheck,
  'custom-reports': ClipboardList,
  'export-reports': FileText,
  'import-format-reports': FileSearch,
}

const cardTones: CardTone[] = [
  {
    card: 'border-emerald-300 bg-emerald-50 text-emerald-950 hover:border-emerald-500 hover:shadow-emerald-900/15',
    icon: 'text-emerald-600',
  },
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

function canAccessItem(item: SidebarMenuItem) {
  return auth.permissions.includes('*') || auth.permissions.includes(item.permission)
}

function itemText(item: SidebarMenuItem) {
  return `${item.label} ${item.endpoint} ${item.href}`.toLowerCase()
}

function matchesSearch(item: SidebarMenuItem) {
  const needle = search.value.trim().toLowerCase()
  return !needle || itemText(item).includes(needle)
}

function cardIcon(item: SidebarMenuItem) {
  return reportIconByItemId[item.id] ?? FileText
}

function sectionIcon(section: SidebarMenuSection) {
  return reportSectionIconById[section.id] ?? FileText
}

function cardTone(sectionIndex: number, itemIndex: number) {
  return cardTones[(sectionIndex + itemIndex) % cardTones.length] ?? cardTones[0]!
}

function shortReportLabel(label: string) {
  return label.replace('Laporan ', '').replace(' / Neraca', '')
}

const accessibleSections = computed<SidebarMenuSection[]>(() =>
  reportMenuSections
    .map((section) => ({
      ...section,
      children: section.children.filter(canAccessItem),
    }))
    .filter((section) => section.children.length > 0),
)

const activeSecondary = computed(() => tabs.activeSecondaryTab)
const visibleSectionIds = computed(() => new Set(accessibleSections.value.map((section) => section.id)))
const activeSidebarSectionId = computed(() => {
  if (activeSectionId.value && visibleSectionIds.value.has(activeSectionId.value)) {
    return activeSectionId.value
  }
  return accessibleSections.value[0]?.id ?? ''
})
const activeSection = computed(
  () =>
    accessibleSections.value.find((section) => section.id === activeSidebarSectionId.value) ??
    accessibleSections.value[0] ??
    null,
)
const activeSectionIndex = computed(() =>
  Math.max(
    accessibleSections.value.findIndex((section) => section.id === activeSidebarSectionId.value),
    0,
  ),
)
const activeSectionItems = computed(() => activeSection.value?.children.filter(matchesSearch) ?? [])
const activeSectionHasFrontendOnlyItems = computed(() =>
  activeSectionItems.value.some((item) => item.frontendOnly),
)

const allReportItems = computed(() => reportMenuSections.flatMap((section) => section.children))
const activeReportPath = computed(() =>
  activeSecondary.value?.mode === 'report'
    ? activeSecondary.value.workspacePath ?? String(activeSecondary.value.entityId ?? '')
    : '',
)
const activeReportItem = computed(() =>
  allReportItems.value.find((item) => item.href === activeReportPath.value) ?? null,
)
const activeReportComponent = computed(() =>
  activeReportPath.value ? reportComponentByPath[activeReportPath.value] : null,
)
const isReportOpen = computed(() => activeSecondary.value?.mode === 'report')

async function openReport(item: SidebarMenuItem) {
  activeSectionId.value =
    reportMenuSections.find((section) => section.children.some((child) => child.id === item.id))?.id ??
    activeSectionId.value
  await router.push(REPORTS_PRIMARY_ID)
  tabs.openPrimaryTab({
    id: REPORTS_PRIMARY_ID,
    label: 'Semua Laporan',
    path: REPORTS_PRIMARY_ID,
    closable: true,
  })
  tabs.openCustomSecondaryTab(REPORTS_PRIMARY_ID, {
    id: `${REPORTS_PRIMARY_ID}::report::${item.id}`,
    label: shortReportLabel(item.label),
    mode: 'report',
    entityId: item.href,
    workspacePath: item.href,
    endpoint: item.endpoint,
    permission: item.permission,
  })
}

function selectSection(section: SidebarMenuSection) {
  activeSectionId.value = section.id
}
</script>

<template>
  <component :is="activeReportComponent" v-if="isReportOpen && activeReportComponent" />

  <div
    v-else-if="isReportOpen"
    class="workspace-card tablet-workspace-card tablet-workspace-card-gap flex min-w-0 flex-col gap-4 rounded-b-3xl rounded-tr-3xl border border-slate-200 bg-white p-5 shadow-sm"
  >
    <div class="border-b border-slate-100 pb-4">
      <p class="text-xs font-bold uppercase tracking-wide text-[#1d81af]">Reports</p>
      <h1 class="mt-1 text-xl font-black text-slate-950">
        {{ activeReportItem?.label ?? activeSecondary?.label ?? 'Laporan' }}
      </h1>
    </div>
    <div class="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
      <p class="text-sm font-semibold text-slate-600">
        {{
          activeReportItem?.frontendOnly
            ? 'Laporan ini baru disiapkan di frontend. Endpoint backend belum tersedia.'
            : 'Halaman laporan ini belum memiliki workspace khusus.'
        }}
      </p>
      <p class="mt-2 text-sm text-slate-500">
        Referensi endpoint:
        <span class="font-bold text-slate-700">
          {{
            activeReportItem?.frontendOnly
              ? activeReportItem?.endpoint
              : `GET /api${activeReportItem?.endpoint ?? activeSecondary?.endpoint}`
          }}
        </span>
      </p>
    </div>
  </div>

  <section
    v-else
    class="workspace-card tablet-workspace-card tablet-workspace-card-gap flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-b-3xl rounded-tr-3xl border border-slate-200 bg-white shadow-sm"
  >
    <header class="flex flex-none flex-col gap-4 border-b border-slate-100 p-5">
      <div class="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-wide text-[#1d81af]">Daftar</p>
          <h1 class="mt-1 truncate text-2xl font-black tracking-tight text-slate-950">
            {{ activeSection?.label ?? 'Semua Laporan' }}
          </h1>
          <p class="mt-1 text-sm font-semibold text-slate-500">
            Pilih menu laporan di sidebar untuk menampilkan daftar laporan pada kategori tersebut.
          </p>
        </div>
        <label class="relative block min-w-0 xl:w-[420px]">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            v-model="search"
            type="search"
            class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#24a1db] focus:bg-white focus:ring-2 focus:ring-[#e9f6fb]"
            placeholder="Cari laporan"
          />
        </label>
      </div>
    </header>

    <div class="grid min-h-0 min-w-0 flex-1 overflow-hidden md:grid-cols-[272px_minmax(0,1fr)]">
      <aside class="hidden min-h-0 border-r border-white/10 bg-[#06131e] p-2 text-white md:block">
        <div class="space-y-1">
          <button
            v-for="section in accessibleSections"
            :key="section.id"
            type="button"
            :class="
              cn(
                'group flex min-h-10 w-full items-center gap-3 px-4 text-left text-sm font-semibold transition',
                section.id === activeSidebarSectionId
                  ? 'rounded-2xl bg-[#b4db24] text-[#06131e]'
                  : 'rounded-xl text-white/72 hover:bg-white/10 hover:text-white',
              )
            "
            @click="selectSection(section)"
          >
            <component
              :is="sectionIcon(section)"
              :class="
                cn(
                  'h-4 w-4 shrink-0',
                  section.id === activeSidebarSectionId ? 'text-[#06131e]' : 'text-white/70 group-hover:text-white',
                )
              "
              stroke-width="2"
            />
            <span class="truncate">{{ section.label }}</span>
            <span
              :class="
                cn(
                  'ml-auto h-2 w-2 shrink-0 rounded-full transition',
                  section.id === activeSidebarSectionId ? 'bg-[#06131e]' : 'bg-transparent group-hover:bg-white/30',
                )
              "
            />
          </button>
        </div>
      </aside>

      <div class="workspace-scrollbar min-h-0 min-w-0 overflow-y-auto p-5">
        <div v-if="accessibleSections.length === 0" class="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <p class="text-sm font-bold text-slate-600">Tidak ada laporan yang cocok.</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-if="activeSectionHasFrontendOnlyItems"
            class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
          >
            Catatan: sebagian daftar laporan pada menu ini baru disimpan di frontend dan belum memiliki endpoint backend.
          </div>

          <section class="space-y-3">
            <h2 class="text-sm font-black text-slate-700">{{ activeSection?.label }}</h2>
            <div class="grid grid-cols-[repeat(auto-fill,minmax(142px,1fr))] gap-3">
              <button
                v-for="(item, itemIndex) in activeSectionItems"
                :key="item.id"
                type="button"
                :class="
                  cn(
                    'group relative flex min-h-32 flex-col items-center justify-center gap-3 rounded-md border px-3 py-4 text-center text-sm font-medium leading-snug transition hover:-translate-y-0.5 hover:shadow-lg',
                    cardTone(activeSectionIndex, itemIndex).card,
                  )
                "
                @click="openReport(item)"
              >
                <span
                  v-if="item.frontendOnly"
                  class="absolute right-2 top-2 rounded-full border border-amber-200 bg-white/80 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700"
                >
                  Draft
                </span>
                <component
                  :is="cardIcon(item)"
                  :class="
                    cn('h-9 w-9 transition group-hover:scale-105', cardTone(activeSectionIndex, itemIndex).icon)
                  "
                  stroke-width="1.8"
                />
                <span>{{ item.label }}</span>
              </button>
            </div>
            <div
              v-if="activeSectionItems.length === 0"
              class="rounded-2xl border border-dashed border-slate-200 p-8 text-center"
            >
              <p class="text-sm font-bold text-slate-600">Tidak ada laporan yang cocok di menu ini.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </section>
</template>
