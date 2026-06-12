import { api } from '@/api'
import type { ApiResponse } from '@/services/apiResponse'
import { unwrap } from '@/services/apiResponse'

export type BackendResourceRow = {
  id: string
  [key: string]: unknown
}

export type BackendResourceListResult = {
  rows: BackendResourceRow[]
  pagination: {
    page: number
    perPage: number
    total: number
    lastPage: number
    from?: number | null
    to?: number | null
  } | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function extractRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload

  const record = asRecord(payload)
  if (!record) return []

  for (const key of ['data', 'items', 'records', 'results', 'rows', 'lines', 'accounts']) {
    const value = record[key]
    if (Array.isArray(value)) return value
    if (key === 'data' && asRecord(value)) return extractRows(value)
  }

  return [record]
}

function numberFrom(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const parsed = Number(record[key])
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function extractPagination(payload: unknown, rowCount: number) {
  const record = asRecord(payload)
  if (!record) return null
  const nested = asRecord(record.data)
  const candidates = [
    record,
    asRecord(record.meta),
    asRecord(record.pagination),
    nested,
    nested ? asRecord(nested.meta) : null,
    nested ? asRecord(nested.pagination) : null,
  ].filter((value): value is Record<string, unknown> => value != null)

  for (const candidate of candidates) {
    const page = numberFrom(candidate, ['current_page', 'page', 'currentPage'])
    const perPage = numberFrom(candidate, ['per_page', 'perPage', 'page_size', 'pageSize'])
    const total = numberFrom(candidate, ['total'])
    const lastPage = numberFrom(candidate, ['last_page', 'lastPage'])
    const from = numberFrom(candidate, ['from'])
    const to = numberFrom(candidate, ['to'])
    if (page == null && perPage == null && total == null && lastPage == null) continue

    const safePerPage = Math.max(1, perPage ?? rowCount ?? 1)
    const safeTotal = Math.max(0, total ?? rowCount)
    return {
      page: Math.max(1, page ?? 1),
      perPage: safePerPage,
      total: safeTotal,
      lastPage: Math.max(1, lastPage ?? Math.ceil(safeTotal / safePerPage)),
      from,
      to,
    }
  }

  return null
}

function rowId(row: Record<string, unknown>, index: number) {
  if (row.mapping_key != null && String(row.mapping_key) !== '') return String(row.mapping_key)

  for (const key of ['id', 'uuid', 'code', 'account_code', 'document_number', 'number', 'mapping_key']) {
    const value = row[key]
    if (value != null && String(value) !== '') return String(value)
  }

  return `row-${index + 1}`
}

function sortNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeRows(endpoint: string, rows: BackendResourceRow[]) {
  if (endpoint !== '/master-data/account-mappings') return rows

  return rows
    .filter((row) => row.visible_in_settings === true)
    .sort((left, right) => {
      const leftOrder = sortNumber(left.settings_order, 999)
      const rightOrder = sortNumber(right.settings_order, 999)
      if (leftOrder !== rightOrder) return leftOrder - rightOrder

      const leftSection = String(left.settings_section ?? '')
      const rightSection = String(right.settings_section ?? '')
      if (leftSection !== rightSection) return leftSection.localeCompare(rightSection)

      return String(left.mapping_key ?? '').localeCompare(String(right.mapping_key ?? ''))
    })
}

export async function listBackendResource(endpoint: string, params: Record<string, unknown> = {}): Promise<BackendResourceListResult> {
  const response = await api.get<ApiResponse<unknown>>(endpoint, { params })
  const payload = unwrap(response.data)

  const rows = normalizeRows(endpoint, extractRows(payload)
    .map(asRecord)
    .filter((row): row is Record<string, unknown> => row != null)
    .map((row, index) => ({ ...row, id: rowId(row, index) }) as BackendResourceRow))

  return { rows, pagination: extractPagination(payload, rows.length) }
}
