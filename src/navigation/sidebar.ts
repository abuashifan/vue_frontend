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
  frontendOnly?: boolean
  note?: string
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
  options: Pick<SidebarMenuItem, 'frontendOnly' | 'note'> = {},
): SidebarMenuItem {
  return { module, id, label, href, endpoint, permission, implemented, openAsPrimaryTab: true, ...options }
}

function section(id: string, label: string, children: SidebarMenuItem[]): SidebarMenuSection {
  return { id, label, children }
}

function frontendReport(id: string, label: string): SidebarMenuItem {
  return item(
    'reports',
    id,
    label,
    `/reports/frontend-only/${id}`,
    `/reports/frontend-only/${id}`,
    'reports.view',
    false,
    {
      frontendOnly: true,
      note: 'Daftar laporan ini baru disiapkan di frontend. Endpoint backend belum tersedia.',
    },
  )
}

export function isSidebarMenuSection(node: SidebarMenuNode): node is SidebarMenuSection {
  return 'children' in node
}

function flattenSidebarMenuNodes(nodes: SidebarMenuNode[]): SidebarMenuItem[] {
  return nodes.flatMap((node) => (isSidebarMenuSection(node) ? node.children : node))
}

export const reportMenuSections: SidebarMenuSection[] = [
  section('financial-reports', 'Laporan Keuangan', [
    item(
      'reports',
      'balance-sheet',
      'Neraca (Standar)',
      '/reports/balance-sheet',
      '/reports/balance-sheet',
      'reports.view',
      true,
    ),
    frontendReport('balance-sheet-branch', 'Neraca (Standar) - Cabang'),
    item(
      'reports',
      'profit-loss',
      'Laba Rugi (Standar)',
      '/reports/profit-loss',
      '/reports/profit-loss',
      'reports.view',
      true,
    ),
    frontendReport('profit-loss-branch', 'Laba Rugi (Standar) - Cabang'),
    frontendReport('retained-earnings', 'Laba Ditahan'),
    item(
      'reports',
      'cash-flow',
      'Arus Kas (Metode Langsung) - Rincian',
      '/reports/cash-flow',
      '/reports/cash-flow',
      'reports.view',
      true,
    ),
    frontendReport('balance-sheet-parent-subsidiary', 'Neraca (Induk Skontro)'),
    frontendReport('balance-sheet-multi-period', 'Neraca (Multi Periode)'),
    frontendReport('balance-sheet-month-comparison', 'Neraca (Perbandingan Bulan)'),
    frontendReport('balance-sheet-budget-comparison', 'Neraca (Perbandingan Anggaran)'),
    frontendReport('balance-sheet-budget-period', 'Neraca (Anggaran Periode)'),
    frontendReport('profit-loss-multi-period', 'Laba Rugi (Multi Periode)'),
    frontendReport('profit-loss-multi-period-new', 'Laba Rugi (Multi Periode NEW)'),
    frontendReport('profit-loss-month-comparison', 'Laba Rugi (Perbandingan Bulan)'),
    frontendReport('profit-loss-budget-comparison', 'Laba Rugi (Perbandingan Anggaran)'),
    item(
      'reports',
      'financial-summary',
      'Keuangan - Ringkasan',
      '/reports/financial-summary',
      '/reports/financial-summary',
      'reports.view',
      true,
    ),
    frontendReport('cash-flow-indirect-summary', 'Arus Kas (Metode Tidak Langsung) - Ringkasan'),
    frontendReport('cash-flow-indirect-detail', 'Arus Kas (Metode Tidak Langsung) - Rincian'),
    frontendReport('owner-equity-changes', 'Perubahan Ekuitas Pemilik'),
    frontendReport('projected-cash-flow-detail', 'Arus Kas Terproyek - Rincian'),
  ]),
  section('general-ledger-reports', 'Buku Besar', [
    item(
      'reports',
      'general-ledger',
      'Buku Besar - Ringkasan',
      '/reports/general-ledger',
      '/reports/general-ledger',
      'reports.view',
      true,
    ),
    item(
      'reports',
      'general-ledger-detail',
      'Buku Besar - Rincian',
      '/reports/general-ledger-detail',
      '/reports/general-ledger-detail',
      'reports.view',
    ),
    frontendReport('all-journals', 'Semua Jurnal'),
    item(
      'reports',
      'trial-balance',
      'Neraca Saldo',
      '/accounting/trial-balance',
      '/reports/trial-balance',
      'reports.view',
      true,
    ),
    frontendReport('purchase-journal', 'Jurnal Pembelian'),
    frontendReport('sales-journal', 'Jurnal Penjualan'),
    frontendReport('general-journal-summary', 'Ringkasan Jurnal Umum'),
    frontendReport('general-journal-voucher', 'Bukti Jurnal Umum'),
    frontendReport('other-payment-summary', 'Pembayaran Lainnya - Ringkasan'),
    frontendReport('other-payment-detail', 'Pembayaran Lainnya Rincian'),
    frontendReport('chart-of-accounts-report', 'Daftar Akun'),
    frontendReport('general-ledger-history-list', 'Daftar Histori Buku Besar'),
    frontendReport('general-ledger-budget-list', 'Daftar Anggaran Buku Besar'),
    frontendReport('bank-book-list', 'Daftar Buku Bank'),
    frontendReport('other-receipt-summary', 'Penerimaan Lainnya - Ringkasan'),
    frontendReport('other-receipt-detail', 'Penerimaan Lainnya - Rincian'),
    frontendReport('transaction-journal', 'Jurnal Transaksi'),
  ]),
  section('sales-reports', 'Laporan Penjualan', [
    frontendReport('sales-by-customer', 'Penjualan per Pelanggan'),
    frontendReport('sales-by-item', 'Penjualan per Barang'),
    frontendReport('sales-by-salesperson', 'Penjualan per Sales'),
    frontendReport('sales-order-summary', 'Ringkasan Sales Order'),
    frontendReport('sales-return-summary', 'Retur Penjualan'),
  ]),
  section('purchase-reports', 'Laporan Pembelian', [
    frontendReport('purchase-by-vendor', 'Pembelian per Pemasok'),
    frontendReport('purchase-by-item', 'Pembelian per Barang'),
    frontendReport('purchase-order-summary', 'Ringkasan Purchase Order'),
    frontendReport('purchase-return-summary', 'Retur Pembelian'),
  ]),
  section('receivable-reports', 'Akun Piutang dan Pelanggan', [
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
  section('payable-reports', 'Akun Hutang dan Pemasok', [
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
  section('inventory-reports', 'Barang', [
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
  section('order-financing-reports', 'Pembiayaan Pesanan', [
    frontendReport('order-financing-summary', 'Ringkasan Pembiayaan Pesanan'),
    frontendReport('order-financing-due', 'Pembiayaan Jatuh Tempo'),
    frontendReport('order-financing-reconciliation', 'Rekonsiliasi Pembiayaan Pesanan'),
  ]),
  section('other-reports', 'Laporan Lainnya', [
    item(
      'reports',
      'cash-bank-account-statement',
      'Mutasi Rekening',
      '/cash-bank/account-statement',
      '/cash-bank/reports/account-statement',
      'cash_bank.view',
      true,
    ),
    frontendReport('activity-summary', 'Ringkasan Aktivitas'),
    frontendReport('transaction-list', 'Daftar Transaksi'),
  ]),
  section('audit-reports', 'Laporan Audit', [
    frontendReport('audit-trail', 'Audit Trail'),
    frontendReport('user-activity-log', 'Aktivitas Pengguna'),
    frontendReport('data-change-log', 'Perubahan Data'),
  ]),
  section('fixed-asset-reports', 'Aktiva Tetap', [
    frontendReport('fixed-asset-register', 'Daftar Aktiva Tetap'),
    frontendReport('fixed-asset-depreciation', 'Penyusutan Aktiva Tetap'),
    frontendReport('fixed-asset-disposal', 'Pelepasan Aktiva Tetap'),
  ]),
  section('tax-reports', 'Laporan Pajak', [
    frontendReport('tax-summary', 'Ringkasan Pajak'),
    frontendReport('vat-in', 'PPN Masukan'),
    frontendReport('vat-out', 'PPN Keluaran'),
    frontendReport('withholding-tax', 'PPh Potong/Pungut'),
  ]),
  section('department-reports', 'Laporan Departemen', [
    frontendReport('department-profit-loss', 'Laba Rugi per Departemen'),
    frontendReport('department-expense', 'Biaya per Departemen'),
  ]),
  section('project-reports', 'Laporan Proyek', [
    frontendReport('project-profit-loss', 'Laba Rugi per Proyek'),
    frontendReport('project-cost', 'Biaya Proyek'),
    frontendReport('project-budget-realization', 'Realisasi Anggaran Proyek'),
  ]),
  section('manufacturing-reports', 'Laporan Manufaktur', [
    frontendReport('production-summary', 'Ringkasan Produksi'),
    frontendReport('bill-of-material-usage', 'Pemakaian Bill of Material'),
    frontendReport('work-order-status', 'Status Work Order'),
  ]),
  section('saved-reports', 'Laporan Tersimpan', [
    frontendReport('saved-report-list', 'Daftar Laporan Tersimpan'),
    frontendReport('scheduled-reports', 'Laporan Terjadwal'),
  ]),
  section('custom-reports', 'Custom Reports', [
    frontendReport('custom-report-builder', 'Report Builder'),
    frontendReport('custom-report-list', 'Daftar Custom Report'),
  ]),
  section('export-reports', 'Ekspor Laporan', [
    frontendReport('export-queue', 'Antrean Ekspor'),
    frontendReport('export-history', 'Riwayat Ekspor'),
  ]),
  section('import-format-reports', 'Laporan Format Impor', [
    frontendReport('import-format-list', 'Daftar Format Impor'),
    frontendReport('import-validation-report', 'Laporan Validasi Impor'),
  ]),
]

export const reportMenuItems = flattenSidebarMenuNodes(reportMenuSections)

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
    href: '/reports',
    endpoint: '/reports',
    items: [],
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

export const sidebarItems = [
  ...sidebarMenuGroups.flatMap((group) => flattenSidebarMenuNodes(group.items)),
  ...reportMenuItems,
]
export const sidebarPlaceholderItems = sidebarItems.filter((menuItem) => !menuItem.implemented)

export function findSidebarMenuItem(href: string) {
  return sidebarItems.find((menuItem) => menuItem.href === href)
}
