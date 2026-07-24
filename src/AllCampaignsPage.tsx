import { useMemo, useRef, useState, useEffect } from 'react'
import { BadgeStatus } from 'agilysys-unity-widget-react'
import { MoreHorizontal, Copy, BarChart2, Search, Filter } from 'lucide-react'

type CampaignStatus = 'active' | 'paused'
type CampaignLifecycle = 'active' | 'archived'

interface CampaignRow {
  id: string
  name: string
  type: string
  template: string
  status: CampaignStatus
  lifecycle: CampaignLifecycle
  hierarchy: string
  productName: string
  category: string
  occurrence: string
  marketing: string
  sent: number
  openRate: number | null
}

type FilterKey = 'type' | 'template' | 'hierarchy' | 'productName' | 'category' | 'occurrence' | 'marketing'

const FILTER_ITEMS: Array<{ key: FilterKey; label: string }> = [
  { key: 'type', label: 'Type' },
  { key: 'template', label: 'Template' },
  { key: 'productName', label: 'Product' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'hierarchy', label: 'Hierarchy' },
  { key: 'category', label: 'Category' },
  { key: 'occurrence', label: 'Occurrence' },
]

const INITIAL_CAMPAIGNS: CampaignRow[] = [
  {
    id: 'c1',
    name: 'Pre-Arrival Welcome',
    type: 'Event Driven',
    template: 'Welcome Template',
    status: 'active',
    lifecycle: 'active',
    hierarchy: 'Property',
    productName: 'Reserve',
    category: 'Pre-Stay',
    occurrence: 'Every Booking',
    marketing: 'Email',
    sent: 12420,
    openRate: 41,
  },
  {
    id: 'c2',
    name: 'Post-Stay Thank You',
    type: 'Scheduled',
    template: 'Thank You Template',
    status: 'active',
    lifecycle: 'active',
    hierarchy: 'Brand',
    productName: 'Engage',
    category: 'Post-Stay',
    occurrence: 'One Time',
    marketing: 'Email',
    sent: 6840,
    openRate: 36,
  },
  {
    id: 'c3',
    name: 'Weekend Golf Package',
    type: 'On Demand',
    template: 'Promotion Template',
    status: 'paused',
    lifecycle: 'archived',
    hierarchy: 'Property',
    productName: 'Reserve',
    category: 'Promotion',
    occurrence: 'Manual',
    marketing: 'Email',
    sent: 2544,
    openRate: 29,
  },
  {
    id: 'c4',
    name: 'Spa Re-Engagement',
    type: 'Scheduled',
    template: 'Re-Engagement Template',
    status: 'paused',
    lifecycle: 'archived',
    hierarchy: 'Segment',
    productName: 'SPA',
    category: 'Re-Engagement',
    occurrence: 'Monthly',
    marketing: 'SMS',
    sent: 1122,
    openRate: 24,
  },
  {
    id: 'c5',
    name: 'Booking Confirmation',
    type: 'Event Driven',
    template: 'Confirmation Template',
    status: 'active',
    lifecycle: 'active',
    hierarchy: 'Property',
    productName: 'Reserve',
    category: 'Transactional',
    occurrence: 'Every Booking',
    marketing: 'Email',
    sent: 22410,
    openRate: 52,
  },
]

function getOptions(rows: CampaignRow[], key: keyof CampaignRow) {
  const vals = rows.map(r => String(r[key]))
  return Array.from(new Set(vals)).sort((a, b) => a.localeCompare(b))
}

export default function AllCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>(INITIAL_CAMPAIGNS)
  const [tab, setTab] = useState<CampaignLifecycle>('active')
  const [openMoreId, setOpenMoreId] = useState<string | null>(null)
  const [reportMessage, setReportMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilterPicker, setShowFilterPicker] = useState(false)
  const [visibleFilters, setVisibleFilters] = useState<Record<FilterKey, boolean>>({
    type: true,
    template: true,
    hierarchy: false,
    productName: true,
    category: false,
    occurrence: false,
    marketing: true,
  })
  const [filters, setFilters] = useState({
    type: 'All',
    template: 'All',
    hierarchy: 'All',
    productName: 'All',
    category: 'All',
    occurrence: 'All',
    marketing: 'All',
  })

  const moreRef = useRef<HTMLDivElement>(null)
  const filterPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openMoreId) return
    function handler(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setOpenMoreId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMoreId])

  useEffect(() => {
    if (!showFilterPicker) return
    function handler(e: MouseEvent) {
      if (filterPickerRef.current && !filterPickerRef.current.contains(e.target as Node)) {
        setShowFilterPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showFilterPicker])

  const scopedRows = useMemo(() => {
    return campaigns.filter(c => c.lifecycle === tab)
  }, [campaigns, tab])

  const rows = useMemo(() => {
    return scopedRows.filter(c =>
      (searchQuery.trim() === '' || c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) &&
      (filters.type === 'All' || c.type === filters.type) &&
      (filters.template === 'All' || c.template === filters.template) &&
      (filters.hierarchy === 'All' || c.hierarchy === filters.hierarchy) &&
      (filters.productName === 'All' || c.productName === filters.productName) &&
      (filters.category === 'All' || c.category === filters.category) &&
      (filters.occurrence === 'All' || c.occurrence === filters.occurrence) &&
      (filters.marketing === 'All' || c.marketing === filters.marketing)
    )
  }, [scopedRows, filters, searchQuery])

  const totals = useMemo(() => {
    const active = campaigns.filter(c => c.lifecycle === 'active').length
    const archived = campaigns.filter(c => c.lifecycle === 'archived').length
    return { total: campaigns.length, active, archived }
  }, [campaigns])

  const filterOptions = useMemo(() => {
    const base = scopedRows.length ? scopedRows : campaigns
    const templateRuleBase = base.filter(c =>
      (filters.type === 'All' || c.type === filters.type) &&
      (filters.marketing === 'All' || c.marketing === filters.marketing)
    )

    return {
      type: ['All', ...getOptions(base, 'type')],
      template: ['All', ...getOptions(templateRuleBase.length ? templateRuleBase : base, 'template')],
      hierarchy: ['All', ...getOptions(base, 'hierarchy')],
      productName: ['All', ...getOptions(base, 'productName')],
      category: ['All', ...getOptions(base, 'category')],
      occurrence: ['All', ...getOptions(base, 'occurrence')],
      marketing: ['All', ...getOptions(base, 'marketing')],
    }
  }, [scopedRows, campaigns, filters.type, filters.marketing])

  useEffect(() => {
    if (filters.template !== 'All' && !filterOptions.template.includes(filters.template)) {
      setFilters(prev => ({ ...prev, template: 'All' }))
    }
  }, [filters.template, filterOptions.template])

  const visibleFilterItems = useMemo(
    () => FILTER_ITEMS.filter(item => visibleFilters[item.key]),
    [visibleFilters]
  )

  function setFilter<K extends keyof typeof filters>(key: K, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function resetFilters() {
    setFilters({
      type: 'All',
      template: 'All',
      hierarchy: 'All',
      productName: 'All',
      category: 'All',
      occurrence: 'All',
      marketing: 'All',
    })
  }

  function toggleLifecycle(id: string) {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c
      if (c.lifecycle === 'active') {
        return { ...c, lifecycle: 'archived', status: 'paused' }
      }
      return { ...c, lifecycle: 'active', status: 'active' }
    }))
    setOpenMoreId(null)
  }

  function copyCampaign(id: string) {
    const item = campaigns.find(c => c.id === id)
    if (!item) return
    const copy: CampaignRow = {
      ...item,
      id: `copy-${Date.now()}`,
      name: `${item.name} (Copy)`,
      lifecycle: tab,
      status: tab === 'active' ? 'active' : 'paused',
      sent: 0,
      openRate: null,
    }
    setCampaigns(prev => [copy, ...prev])
    setOpenMoreId(null)
  }

  function viewReport(id: string) {
    const item = campaigns.find(c => c.id === id)
    if (!item) return
    setReportMessage(`Viewing report for ${item.name}`)
    setOpenMoreId(null)
    window.setTimeout(() => setReportMessage(null), 2500)
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--unity-color-surface-subtle, #f6f6f6)' }}>
      <div className="rounded-2xl" style={{
        background: 'var(--unity-color-surface-layer-1, #fff)',
        border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)' }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--unity-text-strong, #1a1a1a)' }}>All Campaigns</p>
              <p style={{ fontSize: 11, color: 'var(--unity-text-subtle, #767676)', marginTop: 2 }}>
                Total {totals.total} · Active {totals.active} · Archived {totals.archived}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex', gap: 2, padding: 3, borderRadius: 8,
                background: 'var(--unity-color-surface-subtle, #f0f0f0)',
                border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
              }}>
                {([
                  { id: 'active', label: 'Active' },
                  { id: 'archived', label: 'Archived' },
                ] as const).map(opt => {
                  const selected = tab === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setTab(opt.id)
                        setOpenMoreId(null)
                      }}
                      style={{
                        padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: selected ? 'var(--unity-color-surface-layer-1, #fff)' : 'transparent',
                        color: selected ? 'var(--unity-in-fill-strong, #2e4de5)' : 'var(--unity-text-subtle, #767676)',
                        fontSize: 12, fontWeight: 700,
                        boxShadow: selected ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                      }}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>

              {reportMessage && (
                <div style={{
                  padding: '6px 10px', borderRadius: 6,
                  background: 'var(--unity-in-fill-subtle, #eef1fd)',
                  color: 'var(--unity-in-fill-strong, #2e4de5)',
                  fontSize: 11, fontWeight: 600,
                }}>
                  {reportMessage}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2 items-end">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: 'var(--unity-text-subtle, #767676)', marginBottom: 4, fontWeight: 600 }}>
                Search Campaign
              </p>
              <div style={{
                height: 30, borderRadius: 6,
                border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
                background: 'var(--unity-color-surface-layer-1, #fff)',
                display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px',
              }}>
                <Search size={12} color="var(--unity-text-placeholder, #aaa)" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Name contains..."
                  style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 11, color: 'var(--unity-text-strong, #1a1a1a)' }}
                />
              </div>
              </div>

              <div ref={filterPickerRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowFilterPicker(v => !v)}
                  title="Filter options"
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
                    background: showFilterPicker ? 'var(--unity-color-surface-subtle, #f6f6f6)' : 'var(--unity-color-surface-layer-1, #fff)',
                    color: 'var(--unity-text-subtle, #767676)',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Filter size={14} />
                </button>

                {showFilterPicker && (
                  <div style={{
                    position: 'absolute', top: 34, right: 0, zIndex: 40,
                    width: 300, maxHeight: 380, overflowY: 'auto', padding: 10,
                    borderRadius: 8,
                    background: 'var(--unity-color-surface-layer-1, #fff)',
                    border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--unity-text-subtle, #767676)', marginBottom: 8, textTransform: 'uppercase' }}>
                      Select Filters
                    </p>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {FILTER_ITEMS.map(item => (
                        <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11, color: 'var(--unity-text-strong, #1a1a1a)' }}>
                          <input
                            type="checkbox"
                            checked={visibleFilters[item.key]}
                            onChange={() => setVisibleFilters(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>

                    {visibleFilterItems.length > 0 && (
                      <div style={{ marginTop: 10, borderTop: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)', paddingTop: 10, display: 'grid', gap: 8 }}>
                        <p style={{ fontSize: 10, color: 'var(--unity-text-subtle, #767676)', margin: 0 }}>
                          Template options are rule-based by selected Type and Marketing.
                        </p>
                        {visibleFilterItems.map(item => (
                          <div key={item.key}>
                            <p style={{ fontSize: 10, color: 'var(--unity-text-subtle, #767676)', marginBottom: 4, fontWeight: 600 }}>
                              {item.label}
                            </p>
                            <select
                              value={filters[item.key]}
                              onChange={e => setFilter(item.key, e.target.value)}
                              style={{
                                width: '100%', height: 30, borderRadius: 6,
                                border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
                                background: 'var(--unity-color-surface-layer-1, #fff)',
                                color: 'var(--unity-text-strong, #1a1a1a)',
                                fontSize: 11, padding: '0 8px', outline: 'none',
                              }}
                            >
                              {filterOptions[item.key].map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}

                    {visibleFilterItems.length === 0 && (
                      <p style={{ marginTop: 10, fontSize: 11, color: 'var(--unity-text-subtle, #767676)' }}>
                        Select at least one filter to refine results.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <p style={{ fontSize: 10, color: 'var(--unity-text-subtle, #767676)' }}>
              Showing {rows.length} result{rows.length === 1 ? '' : 's'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                resetFilters()
              }}
              style={{
                fontSize: 11, fontWeight: 600,
                color: 'var(--unity-in-fill-strong, #2e4de5)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              Reset all
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '28%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)', background: 'var(--unity-color-surface-subtle, #f6f6f6)' }}>
                <th className="px-4 py-2.5 text-left" style={{ fontSize: 10, color: 'var(--unity-text-subtle, #767676)', fontWeight: 700, textTransform: 'uppercase' }}>Campaign</th>
                <th className="px-4 py-2.5 text-left" style={{ fontSize: 10, color: 'var(--unity-text-subtle, #767676)', fontWeight: 700, textTransform: 'uppercase' }}>Type</th>
                <th className="px-4 py-2.5 text-left" style={{ fontSize: 10, color: 'var(--unity-text-subtle, #767676)', fontWeight: 700, textTransform: 'uppercase' }}>Status</th>
                <th className="px-4 py-2.5 text-left" style={{ fontSize: 10, color: 'var(--unity-text-subtle, #767676)', fontWeight: 700, textTransform: 'uppercase' }}>Hierarchy</th>
                <th className="px-4 py-2.5 text-left" style={{ fontSize: 10, color: 'var(--unity-text-subtle, #767676)', fontWeight: 700, textTransform: 'uppercase' }}>Product</th>
                <th className="px-4 py-2.5 text-right" style={{ fontSize: 10, color: 'var(--unity-text-subtle, #767676)', fontWeight: 700, textTransform: 'uppercase' }}>Sent</th>
                <th className="px-4 py-2.5 text-right" style={{ fontSize: 10, color: 'var(--unity-text-subtle, #767676)', fontWeight: 700, textTransform: 'uppercase' }}>Open Rate</th>
                <th className="px-4 py-2.5 text-right" style={{ fontSize: 10, color: 'var(--unity-text-subtle, #767676)', fontWeight: 700, textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c, idx) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: idx < rows.length - 1 ? '1px solid var(--unity-surface-stroke-weak, #e7e7e7)' : 'none' }}
                >
                  <td className="px-4 py-3">
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--unity-text-strong, #1a1a1a)' }}>{c.name}</p>
                    <p style={{ fontSize: 10, color: 'var(--unity-text-subtle, #767676)', marginTop: 2 }}>
                      {c.category} · {c.occurrence} · {c.marketing}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 6,
                      background: 'var(--unity-color-surface-subtle, #f0f0f0)',
                      color: 'var(--unity-text-subtle, #767676)',
                      border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
                    }}>
                      {c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <BadgeStatus
                      tone={c.lifecycle === 'active' ? (c.status === 'active' ? 'success' : 'warning') : 'neutral'}
                      label={c.lifecycle === 'active' ? (c.status === 'active' ? 'Active' : 'Paused') : 'Archived'}
                    />
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--unity-text-subtle, #767676)', fontSize: 11 }}>{c.hierarchy}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--unity-text-subtle, #767676)', fontSize: 11 }}>{c.productName}</td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--unity-text-subtle, #767676)', fontVariantNumeric: 'tabular-nums' }}>
                    {c.sent.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.openRate !== null ? (
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--unity-text-strong, #1a1a1a)', fontVariantNumeric: 'tabular-nums' }}>
                        {c.openRate}%
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--unity-text-placeholder, #aaa)' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => toggleLifecycle(c.id)}
                        style={c.lifecycle === 'active'
                          ? {
                              padding: '6px 10px', borderRadius: 4,
                              border: '1px solid var(--unity-surface-stroke-error-strong, #c9180a)',
                              color: 'var(--unity-surface-stroke-error-strong, #c9180a)',
                              background: 'var(--unity-surface-fill-error-weak, #fde8e4)',
                              fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            }
                          : {
                              padding: '6px 10px', borderRadius: 4,
                              border: 'none',
                              color: '#fff',
                              background: 'var(--unity-in-fill-strong, #2e4de5)',
                              fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            }}
                      >
                        {c.lifecycle === 'active' ? 'Deactivate' : 'Activate'}
                      </button>

                      <div ref={openMoreId === c.id ? moreRef : undefined} style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          onClick={() => setOpenMoreId(prev => prev === c.id ? null : c.id)}
                          style={{
                            width: 30, height: 30, borderRadius: 4,
                            border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
                            background: openMoreId === c.id ? 'var(--unity-color-surface-subtle, #f6f6f6)' : 'var(--unity-color-surface-layer-1, #fff)',
                            color: 'var(--unity-text-subtle, #767676)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <MoreHorizontal size={14} />
                        </button>

                        {openMoreId === c.id && (
                          <div style={{
                            position: 'absolute', top: 34, right: 0, zIndex: 30,
                            minWidth: 134, padding: 6,
                            borderRadius: 6,
                            background: 'var(--unity-color-surface-layer-1, #fff)',
                            border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          }}>
                            <button
                              onClick={() => copyCampaign(c.id)}
                              style={{
                                width: '100%', padding: '8px 10px', borderRadius: 4, border: 'none',
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: 'transparent', cursor: 'pointer',
                                color: 'var(--unity-text-strong, #1a1a1a)', fontSize: 12,
                              }}
                            >
                              <Copy size={12} style={{ opacity: 0.7 }} />
                              Copy
                            </button>
                            <button
                              onClick={() => viewReport(c.id)}
                              style={{
                                width: '100%', padding: '8px 10px', borderRadius: 4, border: 'none',
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: 'transparent', cursor: 'pointer',
                                color: 'var(--unity-text-strong, #1a1a1a)', fontSize: 12,
                              }}
                            >
                              <BarChart2 size={12} style={{ opacity: 0.7 }} />
                              View Report
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--unity-text-strong, #1a1a1a)' }}>No campaigns found</p>
                    <p style={{ fontSize: 11, color: 'var(--unity-text-subtle, #767676)', marginTop: 4 }}>
                      Try changing filter values or reset filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
