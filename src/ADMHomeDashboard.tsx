import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Button,
  BadgeStatus,
  AlertBanner,
} from 'agilysys-unity-widget-react'
import {
  Plus, Send, Mail, Eye, Users, BarChart2,
  Sparkles, Target, Clock, Calendar, AlertCircle,
  TrendingUp, FileText, Inbox, ChevronRight, ArrowUpRight, MoreHorizontal,
  Archive, Play, Pencil, Copy, X,
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const KPI_CARDS = [
  { label: 'Active Campaigns', value: '12',    delta: '+3 this week',       up: true,  icon: Send,    accentVar: '--unity-surface-stroke-success-strong', bgVar: '--unity-surface-fill-success-weak' },
  { label: 'Emails Sent',      value: '24,810',delta: '+18% vs last month', up: true,  icon: Mail,    accentVar: '--unity-surface-stroke-info-strong',    bgVar: '--unity-surface-fill-info-weak' },
  { label: 'Avg. Open Rate',   value: '38.4%', delta: 'Industry avg 22%',   up: true,  icon: Eye,     accentVar: '--unity-text-brand',                    bgVar: '--unity-surface-fill-info-weak' },
  { label: 'Guests Reached',   value: '8,204', delta: 'Unique this month',  up: false, icon: Users,   accentVar: '--unity-surface-stroke-warning-strong',  bgVar: '--unity-surface-fill-warning-weak' },
]

const CAMPAIGNS = [
  { name: 'Pre-Arrival Spa Reminder', type: 'Event Driven', channel: 'Email', sent: 312,  open: 41,   status: 'active',    next: 'Sends in 2h' },
  { name: 'Post-Stay Thank You',      type: 'Scheduled',    channel: 'Email', sent: 1840, open: 36,   status: 'active',    next: 'Tomorrow 9am' },
  { name: 'Booking Confirmation',     type: 'Event Driven', channel: 'Email', sent: 5480, open: 52,   status: 'active',    next: 'Always on' },
  { name: 'Weekend Golf Package',     type: 'On Demand',    channel: 'Email', sent: 544,  open: 29,   status: 'scheduled', next: 'Jun 14' },
  { name: 'Loyalty Re-Engagement',    type: 'Scheduled',    channel: 'SMS',   sent: 220,  open: null, status: 'paused',    next: 'Needs template' },
  { name: 'Summer Upsell Promo',      type: 'On Demand',    channel: 'Email', sent: 0,    open: null, status: 'draft',     next: 'Not scheduled' },
]

const INITIAL_ARCHIVED_CAMPAIGNS = [
  { id: 'arc-1', name: 'Spring Getaway Promo',  type: 'Scheduled',    channel: 'Email', sent: 3980, open: 31 as number | null, lastActive: 'Archived on Mar 11' },
  { id: 'arc-2', name: 'Flash Dining Offer',    type: 'On Demand',    channel: 'SMS',   sent: 1150, open: null as number | null, lastActive: 'Archived on Apr 3' },
  { id: 'arc-3', name: 'Post-Stay NPS Survey',  type: 'External Survey', channel: 'Email', sent: 1422, open: 44 as number | null, lastActive: 'Archived on May 2' },
]

const UPCOMING = [
  { time: 'Today 9 PM',   name: 'Post-Stay Thank You',      count: '~340 guests', icon: Mail,        color: 'var(--unity-surface-stroke-info-strong, #1a74a8)' },
  { time: 'Tomorrow 7AM', name: 'Pre-Arrival Spa Reminder', count: '~28 guests',  icon: Clock,       color: 'var(--unity-surface-stroke-success-strong, #29845a)' },
  { time: 'Jun 14 10AM',  name: 'Weekend Golf Package',     count: '~180 guests', icon: Calendar,    color: 'var(--unity-surface-stroke-warning-strong, #e29300)' },
  { time: 'Jun 16 12PM',  name: 'Loyalty Re-Engagement',    count: 'Paused',      icon: AlertCircle, color: 'var(--unity-surface-fill-error-strong, #e51c00)' },
]

const STAT_BLOCKS = [
  {
    label: '30-Day Performance',
    icon: TrendingUp,
    accentVar: '--unity-surface-stroke-success-strong',
    bgVar: '--unity-surface-fill-success-weak',
    stats: [
      { name: 'Total Sent',   val: '24,810' },
      { name: 'Total Opens',  val: '9,527'  },
      { name: 'Total Clicks', val: '2,140'  },
    ],
  },
  {
    label: 'Template Activity',
    icon: FileText,
    accentVar: '--unity-surface-stroke-info-strong',
    bgVar: '--unity-surface-fill-info-weak',
    stats: [
      { name: 'Total Templates', val: '18' },
      { name: 'Used this month', val: '7'  },
      { name: 'Needs review',    val: '3'  },
    ],
  },
  {
    label: 'Guest Insights',
    icon: Inbox,
    accentVar: '--unity-text-brand',
    bgVar: '--unity-surface-fill-info-weak',
    stats: [
      { name: 'Total Guests',   val: '26K'  },
      { name: 'Subscribed',     val: '18.4K'},
      { name: 'New this month', val: '312'  },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, delta, up, icon: Icon, accentVar, bgVar }: typeof KPI_CARDS[number]) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--unity-color-surface-layer-1, #ffffff)',
        border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `var(${bgVar}, #e4f0fa)` }}
        >
          <Icon size={15} style={{ color: `var(${accentVar}, #1a74a8)` }} />
        </div>
        <ArrowUpRight size={13} style={{ color: 'var(--unity-text-placeholder, #b3b3b3)' }} />
      </div>
      <p className="text-[30px] font-black leading-none mb-1" style={{ color: 'var(--unity-text-strong, #1a1a1a)' }}>
        {value}
      </p>
      <p className="text-sm mb-2" style={{ color: 'var(--unity-text-subtle, #767676)' }}>{label}</p>
      <p className="text-xs font-semibold" style={{ color: up ? 'var(--unity-surface-stroke-success-strong, #29845a)' : 'var(--unity-surface-stroke-warning-strong, #e29300)' }}>
        {delta}
      </p>
    </div>
  )
}

function statusTone(s: string): 'success' | 'warning' | 'neutral' | 'error' | 'info' {
  if (s === 'active')    return 'success'
  if (s === 'paused')    return 'warning'
  if (s === 'scheduled') return 'info'
  if (s === 'archived')  return 'neutral'
  return 'neutral' // draft
}

const LIFECYCLE_STATES: { value: string; label: string; icon: string; tone: 'success' | 'warning' | 'neutral' | 'info' }[] = [
  { value: 'draft',     label: 'Draft',     icon: '✏️', tone: 'neutral'  },
  { value: 'scheduled', label: 'Scheduled', icon: '📅', tone: 'info'     },
  { value: 'active',    label: 'Active',    icon: '▶',  tone: 'success'  },
  { value: 'paused',    label: 'Paused',    icon: '⏸', tone: 'warning'  },
  { value: 'archived',  label: 'Archived',  icon: '🗄', tone: 'neutral'  },
]

const TYPE_LABELS: Record<string, string> = {
  'event-driven':   'Event Driven',
  'scheduled':      'Scheduled',
  'on-demand':      'On Demand',
  'internal-survey':'Internal Survey',
  'external-survey':'External Survey',
}

interface LaunchedCampaignRow {
  id: number
  name: string
  type: string
  channel: string
}

interface ArchivedCampaignRow {
  id: string
  name: string
  type: string
  channel: string
  sent: number
  open: number | null
  lastActive: string
}

interface DashboardMetrics {
  activeCampaigns: number
  totalVisibleCampaigns: number
  pausedCampaigns: number
  emailsSent: number
  averageOpenRate: number | null
  topCampaign: { name: string; open: number; sent: number; type: string } | null
  anomalies: string[]
}

interface ADMHomeDashboardProps {
  onNewCampaign?: () => void
  launchedCampaigns?: LaunchedCampaignRow[]
  onMetricsChange?: (metrics: DashboardMetrics) => void
  justLaunchedId?: number | null
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function ADMHomeDashboard({
  onNewCampaign,
  launchedCampaigns = [],
  onMetricsChange,
  justLaunchedId,
}: ADMHomeDashboardProps) {
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [archivedOpen, setArchivedOpen] = useState(false)
  const [archivedActionOpenId, setArchivedActionOpenId] = useState<string | null>(null)
  const [archivedCampaigns, setArchivedCampaigns] = useState<ArchivedCampaignRow[]>(INITIAL_ARCHIVED_CAMPAIGNS)
  const [activatedFromArchive, setActivatedFromArchive] = useState<Array<{
    id: string; name: string; type: string; channel: string
    sent: number; open: number | null; status: 'active'; next: string; isNew: boolean
  }>>([])
  const [rowStatuses, setRowStatuses] = useState<Record<string, string>>({})
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null)
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const archivedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!statusDropdownId) return
    function handler(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [statusDropdownId])

  useEffect(() => {
    if (!moreOpen) return
    function handler(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [moreOpen])

  useEffect(() => {
    if (!archivedOpen) return
    function handler(e: MouseEvent) {
      if (archivedRef.current && !archivedRef.current.contains(e.target as Node)) {
        setArchivedOpen(false)
        setArchivedActionOpenId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [archivedOpen])

  function handleActivateArchived(id: string) {
    const picked = archivedCampaigns.find(c => c.id === id)
    if (!picked) return
    setArchivedCampaigns(prev => prev.filter(c => c.id !== id))
    setActivatedFromArchive(prev => [
      {
        id: `reactivated-${picked.id}`,
        name: picked.name,
        type: picked.type,
        channel: picked.channel,
        sent: picked.sent,
        open: picked.open,
        status: 'active',
        next: 'Re-activated',
        isNew: true,
      },
      ...prev,
    ])
    setArchivedActionOpenId(null)
  }

  const visibleCampaignRows = useMemo(() => [
    ...activatedFromArchive,
    ...launchedCampaigns.map(c => ({
      id: `launched-${c.id}`,
      name: c.name,
      type: TYPE_LABELS[c.type] || c.type,
      channel: c.channel === 'email' ? 'Email' : 'SMS',
      sent: 0,
      open: null as number | null,
      status: 'active',
      next: 'Just launched',
      isNew: true,
    })),
    ...CAMPAIGNS.map((c, i) => ({ ...c, id: `static-${i}`, isNew: false })),
  ], [activatedFromArchive, launchedCampaigns])

  const dashboardMetrics = useMemo<DashboardMetrics>(() => {
    const activeCampaigns = visibleCampaignRows.filter(c => c.status === 'active').length
    const pausedCampaigns = visibleCampaignRows.filter(c => c.status !== 'active').length
    const emailsSent = visibleCampaignRows.reduce((sum, c) => sum + (c.sent || 0), 0)
    const campaignsWithOpen = visibleCampaignRows.filter(c => c.open !== null)
    const averageOpenRate = campaignsWithOpen.length
      ? Number((campaignsWithOpen.reduce((sum, c) => sum + (c.open || 0), 0) / campaignsWithOpen.length).toFixed(1))
      : null

    let topCampaign: DashboardMetrics['topCampaign'] = null
    for (const c of campaignsWithOpen) {
      if (!topCampaign || (c.open as number) > topCampaign.open || ((c.open as number) === topCampaign.open && c.sent > topCampaign.sent)) {
        topCampaign = { name: c.name, open: c.open as number, sent: c.sent, type: c.type }
      }
    }

    const anomalies = visibleCampaignRows
      .filter(c => c.status === 'paused' || (c.open !== null && c.open < 30 && c.sent >= 500))
      .map(c => c.name)

    return {
      activeCampaigns,
      totalVisibleCampaigns: visibleCampaignRows.length,
      pausedCampaigns,
      emailsSent,
      averageOpenRate,
      topCampaign,
      anomalies,
    }
  }, [visibleCampaignRows])

  useEffect(() => {
    onMetricsChange?.(dashboardMetrics)
  }, [dashboardMetrics, onMetricsChange])

  const justLaunchedRowRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    if (!justLaunchedId) return
    // Small delay to let React paint the new row
    const t = setTimeout(() => {
      justLaunchedRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
    return () => clearTimeout(t)
  }, [justLaunchedId])

  return (
    <div
      className="min-h-screen p-6 space-y-6"
      style={{
        background: 'var(--unity-color-surface-subtle, #f6f6f6)',
        fontFamily: 'Roboto, var(--unity-font-family-base, Inter, system-ui, sans-serif)',
      }}
    >
      {/* System alert banner */}
      {!alertDismissed && (
        <AlertBanner
          tone="warning"
          flavour="light"
          title="Loyalty Re-Engagement is paused"
          message="Assign a template to this campaign to resume sending."
          showCta
          ctaLabel="Fix now"
          showClose
          onCloseClick={() => setAlertDismissed(true)}
        />
      )}

      {/* Page header + quick actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[16px] font-semibold leading-tight" style={{ color: 'var(--unity-text-strong, #1a1a1a)' }}>
            Good morning, Maya 👋
          </h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--unity-text-subtle, #767676)' }}>
            Here's what's happening across your campaigns today.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="primary" size="small" icon={<Plus size={13} />} prefixIcon onClick={onNewCampaign}>
            New Campaign
          </Button>
          <Button variant="secondary" size="small" icon={<Sparkles size={13} />} prefixIcon>
            Browse Templates
          </Button>
          {/* More menu */}
          <div ref={moreRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMoreOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 4,
                border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
                background: moreOpen ? 'var(--unity-color-surface-subtle, #f6f6f6)' : 'var(--unity-color-surface-layer-1, #fff)',
                cursor: 'pointer', color: 'var(--unity-text-subtle, #555)',
                transition: 'background 0.12s',
              }}
            >
              <MoreHorizontal size={15} />
            </button>
            {moreOpen && (
              <div style={{
                position: 'absolute', top: 36, right: 0, zIndex: 100,
                background: 'var(--unity-color-surface-layer-1, #fff)',
                border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
                borderRadius: 6,
                boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                minWidth: 170,
                padding: '6px',
              }}>
                {[
                  { label: 'Archived Campaigns', icon: Archive },
                  { label: 'Guest Insights', icon: Target },
                  { label: 'View Reports',   icon: BarChart2 },
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => {
                      setMoreOpen(false)
                      if (label === 'Archived Campaigns') {
                        setArchivedOpen(true)
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      width: '100%', padding: '8px 10px',
                      borderRadius: 4, border: 'none', cursor: 'pointer',
                      background: 'transparent',
                      color: 'var(--unity-text-strong, #1a1a1a)',
                      fontSize: 13, textAlign: 'left',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--unity-color-surface-subtle, #f6f6f6)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                  >
                    <Icon size={13} style={{ opacity: 0.55, flexShrink: 0 }} />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {archivedOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 220,
          background: 'rgba(18, 22, 33, 0.34)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div
            ref={archivedRef}
            style={{
              width: 'min(840px, 96vw)', maxHeight: '80vh', overflow: 'hidden',
              borderRadius: 10,
              background: 'var(--unity-color-surface-layer-1, #fff)',
              border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
              boxShadow: '0 14px 44px rgba(0,0,0,0.22)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 16px',
              borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
            }}>
              <Archive size={15} color="var(--unity-text-subtle, #767676)" />
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--unity-text-strong, #1a1a1a)' }}>Archived Campaigns</p>
              <span style={{
                marginLeft: 6,
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
                background: 'var(--unity-color-surface-subtle, #f0f0f0)',
                color: 'var(--unity-text-subtle, #767676)',
              }}>{archivedCampaigns.length}</span>
              <button
                onClick={() => { setArchivedOpen(false); setArchivedActionOpenId(null) }}
                style={{
                  marginLeft: 'auto',
                  width: 28, height: 28, borderRadius: 4,
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: 'var(--unity-text-placeholder, #aaa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {archivedCampaigns.length === 0 ? (
                <div style={{
                  padding: 28, textAlign: 'center', borderRadius: 8,
                  background: 'var(--unity-color-surface-subtle, #f6f6f6)',
                  border: '1px dashed var(--unity-surface-stroke-medium, #c0c0c0)',
                }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--unity-text-strong, #1a1a1a)', marginBottom: 4 }}>No archived campaigns</p>
                  <p style={{ fontSize: 12, color: 'var(--unity-text-subtle, #767676)' }}>All archived campaigns have been re-activated.</p>
                </div>
              ) : archivedCampaigns.map(c => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--unity-color-surface-layer-1, #fff)',
                  boxShadow: 'inset 0 0 0 1px var(--unity-surface-stroke-weak, #e7e7e7)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--unity-text-strong, #1a1a1a)' }}>{c.name}</p>
                    <p style={{ fontSize: 10, color: 'var(--unity-text-subtle, #767676)', marginTop: 2 }}>
                      {c.type} · {c.channel} · {c.lastActive}
                    </p>
                  </div>

                  <button
                    onClick={() => handleActivateArchived(c.id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 10px', borderRadius: 4,
                      border: 'none', cursor: 'pointer',
                      background: 'var(--unity-surface-stroke-success-strong, #29845a)',
                      color: '#fff', fontSize: 11, fontWeight: 600,
                    }}
                  >
                    <Play size={11} />
                    Activate
                  </button>

                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setArchivedActionOpenId(prev => prev === c.id ? null : c.id)}
                      style={{
                        width: 30, height: 30, borderRadius: 4,
                        border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
                        background: archivedActionOpenId === c.id ? 'var(--unity-color-surface-subtle, #f6f6f6)' : 'var(--unity-color-surface-layer-1, #fff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--unity-text-subtle, #767676)',
                      }}
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {archivedActionOpenId === c.id && (
                      <div style={{
                        position: 'absolute', top: 34, right: 0, zIndex: 50,
                        minWidth: 130, padding: 6,
                        borderRadius: 6,
                        background: 'var(--unity-color-surface-layer-1, #fff)',
                        border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      }}>
                        {[
                          { label: 'Edit', icon: Pencil },
                          { label: 'Copy', icon: Copy },
                          { label: 'Report', icon: BarChart2 },
                        ].map(({ label, icon: Icon }) => (
                          <button
                            key={label}
                            onClick={() => setArchivedActionOpenId(null)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              width: '100%', padding: '8px 10px',
                              borderRadius: 4, border: 'none', cursor: 'pointer',
                              background: 'transparent',
                              color: 'var(--unity-text-strong, #1a1a1a)',
                              fontSize: 14, textAlign: 'left',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--unity-color-surface-subtle, #f6f6f6)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                          >
                            <Icon size={12} style={{ opacity: 0.7, flexShrink: 0 }} />
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-[1fr_296px] gap-6">

        {/* Active Campaigns table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--unity-color-surface-layer-1, #ffffff)',
            border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          {/* Table header */}
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)' }}
          >
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--unity-text-strong, #1a1a1a)' }}>
                Active Campaigns
              </p>
              <p className="text-[14px] mt-0.5" style={{ color: 'var(--unity-text-subtle, #767676)' }}>
                Live performance across all channels
              </p>
            </div>
            <Button variant="link" size="small" suffixIcon icon={<ChevronRight size={11} />}>
              All campaigns
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '38%' }} />
                <col style={{ width: '18%' }} className="hidden sm:table-column" />
                <col style={{ width: '14%' }} />
                <col style={{ width: '12%' }} className="hidden md:table-column" />
                <col style={{ width: '18%' }} />
              </colgroup>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)', background: 'var(--unity-color-surface-subtle, #f6f6f6)' }}>
                  <th className="px-4 py-2.5 text-left text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--unity-text-subtle, #767676)' }}>Campaign</th>
                  <th className="px-4 py-2.5 text-left text-[12px] font-bold uppercase tracking-wide hidden sm:table-cell" style={{ color: 'var(--unity-text-subtle, #767676)' }}>Type</th>
                  <th className="px-4 py-2.5 text-left text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--unity-text-subtle, #767676)' }}>Status</th>
                  <th className="px-4 py-2.5 text-right text-[12px] font-bold uppercase tracking-wide hidden md:table-cell" style={{ color: 'var(--unity-text-subtle, #767676)' }}>Sent</th>
                  <th className="px-4 py-2.5 text-right text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--unity-text-subtle, #767676)' }}>Open Rate</th>
                </tr>
              </thead>
              <tbody>
                {visibleCampaignRows.map((c, idx, arr) => {
                  const isJustLaunched = justLaunchedId !== null && c.id === `launched-${justLaunchedId}`
                  return (
                  <tr
                    key={c.id}
                    ref={isJustLaunched ? justLaunchedRowRef : undefined}
                    className="transition-colors"
                    style={{
                      borderBottom: idx < arr.length - 1 ? '1px solid var(--unity-surface-stroke-weak, #e7e7e7)' : 'none',
                      background: isJustLaunched
                        ? 'rgba(46,77,229,0.06)'
                        : c.isNew ? 'rgba(41,132,90,0.035)' : 'transparent',
                      outline: isJustLaunched ? '2px solid rgba(46,77,229,0.35)' : 'none',
                      outlineOffset: -1,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--unity-color-surface-subtle, #f6f6f6)')}
                    onMouseLeave={e => (e.currentTarget.style.background = isJustLaunched ? 'rgba(46,77,229,0.06)' : c.isNew ? 'rgba(41,132,90,0.035)' : 'transparent')}
                  >
                    <td className="px-4 py-3 align-middle">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        {isJustLaunched ? (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10, flexShrink: 0,
                            background: '#2e4de5', color: '#fff', letterSpacing: '0.04em',
                          }}>NEW</span>
                        ) : c.isNew ? (
                          <span style={{
                            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--unity-surface-stroke-success-strong, #29845a)',
                            animation: 'livePulse 1.4s ease-in-out infinite',
                          }} />
                        ) : null}
                        <div style={{ minWidth: 0 }}>
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--unity-text-strong, #1a1a1a)' }}>
                            {c.name}
                          </p>
                          <p className="text-[12px] mt-0.5" style={{ color: 'var(--unity-text-subtle, #767676)' }}>
                            {c.channel} · {c.next}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle hidden sm:table-cell">
                      <span
                        className="text-[12px] px-2 py-0.5 rounded-md whitespace-nowrap"
                        style={{
                          background: 'var(--unity-color-surface-subtle, #f6f6f6)',
                          color: 'var(--unity-text-subtle, #767676)',
                          border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
                        }}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {/* Interactive lifecycle status badge */}
                      <div style={{ position: 'relative', display: 'inline-block' }} ref={statusDropdownId === c.id ? statusDropdownRef : undefined}>
                        <button
                          onClick={() => setStatusDropdownId(statusDropdownId === c.id ? null : c.id)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                        >
                          {(() => {
                            const s = rowStatuses[c.id] ?? c.status
                            const st = LIFECYCLE_STATES.find(x => x.value === s) ?? LIFECYCLE_STATES[2]
                            const colors: Record<string, { bg: string; text: string; border: string }> = {
                              active:    { bg: '#edf8f2', text: '#1f7a45', border: '#a3d9b8' },
                              scheduled: { bg: '#e8f1ff', text: '#1a4ab8', border: '#a3b8f0' },
                              paused:    { bg: '#fff8e5', text: '#8a5a00', border: '#f0d88a' },
                              draft:     { bg: '#f4f4f4', text: '#5a5a5a', border: '#d8d8d8' },
                              archived:  { bg: '#f4f4f4', text: '#5a5a5a', border: '#d8d8d8' },
                            }
                            const c2 = colors[s] ?? colors.draft
                            return (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: c2.bg, color: c2.text, border: `1px solid ${c2.border}` }}>
                                <span style={{ fontSize: 10 }}>{st.icon}</span>
                                {st.label}
                                <span style={{ fontSize: 9, opacity: 0.6, marginLeft: 1 }}>▾</span>
                              </span>
                            )
                          })()}
                        </button>
                        {statusDropdownId === c.id && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 200, minWidth: 140, overflow: 'hidden' }}>
                            {LIFECYCLE_STATES.map(ls => {
                              const cur = rowStatuses[c.id] ?? c.status
                              const active = cur === ls.value
                              return (
                                <button
                                  key={ls.value}
                                  onClick={() => { setRowStatuses(prev => ({ ...prev, [c.id]: ls.value })); setStatusDropdownId(null) }}
                                  style={{ width: '100%', textAlign: 'left', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: active ? 700 : 500, color: active ? '#1a1a1a' : '#4a4a4a', background: active ? '#f2f6ff' : '#fff', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f2f2f2' }}
                                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8f9ff' }}
                                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#fff' }}
                                >
                                  <span style={{ fontSize: 13 }}>{ls.icon}</span>
                                  {ls.label}
                                  {active && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#2e4de5' }}>✓</span>}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-right hidden md:table-cell" style={{ color: 'var(--unity-text-subtle, #767676)', fontVariantNumeric: 'tabular-nums' }}>
                      {c.sent.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      {c.open !== null ? (
                        <span className="text-[14px] font-black" style={{ color: 'var(--unity-text-strong, #1a1a1a)', fontVariantNumeric: 'tabular-nums' }}>
                          {c.open}%
                        </span>
                      ) : (
                        <span className="text-[12px] font-semibold" style={{ color: 'var(--unity-surface-stroke-warning-strong, #e29300)' }}>—</span>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Upcoming sends */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--unity-color-surface-layer-1, #ffffff)',
              border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div
              className="px-4 py-3.5"
              style={{ borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)' }}
            >
              <p className="text-[16px] font-bold" style={{ color: 'var(--unity-text-strong, #1a1a1a)' }}>Upcoming Sends</p>
            </div>
            <div>
              {UPCOMING.map((u, idx) => (
                <div
                  key={u.name}
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ borderBottom: idx < UPCOMING.length - 1 ? '1px solid var(--unity-surface-stroke-weak, #e7e7e7)' : 'none' }}
                >
                  <u.icon size={13} style={{ color: u.color, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--unity-text-strong, #1a1a1a)' }}>
                      {u.name}
                    </p>
                    <p className="text-[12px]" style={{ color: 'var(--unity-text-subtle, #767676)' }}>{u.count}</p>
                  </div>
                  <p className="text-[12px] flex-shrink-0 text-right" style={{ color: 'var(--unity-text-subtle, #767676)' }}>
                    {u.time}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 3 templates need review */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--unity-color-surface-layer-1, #ffffff)',
              border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div
              className="px-4 py-3 flex items-start gap-3"
              style={{ borderLeft: '3px solid var(--unity-surface-stroke-info-strong, #1a74a8)' }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'var(--unity-surface-fill-info-weak, #e4f0fa)' }}
              >
                <FileText size={13} style={{ color: 'var(--unity-surface-stroke-info-strong, #1a74a8)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold leading-tight" style={{ color: 'var(--unity-text-strong, #1a1a1a)' }}>
                  3 templates need review
                </p>
                <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: 'var(--unity-text-subtle, #767676)' }}>
                  Spa Confirmation, Welcome Email, and Survey Follow-up haven't been updated in 90+ days.
                </p>
              </div>
              <Button variant="link" size="small" suffixIcon icon={<ChevronRight size={10} />}>
                Review
              </Button>
            </div>
          </div>

          {/* Performance highlight */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--unity-color-surface-layer-1, #ffffff)',
              border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div
              className="px-4 py-3 flex items-start gap-3"
              style={{ borderLeft: '3px solid var(--unity-surface-stroke-success-strong, #29845a)' }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'var(--unity-surface-fill-success-weak, #daf1e2)' }}
              >
                <TrendingUp size={13} style={{ color: 'var(--unity-surface-stroke-success-strong, #29845a)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold leading-tight" style={{ color: 'var(--unity-text-strong, #1a1a1a)' }}>
                  Pre-Arrival Spa is performing well
                </p>
                <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: 'var(--unity-text-subtle, #767676)' }}>
                  41% open rate — well above the 22% industry average.
                </p>
              </div>
              <Button variant="link" size="small" suffixIcon icon={<ChevronRight size={10} />}>
                Report
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Stats blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STAT_BLOCKS.map((block) => (
          <div
            key={block.label}
            className="rounded-2xl p-5"
            style={{
              background: 'var(--unity-color-surface-layer-1, #ffffff)',
              border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `var(${block.bgVar}, #e4f0fa)` }}
              >
                <block.icon size={14} style={{ color: `var(${block.accentVar}, #1a74a8)` }} />
              </div>
              <p className="text-[16px] font-bold" style={{ color: 'var(--unity-text-strong, #1a1a1a)' }}>
                {block.label}
              </p>
            </div>
            <div className="space-y-2.5">
              {block.stats.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="text-[14px]" style={{ color: 'var(--unity-text-subtle, #767676)' }}>{s.name}</span>
                  <span className="text-[14px] font-bold" style={{ color: 'var(--unity-text-strong, #1a1a1a)' }}>{s.val}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="link" size="small" suffixIcon icon={<ChevronRight size={10} />}>
                View details
              </Button>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
