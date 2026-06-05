import type { Component } from 'vue'

import {
  BookOpen,
  ClipboardList,
  Database,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  WalletCards,
  Warehouse,
} from 'lucide-vue-next'

export type SidebarMenuItem = {
  id: string
  label: string
  href: string
  permission: string
  endpoint: string
  module: string
  openAsPrimaryTab: true
  implemented: boolean
}

export type SidebarMenuSection = {
  id: string
  label: string
  children: SidebarMenuItem[]
}

export type SidebarMenuNode = SidebarMenuItem | SidebarMenuSection

export type SidebarMenuGroup = {
  key: string
  label: string
  icon: Component
  href?: string
  endpoint?: string
  items: SidebarMenuNode[]
}

function item(
  module: string,
  id: string,
  label: string,
  href: string,
  endpoint: string,
  permission: string,
  implemented = false,
): SidebarMenuItem {
  return { module, id, label, href, endpoint, permission, implemented, openAsPrimaryTab: true }
}

function section(id: string, label: string, children: SidebarMenuItem[]): SidebarMenuSection {
  return { id, label, children }
}

export function isSidebarMenuSection(node: SidebarMenuNode): node is SidebarMenuSection {
  return 'children' in node
}

function flattenSidebarMenuNodes(nodes: SidebarMenuNode[]): SidebarMenuItem[] {
  return nodes.flatMap((node) => (isSidebarMenuSection(node) ? node.children : node))
}

export const sidebarMenuGroups: SidebarMenuGroup[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    endpoint: '/accounting/fiscal-year/status',
    items: [],
  },
  {
    key: 'master-data',
    label: 'Master Data',
    icon: Database,
    items: [
      item(
        'master-data',
        'coa',
        'Daftar Akun',
        '/accounting/chart-of-accounts',
        '/master-data/chart-of-accounts',
        'coa.view',
        true,
      ),
      item(
        'master-data',
        'contacts',
        'Kontak',
        '/master-data/contacts',
        '/master-data/contacts',
        'contacts.view',
      ),
      item(
        'master-data',
        'payment-terms',
        'Syarat Pembayaran',
        '/master-data/payment-terms',
        '/master-data/payment-terms',
        'payment_terms.view',
      ),
      item(
        'master-data',
        'units',
        'Satuan',
        '/master-data/units',
        '/master-data/units',
        'units.view',
      ),
      item(
        'master-data',
        'departments',
        'Departemen',
        '/master-data/departments',
        '/master-data/departments',
        'departments.view',
      ),
      item(
        'master-data',
        'projects',
        'Proyek',
        '/master-data/projects',
        '/master-data/projects',
        'projects.view',
      ),
      item(
        'master-data',
        'account-mappings',
        'Pemetaan Akun',
        '/settings/account-mappings',
        '/master-data/account-mappings',
        'settings.company.view',
      ),
    ],
  },
  {
    key: 'general-ledger',
    label: 'Buku Besar',
    icon: ClipboardList,
    items: [
      item(
        'general-ledger',
        'journals',
        'Jurnal Umum',
        '/accounting/journals',
        '/journals',
        'journal.view',
        true,
      ),
      item(
        'general-ledger',
        'fiscal-closing',
        'Tutup Buku',
        '/accounting/fiscal-closing',
        '/accounting/fiscal-year/status',
        'fiscal_year.view',
        true,
      ),
      // TODO: wire to a dedicated period lock workspace when the backend/page is available.
      item(
        'general-ledger',
        'period-locks',
        'Kunci Periode',
        '/accounting/period-locks',
        '/accounting/fiscal-year/status',
        'fiscal_year.view',
        true,
      ),
    ],
  },
  {
    key: 'sales',
    label: 'Penjualan',
    icon: ShoppingCart,
    items: [
      item(
        'sales',
        'sales-quotations',
        'Penawaran Penjualan',
        '/sales/quotations',
        '/sales/quotations',
        'sales.quotations.view',
      ),
      item(
        'sales',
        'sales-orders',
        'Pesanan Penjualan',
        '/sales/orders',
        '/sales/orders',
        'sales.orders.view',
      ),
      item(
        'sales',
        'delivery-orders',
        'Pengiriman Barang',
        '/sales/delivery-orders',
        '/sales/delivery-orders',
        'sales.delivery_orders.view',
      ),
      item(
        'sales',
        'proforma-invoices',
        'Proforma Invoice',
        '/sales/proformas',
        '/sales/proformas',
        'sales.proformas.view',
      ),
      item(
        'sales',
        'sales-invoices',
        'Faktur Penjualan',
        '/sales/invoices',
        '/sales/invoices',
        'sales.invoices.view',
      ),
      item(
        'sales',
        'billing-invoices',
        'Tagihan Penjualan',
        '/sales/billings',
        '/sales/billings',
        'sales.billings.view',
      ),
      item(
        'sales',
        'customer-deposits',
        'Uang Muka Pelanggan',
        '/sales/customer-deposits',
        '/sales/customer-deposits',
        'sales.deposits.view',
      ),
      item(
        'sales',
        'sales-receipts',
        'Penerimaan Penjualan',
        '/sales/receipts',
        '/sales/receipts',
        'sales.receipts.view',
      ),
      item(
        'sales',
        'sales-returns',
        'Retur Penjualan',
        '/sales/returns',
        '/sales/returns',
        'sales.returns.view',
      ),
    ],
  },
  {
    key: 'purchase',
    label: 'Pembelian',
    icon: ShoppingCart,
    items: [
      item(
        'purchase',
        'purchase-requests',
        'Permintaan Pembelian',
        '/purchase/requests',
        '/purchase/requests',
        'purchase.requests.view',
      ),
      item(
        'purchase',
        'purchase-orders',
        'Pesanan Pembelian',
        '/purchase/orders',
        '/purchase/orders',
        'purchase.orders.view',
      ),
      item(
        'purchase',
        'goods-receipts',
        'Penerimaan Barang',
        '/purchase/goods-receipts',
        '/purchase/goods-receipts',
        'purchase.goods_receipts.view',
      ),
      item(
        'purchase',
        'vendor-bills',
        'Faktur Pembelian',
        '/purchase/bills',
        '/purchase/bills',
        'purchase.bills.view',
      ),
      item(
        'purchase',
        'vendor-deposits',
        'Uang Muka Pemasok',
        '/purchase/vendor-deposits',
        '/purchase/vendor-deposits',
        'purchase.deposits.view',
      ),
      item(
        'purchase',
        'vendor-payments',
        'Pembayaran Pemasok',
        '/purchase/payments',
        '/purchase/payments',
        'purchase.payments.view',
      ),
      item(
        'purchase',
        'purchase-returns',
        'Retur Pembelian',
        '/purchase/returns',
        '/purchase/returns',
        'purchase.returns.view',
      ),
    ],
  },
  {
    key: 'cash-bank',
    label: 'Buku Bank',
    icon: WalletCards,
    items: [
      item(
        'cash-bank',
        'cash-bank-accounts',
        'Daftar Rekening',
        '/cash-bank/accounts',
        '/cash-bank/accounts',
        'cash_bank.view',
      ),
      item(
        'cash-bank',
        'cash-receipts',
        'Penerimaan Kas',
        '/cash-bank/cash-receipts',
        '/cash-bank/cash-receipts',
        'cash_bank.view',
      ),
      item(
        'cash-bank',
        'cash-payments',
        'Pengeluaran Kas',
        '/cash-bank/cash-payments',
        '/cash-bank/cash-payments',
        'cash_bank.view',
      ),
      item(
        'cash-bank',
        'bank-transfers',
        'Transfer Antar Rekening',
        '/cash-bank/bank-transfers',
        '/cash-bank/bank-transfers',
        'cash_bank.view',
      ),
      item(
        'cash-bank',
        'bank-reconciliation',
        'Rekonsiliasi Bank',
        '/cash-bank/bank-reconciliations',
        '/cash-bank/bank-reconciliations',
        'cash_bank.view',
      ),
    ],
  },
  {
    key: 'inventory',
    label: 'Persediaan',
    icon: Warehouse,
    items: [
      item(
        'inventory',
        'products',
        'Barang & Jasa',
        '/master-data/products',
        '/master-data/products',
        'products.view',
      ),
      item(
        'inventory',
        'product-categories',
        'Kategori Barang',
        '/master-data/product-categories',
        '/master-data/product-categories',
        'products.view',
      ),
      item(
        'inventory',
        'warehouses',
        'Gudang',
        '/master-data/warehouses',
        '/master-data/warehouses',
        'warehouses.view',
      ),
      item(
        'inventory',
        'stock-balances',
        'Saldo Persediaan',
        '/inventory/stock-balances',
        '/inventory/stock-balances',
        'inventory.stock.view',
      ),
      item(
        'inventory',
        'stock-movements',
        'Mutasi Persediaan',
        '/inventory/stock-movements',
        '/inventory/stock-movements',
        'inventory.movements.view',
      ),
      item(
        'inventory',
        'stock-adjustments',
        'Penyesuaian Persediaan',
        '/inventory/stock-adjustments',
        '/inventory/stock-adjustments',
        'inventory.adjustments.view',
      ),
      item(
        'inventory',
        'stock-opnames',
        'Stock Opname',
        '/inventory/stock-opnames',
        '/inventory/stock-opnames',
        'inventory.opname.view',
      ),
    ],
  },
  {
    key: 'reports',
    label: 'Laporan',
    icon: BookOpen,
    items: [
      section('financial-reports', 'Laporan Keuangan', [
        item(
          'reports',
          'balance-sheet',
          'Laporan Posisi Keuangan / Neraca',
          '/reports/balance-sheet',
          '/reports/balance-sheet',
          'reports.view',
          true,
        ),
        item(
          'reports',
          'profit-loss',
          'Laporan Laba Rugi',
          '/reports/profit-loss',
          '/reports/profit-loss',
          'reports.view',
          true,
        ),
        item(
          'reports',
          'cash-flow',
          'Laporan Arus Kas',
          '/reports/cash-flow',
          '/reports/cash-flow',
          'reports.view',
          true,
        ),
        item(
          'reports',
          'financial-summary',
          'Ringkasan Keuangan',
          '/reports/financial-summary',
          '/reports/financial-summary',
          'reports.view',
          true,
        ),
      ]),
      section('general-ledger-reports', 'Laporan Buku Besar', [
        item(
          'reports',
          'general-ledger',
          'Buku Besar',
          '/reports/general-ledger',
          '/reports/general-ledger',
          'reports.view',
          true,
        ),
        item(
          'reports',
          'general-ledger-detail',
          'Detail Buku Besar',
          '/reports/general-ledger-detail',
          '/reports/general-ledger-detail',
          'reports.view',
        ),
        item(
          'reports',
          'trial-balance',
          'Neraca Saldo',
          '/accounting/trial-balance',
          '/reports/trial-balance',
          'reports.view',
          true,
        ),
      ]),
      section('receivable-reports', 'Laporan Piutang Usaha', [
        item(
          'reports',
          'customer-summary',
          'Ringkasan Piutang',
          '/sales/ar/customer-summary',
          '/sales/ar/customer-summary',
          'sales.ar.view',
        ),
        item(
          'reports',
          'customer-ledger',
          'Buku Pembantu Piutang',
          '/sales/ar/customer-ledger',
          '/sales/ar/customers/:customerId/ledger',
          'sales.ar.view',
        ),
        item(
          'reports',
          'ar-aging',
          'Umur Piutang',
          '/sales/ar/aging',
          '/sales/ar/aging',
          'sales.ar.view',
        ),
        item(
          'reports',
          'open-invoices',
          'Faktur Belum Lunas',
          '/sales/ar/open-invoices',
          '/sales/ar/open-invoices',
          'sales.ar.view',
        ),
        item(
          'reports',
          'ar-reconciliation',
          'Rekonsiliasi Piutang',
          '/sales/ar/reconciliation',
          '/sales/ar/reconciliation',
          'sales.ar.reconcile',
        ),
      ]),
      section('payable-reports', 'Laporan Hutang Usaha', [
        item(
          'reports',
          'vendor-summary',
          'Ringkasan Hutang',
          '/purchase/ap/vendor-summary',
          '/purchase/ap/vendor-summary',
          'purchase.ap.view',
        ),
        item(
          'reports',
          'vendor-ledger',
          'Buku Pembantu Hutang',
          '/purchase/ap/vendor-ledger',
          '/purchase/ap/vendors/:vendorId/ledger',
          'purchase.ap.view',
        ),
        item(
          'reports',
          'ap-aging',
          'Umur Hutang',
          '/purchase/ap/aging',
          '/purchase/ap/aging',
          'purchase.ap.view',
        ),
        item(
          'reports',
          'open-bills',
          'Tagihan Belum Lunas',
          '/purchase/ap/open-bills',
          '/purchase/ap/open-bills',
          'purchase.ap.view',
        ),
        item(
          'reports',
          'ap-reconciliation',
          'Rekonsiliasi Hutang',
          '/purchase/ap/reconciliation',
          '/purchase/ap/reconciliation',
          'purchase.ap.reconcile',
        ),
      ]),
      section('inventory-reports', 'Laporan Persediaan', [
        item(
          'reports',
          'stock-balance-report',
          'Saldo Persediaan',
          '/inventory/reports/stock-balances',
          '/inventory/reports/stock-balances',
          'inventory.reports.view',
        ),
        item(
          'reports',
          'stock-movement-report',
          'Mutasi Persediaan',
          '/inventory/reports/stock-movements',
          '/inventory/reports/stock-movements',
          'inventory.reports.view',
        ),
        item(
          'reports',
          'stock-card',
          'Kartu Stok',
          '/inventory/reports/stock-card',
          '/inventory/reports/stock-card',
          'inventory.reports.view',
        ),
        item(
          'reports',
          'valuation-report',
          'Penilaian Persediaan',
          '/inventory/reports/valuation',
          '/inventory/reports/valuation',
          'inventory.reports.view',
        ),
        item(
          'reports',
          'low-stock-report',
          'Persediaan Minimum',
          '/inventory/reports/low-stock',
          '/inventory/reports/low-stock',
          'inventory.reports.view',
        ),
        item(
          'reports',
          'negative-stock-report',
          'Persediaan Negatif',
          '/inventory/reports/negative-stock',
          '/inventory/reports/negative-stock',
          'inventory.reports.view',
        ),
      ]),
      section('cash-bank-reports', 'Laporan Kas & Bank', [
        item(
          'reports',
          'cash-bank-account-statement',
          'Mutasi Rekening',
          '/cash-bank/account-statement',
          '/cash-bank/reports/account-statement',
          'cash_bank.view',
          true,
        ),
      ]),
    ],
  },
  {
    key: 'settings-access',
    label: 'Pengaturan & Akses',
    icon: Settings,
    items: [
      item(
        'settings-access',
        'company-settings',
        'Pengaturan Perusahaan',
        '/settings/company',
        '/settings/company',
        'settings.company.view',
        true,
      ),
      item(
        'settings-access',
        'access-company-users',
        'Pengguna',
        '/access/company-users',
        '/access/company-users',
        'access.users.view',
        true,
      ),
      item(
        'settings-access',
        'access-roles',
        'Peran & Hak Akses',
        '/access/roles',
        '/access/roles',
        'access.roles.view',
        true,
      ),
      item(
        'settings-access',
        'access-user-permissions',
        'Hak Akses Pengguna',
        '/access/permissions',
        '/access/permission-catalog',
        'access.permissions.view',
        true,
      ),
      item(
        'settings-access',
        'access-invitations',
        'Undangan Pengguna',
        '/access/invitations',
        '/access/invitations',
        'access.invitations.view',
        true,
      ),
      item(
        'settings-access',
        'access-audit',
        'Audit Akses',
        '/access/audit',
        '/access/audit',
        'access.audit.view',
        true,
      ),
    ],
  },
]

export const sidebarItems = sidebarMenuGroups.flatMap((group) =>
  flattenSidebarMenuNodes(group.items),
)
export const sidebarPlaceholderItems = sidebarItems.filter((menuItem) => !menuItem.implemented)

export function findSidebarMenuItem(href: string) {
  return sidebarItems.find((menuItem) => menuItem.href === href)
}
