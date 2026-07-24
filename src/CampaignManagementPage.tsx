import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  Edit3,
  Filter,
  GitCompare,
  Globe2,
  GripVertical,
  Layers3,
  LineChart as LineChartIcon,
  Megaphone,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Search,
  SendHorizontal,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
  SlidersHorizontal,
} from 'lucide-react'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  PieChart,
  Pie,
} from 'recharts'

type CampaignChannel = 'Google' | 'Meta' | 'Email' | 'SMS' | 'LinkedIn' | 'Push'
type CampaignStatus = 'Active' | 'Scheduled' | 'Paused' | 'Completed' | 'Archived'
type BudgetStatus = 'On Track' | 'Overspending' | 'Underspending'
type CampaignMode = 'On Demand' | 'Scheduled' | 'Automated'
type FunnelStage = 'Impressions' | 'Clicks' | 'Landing Page Visits' | 'Bookings' | 'Revenue'
type KpiKey = (typeof KPIS)[number]['label']

type CampaignRow = {
  id: string
  name: string
  channel: CampaignChannel
  status: CampaignStatus
  mode: CampaignMode
  objective: string
  audience: string
  budget: number
  spend: number
  ctr: number
  cpc: number
  cpa: number
  conversions: number
  revenue: number
  roas: number
  createdBy: string
  lastUpdated: string
  startDate: string
  endDate: string
  property: string
  tags: string[]
  budgetStatus: BudgetStatus
  visitors: number
  visibility: 'Public' | 'Private' | 'Shared'
}

type ColumnKey =
  | 'name'
  | 'channel'
  | 'status'
  | 'objective'
  | 'audience'
  | 'budget'
  | 'spend'
  | 'ctr'
  | 'cpc'
  | 'cpa'
  | 'conversions'
  | 'revenue'
  | 'roas'
  | 'createdBy'
  | 'lastUpdated'
  | 'startDate'
  | 'endDate'
  | 'actions'

type SortableColumnKey = Exclude<ColumnKey, 'actions'>

type ColumnDefinition = {
  key: ColumnKey
  label: string
  sortable?: boolean
  minWidth: number
  defaultWidth: number
  align?: 'left' | 'right' | 'center'
}

type SavedView = {
  label: string
  search: string
  status: string
  channel: string
  property: string
}

type AlertItem = {
  title: string
  detail: string
  tone: 'warning' | 'danger' | 'info' | 'success'
}

type RecommendationItem = {
  title: string
  detail: string
}

const COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'Campaign Name', sortable: true, minWidth: 240, defaultWidth: 260 },
  { key: 'channel', label: 'Channel', sortable: true, minWidth: 110, defaultWidth: 130 },
  { key: 'status', label: 'Status', sortable: true, minWidth: 130, defaultWidth: 140 },
  { key: 'objective', label: 'Objective', sortable: true, minWidth: 170, defaultWidth: 190 },
  { key: 'audience', label: 'Audience', sortable: true, minWidth: 170, defaultWidth: 200 },
  { key: 'budget', label: 'Budget', sortable: true, minWidth: 120, defaultWidth: 130, align: 'right' },
  { key: 'spend', label: 'Spend', sortable: true, minWidth: 120, defaultWidth: 130, align: 'right' },
  { key: 'ctr', label: 'CTR', sortable: true, minWidth: 96, defaultWidth: 100, align: 'right' },
  { key: 'cpc', label: 'CPC', sortable: true, minWidth: 96, defaultWidth: 100, align: 'right' },
  { key: 'cpa', label: 'CPA', sortable: true, minWidth: 96, defaultWidth: 100, align: 'right' },
  { key: 'conversions', label: 'Conversions', sortable: true, minWidth: 120, defaultWidth: 130, align: 'right' },
  { key: 'revenue', label: 'Revenue', sortable: true, minWidth: 120, defaultWidth: 130, align: 'right' },
  { key: 'roas', label: 'ROAS', sortable: true, minWidth: 100, defaultWidth: 100, align: 'right' },
  { key: 'createdBy', label: 'Created By', sortable: true, minWidth: 120, defaultWidth: 140 },
  { key: 'lastUpdated', label: 'Last Updated', sortable: true, minWidth: 130, defaultWidth: 150 },
  { key: 'startDate', label: 'Start Date', sortable: true, minWidth: 120, defaultWidth: 130 },
  { key: 'endDate', label: 'End Date', sortable: true, minWidth: 120, defaultWidth: 130 },
  { key: 'actions', label: 'Actions', minWidth: 130, defaultWidth: 140, align: 'center' },
]

const KPIS = [
  { label: 'Total Campaigns', value: 148, change: '+12.4%', previous: 'vs previous period', tone: 'blue', icon: Layers3, spark: [40, 42, 39, 47, 51, 55, 58] },
  { label: 'Active Campaigns', value: 38, change: '+6.7%', previous: 'vs previous period', tone: 'green', icon: Play, spark: [16, 18, 20, 21, 26, 28, 30] },
  { label: 'Scheduled Campaigns', value: 21, change: '+2.1%', previous: 'vs previous period', tone: 'slate', icon: ChevronRight, spark: [13, 13, 14, 16, 18, 20, 21] },
  { label: 'Completed Campaigns', value: 69, change: '+9.9%', previous: 'vs previous period', tone: 'emerald', icon: CheckCircle2, spark: [40, 43, 48, 52, 57, 63, 69] },
  { label: 'Total Spend', value: '$184.2K', change: '+4.8%', previous: 'vs previous period', tone: 'amber', icon: Wallet, spark: [28, 30, 31, 33, 36, 38, 41] },
  { label: 'Revenue Generated', value: '$1.26M', change: '+18.5%', previous: 'vs previous period', tone: 'blue', icon: BarChart3, spark: [70, 76, 82, 88, 93, 101, 108] },
  { label: 'ROAS', value: '6.8x', change: '+1.2%', previous: 'vs previous period', tone: 'green', icon: GitCompare, spark: [4.8, 5.2, 5.6, 5.8, 6.1, 6.4, 6.8] },
  { label: 'Conversion Rate', value: '8.4%', change: '+0.9%', previous: 'vs previous period', tone: 'slate', icon: TrendingUp, spark: [6.2, 6.6, 7.0, 7.2, 7.5, 7.9, 8.4] },
  { label: 'CTR', value: '4.7%', change: '-0.3%', previous: 'vs previous period', tone: 'amber', icon: LineChart, spark: [5.2, 5.0, 4.9, 4.8, 4.8, 4.7, 4.7] },
  { label: 'Clicks', value: '248K', change: '+12.8%', previous: 'vs previous period', tone: 'blue', icon: SendHorizontal, spark: [180, 189, 205, 216, 224, 233, 248] },
  { label: 'Impressions', value: '5.8M', change: '+14.1%', previous: 'vs previous period', tone: 'slate', icon: Megaphone, spark: [4.1, 4.5, 4.8, 5.1, 5.4, 5.6, 5.8] },
  { label: 'Leads', value: '18.9K', change: '+7.2%', previous: 'vs previous period', tone: 'green', icon: Users, spark: [13, 13.7, 14.4, 15.3, 16.1, 17.4, 18.9] },
] as const

const SAVED_VIEWS: SavedView[] = [
  { label: 'Needs Attention', search: '', status: 'Paused', channel: 'All', property: 'All' },
  { label: 'Google Priority', search: '', status: 'All', channel: 'Google', property: 'All' },
  { label: 'Property: Alpine', search: '', status: 'All', channel: 'All', property: 'Alpine Resort' },
]

const CHART_GRANULARITIES = ['Daily', 'Weekly', 'Monthly', 'Quarterly'] as const
const CHANNELS: CampaignChannel[] = ['Google', 'Meta', 'Email', 'SMS', 'LinkedIn', 'Push']
const STATUS_OPTIONS: Array<CampaignStatus | 'All'> = ['All', 'Active', 'Scheduled', 'Paused', 'Completed', 'Archived']
const MODE_OPTIONS: Array<CampaignMode | 'All'> = ['All', 'On Demand', 'Scheduled', 'Automated']
const BUDGET_STATUS_OPTIONS: Array<BudgetStatus | 'All'> = ['All', 'On Track', 'Overspending', 'Underspending']
const PROPERTIES = ['All', 'Alpine Resort', 'Harbor Hotel', 'Summit Lodge', 'Coastal Retreat']
const TAG_OPTIONS = ['All', 'Pre-arrival', 'Upsell', 'Retention', 'VIP', 'Winback', 'Event', 'Promo']

const CAMPAIGN_DATA: CampaignRow[] = [
  {
    id: 'cmp-001',
    name: 'Summer Stay Promotion',
    channel: 'Google',
    status: 'Active',
    mode: 'On Demand',
    objective: 'Direct bookings',
    audience: 'Leisure travelers',
    budget: 32000,
    spend: 21450,
    ctr: 4.8,
    cpc: 1.92,
    cpa: 42,
    conversions: 512,
    revenue: 164800,
    roas: 7.7,
    createdBy: 'A. Patel',
    lastUpdated: '2026-07-22',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    property: 'Alpine Resort',
    tags: ['Promo', 'Leisure'],
    budgetStatus: 'On Track',
    visitors: 18420,
    visibility: 'Shared',
  },
  {
    id: 'cmp-002',
    name: 'Pre-Arrival Room Upgrade',
    channel: 'Email',
    status: 'Active',
    mode: 'Automated',
    objective: 'Ancillary revenue',
    audience: 'Booked guests',
    budget: 12000,
    spend: 11140,
    ctr: 8.1,
    cpc: 0.74,
    cpa: 18,
    conversions: 603,
    revenue: 98520,
    roas: 8.9,
    createdBy: 'M. Smith',
    lastUpdated: '2026-07-23',
    startDate: '2026-06-14',
    endDate: '2026-08-10',
    property: 'All Properties',
    tags: ['Pre-arrival', 'Upsell'],
    budgetStatus: 'On Track',
    visitors: 9480,
    visibility: 'Public',
  },
  {
    id: 'cmp-003',
    name: 'Loyalty Member Re-Engage',
    channel: 'Meta',
    status: 'Paused',
    mode: 'On Demand',
    objective: 'Member retention',
    audience: 'Loyalty members',
    budget: 18000,
    spend: 18450,
    ctr: 3.4,
    cpc: 2.31,
    cpa: 58,
    conversions: 284,
    revenue: 39720,
    roas: 2.1,
    createdBy: 'N. Rao',
    lastUpdated: '2026-07-21',
    startDate: '2026-05-15',
    endDate: '2026-09-15',
    property: 'Harbor Hotel',
    tags: ['Retention', 'Loyalty'],
    budgetStatus: 'Overspending',
    visitors: 13670,
    visibility: 'Shared',
  },
  {
    id: 'cmp-004',
    name: 'Conference Lead Capture',
    channel: 'LinkedIn',
    status: 'Scheduled',
    mode: 'Scheduled',
    objective: 'Corporate bookings',
    audience: 'Business travelers',
    budget: 28000,
    spend: 0,
    ctr: 0,
    cpc: 0,
    cpa: 0,
    conversions: 0,
    revenue: 0,
    roas: 0,
    createdBy: 'L. Chen',
    lastUpdated: '2026-07-20',
    startDate: '2026-08-01',
    endDate: '2026-10-01',
    property: 'Summit Lodge',
    tags: ['Event', 'Business'],
    budgetStatus: 'Underspending',
    visitors: 0,
    visibility: 'Private',
  },
  {
    id: 'cmp-005',
    name: 'Spa Weekend Upsell',
    channel: 'SMS',
    status: 'Completed',
    mode: 'Scheduled',
    objective: 'Ancillary revenue',
    audience: 'Guests in-house',
    budget: 9000,
    spend: 8720,
    ctr: 6.3,
    cpc: 1.41,
    cpa: 24,
    conversions: 366,
    revenue: 46540,
    roas: 5.3,
    createdBy: 'A. Patel',
    lastUpdated: '2026-07-18',
    startDate: '2026-06-01',
    endDate: '2026-07-18',
    property: 'Coastal Retreat',
    tags: ['Upsell', 'Promo'],
    budgetStatus: 'On Track',
    visitors: 6110,
    visibility: 'Shared',
  },
  {
    id: 'cmp-006',
    name: 'Winback Winter Guests',
    channel: 'Push',
    status: 'Archived',
    mode: 'Automated',
    objective: 'Return visits',
    audience: 'Lapsed guests',
    budget: 6500,
    spend: 5480,
    ctr: 2.9,
    cpc: 1.18,
    cpa: 37,
    conversions: 148,
    revenue: 12960,
    roas: 2.4,
    createdBy: 'S. Evans',
    lastUpdated: '2026-07-10',
    startDate: '2026-02-01',
    endDate: '2026-05-31',
    property: 'Alpine Resort',
    tags: ['Winback', 'Retention'],
    budgetStatus: 'Underspending',
    visitors: 3820,
    visibility: 'Private',
  },
  {
    id: 'cmp-007',
    name: 'Weekend Brunch Reminder',
    channel: 'Email',
    status: 'Active',
    mode: 'Scheduled',
    objective: 'F&B revenue',
    audience: 'In-house guests',
    budget: 4800,
    spend: 2730,
    ctr: 7.2,
    cpc: 0.66,
    cpa: 12,
    conversions: 226,
    revenue: 18220,
    roas: 6.7,
    createdBy: 'M. Smith',
    lastUpdated: '2026-07-23',
    startDate: '2026-07-01',
    endDate: '2026-08-15',
    property: 'Harbor Hotel',
    tags: ['Promo', 'F&B'],
    budgetStatus: 'On Track',
    visitors: 4310,
    visibility: 'Public',
  },
  {
    id: 'cmp-008',
    name: 'Corporate Retreat Offers',
    channel: 'Google',
    status: 'Active',
    mode: 'On Demand',
    objective: 'Group bookings',
    audience: 'Business travelers',
    budget: 42000,
    spend: 32980,
    ctr: 5.1,
    cpc: 2.05,
    cpa: 49,
    conversions: 612,
    revenue: 204400,
    roas: 6.2,
    createdBy: 'L. Chen',
    lastUpdated: '2026-07-23',
    startDate: '2026-05-10',
    endDate: '2026-09-30',
    property: 'Summit Lodge',
    tags: ['Business', 'Event'],
    budgetStatus: 'On Track',
    visitors: 20130,
    visibility: 'Shared',
  },
]

const SPEND_SERIES = [
  { period: 'Mon', spend: 22, clicks: 180, conversions: 31, revenue: 140 },
  { period: 'Tue', spend: 26, clicks: 210, conversions: 35, revenue: 160 },
  { period: 'Wed', spend: 24, clicks: 205, conversions: 37, revenue: 154 },
  { period: 'Thu', spend: 28, clicks: 232, conversions: 42, revenue: 180 },
  { period: 'Fri', spend: 31, clicks: 260, conversions: 48, revenue: 212 },
  { period: 'Sat', spend: 29, clicks: 250, conversions: 45, revenue: 198 },
  { period: 'Sun', spend: 27, clicks: 240, conversions: 41, revenue: 190 },
]

const CHANNEL_PERFORMANCE = [
  { channel: 'Google Ads', spend: 74200, revenue: 418000, roas: 5.6, conversions: 3180, ctr: 4.8, status: 'Healthy' },
  { channel: 'Meta', spend: 42100, revenue: 132500, roas: 3.1, conversions: 1020, ctr: 3.6, status: 'Watch' },
  { channel: 'LinkedIn', spend: 19600, revenue: 88900, roas: 4.5, conversions: 690, ctr: 2.9, status: 'Healthy' },
  { channel: 'Email', spend: 10800, revenue: 102400, roas: 9.5, conversions: 1890, ctr: 8.1, status: 'Strong' },
  { channel: 'SMS', spend: 7700, revenue: 42600, roas: 5.5, conversions: 450, ctr: 6.4, status: 'Strong' },
  { channel: 'Push Notification', spend: 4300, revenue: 15600, roas: 3.6, conversions: 180, ctr: 2.6, status: 'Watch' },
] as const

const FUNNEL = [
  { stage: 'Impressions', value: 5800000, rate: null },
  { stage: 'Clicks', value: 248000, rate: '4.3%' },
  { stage: 'Landing Page Visits', value: 171000, rate: '68.9%' },
  { stage: 'Bookings', value: 18900, rate: '11.1%' },
  { stage: 'Revenue', value: 1260000, rate: '6.7x' },
] as const

const ALERTS: AlertItem[] = [
  { title: 'Campaign budget almost exhausted', detail: 'Pre-Arrival Room Upgrade is at 93% of its current budget.', tone: 'warning' },
  { title: 'CTR dropped significantly', detail: 'Loyalty Member Re-Engage is down 18% week over week.', tone: 'danger' },
  { title: 'High CPA', detail: 'Meta campaigns are trending above the acceptable acquisition threshold.', tone: 'danger' },
  { title: 'Inactive campaign', detail: 'Winback Winter Guests has no active delivery window.', tone: 'info' },
  { title: 'Low conversion campaign', detail: 'Push campaigns are generating clicks but not enough booking starts.', tone: 'warning' },
  { title: 'Duplicate audiences detected', detail: 'Two remarketing segments overlap across Google and Meta.', tone: 'info' },
]

const RECOMMENDATIONS: RecommendationItem[] = [
  { title: 'Increase budget', detail: 'Shift 12% more spend toward the highest ROAS campaigns.' },
  { title: 'Pause campaign', detail: 'Pause low-converting remarketing variants with duplicated audiences.' },
  { title: 'Improve targeting', detail: 'Exclude recent bookers from top-of-funnel acquisition campaigns.' },
  { title: 'Best time to send', detail: 'Tuesday late morning continues to outperform for pre-arrival emails.' },
  { title: 'Recommended audience expansion', detail: 'Add high-value loyalty members and conference planners.' },
  { title: 'Suggested A/B testing', detail: 'Test subject lines with urgency versus value-led messaging.' },
  { title: 'Recommended communication channel', detail: 'Use Email for booking nudges and SMS for day-of-stay reminders.' },
]

const TIMELINE = [
  { label: 'Created', date: '2026-05-10', detail: 'Campaign created with base audience and budget.' },
  { label: 'Scheduled', date: '2026-05-11', detail: 'Delivery window aligned with summer booking window.' },
  { label: 'Started', date: '2026-06-01', detail: 'Campaign went live across Google and Email.' },
  { label: 'Paused', date: '2026-07-08', detail: 'Budget guardrail triggered on Meta segment.' },
  { label: 'Completed', date: '2026-07-18', detail: 'Promotion completed with above-target ROAS.' },
  { label: 'Archived', date: '2026-07-23', detail: 'Historical campaign archived for reporting.' },
] as const

const AUDIENCE_SEGMENTS = [
  { label: 'VIP Guests', value: 24, tone: 'blue' },
  { label: 'Loyalty Members', value: 38, tone: 'green' },
  { label: 'Business Travelers', value: 28, tone: 'slate' },
  { label: 'Leisure Travelers', value: 46, tone: 'amber' },
] as const

const AUDIENCE_DATA = [
  { label: '18-24', value: 12 },
  { label: '25-34', value: 22 },
  { label: '35-44', value: 24 },
  { label: '45-54', value: 20 },
  { label: '55-64', value: 14 },
  { label: '65+', value: 8 },
]

const GENDER_DATA = [
  { label: 'Female', value: 52 },
  { label: 'Male', value: 44 },
  { label: 'Other / Unspecified', value: 4 },
]

const DEVICE_DATA = [
  { label: 'Mobile', value: 61 },
  { label: 'Desktop', value: 31 },
  { label: 'Tablet', value: 8 },
]

const GEO_DATA = [
  { label: 'North America', value: 48 },
  { label: 'Europe', value: 22 },
  { label: 'APAC', value: 16 },
  { label: 'Middle East', value: 8 },
  { label: 'LATAM', value: 6 },
]

const LANGUAGE_DATA = [
  { label: 'English', value: 70 },
  { label: 'Spanish', value: 14 },
  { label: 'French', value: 7 },
  { label: 'German', value: 5 },
  { label: 'Other', value: 4 },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00`))
}

function toSentenceCaseLabel(value: string) {
  return value.replace(/\b[A-Z]{2,}\b/g, token => `${token.charAt(0)}${token.slice(1).toLowerCase()}`)
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function getToneClasses(tone: string) {
  switch (tone) {
    case 'green':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'amber':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    case 'slate':
      return 'border-slate-200 bg-slate-50 text-slate-800'
    default:
      return 'border-blue-200 bg-blue-50 text-blue-800'
  }
}

function getStatusTone(status: string) {
  switch (status) {
    case 'Active':
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Scheduled':
      return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'Paused':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Archived':
      return 'bg-slate-100 text-slate-600 border-slate-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

function getBudgetTone(status: BudgetStatus) {
  switch (status) {
    case 'On Track':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Overspending':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200'
  }
}

function getAlertTone(tone: AlertItem['tone']) {
  switch (tone) {
    case 'danger':
      return 'border-rose-200 bg-rose-50 text-rose-800'
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    default:
      return 'border-sky-200 bg-sky-50 text-sky-800'
  }
}

function MiniSparkline({ data }: { data: readonly number[] }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const normalized = max === min ? 50 : ((value - min) / (max - min)) * 100
    const y = 100 - normalized
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox="0 0 100 100" className="h-10 w-full overflow-visible" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-slate-400"
      />
    </svg>
  )
}

function MetricCard({ metric }: { metric: typeof KPIS[number] }) {
  const Icon = metric.icon

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.08em] text-slate-500">{toSentenceCaseLabel(metric.label)}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className={cn('inline-flex h-8 w-8 items-center justify-center rounded-xl border', getToneClasses(metric.tone))}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-semibold tracking-tight text-slate-900">{metric.value}</p>
          </div>
        </div>
        <div className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', metric.change.startsWith('+') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700')}>
          {metric.change}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">{metric.previous}</p>
          <p className="mt-1 text-xs font-medium text-slate-700">Subtle weekly trend</p>
        </div>
        <div className="h-10 w-24 text-slate-400">
          <MiniSparkline data={metric.spark} />
        </div>
      </div>
    </article>
  )
}

function SectionCard({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-3xl border border-slate-200 bg-white shadow-sm', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      <div>{children}</div>
    </section>
  )
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', className)}>{children}</span>
}

function PillButton({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      )}
    >
      {children}
    </button>
  )
}

function SelectField({
  className,
  iconInsetClassName,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  iconInsetClassName?: string
}) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          'appearance-none pr-10',
          className,
        )}
      >
        {children}
      </select>
      <ChevronDown className={cn('pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400', iconInsetClassName)} />
    </div>
  )
}

function TableMetric({ value, tone = 'slate' }: { value: string; tone?: 'slate' | 'green' | 'amber' | 'rose' }) {
  const toneClass =
    tone === 'green'
      ? 'text-emerald-700'
      : tone === 'amber'
        ? 'text-amber-700'
        : tone === 'rose'
          ? 'text-rose-700'
          : 'text-slate-800'

  return <span className={cn('font-semibold tabular-nums', toneClass)}>{value}</span>
}

function CampaignManagementPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [tableSearch, setTableSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [selectedChannel, setSelectedChannel] = useState<string>('All')
  const [selectedMode, setSelectedMode] = useState<string>('All')
  const [selectedTags, setSelectedTags] = useState<string>('All')
  const [selectedProperty, setSelectedProperty] = useState<string>('All')
  const [selectedBudgetStatus, setSelectedBudgetStatus] = useState<string>('All')
  const [granularity, setGranularity] = useState<typeof CHART_GRANULARITIES[number]>('Weekly')
  const [selectedView, setSelectedView] = useState<string>('All Campaigns')
  const [sortKey, setSortKey] = useState<SortableColumnKey>('spend')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(() => {
    return COLUMNS.reduce((accumulator, column) => {
      accumulator[column.key] = true
      return accumulator
    }, {} as Record<ColumnKey, boolean>)
  })
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>(() => {
    return COLUMNS.reduce((accumulator, column) => {
      accumulator[column.key] = column.defaultWidth
      return accumulator
    }, {} as Record<ColumnKey, number>)
  })
  const [campaigns, setCampaigns] = useState<CampaignRow[]>(CAMPAIGN_DATA)
  const [columnsPopoverOpen, setColumnsPopoverOpen] = useState(false)
  const [overviewSettingsOpen, setOverviewSettingsOpen] = useState(false)
  const [visibleKpis, setVisibleKpis] = useState<Record<KpiKey, boolean>>(() => {
    return KPIS.reduce((accumulator, metric) => {
      accumulator[metric.label] = true
      return accumulator
    }, {} as Record<KpiKey, boolean>)
  })
  const [kpiOrder, setKpiOrder] = useState<KpiKey[]>(() => KPIS.map(metric => metric.label))

  const tableWrapRef = useRef<HTMLDivElement>(null)
  const columnsPopoverRef = useRef<HTMLDivElement>(null)
  const overviewSettingsRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function closeMenus(event: MouseEvent) {
      const target = event.target as Node
      if (columnsPopoverOpen && columnsPopoverRef.current && !columnsPopoverRef.current.contains(target)) {
        setColumnsPopoverOpen(false)
      }
      if (overviewSettingsOpen && overviewSettingsRef.current && !overviewSettingsRef.current.contains(target)) {
        setOverviewSettingsOpen(false)
      }
      if (openMenuId && menuRef.current && !menuRef.current.contains(target)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', closeMenus)
    return () => document.removeEventListener('mousedown', closeMenus)
  }, [columnsPopoverOpen, openMenuId, overviewSettingsOpen])

  const orderedVisibleKpis = useMemo(() => {
    return kpiOrder
      .map(label => KPIS.find(metric => metric.label === label))
      .filter((metric): metric is (typeof KPIS)[number] => Boolean(metric && visibleKpis[metric.label]))
  }, [kpiOrder, visibleKpis])

  const tableColumns = useMemo(() => COLUMNS.filter(column => visibleColumns[column.key]), [visibleColumns])

  const derivedRows = useMemo(() => {
    const query = `${searchQuery} ${tableSearch}`.trim().toLowerCase()
    const selectedTag = selectedTags === 'All' ? null : selectedTags

    return campaigns.filter(campaign => {
      const matchesSearch = !query || [campaign.name, campaign.channel, campaign.objective, campaign.audience, campaign.createdBy, campaign.property, campaign.tags.join(' ')].join(' ').toLowerCase().includes(query)
      const matchesStatus = selectedStatus === 'All' || campaign.status === selectedStatus
      const matchesChannel = selectedChannel === 'All' || campaign.channel === selectedChannel
      const matchesMode = selectedMode === 'All' || campaign.mode === selectedMode
      const matchesProperty = selectedProperty === 'All' || campaign.property === selectedProperty
      const matchesBudget = selectedBudgetStatus === 'All' || campaign.budgetStatus === selectedBudgetStatus
      const matchesTag = !selectedTag || campaign.tags.includes(selectedTag)

      return matchesSearch && matchesStatus && matchesChannel && matchesMode && matchesProperty && matchesBudget && matchesTag
    })
  }, [campaigns, searchQuery, tableSearch, selectedStatus, selectedChannel, selectedMode, selectedProperty, selectedBudgetStatus, selectedTags])

  const sortedRows = useMemo(() => {
    const rows = [...derivedRows]
    rows.sort((left, right) => {
      const leftValue = left[sortKey]
      const rightValue = right[sortKey]

      const numericColumns: ColumnKey[] = ['budget', 'spend', 'ctr', 'cpc', 'cpa', 'conversions', 'revenue', 'roas']
      if (numericColumns.includes(sortKey)) {
        const result = Number(leftValue) - Number(rightValue)
        return sortDirection === 'asc' ? result : -result
      }

      const result = String(leftValue).localeCompare(String(rightValue))
      return sortDirection === 'asc' ? result : -result
    })
    return rows
  }, [derivedRows, sortDirection, sortKey])

  const pagedRows = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage
    return sortedRows.slice(startIndex, startIndex + rowsPerPage)
  }, [page, rowsPerPage, sortedRows])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const allVisibleSelected = pagedRows.length > 0 && pagedRows.every(row => selectedCampaignIds.includes(row.id))

  const budgetProgress = useMemo(() => {
    return campaigns.map(campaign => ({
      ...campaign,
      allocated: campaign.budget,
      actual: campaign.spend,
      remaining: Math.max(campaign.budget - campaign.spend, 0),
      forecast: Math.round(campaign.spend * 1.12),
      utilization: campaign.budget === 0 ? 0 : Math.min((campaign.spend / campaign.budget) * 100, 140),
    }))
  }, [campaigns])

  const alertCounts = ALERTS.length
  const activeCampaignCount = campaigns.filter(campaign => campaign.status === 'Active').length
  const selectedCount = selectedCampaignIds.length

  const channelsWithStatus = CHANNEL_PERFORMANCE.map(channel => ({
    ...channel,
    trend: channel.roas > 5 ? 'Healthy' : channel.roas > 3 ? 'Watch' : 'Review',
  }))

  function applyView(view: SavedView) {
    setSelectedView(view.label)
    setSearchQuery(view.search)
    setSelectedStatus(view.status)
    setSelectedChannel(view.channel)
    setSelectedMode('All')
    setSelectedProperty(view.property)
    setSelectedTags('All')
    setSelectedBudgetStatus('All')
    setPage(1)
  }

  function toggleSelection(id: string) {
    setSelectedCampaignIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])
  }

  function toggleAllVisible() {
    setSelectedCampaignIds(current => {
      if (allVisibleSelected) return current.filter(id => !pagedRows.some(row => row.id === id))
      return Array.from(new Set([...current, ...pagedRows.map(row => row.id)]))
    })
  }

  function toggleStatus(id: string) {
    setCampaigns(current => current.map(campaign => {
      if (campaign.id !== id) return campaign
      const nextStatus = campaign.status === 'Active' ? 'Paused' : 'Active'
      return {
        ...campaign,
        status: nextStatus,
        budgetStatus: nextStatus === 'Active' ? 'On Track' : campaign.budgetStatus,
      }
    }))
  }

  function duplicateCampaign(id: string) {
    const source = campaigns.find(campaign => campaign.id === id)
    if (!source) return

    const clone: CampaignRow = {
      ...source,
      id: `dup-${Date.now()}`,
      name: `${source.name} Copy`,
      status: 'Scheduled',
      spend: 0,
      ctr: 0,
      cpc: 0,
      cpa: 0,
      conversions: 0,
      revenue: 0,
      roas: 0,
      lastUpdated: '2026-07-24',
      createdBy: 'Copied',
    }

    setCampaigns(current => [clone, ...current])
    setOpenMenuId(null)
  }

  function removeCampaign(id: string) {
    setCampaigns(current => current.filter(campaign => campaign.id !== id))
    setSelectedCampaignIds(current => current.filter(value => value !== id))
    setOpenMenuId(null)
  }

  function exportCsv() {
    const header = ['Campaign Name', 'Channel', 'Status', 'Objective', 'Audience', 'Budget', 'Spend', 'CTR', 'CPC', 'CPA', 'Conversions', 'Revenue', 'ROAS', 'Created By', 'Last Updated', 'Start Date', 'End Date']
    const body = sortedRows.map(campaign => [
      campaign.name,
      campaign.channel,
      campaign.status,
      campaign.objective,
      campaign.audience,
      campaign.budget,
      campaign.spend,
      campaign.ctr,
      campaign.cpc,
      campaign.cpa,
      campaign.conversions,
      campaign.revenue,
      campaign.roas,
      campaign.createdBy,
      campaign.lastUpdated,
      campaign.startDate,
      campaign.endDate,
    ].map(value => `"${String(value).split('"').join('""')}"`).join(','))

    const blob = new Blob([`${header.join(',')}
${body.join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'campaign-management-report.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleHeaderSort(column: ColumnDefinition) {
    if (!column.sortable) return
    if (sortKey === column.key) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc')
      return
    }
    setSortKey(column.key as SortableColumnKey)
    setSortDirection('desc')
  }

  function startColumnResize(event: React.MouseEvent<HTMLDivElement>, columnKey: ColumnKey) {
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const startWidth = columnWidths[columnKey]

    function onMove(moveEvent: MouseEvent) {
      const nextWidth = Math.max(COLUMNS.find(column => column.key === columnKey)?.minWidth ?? 100, startWidth + (moveEvent.clientX - startX))
      setColumnWidths(current => ({ ...current, [columnKey]: nextWidth }))
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function renderTrend(value: number) {
    const tone = value >= 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'
    const Icon = value >= 0 ? TrendingUp : TrendingDown
    return (
      <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold', tone)}>
        <Icon className="h-3.5 w-3.5" />
        {value >= 0 ? '+' : ''}{value.toFixed(1)}%
      </span>
    )
  }

  function toggleKpiVisibility(label: KpiKey) {
    setVisibleKpis(current => ({ ...current, [label]: !current[label] }))
  }

  function moveKpi(label: KpiKey, direction: 'up' | 'down') {
    setKpiOrder(current => {
      const index = current.indexOf(label)
      if (index === -1) return current

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= current.length) return current

      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(targetIndex, 0, item)
      return next
    })
  }

  return (
    <div className="min-h-full bg-slate-50 pb-28 text-slate-900">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex flex-col gap-3 px-4 py-3 xl:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[1.75rem] font-semibold tracking-tight text-slate-900 sm:text-[1.875rem]">Campaign Management</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-center">
              <button className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
                <Download className="h-4 w-4" />
                Export Report
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Create Campaign
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 shadow-sm lg:min-w-[320px] lg:flex-[1.5]">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Search campaigns, audiences, tags..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                aria-label="Search campaigns"
              />
            </div>

            <SelectField defaultValue="All" className="h-10 min-w-[150px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none sm:flex-none">
              <option>Date Range</option>
            </SelectField>
            <SelectField value={selectedChannel} onChange={event => { setSelectedChannel(event.target.value); setPage(1) }} className="h-10 min-w-[150px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none sm:flex-none">
              <option value="All">Channel Filter</option>
              {CHANNELS.map(channel => <option key={channel} value={channel}>{toSentenceCaseLabel(channel)}</option>)}
            </SelectField>
            <SelectField value={selectedMode} onChange={event => { setSelectedMode(event.target.value); setPage(1) }} className="h-10 min-w-[150px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none sm:flex-none">
              <option value="All">Campaign Mode</option>
              {MODE_OPTIONS.filter(option => option !== 'All').map(option => <option key={option} value={option}>{toSentenceCaseLabel(option)}</option>)}
            </SelectField>
            <SelectField value={selectedStatus} onChange={event => { setSelectedStatus(event.target.value); setPage(1) }} className="h-10 min-w-[150px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none sm:flex-none">
              <option value="All">Campaign Status</option>
              {STATUS_OPTIONS.filter(option => option !== 'All').map(option => <option key={option} value={option}>{toSentenceCaseLabel(option)}</option>)}
            </SelectField>
            <SelectField value={selectedTags} onChange={event => { setSelectedTags(event.target.value); setPage(1) }} className="h-10 min-w-[150px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none sm:flex-none">
              <option value="All">Tags Filter</option>
              {TAG_OPTIONS.filter(option => option !== 'All').map(option => <option key={option} value={option}>{toSentenceCaseLabel(option)}</option>)}
            </SelectField>
          </div>

        </div>
      </div>

      <main className="space-y-6 px-4 py-6 xl:px-6">
        <SectionCard
          title="Campaign Overview"
          subtitle="Key operational and performance indicators at a glance."
          actions={
            <div className="flex items-center gap-2">
              <Badge className="border-sky-200 bg-sky-50 text-sky-700">Desktop-first enterprise view</Badge>
              <div ref={overviewSettingsRef} className="relative">
                <button
                  onClick={() => setOverviewSettingsOpen(current => !current)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Settings
                </button>

                {overviewSettingsOpen ? (
                  <div className="absolute right-0 top-12 z-20 w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Overview cards</p>
                        <p className="mt-1 text-xs text-slate-500">Choose which metrics appear and reorder them for your preferred layout.</p>
                      </div>
                      <button className="text-xs font-medium text-slate-500" onClick={() => setOverviewSettingsOpen(false)}>Close</button>
                    </div>

                    <div className="grid max-h-80 gap-2 overflow-y-auto pr-1">
                      {kpiOrder.map((label, index) => {
                        const metric = KPIS.find(item => item.label === label)
                        if (!metric) return null

                        return (
                          <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={visibleKpis[label]}
                              onChange={() => toggleKpiVisibility(label)}
                              aria-label={`Toggle ${label}`}
                            />
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <GripVertical className="h-4 w-4 flex-shrink-0 text-slate-400" />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-800">{toSentenceCaseLabel(metric.label)}</p>
                                <p className="truncate text-xs text-slate-500">{metric.value} currently displayed</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => moveKpi(label, 'up')}
                                disabled={index === 0}
                                className="rounded-full border border-slate-200 p-1.5 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={`Move ${label} up`}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => moveKpi(label, 'down')}
                                disabled={index === kpiOrder.length - 1}
                                className="rounded-full border border-slate-200 p-1.5 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={`Move ${label} down`}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          }
        >
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {orderedVisibleKpis.map(metric => <MetricCard key={metric.label} metric={metric} />)}
          </div>
        </SectionCard>

        <SectionCard title="Campaign Performance Table" subtitle="Sortable, searchable, and designed for bulk decisions across large campaign volumes." actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                value={tableSearch}
                onChange={event => { setTableSearch(event.target.value); setPage(1) }}
                placeholder="Search table"
                className="w-56 rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        }>
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-5 py-3 text-sm">
            <span className="font-medium text-slate-500">Saved Views:</span>
            {SAVED_VIEWS.map(view => (
              <button key={view.label} onClick={() => applyView(view)} className={cn('rounded-full px-3 py-1.5 font-medium transition', selectedView === view.label ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100')}>
                {view.label}
              </button>
            ))}
            <button onClick={() => {
              setSelectedView('All Campaigns')
              setSearchQuery('')
              setTableSearch('')
              setSelectedStatus('All')
              setSelectedChannel('All')
              setSelectedMode('All')
              setSelectedProperty('All')
              setSelectedTags('All')
              setSelectedBudgetStatus('All')
            }} className="rounded-full border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50">Reset</button>
          </div>

          <div className="border-b border-slate-200 px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
                  Bulk selection
                </label>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium">{sortedRows.length} matching campaigns</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium">{selectedCount} selected</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SelectField value={selectedBudgetStatus} onChange={event => { setSelectedBudgetStatus(event.target.value); setPage(1) }} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 outline-none" iconInsetClassName="right-3">
                  {BUDGET_STATUS_OPTIONS.map(option => <option key={option} value={option}>{option === 'All' ? 'Budget Status' : option}</option>)}
                </SelectField>
                <SelectField value={rowsPerPage} onChange={event => setRowsPerPage(Number(event.target.value))} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 outline-none" iconInsetClassName="right-3">
                  {[6, 8, 10, 15].map(option => <option key={option} value={option}>{option} / page</option>)}
                </SelectField>
              </div>
            </div>
          </div>

          <div ref={tableWrapRef} className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur">
                <tr>
                  <th className="sticky left-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 align-middle">
                    <span className="sr-only">Select</span>
                  </th>
                  {tableColumns.map(column => {
                    const active = sortKey === column.key
                    return (
                      <th
                        key={column.key}
                        style={{ width: columnWidths[column.key], minWidth: columnWidths[column.key] }}
                        className={cn('group relative border-b border-slate-200 px-4 py-3 font-semibold text-slate-700 align-middle', column.align === 'right' ? 'text-right' : 'text-left', column.key === 'actions' ? 'text-center' : '')}
                      >
                        <button className="flex w-full items-center gap-2 whitespace-nowrap outline-none" onClick={() => handleHeaderSort(column)}>
                          <span>{toSentenceCaseLabel(column.label)}</span>
                          {column.sortable ? <ChevronDown className={cn('h-3.5 w-3.5 transition', active && sortDirection === 'asc' ? 'rotate-180 text-blue-600' : active ? 'text-blue-600' : 'text-slate-400')} /> : null}
                        </button>
                        {column.key !== 'actions' ? (
                          <div
                            onMouseDown={event => startColumnResize(event, column.key)}
                            className="absolute right-0 top-0 h-full w-2 cursor-col-resize opacity-0 transition group-hover:opacity-100"
                          >
                            <span className="absolute right-0 top-1/2 h-6 -translate-y-1/2 border-r border-slate-300" />
                          </div>
                        ) : null}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={tableColumns.length + 1} className="px-6 py-16 text-center text-slate-500">
                      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                        <div className="rounded-full bg-slate-100 p-4 text-slate-400"><BookOpen className="h-6 w-6" /></div>
                        <p className="text-base font-semibold text-slate-900">No campaigns match the current filters.</p>
                        <p className="text-sm text-slate-500">Adjust the view, clear filters, or create a new campaign to populate this table.</p>
                      </div>
                    </td>
                  </tr>
                ) : pagedRows.map(row => {
                  const selected = selectedCampaignIds.includes(row.id)
                  return (
                    <tr key={row.id} className="group border-b border-slate-100 transition hover:bg-slate-50">
                      <td className="sticky left-0 z-20 border-b border-slate-100 bg-white px-4 py-4 align-middle">
                        <input type="checkbox" checked={selected} onChange={() => toggleSelection(row.id)} aria-label={`Select ${row.name}`} />
                      </td>
                      {tableColumns.map(column => {
                        const width = columnWidths[column.key]
                        return (
                          <td key={column.key} style={{ width, minWidth: width }} className={cn('border-b border-slate-100 px-4 py-4 align-middle', column.align === 'right' ? 'text-right' : 'text-left', column.key === 'actions' ? 'text-center' : '')}>
                            {column.key === 'name' ? (
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-slate-900">{row.name}</p>
                                  <Badge className="border-slate-200 bg-slate-100 text-slate-600">{row.visibility}</Badge>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">{row.property}</p>
                              </div>
                            ) : null}

                            {column.key === 'channel' ? <Badge className="border-slate-200 bg-slate-100 text-slate-700">{toSentenceCaseLabel(row.channel)}</Badge> : null}

                            {column.key === 'status' ? (
                              <div className="flex items-center justify-between gap-2">
                                <Badge className={getStatusTone(row.status)}>{row.status}</Badge>
                                <button onClick={() => toggleStatus(row.id)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100" aria-label={`Toggle status for ${row.name}`}>
                                  {row.status === 'Active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                  {row.status === 'Active' ? 'Pause' : 'Resume'}
                                </button>
                              </div>
                            ) : null}

                            {column.key === 'objective' ? <p className="text-slate-700">{row.objective}</p> : null}
                            {column.key === 'audience' ? <p className="text-slate-700">{row.audience}</p> : null}
                            {column.key === 'budget' ? <TableMetric value={formatCurrency(row.budget)} /> : null}
                            {column.key === 'spend' ? <TableMetric value={formatCurrency(row.spend)} tone={row.spend > row.budget ? 'rose' : 'slate'} /> : null}
                            {column.key === 'ctr' ? <TableMetric value={formatPercent(row.ctr)} tone={row.ctr >= 5 ? 'green' : row.ctr >= 3 ? 'amber' : 'rose'} /> : null}
                            {column.key === 'cpc' ? <TableMetric value={formatCurrency(row.cpc)} /> : null}
                            {column.key === 'cpa' ? <TableMetric value={formatCurrency(row.cpa)} tone={row.cpa <= 25 ? 'green' : row.cpa <= 50 ? 'amber' : 'rose'} /> : null}
                            {column.key === 'conversions' ? <TableMetric value={formatCompact(row.conversions)} /> : null}
                            {column.key === 'revenue' ? <TableMetric value={formatCurrency(row.revenue)} tone={row.revenue > 0 ? 'green' : 'slate'} /> : null}
                            {column.key === 'roas' ? <TableMetric value={`${row.roas.toFixed(1)}x`} tone={row.roas >= 5 ? 'green' : row.roas >= 3 ? 'amber' : 'rose'} /> : null}
                            {column.key === 'createdBy' ? <p className="text-slate-700">{row.createdBy}</p> : null}
                            {column.key === 'lastUpdated' ? <p className="text-slate-700">{formatDate(row.lastUpdated)}</p> : null}
                            {column.key === 'startDate' ? <p className="text-slate-700">{formatDate(row.startDate)}</p> : null}
                            {column.key === 'endDate' ? <p className="text-slate-700">{formatDate(row.endDate)}</p> : null}
                            {column.key === 'actions' ? (
                              <div ref={openMenuId === row.id ? menuRef : undefined} className="relative inline-flex items-center justify-center gap-2 text-slate-500">
                                <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:bg-slate-50"><Edit3 className="h-4 w-4" /></button>
                                <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:bg-slate-50" onClick={() => setOpenMenuId(current => current === row.id ? null : row.id)}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>

                                {openMenuId === row.id ? (
                                  <div className="absolute right-0 top-10 z-20 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                                    {[
                                      { label: 'Quick Edit', icon: Edit3 },
                                      { label: 'Duplicate', icon: Copy, action: () => duplicateCampaign(row.id) },
                                      { label: row.status === 'Active' ? 'Pause' : 'Resume', icon: row.status === 'Active' ? Pause : Play, action: () => toggleStatus(row.id) },
                                      { label: 'Archive', icon: Download },
                                      { label: 'Delete', icon: Trash2, tone: 'rose' },
                                    ].map(item => {
                                      const Icon = item.icon
                                      return (
                                        <button
                                          key={item.label}
                                          onClick={() => {
                                            if (item.label === 'Delete') removeCampaign(row.id)
                                            else if (item.action) item.action()
                                            setOpenMenuId(null)
                                          }}
                                          className={cn('flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-50', item.label === 'Delete' ? 'text-rose-600' : 'text-slate-700')}
                                        >
                                          <Icon className="h-4 w-4" />
                                          {item.label}
                                        </button>
                                      )
                                    })}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Showing {Math.min(sortedRows.length, (page - 1) * rowsPerPage + 1)}-{Math.min(sortedRows.length, page * rowsPerPage)} of {sortedRows.length} campaigns</p>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setPage(current => Math.max(1, current - 1))} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-40" disabled={page === 1}>Previous</button>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Page {page} of {totalPages}</div>
              <button onClick={() => setPage(current => Math.min(totalPages, current + 1))} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-40" disabled={page === totalPages}>Next</button>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard
            title="Performance Analytics"
            subtitle="Compare multiple campaigns with enterprise analytics views and date granularity controls."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                {CHART_GRANULARITIES.map(option => <PillButton key={option} active={granularity === option} onClick={() => setGranularity(option)}>{option}</PillButton>)}
              </div>
            }
          >
            <div className="grid gap-5 p-5 2xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Spend Over Time</p>
                    <p className="text-xs text-slate-500">Line chart with multiple campaign overlays</p>
                  </div>
                    <LineChartIcon className="h-4 w-4 text-slate-400" />
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={SPEND_SERIES}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="period" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="spend" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Clicks vs Conversions</p>
                    <p className="text-xs text-slate-500">Area chart tracking demand efficiency</p>
                  </div>
                  <Layers3 className="h-4 w-4 text-slate-400" />
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={SPEND_SERIES}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="period" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip />
                      <Area type="monotone" dataKey="clicks" stroke="#0ea5e9" fill="#dbeafe" fillOpacity={0.8} />
                      <Area type="monotone" dataKey="conversions" stroke="#16a34a" fill="#dcfce7" fillOpacity={0.8} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Revenue vs Spend</p>
                    <p className="text-xs text-slate-500">Bar chart for financial comparison</p>
                  </div>
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={SPEND_SERIES}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="period" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="spend" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="revenue" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">CTR Trend</p>
                    <p className="text-xs text-slate-500">Campaign health over time</p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={SPEND_SERIES.map(item => ({ ...item, ctr: Math.min(2 + item.clicks / 100, 9) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="period" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="ctr" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Channel Performance" subtitle="High-level channel performance cards with pacing indicators and status states.">
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {channelsWithStatus.map(channel => (
                <article key={channel.channel} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{channel.channel}</p>
                      <Badge className={cn('mt-2', channel.status === 'Strong' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : channel.status === 'Healthy' ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-amber-200 bg-amber-50 text-amber-700')}>
                        {channel.status}
                      </Badge>
                    </div>
                    <div className="rounded-full bg-white p-2 text-slate-500 shadow-sm"><Megaphone className="h-4 w-4" /></div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-slate-500">Spend</p><p className="mt-1 font-semibold text-slate-900">{formatCurrency(channel.spend)}</p></div>
                    <div><p className="text-xs text-slate-500">Revenue</p><p className="mt-1 font-semibold text-slate-900">{formatCurrency(channel.revenue)}</p></div>
                    <div><p className="text-xs text-slate-500">ROAS</p><p className="mt-1 font-semibold text-slate-900">{channel.roas.toFixed(1)}x</p></div>
                    <div><p className="text-xs text-slate-500">Conversions</p><p className="mt-1 font-semibold text-slate-900">{formatCompact(channel.conversions)}</p></div>
                    <div className="col-span-2"><p className="text-xs text-slate-500">CTR</p><p className="mt-1 font-semibold text-slate-900">{formatPercent(channel.ctr)}</p></div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Progress indicator</span>
                      <span>{channel.trend}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div className={cn('h-full rounded-full', channel.status === 'Strong' ? 'bg-emerald-500' : channel.status === 'Healthy' ? 'bg-blue-500' : 'bg-amber-500')} style={{ width: `${Math.min((channel.roas / 10) * 100, 100)}%` }} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionCard title="Budget Tracker" subtitle="Campaign pacing view with budget allocation, remaining spend, and forecast pressure.">
            <div className="space-y-4 p-5">
              {budgetProgress.map(item => (
                <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.channel} · {item.property}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getBudgetTone(item.budgetStatus)}>{item.budgetStatus}</Badge>
                      <Badge className="border-slate-200 bg-slate-100 text-slate-600">{item.utilization.toFixed(0)}% utilization</Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <div><p className="text-xs text-slate-500">Allocated Budget</p><p className="mt-1 text-sm font-semibold">{formatCurrency(item.allocated)}</p></div>
                    <div><p className="text-xs text-slate-500">Actual Spend</p><p className="mt-1 text-sm font-semibold">{formatCurrency(item.actual)}</p></div>
                    <div><p className="text-xs text-slate-500">Remaining Budget</p><p className="mt-1 text-sm font-semibold">{formatCurrency(item.remaining)}</p></div>
                    <div><p className="text-xs text-slate-500">Forecast Spend</p><p className="mt-1 text-sm font-semibold">{formatCurrency(item.forecast)}</p></div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Budget progress bar</span>
                      <span>{formatPercent(item.utilization)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                      <div className={cn('h-full rounded-full', item.utilization > 100 ? 'bg-rose-500' : item.utilization > 85 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${Math.min(item.utilization, 100)}%` }} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Audience Insights" subtitle="Core audience segments and distribution snapshots.">
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Age Distribution</p>
                <div className="mt-4 space-y-3">
                  {AUDIENCE_DATA.map(item => (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between text-xs text-slate-500"><span>{item.label}</span><span>{item.value}%</span></div>
                      <div className="h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${item.value}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Gender</p>
                <div className="mt-4 space-y-3">
                  {GENDER_DATA.map(item => (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between text-xs text-slate-500"><span>{item.label}</span><span>{item.value}%</span></div>
                      <div className="h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${item.value}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Device Breakdown</p>
                <div className="mt-4 space-y-3">
                  {DEVICE_DATA.map(item => (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between text-xs text-slate-500"><span>{item.label}</span><span>{item.value}%</span></div>
                      <div className="h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-slate-700" style={{ width: `${item.value}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Geo Distribution</p>
                <div className="mt-4 space-y-3">
                  {GEO_DATA.map(item => (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between text-xs text-slate-500"><span>{item.label}</span><span>{item.value}%</span></div>
                      <div className="h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-amber-500" style={{ width: `${item.value}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Language</p>
                  <div className="flex flex-wrap gap-2">
                    {['New vs Returning Guests', 'Audience Segments', 'VIP Guests', 'Loyalty Members', 'Business Travelers', 'Leisure Travelers'].map(item => (
                      <Badge key={item} className="border-slate-200 bg-slate-100 text-slate-600">{item}</Badge>
                    ))}
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {LANGUAGE_DATA.map(item => (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between text-xs text-slate-500"><span>{item.label}</span><span>{item.value}%</span></div>
                      <div className="h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${item.value}%` }} /></div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  {AUDIENCE_SEGMENTS.map(segment => (
                    <div key={segment.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs tracking-[0.08em] text-slate-500">{toSentenceCaseLabel(segment.label)}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{segment.value}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <SectionCard title="Marketing Funnel" subtitle="Stage-to-stage conversion view with percentage loss between each step.">
            <div className="p-5">
              <div className="space-y-4">
                {FUNNEL.map((stage, index) => {
                  const nextStage = FUNNEL[index + 1]
                  return (
                    <div key={stage.stage} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{stage.stage}</p>
                          <p className="mt-1 text-xs text-slate-500">{stage.value.toLocaleString()}</p>
                        </div>
                        {stage.rate ? <Badge className="border-blue-200 bg-blue-50 text-blue-700">{stage.rate}</Badge> : <Badge className="border-slate-200 bg-slate-100 text-slate-600">Top of funnel</Badge>}
                      </div>
                      {nextStage ? <div className="mt-3 text-center text-xs font-semibold text-slate-400">↓ {Math.max(0, Math.round((nextStage.value / stage.value) * 100))}% to {nextStage.stage}</div> : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Alerts & AI Recommendations" subtitle="Enterprise notification panel with operational insight and next-best actions.">
            <div className="grid gap-5 p-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Alerts</p>
                  <Badge className="border-slate-200 bg-slate-100 text-slate-600">{alertCounts} active</Badge>
                </div>
                {ALERTS.map(alert => (
                  <div key={alert.title} className={cn('rounded-2xl border p-4', getAlertTone(alert.tone))}>
                    <p className="text-sm font-semibold">{alert.title}</p>
                    <p className="mt-1 text-sm opacity-80">{alert.detail}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">AI Recommendations</p>
                  <Badge className="border-violet-200 bg-violet-50 text-violet-700"><Sparkles className="mr-1 h-3.5 w-3.5" />Enabled</Badge>
                </div>
                {RECOMMENDATIONS.map(recommendation => (
                  <div key={recommendation.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-white p-2 text-blue-600 shadow-sm"><Sparkles className="h-4 w-4" /></div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{recommendation.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{recommendation.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <SectionCard title="Campaign Timeline" subtitle="Chronological view of the campaign lifecycle and operational milestones.">
            <div className="space-y-0 p-5">
              {TIMELINE.map((entry, index) => (
                <div key={entry.label} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-700 shadow-sm"><span className="text-xs font-semibold">{index + 1}</span></div>
                    {index !== TIMELINE.length - 1 ? <div className="h-full w-px bg-slate-200" /> : null}
                  </div>
                  <div className="flex-1 rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
                      <p className="text-xs text-slate-500">{formatDate(entry.date)}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{entry.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Quick Actions" subtitle="Floating action set for high-frequency campaign operations." className="xl:sticky xl:top-[250px]">
            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-1">
              {[
                'Create Campaign',
                'Duplicate Campaign',
                'Import Campaign',
                'Export Campaign',
                'Bulk Edit',
                'Pause Selected',
                'Delete Selected',
              ].map(action => (
                <button key={action} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                  <span>{action}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-semibold">Quick decision support</p>
                <p className="mt-1 text-blue-800">Use selection, filters, and the context menu to move from analysis to action without leaving the page.</p>
              </div>
            </div>
          </SectionCard>
        </div>
      </main>

      {selectedCount > 0 ? (
        <div className="fixed bottom-5 left-1/2 z-40 w-[min(980px,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">{selectedCount} selected</div>
              <span className="text-slate-500">Bulk actions are ready for the selected campaigns.</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"><Edit3 className="h-4 w-4" />Bulk Edit</button>
              <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"><Pause className="h-4 w-4" />Pause Selected</button>
              <button className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"><Trash2 className="h-4 w-4" />Delete Selected</button>
              <button onClick={() => setSelectedCampaignIds([])} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600"><X className="h-4 w-4" />Clear</button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="group fixed bottom-5 right-5 z-40 hidden xl:block">
        <div className="pointer-events-none absolute bottom-16 right-0 w-72 translate-y-2 rounded-3xl border border-slate-200 bg-white p-4 opacity-0 shadow-2xl transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Quick Actions</p>
              <p className="text-xs text-slate-500">Hover or focus to reveal</p>
            </div>
            <div className="rounded-full bg-blue-50 p-2 text-blue-700"><Sparkles className="h-4 w-4" /></div>
          </div>
          <div className="mt-4 grid gap-2">
            {['Create Campaign', 'Duplicate Campaign', 'Import Campaign', 'Export Campaign'].map(action => (
              <button key={action} className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                <span>{action}</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-blue-200 bg-blue-600 text-white shadow-2xl transition hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Open quick actions"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export default CampaignManagementPage