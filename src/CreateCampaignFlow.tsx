import React, { useState, useEffect, useMemo } from 'react'
import {
  Button,
  WizardStepper,
  TextInput,
  BadgeStatus,
  InlineMessage,
} from 'agilysys-unity-widget-react'
import {
  X, Send, Mail, MessageSquare, Zap, Calendar, MousePointer,
  Search, Check, Users, Clock,
  Sparkles, Target, FileText, Star, ClipboardList, Globe, Info,
  Paperclip, Upload, Trash2,
  Filter, ChevronDown, ChevronRight, Settings, Instagram,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type CampaignType = 'event-driven' | 'scheduled' | 'on-demand' | 'internal-survey' | 'external-survey'
type Channel = 'email' | 'sms' | 'both'
type DeliveryMode = 'email' | 'sms' | 'push' | 'social' | 'all' | ''
type AudienceMode = 'segment' | 'custom'

interface AudienceRule {
  id: string
  field: string
  operator: string
  value: string
}

interface SavedSegment {
  id: string
  label: string
  count: string
  hint: string
  source: 'custom'
  sourceTemplateId?: string
}

interface Attachment {
  id: string
  name: string
  size: number   // bytes
  mimeType: string
}

interface FormState {
  name: string
  type: CampaignType | ''
  channel: Channel | ''
  deliveryMode: DeliveryMode
  senderMode: 'default' | 'custom'
  senderEmail: string
  replyToEmail: string
  fromName: string
  subject: string
  previewText: string
  campaignTrackingEnabled: boolean
  trackOpen: boolean
  trackClick: boolean
  trackUtm: boolean
  trackConversion: boolean
  manageReplies: boolean
  autoAcknowledgment: boolean
  trackReplyResolution: boolean
  templateIds: string[]
  segmentId: string
  audienceMode: AudienceMode
  customRules: AudienceRule[]
  rulesLogic: 'AND' | 'OR'
  triggerEvent: string
  surveyScheduleMode: 'event-driven' | 'scheduled'
  scheduleType: 'best-time' | 'custom' | 'always-on'
  scheduleDate: string
  scheduleTime: string
  timingAction: string
  timingRelation: 'before' | 'after'
  timingValue: string
  timingUnit: 'hours' | 'days'
  fromDate: string
  toDate: string
  attachments: Attachment[]
  savedSegments: SavedSegment[]
}

const DEFAULT_SENDER_EMAIL = 'marketing@alpineresort.com'
const DEFAULT_REPLY_TO_EMAIL = 'guestservices@alpineresort.com'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const CAMPAIGN_TYPES = [
  {
    id: 'event-driven',
    label: 'Event Driven',
    icon: Zap,
    desc: 'Sends automatically when a guest reaches a trigger — check-in, booking, checkout.',
    example: 'e.g. Pre-Arrival, Post-Stay',
  },
  {
    id: 'scheduled',
    label: 'Scheduled',
    icon: Calendar,
    desc: 'Sends to an audience at a specific date and time you choose.',
    example: 'e.g. Weekly Promo, Seasonal Offer',
  },
  {
    id: 'on-demand',
    label: 'On Demand',
    icon: MousePointer,
    desc: "Send immediately to a guest list whenever you're ready.",
    example: 'e.g. Flash Sale, Urgent Notice',
  },
  {
    id: 'internal-survey',
    label: 'Internal Survey',
    icon: ClipboardList,
    desc: 'Send a survey to staff or internal teams to collect feedback.',
    example: 'e.g. Staff Satisfaction, Ops Check-in',
  },
  {
    id: 'external-survey',
    label: 'External Survey',
    icon: Globe,
    desc: 'Send a guest-facing survey to collect post-stay or in-stay feedback.',
    example: 'e.g. Post-Stay Rating, Mid-Stay NPS',
  },
] as const

const TRIGGER_MODULES = [
  {
    id: 'reserve', label: 'Reserve', icon: '🏨', color: '#1a4c8b', bgColor: '#e8f0fb',
    events: [
      { id: 'reservation-created',   label: 'Reservation Created',  hint: 'New booking confirmed' },
      { id: 'check-in',              label: 'Check-In',             hint: 'Guest arrives & checks in' },
      { id: 'check-out',             label: 'Check-Out',            hint: 'Stay completed' },
      { id: 'reservation-cancelled', label: 'Cancellation',         hint: 'Booking cancelled by guest' },
      { id: 'pre-arrival',           label: 'Pre-Arrival',          hint: '24h before arrival date' },
      { id: 'post-stay',             label: 'Post-Stay',            hint: '24h after checkout' },
      { id: 'room-upgrade',          label: 'Room Upgrade Offered', hint: 'Upsell upgrade triggered' },
      { id: 'no-show',               label: 'No Show',              hint: 'Guest did not arrive' },
    ],
  },
  {
    id: 'spa', label: 'SPA', icon: '🧖', color: '#7b5ea7', bgColor: '#f3effe',
    events: [
      { id: 'spa-booking',           label: 'Booking Confirmed',    hint: 'Spa service booked' },
      { id: 'spa-completed',         label: 'Treatment Completed',  hint: 'Service delivered & finished' },
      { id: 'spa-reminder',          label: 'Appointment Reminder', hint: '24h before spa visit' },
      { id: 'spa-package',           label: 'Package Purchased',    hint: 'Spa package bought' },
    ],
  },
  {
    id: 'engage', label: 'Engage', icon: '🎯', color: '#c06000', bgColor: '#fff3e0',
    events: [
      { id: 'loyalty-milestone',     label: 'Milestone Reached',    hint: 'Guest hits a rewards tier' },
      { id: 'points-earned',         label: 'Points Earned',        hint: 'Points added to account' },
      { id: 'tier-upgrade',          label: 'Tier Upgrade',         hint: 'Moved to a higher tier' },
      { id: 'referral-completed',    label: 'Referral Completed',   hint: 'Guest referred someone' },
    ],
  },
  {
    id: 'giftcards', label: 'Gift Cards', icon: '🎁', color: '#2d6a4f', bgColor: '#e6f4ed',
    events: [
      { id: 'giftcard-purchased',    label: 'Card Purchased',       hint: 'Gift card bought' },
      { id: 'giftcard-redeemed',     label: 'Card Redeemed',        hint: 'Gift card used at checkout' },
      { id: 'giftcard-balance-low',  label: 'Balance Running Low',  hint: 'Balance below threshold' },
      { id: 'giftcard-expiring',     label: 'Expiring Soon',        hint: 'Expiry within 30 days' },
    ],
  },
]

// Flat list used for summary card lookup
const TRIGGER_EVENTS = TRIGGER_MODULES.flatMap(m => m.events)

const TEMPLATES = [
  { id: 't1', name: 'Pre-Arrival Welcome',    type: 'Event Driven', channel: 'email', used: 'Used 3 times', score: 5,  thumb: '✉️' },
  { id: 't2', name: 'Post-Stay Thank You',     type: 'Scheduled',    channel: 'email', used: 'Used 12 times', score: 5, thumb: '🙏' },
  { id: 't3', name: 'Spa & Wellness Offer',    type: 'On Demand',    channel: 'email', used: 'Used 2 times', score: 4,  thumb: '🧖' },
  { id: 't4', name: 'Weekend Golf Package',    type: 'On Demand',    channel: 'email', used: 'Used 5 times', score: 4,  thumb: '⛳' },
  { id: 't5', name: 'Loyalty Re-Engagement',   type: 'Scheduled',    channel: 'sms',   used: 'Used 1 time',  score: 3,  thumb: '🎯' },
  { id: 't6', name: 'Booking Confirmation',    type: 'Event Driven', channel: 'email', used: 'Used 28 times', score: 5, thumb: '✅' },
  { id: 'blank', name: 'Start from blank',      type: 'any',          channel: 'any',   used: '',             score: 0,  thumb: '➕' },
]

const SEGMENTS = [
  { id: 's-all',     label: 'All Guests',         count: '26,000', icon: Users,  hint: 'Your full guest database' },
  { id: 's-recent',  label: 'Recent Bookers',      count: '3,240',  icon: Clock,  hint: 'Booked in the last 90 days' },
  { id: 's-loyalty', label: 'Loyalty Members',     count: '8,412',  icon: Star,   hint: 'Enrolled in rewards program' },
  { id: 's-lapsed',  label: 'Lapsed Guests',       count: '4,180',  icon: Target, hint: "Haven't visited in 12+ months" },
  { id: 's-spa',     label: 'Spa Visitors',        count: '2,060',  icon: Sparkles, hint: 'Used spa in last 6 months' },
]

const STEPS = [
  { label: 'Basics',    secondaryLabel: 'Name & type' },
  { label: 'Template',  secondaryLabel: 'Pick a design' },
  { label: 'Audience',  secondaryLabel: 'Who receives it' },
  { label: 'Schedule',  secondaryLabel: 'When to send' },
]

// ─── Audience Rule Config ─────────────────────────────────────────────────────

type FieldType = 'number' | 'select' | 'date' | 'text'

interface FieldDef {
  id: string
  label: string
  type: FieldType
  operators: { id: string; label: string }[]
  options?: { id: string; label: string }[]  // for select type
  placeholder?: string
  unit?: string
}

const RULE_FIELDS: FieldDef[] = [
  {
    id: 'last_visit_days',
    label: 'Last Visit',
    type: 'number',
    operators: [
      { id: 'within',       label: 'within the last (days)' },
      { id: 'more_than',    label: 'more than (days) ago' },
      { id: 'exactly',      label: 'exactly (days) ago' },
    ],
    placeholder: 'e.g. 30',
    unit: 'days',
  },
  {
    id: 'total_spend',
    label: 'Total Lifetime Spend',
    type: 'number',
    operators: [
      { id: 'gt', label: 'greater than ($)' },
      { id: 'lt', label: 'less than ($)' },
      { id: 'eq', label: 'equals ($)' },
    ],
    placeholder: 'e.g. 500',
    unit: '$',
  },
  {
    id: 'loyalty_tier',
    label: 'Loyalty Tier',
    type: 'select',
    operators: [
      { id: 'is',     label: 'is' },
      { id: 'is_not', label: 'is not' },
    ],
    options: [
      { id: 'bronze',    label: 'Bronze' },
      { id: 'silver',    label: 'Silver' },
      { id: 'gold',      label: 'Gold' },
      { id: 'platinum',  label: 'Platinum' },
      { id: 'none',      label: 'Not enrolled' },
    ],
  },
  {
    id: 'booking_source',
    label: 'Booking Source',
    type: 'select',
    operators: [
      { id: 'is',     label: 'is' },
      { id: 'is_not', label: 'is not' },
    ],
    options: [
      { id: 'direct',    label: 'Direct' },
      { id: 'ota',       label: 'OTA' },
      { id: 'group',     label: 'Group' },
      { id: 'corporate', label: 'Corporate' },
      { id: 'travel_agent', label: 'Travel Agent' },
    ],
  },
  {
    id: 'room_type',
    label: 'Room Type',
    type: 'select',
    operators: [
      { id: 'is',     label: 'is' },
      { id: 'is_not', label: 'is not' },
    ],
    options: [
      { id: 'standard', label: 'Standard' },
      { id: 'deluxe',   label: 'Deluxe' },
      { id: 'suite',    label: 'Suite' },
      { id: 'villa',    label: 'Villa' },
    ],
  },
  {
    id: 'guest_type',
    label: 'Guest Type',
    type: 'select',
    operators: [
      { id: 'is',     label: 'is' },
      { id: 'is_not', label: 'is not' },
    ],
    options: [
      { id: 'leisure',   label: 'Leisure' },
      { id: 'business',  label: 'Business' },
      { id: 'family',    label: 'Family' },
    ],
  },
  {
    id: 'visit_count',
    label: 'Total Visits',
    type: 'number',
    operators: [
      { id: 'gt', label: 'more than' },
      { id: 'lt', label: 'fewer than' },
      { id: 'eq', label: 'exactly' },
    ],
    placeholder: 'e.g. 3',
    unit: 'visits',
  },
  {
    id: 'email_status',
    label: 'Email Status',
    type: 'select',
    operators: [
      { id: 'is', label: 'is' },
    ],
    options: [
      { id: 'subscribed',   label: 'Subscribed' },
      { id: 'unsubscribed', label: 'Unsubscribed' },
      { id: 'bounced',      label: 'Bounced' },
    ],
  },
  {
    id: 'checkin_date',
    label: 'Check-in Date',
    type: 'date',
    operators: [
      { id: 'after',   label: 'after' },
      { id: 'before',  label: 'before' },
      { id: 'between', label: 'on' },
    ],
    placeholder: 'YYYY-MM-DD',
  },
  {
    id: 'nationality',
    label: 'Nationality / Region',
    type: 'text',
    operators: [
      { id: 'contains',     label: 'contains' },
      { id: 'not_contains', label: 'does not contain' },
    ],
    placeholder: 'e.g. United States',
  },
]

// Simulated estimated reach based on number of rules (deterministic)
function estimateReach(rules: AudienceRule[], logic: 'AND' | 'OR'): number {
  if (rules.length === 0) return 0
  const complete = rules.filter(r => r.field && r.operator && r.value.trim())
  if (complete.length === 0) return 0
  // AND narrows, OR widens — simulate plausible numbers
  const base = 26000
  const factor = logic === 'AND'
    ? Math.pow(0.52, complete.length)
    : 1 - Math.pow(0.48, complete.length)
  return Math.max(50, Math.round(base * factor / 10) * 10)
}

function makeRule(): AudienceRule {
  return { id: `r${Date.now()}-${Math.random().toString(36).slice(2,6)}`, field: '', operator: '', value: '' }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  const [desc, example] = text.split('\n')
  return (    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info size={12} color="var(--unity-text-placeholder, #aaa)" style={{ cursor: 'default', flexShrink: 0 }} />
      {show && (
        <div style={{
          position: 'absolute', bottom: '100%', right: 0,
          marginBottom: 8, zIndex: 999,
          background: 'var(--unity-color-surface-inverse, #1a1a1a)',
          color: '#fff', fontSize: 14, lineHeight: 1.6,
          padding: '7px 10px', borderRadius: 6,
          width: 180,
          whiteSpace: 'normal' as const,
          boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
          pointerEvents: 'none',
        }}>
          <span>{desc}</span>
          {example && <><br /><span style={{ opacity: 0.65, fontSize: 14 }}>{example}</span></>}
          {/* Arrow */}
          <div style={{
            position: 'absolute', top: '100%', right: 6,
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid var(--unity-color-surface-inverse, #1a1a1a)',
          }} />
        </div>
      )}
    </div>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--unity-text-strong, #1a1a1a)', marginBottom: 6 }}>
      {children}
      {required && <span style={{ color: 'var(--unity-surface-fill-error-strong, #e51c00)', marginLeft: 3 }}>*</span>}
    </p>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--unity-text-strong, #1a1a1a)', marginBottom: 4 }}>
      {children}
    </h2>
  )
}
function SectionSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 14, color: 'var(--unity-text-subtle, #767676)', marginBottom: 24 }}>
      {children}
    </p>
  )
}

// ─── Campaign Summary Card ────────────────────────────────────────────────────

function CampaignSummaryCard({ form, step }: { form: FormState; step: number }) {
  const template = TEMPLATES.find(t => t.id === form.templateIds[0])
  const segment = [...SEGMENTS, ...form.savedSegments].find(s => s.id === form.segmentId)
  const triggerLabel = TRIGGER_EVENTS.find(e => e.id === form.triggerEvent)?.label
  const typeLabel = CAMPAIGN_TYPES.find(t => t.id === form.type)?.label

  const rows: { label: string; value: React.ReactNode }[] = [
    ...(form.name.trim() ? [{ label: 'Name', value: form.name.trim() }] : []),
    ...(typeLabel ? [{ label: 'Type', value: typeLabel }] : []),
    ...(form.channel ? [{
      label: 'Channel',
      value: form.channel === 'email' ? 'Email' : form.channel === 'sms' ? 'SMS' : 'Email + SMS',
    }] : []),
    ...(triggerLabel ? [{ label: 'Trigger', value: triggerLabel }] : []),
    ...(step >= 2 && template ? [{ label: 'Template', value: template.name }] : []),
    ...(step >= 3 ? [{ label: 'Audience', value: (() => {
      if (form.audienceMode === 'custom') {
        const n = form.customRules.filter(r => r.field && r.operator && r.value.trim()).length
        return n > 0 ? `${n} custom rule${n > 1 ? 's' : ''} (${form.rulesLogic})` : null
      }
      return segment ? `${segment.label} · ${segment.count}` : null
    })() }].filter(r => r.value !== null) as { label: string; value: React.ReactNode }[] : []),
  ]

  const pct = Math.round((step / (STEPS.length - 1)) * 100)

  return (
    <div style={{
      position: 'sticky', top: 0,
      borderRadius: 10,
      border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
      background: 'var(--unity-color-surface-layer-1, #fff)',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
        background: 'var(--unity-color-surface-subtle, #f8f8f8)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--unity-text-strong, #1a1a1a)' }}>
          Campaign summary
        </p>
        <span style={{ fontSize: 14, color: 'var(--unity-text-subtle, #767676)', fontWeight: 500 }}>Step {step + 1} / {STEPS.length}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--unity-color-surface-subtle, #f0f0f0)' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--unity-in-fill-strong, #2e4de5)', transition: 'width 0.3s ease' }} />
      </div>

      {/* Rows */}
      {rows.length > 0 ? rows.map(row => (
        <div key={row.label as string} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '8px 16px',
          borderBottom: '1px solid var(--unity-color-surface-subtle, #f0f0f0)',
        }}>
          <span style={{ fontSize: 14, color: 'var(--unity-text-subtle, #767676)', fontWeight: 500, flexShrink: 0, marginRight: 8 }}>{row.label}</span>
          <span style={{ fontSize: 14, color: 'var(--unity-text-strong, #1a1a1a)', fontWeight: 600, maxWidth: 150, textAlign: 'right', lineHeight: 1.4 }}>{row.value}</span>
        </div>
      )) : (
        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--unity-text-placeholder, #aaa)' }}>Fill in details to see your summary here.</p>
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'flex-start' }}>
      <span style={{ fontSize: 12, color: '#8f8f8f', lineHeight: 1.2 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: value ? '#1a1a1a' : '#d0d0d0', lineHeight: 1.35, minHeight: 19, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value || '—'}
      </span>
    </div>
  )
}

function CampaignSummarySidebar({ form, step = 0 }: { form: FormState; step?: number }) {
  const [previewIdx, setPreviewIdx] = useState(0)

  const triggerLabel = TRIGGER_EVENTS.find(e => e.id === form.triggerEvent)?.label
  const deliveryLabel = form.deliveryMode === 'all' ? 'All Channels'
    : form.deliveryMode === 'social' ? 'Social Media'
    : form.deliveryMode === 'push' ? 'Push'
    : form.deliveryMode ? form.deliveryMode.charAt(0).toUpperCase() + form.deliveryMode.slice(1)
    : undefined
  const segment = [...SEGMENTS, ...form.savedSegments].find(s => s.id === form.segmentId)
  const isReadyToPublish = step >= 3 && !!form.name && !!form.deliveryMode && form.templateIds.length > 0 && !!segment

  // Carousel of selected templates
  const selectedTemplates = TEMPLATES.filter(t => form.templateIds.includes(t.id))
  const safeIdx = selectedTemplates.length > 0 ? Math.min(previewIdx, selectedTemplates.length - 1) : 0
  const previewTemplate = selectedTemplates[safeIdx] ?? null
  const TEMPLATE_ICON_COLORS = ['#1a9a5f', '#f5a623', '#e54de5', '#2e4de5', '#e51c00', '#c46a3a']
  const iconColor = previewTemplate
    ? TEMPLATE_ICON_COLORS[TEMPLATES.findIndex(t => t.id === previewTemplate.id) % TEMPLATE_ICON_COLORS.length]
    : '#2e4de5'
  function prevTemplate() { setPreviewIdx(i => (i - 1 + selectedTemplates.length) % selectedTemplates.length) }
  function nextTemplate() { setPreviewIdx(i => (i + 1) % selectedTemplates.length) }

  return (
    <div style={{
      width: 320, borderLeft: '1px solid #efefef',
      background: '#fff', display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      {/* Header */}
      <div style={{
        height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', borderBottom: '1px solid #efefef', flexShrink: 0,
      }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#5a5a5a' }}>Campaign summary</p>
        <Settings size={13} color="#c0c0c0" style={{ cursor: 'pointer' }} />
      </div>

      {/* Body — compact, no scroll */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Basic */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f2f2f2' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#7a7a7a', marginBottom: 8 }}>Basic</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12, rowGap: 10, alignItems: 'start' }}>
            <SummaryRow label="Trigger" value={triggerLabel} />
            <SummaryRow label="Channel" value={deliveryLabel} />
            <SummaryRow label="Name" value={form.name} />
            <SummaryRow label="From email" value={form.senderMode === 'default' ? DEFAULT_SENDER_EMAIL : form.senderEmail} />
            <SummaryRow label="From name" value={form.fromName} />
            <SummaryRow label="Tracking" value={form.campaignTrackingEnabled ? 'On' : undefined} />
          </div>
        </div>

        {/* Template Carousel */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f2f2f2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#7a7a7a' }}>
              Template{previewTemplate ? ` - ${previewTemplate.name}` : ''}
            </p>
            {selectedTemplates.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {selectedTemplates.length > 1 && (
                  <button onClick={prevTemplate} style={{ width: 18, height: 18, borderRadius: 3, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    <ChevronRight size={10} style={{ transform: 'rotate(180deg)', display: 'block' }} />
                  </button>
                )}
                <span style={{ fontSize: 12, fontWeight: 600, color: '#5a5a5a', minWidth: selectedTemplates.length > 1 ? 28 : 'auto', textAlign: 'center' }}>
                  {safeIdx + 1} / {selectedTemplates.length}
                </span>
                {selectedTemplates.length > 1 && (
                  <button onClick={nextTemplate} style={{ width: 18, height: 18, borderRadius: 3, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    <ChevronRight size={10} style={{ display: 'block' }} />
                  </button>
                )}
              </div>
            )}
          </div>

          {previewTemplate ? (
            <>
              <div style={{ borderRadius: 6, border: '1px solid #e8e8e8', overflow: 'hidden', background: '#fafbff', marginBottom: 7 }}>
                <div style={{ height: 30, background: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 12 }}>{previewTemplate.thumb}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{previewTemplate.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{previewTemplate.type}</span>
                </div>
                <div style={{ minHeight: 78, padding: '8px 10px 10px' }}>
                  <div style={{ height: 5, background: '#e0e0e0', borderRadius: 3, width: '65%', marginBottom: 4 }} />
                  <div style={{ height: 3, background: '#efefef', borderRadius: 2, width: '100%', marginBottom: 2 }} />
                  <div style={{ height: 3, background: '#efefef', borderRadius: 2, width: '80%', marginBottom: 5 }} />
                  <div style={{ height: 12, background: iconColor, borderRadius: 3, width: '45%', opacity: 0.7, marginBottom: 8 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid #e3e3e3', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 12 }}>{previewTemplate.thumb}</span>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid #e3e3e3', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 12 }}>{previewTemplate.thumb}</span>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid #e3e3e3', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 12 }}>{previewTemplate.thumb}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 12, padding: '1px 6px', borderRadius: 10, background: '#eef1ff', color: '#2e4de5', fontWeight: 600 }}>{previewTemplate.type}</span>
                <span style={{ fontSize: 12, color: '#f5a623' }}>{'★'.repeat(previewTemplate.score)}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ flex: 1, height: 26, borderRadius: 4, border: '1px solid #e0e0e0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#5a5a5a', cursor: 'pointer' }}>Preview</button>
                <button style={{ flex: 1, height: 26, borderRadius: 4, border: '1px solid #2e4de5', background: '#fff', fontSize: 12, fontWeight: 600, color: '#2e4de5', cursor: 'pointer' }}>Send Test</button>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 12, color: '#d0d0d0' }}>No template selected</p>
          )}
        </div>

        {/* Audience */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f2f2f2' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#7a7a7a', marginBottom: 8 }}>Audience</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12, rowGap: 10, alignItems: 'start' }}>
            <SummaryRow label="Segment" value={segment?.label} />
            <SummaryRow label="Excluded" value={segment ? '1,870 Guests' : undefined} />
          </div>
        </div>

        {/* Estimated reach */}
        {step >= 3 && segment && (
          <div style={{ margin: '8px 16px 0', padding: '7px 10px', borderRadius: 6, background: '#eaf7ea', border: '1px solid #a8d5a0' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#1a7a0a' }}>Estimated Reach: {segment.count} guests</p>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Publish */}
        <div style={{ padding: '10px 16px 14px', borderTop: '1px solid #efefef' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '6px 8px', borderRadius: 6, background: '#f8f8f8', marginBottom: 8 }}>
            <Info size={11} color="#b0b0b0" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: '#767676', lineHeight: 1.45 }}>
              {isReadyToPublish ? 'Review all the steps and publish' : 'Complete all steps to publish'}
            </p>
          </div>
          <button
            disabled={!isReadyToPublish}
            style={{
              width: '100%', height: 34, border: 'none', borderRadius: 6,
              background: isReadyToPublish ? '#2e4de5' : '#ebebeb',
              color: isReadyToPublish ? '#fff' : '#b0b0b0',
              fontWeight: 700, fontSize: 12,
              cursor: isReadyToPublish ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  )
}

type NbxRecommendation = {
  templateId: string
  templateConfidence: number
  templateReason: string
  audienceSegmentId: string
  audienceReason: string
  scheduleDay: string
  scheduleTime: string
  scheduleReason: string
  predictionOpenRate: string
  predictionCtr: string
  predictionRevenue: string
  confidence: number
}

function getNextTuesdayISODate() {
  const d = new Date()
  const day = d.getDay()
  const diff = (2 - day + 7) % 7 || 7
  d.setDate(d.getDate() + diff)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildNbxRecommendation(form: FormState): NbxRecommendation {
  if (form.triggerEvent === 'pre-arrival') {
    return {
      templateId: 't1',
      templateConfidence: 96,
      templateReason: 'Similar pre-arrival campaigns improved booking conversion by 24% in the last 90 days.',
      audienceSegmentId: 's-recent',
      audienceReason: 'Recently booked guests show highest pre-arrival engagement and upsell readiness.',
      scheduleDay: 'Tuesday',
      scheduleTime: '10:00 AM',
      scheduleReason: 'Tuesday morning consistently delivers strongest engagement for pre-arrival content.',
      predictionOpenRate: '41%',
      predictionCtr: '9%',
      predictionRevenue: '$18,400',
      confidence: 94,
    }
  }
  if (form.triggerEvent === 'check-out') {
    return {
      templateId: 't2',
      templateConfidence: 93,
      templateReason: 'Post-stay appreciation templates increase feedback conversion and repeat intent.',
      audienceSegmentId: 's-loyalty',
      audienceReason: 'Loyalty members are most likely to respond and rebook after checkout.',
      scheduleDay: 'Tuesday',
      scheduleTime: '10:00 AM',
      scheduleReason: 'Tuesday late morning yields the strongest response rates for follow-up campaigns.',
      predictionOpenRate: '38%',
      predictionCtr: '8%',
      predictionRevenue: '$14,900',
      confidence: 91,
    }
  }
  return {
    templateId: 't6',
    templateConfidence: 95,
    templateReason: 'Confirmation-style journeys perform strongly for trigger-based campaigns.',
    audienceSegmentId: 's-recent',
    audienceReason: 'Recent guests are most responsive to reservation and stay-related communications.',
    scheduleDay: 'Tuesday',
    scheduleTime: '10:00 AM',
    scheduleReason: 'Tuesday 10:00 AM is the highest engagement period for this campaign type.',
    predictionOpenRate: '40%',
    predictionCtr: '8.5%',
    predictionRevenue: '$16,700',
    confidence: 93,
  }
}

function AIAssistantSidebar({
  step,
  form,
  phase = 'idle',
  generationIndex = 0,
  applyIndex = 0,
  recommendation,
  expanded = false,
  onApplyTemplate,
  onApplyAudience,
  onApplySchedule,
  onApplyAll,
  onCustomize,
  onIgnore,
  onToggleWhy,
  showWhy = false,
}: {
  step: number
  form: FormState
  phase?: 'idle' | 'generating' | 'ready' | 'applying'
  generationIndex?: number
  applyIndex?: number
  recommendation?: NbxRecommendation | null
  expanded?: boolean
  onApplyTemplate?: () => void
  onApplyAudience?: () => void
  onApplySchedule?: () => void
  onApplyAll?: () => void
  onCustomize?: () => void
  onIgnore?: () => void
  onToggleWhy?: () => void
  showWhy?: boolean
}) {
  const template = recommendation ? TEMPLATES.find(t => t.id === recommendation.templateId) : undefined
  const audience = recommendation ? [...SEGMENTS, ...form.savedSegments].find(s => s.id === recommendation.audienceSegmentId) : undefined
  type ChatMsg = { role: 'user' | 'assistant'; text: string }
  const [chatInput, setChatInput] = React.useState('')
  const [messages, setMessages] = React.useState<ChatMsg[]>([])
  const [thinking, setThinking] = React.useState(false)
  const msgEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  function generateResponse(prompt: string): string {
    const q = prompt.toLowerCase()
    if (step === 0) {
      if (q.includes('type') || q.includes('event') || q.includes('pre-arrival') || q.includes('campaign type'))
        return 'For pre-arrival campaigns, use Event Driven triggered by the "pre-arrival" event. It fires automatically 2 days before check-in and achieves an avg. 41% open rate — 18% higher than scheduled sends at this property.'
      if (q.includes('name') || q.includes('title') || q.includes('naming') || q.includes('loyalty re-engage'))
        return 'Use the pattern "{Trigger} · {Month Year}", e.g. "Pre-Arrival Welcome · Jul 2026". For re-engagement: "Loyalty Re-Engagement · Jul 2026". This keeps campaigns easy to find and avoids duplicates.'
      if (q.includes('channel') || q.includes('email') || q.includes('sms') || q.includes('open rate'))
        return 'Email is your top channel here at 38% avg. open rate vs. 21% for SMS. Use Email unless the campaign is time-critical (under 2 hrs to trigger), where SMS wins on immediacy.'
      return 'For Basics, set type to Event Driven, channel to Email, and name it after the trigger event. This combination has the highest completion rate across similar properties.'
    }
    if (step === 1) {
      if (q.includes('loyalty') || q.includes('vip') || q.includes('member'))
        return 'Pre-Arrival Welcome works best for loyalty members — personalised amenity upsells with a 41% open rate and 12% upsell conversion for loyalty segments at this property.'
      if (q.includes('click') || q.includes('ctr') || q.includes('click rate'))
        return 'Booking Confirmation has the highest CTR at 18.4% — it includes dynamic booking details and a "manage my booking" CTA that drives repeat interactions. Best paired with the All Guests segment.'
      if (q.includes('summer') || q.includes('promo') || q.includes('season') || q.includes('promotion'))
        return 'For a summer promo, try the Luxury Stay Promotion template — strong seasonal imagery and a "book direct" discount CTA. It drove 22% booking conversion last summer when sent to Recent Bookers.'
      return 'Start with Pre-Arrival Welcome — the top performer at 41% open rate. It\'s fully customisable and works across all campaign types at this property.'
    }
    if (step === 2) {
      if (q.includes('re-engage') || q.includes('lapsed') || q.includes('inactive') || q.includes('return'))
        return 'Target the Lapsed Guests segment — guests who stayed 6–18 months ago. 2,180 members with a 28% re-booking rate. Pair with a "we miss you" offer for best results.'
      if (q.includes('conversion') || q.includes('book') || q.includes('revenue') || q.includes('booking conversion'))
        return 'For highest booking conversion, use Recent Bookers (last 90 days) — they convert at 34% vs. the 12% avg. That\'s 3,240 guests still in the active consideration window.'
      if (q.includes('vip') || q.includes('platinum') || q.includes('gold') || q.includes('rules') || q.includes('only'))
        return 'For VIP-only targeting, add rules: Loyalty Tier = Platinum OR Gold, AND Total Stays ≥ 3. This gives ~1,840 high-intent guests with a 49% historical open rate on past campaigns.'
      return 'I recommend Loyalty Members (8,412 guests) — highest engagement tier with a 44% open rate. They respond well to personalised amenity and upgrade offers.'
    }
    if (step === 3) {
      if (q.includes('best day') || q.includes('when') || q.includes('day') || q.includes('promo') || q.includes('promotional'))
        return 'Tuesday and Wednesday at 10 AM are your top slots — 31% avg. open rate vs. the weekly avg. of 24%. Avoid Monday mornings and Friday afternoons for promotional sends.'
      if (q.includes('always on') || q.includes('fixed') || q.includes('scheduled') || q.includes('real time'))
        return 'Use Always On for event-driven campaigns — it triggers in real time on the guest event, outperforming fixed schedules by 22% for pre-arrival and post-stay sends. Fixed schedule is best for seasonal batch promotions only.'
      if (q.includes('optim') || q.includes('ai') || q.includes('time') || q.includes('loyalty'))
        return 'Enable AI Best Time to personalise delivery per guest based on their open history. For your loyalty segment this typically shifts sends to Tuesday 9–10 AM and Thursday 2–3 PM, lifting opens by ~14%.'
      return 'I recommend Tuesday at 10 AM as the fixed send time — consistently your top slot. For hands-off optimisation, enable AI Best Time to personalise the window per guest.'
    }
    return 'I can help you optimise each step — ask about campaign type, audience targeting, template selection, or the best send schedule.'
  }

  function sendPrompt(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setChatInput('')
    setMessages(prev => [...prev, { role: 'user', text: trimmed }])
    setThinking(true)
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: generateResponse(trimmed) }])
      setThinking(false)
    }, 900)
  }

  const generatingLines = [
    'Analyzing campaign goal...',
    'Finding best template...',
    'Finding best audience...',
    'Optimizing send time...',
    'Calculating confidence score...',
  ]
  const applyingLines = [
    'Selecting best template',
    'Building audience',
    'Optimizing schedule',
    'Applying personalization',
    'Campaign ready',
  ]

  return (
    <div style={{
      width: 320,
      borderLeft: '1px solid #efefef',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
    }}>
      <div style={{
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid #efefef',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src="http://localhost:3845/assets/75a7a32664fd6bf1de9f5c22f79166e5188802ed.svg" alt="" style={{ width: 14, height: 14, display: 'block' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>AI Assistant</p>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Chat thread ── */}
        {messages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((m, idx) => (
              m.role === 'user' ? (
                <div key={idx} style={{ alignSelf: 'flex-end', maxWidth: '85%', background: '#2e4de5', color: '#fff', borderRadius: '10px 10px 2px 10px', padding: '7px 11px', fontSize: 12, lineHeight: 1.55 }}>
                  {m.text}
                </div>
              ) : (
                <div key={idx} style={{ alignSelf: 'flex-start', maxWidth: '94%', background: '#f4f6ff', border: '1px solid #e3e8f8', borderRadius: '2px 10px 10px 10px', padding: '8px 11px', fontSize: 12, color: '#1a1a2e', lineHeight: 1.65 }}>
                  {m.text}
                </div>
              )
            ))}
            {thinking && (
              <div style={{ alignSelf: 'flex-start', background: '#f4f6ff', border: '1px solid #e3e8f8', borderRadius: '2px 10px 10px 10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8898d8', display: 'inline-block' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8898d8', display: 'inline-block', opacity: 0.6 }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8898d8', display: 'inline-block', opacity: 0.3 }} />
              </div>
            )}
            <div ref={msgEndRef} />
          </div>
        )}

        {phase === 'idle' && messages.length === 0 && (() => {
          type StepConfig = { context: string; actions: { icon: string; label: string; desc: string }[]; prompts: string[] }
          const stepConfig: Record<number, StepConfig> = {
            0: {
              context: 'Set up the basics for your campaign. Here are the best actions to start strong.',
              actions: [
                { icon: '⚡', label: 'Use Event Driven type', desc: 'Best for check-in & checkout triggers' },
                { icon: '📧', label: 'Set Email as channel', desc: 'Highest open rate for this property' },
                { icon: '✏️', label: 'Auto-name by trigger', desc: 'e.g. Pre-Arrival Welcome · Jul 2026' },
              ],
              prompts: [
                'What campaign type should I use for pre-arrival?',
                'Suggest a name for a loyalty re-engagement campaign',
                'What channel gets the best open rates here?',
              ],
            },
            1: {
              context: 'Pick the right template to maximise engagement for this campaign.',
              actions: [
                { icon: '🏆', label: 'Use Pre-Arrival Welcome', desc: 'Top performer · 41% avg open rate' },
                { icon: '✅', label: 'Use Booking Confirmation', desc: 'Highest volume · 52% open rate' },
                { icon: '🎨', label: 'Start from blank template', desc: 'Full creative control' },
              ],
              prompts: [
                'Which template works best for loyalty members?',
                'Show me templates with the highest click rates',
                'Recommend a template for a summer promotion',
              ],
            },
            2: {
              context: 'Target the right guests to drive conversions.',
              actions: [
                { icon: '📅', label: 'Target Recent Bookers', desc: '3,240 guests · booked last 90 days' },
                { icon: '⭐', label: 'Use Loyalty Members', desc: '8,412 guests · highest engagement tier' },
                { icon: '🔧', label: 'Build a custom segment', desc: 'Add filters for precise targeting' },
              ],
              prompts: [
                'Who are the best guests to target for re-engagement?',
                'What segment has the highest booking conversion?',
                'Suggest audience rules for VIP guests only',
              ],
            },
            3: {
              context: 'Schedule at the right time to maximise open rates.',
              actions: [
                { icon: '📆', label: 'Send Tuesday at 10 AM', desc: 'Historically highest engagement slot' },
                { icon: '🤖', label: 'Enable AI Best Time', desc: 'AI picks optimal time per guest' },
                { icon: '🔄', label: 'Set Always On mode', desc: 'Best for event-driven campaigns' },
              ],
              prompts: [
                'What is the best day to send a promotional email?',
                'Should I use Always On or a fixed schedule?',
                'How do I optimise send time for loyalty guests?',
              ],
            },
          }
          const cfg = stepConfig[step] ?? stepConfig[0]
          return (
            <>
              <p style={{ fontSize: 12, color: '#6a7a8a', lineHeight: 1.5, margin: 0 }}>{cfg.context}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9aa3b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Suggested actions</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cfg.actions.map(a => (
                    <div key={a.label}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 8, border: '1px solid #eaecf4', background: '#fff', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#a8b8f8'; e.currentTarget.style.background = '#f5f7ff' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#eaecf4'; e.currentTarget.style.background = '#fff' }}
                    >
                      <span style={{ fontSize: 15, lineHeight: 1, marginTop: 1 }}>{a.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{a.label}</p>
                        <p style={{ fontSize: 11, color: '#7a8698', margin: '2px 0 0' }}>{a.desc}</p>
                      </div>
                      <span style={{ fontSize: 16, color: '#b0bac9', flexShrink: 0, marginTop: 1 }}>›</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9aa3b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Try asking</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {cfg.prompts.map(p => (
                    <button key={p} onClick={() => sendPrompt(p)}
                      style={{ textAlign: 'left', padding: '7px 10px', borderRadius: 7, border: '1px solid #e3e8f8', background: '#f8faff', cursor: 'pointer', fontSize: 12, color: '#2e4de5', lineHeight: 1.45, display: 'block', width: '100%' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#b0c0f8' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f8faff'; e.currentTarget.style.borderColor = '#e3e8f8' }}
                    >
                      "{p}"
                    </button>
                  ))}
                </div>
              </div>
            </>
          )
        })()}

        {phase === 'generating' && (
          <div style={{ border: '1px solid #d9ebd5', borderRadius: 10, background: '#f6fbf4', padding: '10px 12px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Generating recommendations...</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {generatingLines.map((line, i) => {
                const done = i < generationIndex
                const active = i === generationIndex
                return (
                  <div key={line} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: done ? '#2e7d1e' : active ? '#2e4de5' : '#e2e2e2', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                      {done ? '✓' : active ? '•' : ''}
                    </span>
                    <span style={{ fontSize: 14, color: done ? '#2e7d1e' : active ? '#2e4de5' : '#777' }}>{line}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(phase === 'ready' || phase === 'applying') && recommendation && (
          <>
            <div style={{ border: '1px solid #d9ebd5', borderRadius: 10, background: '#f6fbf4', padding: '10px 12px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#2a6e1b', marginBottom: 4 }}>Best action suggestions</p>
              <p style={{ fontSize: 12, color: '#3f5f39', lineHeight: 1.45 }}>
                AI prepared the best campaign setup based on historical performance, guest behaviour, and your campaign goals.
              </p>
            </div>

            <div style={{ border: '1px solid #e8e8e8', borderRadius: 9, padding: '10px 11px', background: '#fff' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#5a5a5a', marginBottom: 4 }}>Recommended template</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{template?.name || 'Luxury Stay Promotion'}</p>
              <p style={{ fontSize: 14, color: '#2e7d1e', fontWeight: 700, marginTop: 3 }}>Confidence {recommendation.templateConfidence}%</p>
              <p style={{ fontSize: 14, color: '#6a6a6a', marginTop: 3 }}>{recommendation.templateReason}</p>
              <button onClick={onApplyTemplate} style={{ marginTop: 8, height: 24, borderRadius: 6, border: '1px solid #2e4de5', background: '#fff', color: '#2e4de5', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: '0 8px' }}>Accept</button>
            </div>

            <div style={{ border: '1px solid #e8e8e8', borderRadius: 9, padding: '10px 11px', background: '#fff' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#5a5a5a', marginBottom: 4 }}>Recommended audience</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{audience?.label || 'Repeat Guests'}</p>
              <p style={{ fontSize: 14, color: '#6a6a6a', marginTop: 3 }}>{recommendation.audienceReason}</p>
              <p style={{ fontSize: 14, color: '#2e4de5', marginTop: 4 }}>Estimated reach: {audience?.count || '8,942'} guests</p>
              <button onClick={onApplyAudience} style={{ marginTop: 7, height: 24, borderRadius: 6, border: '1px solid #2e4de5', background: '#fff', color: '#2e4de5', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: '0 8px' }}>Accept</button>
            </div>

            <div style={{ border: '1px solid #e8e8e8', borderRadius: 9, padding: '10px 11px', background: '#fff' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#5a5a5a', marginBottom: 4 }}>Recommended schedule</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{recommendation.scheduleDay} · {recommendation.scheduleTime}</p>
              <p style={{ fontSize: 14, color: '#6a6a6a', marginTop: 3 }}>{recommendation.scheduleReason}</p>
              <p style={{ fontSize: 14, color: '#2e7d1e', marginTop: 4 }}>Expected: +18% open rate</p>
              <button onClick={onApplySchedule} style={{ marginTop: 7, height: 24, borderRadius: 6, border: '1px solid #2e4de5', background: '#fff', color: '#2e4de5', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: '0 8px' }}>Accept</button>
            </div>

            <div style={{ border: '1px solid #e8e8e8', borderRadius: 9, padding: '10px 11px', background: '#fff' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#5a5a5a', marginBottom: 6 }}>Campaign prediction</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div><p style={{ fontSize: 14, color: '#888' }}>Open rate</p><p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{recommendation.predictionOpenRate}</p></div>
                <div><p style={{ fontSize: 14, color: '#888' }}>CTR</p><p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{recommendation.predictionCtr}</p></div>
                <div><p style={{ fontSize: 14, color: '#888' }}>Revenue</p><p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{recommendation.predictionRevenue}</p></div>
                <div><p style={{ fontSize: 14, color: '#888' }}>Confidence</p><p style={{ fontSize: 14, fontWeight: 700, color: '#2e7d1e' }}>{recommendation.confidence}%</p></div>
              </div>
            </div>

            {showWhy && (
              <div style={{ border: '1px dashed #cdd9f8', borderRadius: 8, background: '#f7f9ff', padding: '8px 10px' }}>
                <p style={{ fontSize: 14, color: '#4a5b99', lineHeight: 1.45 }}>
                  Template is recommended because similar campaigns in the last 90 days showed the highest repeat booking conversion.
                </p>
                <p style={{ marginTop: 5, fontSize: 14, color: '#4a5b99', lineHeight: 1.45 }}>
                  Audience is selected because repeat and recently stayed guests consistently outperform in engagement and booking propensity.
                </p>
                <p style={{ marginTop: 5, fontSize: 14, color: '#4a5b99', lineHeight: 1.45 }}>
                  Schedule is recommended based on historical engagement peaks for similar campaign types.
                </p>
              </div>
            )}

            {phase === 'applying' && (
              <div style={{ border: '1px solid #d9ebd5', borderRadius: 9, background: '#f6fbf4', padding: '10px 12px' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Applying recommendations...</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {applyingLines.map((line, i) => {
                    const done = i < applyIndex
                    const active = i === applyIndex
                    return (
                      <div key={line} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 14, height: 14, borderRadius: '50%', background: done ? '#2e7d1e' : active ? '#2e4de5' : '#e2e2e2', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                          {done ? '✓' : active ? '•' : ''}
                        </span>
                        <span style={{ fontSize: 14, color: done ? '#2e7d1e' : active ? '#2e4de5' : '#777' }}>{line}{done ? ' ✓' : ''}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid #f0f0f0',
        flexShrink: 0,
        background: '#fff',
        marginTop: 'auto',
      }}>
        {(phase === 'ready' || phase === 'applying') ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button onClick={onCustomize} style={{ height: 30, borderRadius: 7, border: '1px solid #ddd', background: '#fff', color: '#5a5a5a', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Customize individually
            </button>
            <button onClick={onToggleWhy} style={{ height: 30, borderRadius: 7, border: '1px solid #ddd', background: '#fff', color: '#5a5a5a', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Why these recommendations?
            </button>
            <button onClick={onIgnore} style={{ height: 30, borderRadius: 7, border: '1px solid #ddd', background: '#fff', color: '#5a5a5a', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Preview recommendations
            </button>
            <button onClick={onApplyAll} disabled={phase === 'applying'} style={{ height: 30, borderRadius: 7, border: '1px solid #2e4de5', background: phase === 'applying' ? '#9fb0ef' : '#2e4de5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: phase === 'applying' ? 'default' : 'pointer' }}>
              Apply all recommendations
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fafafa' }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendPrompt(chatInput) } }}
              placeholder="Ask AI for suggestions..."
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: '#1a1a1a' }}
            />
            <button
              onClick={() => sendPrompt(chatInput)}
              disabled={thinking || !chatInput.trim()}
              style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: chatInput.trim() && !thinking ? '#2e4de5' : '#c5cce8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: chatInput.trim() && !thinking ? 'pointer' : 'default', flexShrink: 0, transition: 'background 0.15s' }}>
              <Send size={11} color="#fff" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step Components ─────────────────────────────────────────────────────────
function StepBasics({ form, set }: { form: FormState; set: (p: Partial<FormState>) => void }) {
  const [aiOperation, setAiOperation] = useState('reservation-created')

  function applySuggestiveAI() {
    const suggestions: Record<string, Partial<FormState>> = {
      'reservation-created': { triggerEvent: 'reservation-created', subject: 'Reservation Confirmed', previewText: 'Thanks for booking with us.', fromName: 'Alpine Resorts', senderEmail: 'alpineresorts@gmail.com', name: 'Reservation Confirmed', deliveryMode: 'email', channel: 'email' },
      'pre-arrival': { triggerEvent: 'pre-arrival', subject: 'Summer Pre-Arrival Welcome', previewText: 'Everything you need before check-in.', fromName: 'Alpine Resorts', senderEmail: 'alpineresorts@gmail.com', name: 'Pre-Arrival Welcome', deliveryMode: 'email', channel: 'email' },
      'check-out': { triggerEvent: 'check-out', subject: 'Thank You for Staying With Us', previewText: 'We would love your feedback.', fromName: 'Alpine Resorts', senderEmail: 'alpineresorts@gmail.com', name: 'Post Stay Followup', deliveryMode: 'email', channel: 'email' },
    }
    set({
      type: 'event-driven',
      replyToEmail: form.replyToEmail || 'alpineresorts@gmail.com',
      ...(suggestions[aiOperation] || suggestions['reservation-created']),
    })
  }

  function selectDeliveryMode(mode: DeliveryMode) {
    const channel: Channel = mode === 'sms' ? 'sms' : mode === 'email' ? 'email' : 'both'
    set({ deliveryMode: mode, channel })
  }

  const modeCards: Array<{ id: DeliveryMode; label: string; hint: string; icon: React.ElementType }> = [
    { id: 'email', label: 'Email', hint: 'Rich content, images & links', icon: Mail },
    { id: 'sms', label: 'SMS', hint: 'Short, direct message', icon: MessageSquare },
    { id: 'push', label: 'Push', hint: 'Send Message on App', icon: Zap },
    { id: 'social', label: 'Social Media', hint: 'Send to social apps', icon: Send },
    { id: 'all', label: 'All', hint: 'Send through all channels', icon: Star },
  ]

  return (
    <div style={{ maxWidth: '100%' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>Choose an operation to trigger</p>
          <button
            onClick={applySuggestiveAI}
            style={{ border: '1px solid #c2edbb', background: '#f2faf0', display: 'inline-flex', alignItems: 'center', gap: 4, color: '#3a9230', cursor: 'pointer', fontSize: 14, fontWeight: 600, borderRadius: 999, padding: '3px 9px' }}
          >
            <Sparkles size={11} color="#3a9230" />
            Suggest with AI
          </button>
        </div>
        <div style={{ width: 220 }}>
          <Label required>Choose Product</Label>
          <select
            value={aiOperation}
            onChange={e => { setAiOperation(e.target.value); set({ triggerEvent: e.target.value }) }}
            style={{
              width: '100%', height: 32,
              borderRadius: 6,
              border: '1px solid #ddd',
              background: '#fafafa',
              color: '#1a1a1a',
              fontSize: 14,
              padding: '0 10px',
              outline: 'none',
            }}
          >
            <option value="reservation-created">Reserve</option>
            <option value="pre-arrival">Pre-Arrival</option>
            <option value="check-out">Check-Out</option>
          </select>
        </div>
      </div>

      <div style={{ padding: '12px 16px 14px', borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#5a5a5a', marginBottom: 8 }}>Campaign mode <span style={{ color: '#e51c00' }}>*</span></p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
          {modeCards.map(card => {
            const active = form.deliveryMode === card.id
            const Icon = card.icon
            return (
              <button
                key={card.id}
                onClick={() => selectDeliveryMode(card.id)}
                style={{
                  border: `1.5px solid ${active ? 'var(--unity-in-fill-strong, #2e4de5)' : '#e4e4e4'}`,
                  background: active ? '#eef1ff' : '#fafafa',
                  borderRadius: 8,
                  minHeight: 72,
                  padding: '10px 10px 8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'border-color 0.12s, background 0.12s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = '#c0c0c0' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = '#e4e4e4' }}
              >
                <Icon size={14} color={active ? 'var(--unity-in-fill-strong, #2e4de5)' : '#888'} />
                <p style={{ fontSize: 14, fontWeight: 600, color: active ? 'var(--unity-in-fill-strong, #2e4de5)' : '#1a1a1a', lineHeight: 1.2 }}>{card.label}</p>
                <p style={{ fontSize: 14, color: '#9a9a9a', lineHeight: 1.3 }}>{card.hint}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#5a5a5a' }}>Campaign info</p>
          <button
            onClick={applySuggestiveAI}
            style={{ border: '1px solid #c2edbb', background: '#f2faf0', display: 'inline-flex', alignItems: 'center', gap: 4, color: '#3a9230', cursor: 'pointer', fontSize: 14, fontWeight: 600, borderRadius: 999, padding: '3px 9px' }}
          >
            <Sparkles size={11} color="#3a9230" />
            Suggest with AI
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Label required>Email Subject</Label>
            <TextInput value={form.subject} onValueChange={v => set({ subject: v, name: v })} placeholder="Summer Pre-Arrival Welcome" size="normal" />
          </div>
          <div>
            <Label required>From Name</Label>
            <TextInput value={form.fromName} onValueChange={v => set({ fromName: v })} placeholder="Alpine Resorts" size="normal" />
          </div>
          <div>
            <Label required>Preview Text</Label>
            <TextInput value={form.previewText} onValueChange={v => set({ previewText: v })} placeholder="Snippet will appear in the inbox after subject line" size="normal" />
          </div>
          <div>
            <Label required>From Email</Label>
            <TextInput value={form.senderEmail} onValueChange={v => set({ senderEmail: v, replyToEmail: form.replyToEmail || v })} placeholder="Alpineresorts@gmail.com" size="normal" />
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ borderRadius: 8, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#2a2a2a', padding: '9px 12px', background: form.campaignTrackingEnabled ? '#f5f7ff' : '#fafafa', borderBottom: form.campaignTrackingEnabled ? '1px solid #e8e8e8' : 'none' }}>
              <input type="checkbox" checked={form.campaignTrackingEnabled} onChange={e => set({ campaignTrackingEnabled: e.target.checked })} style={{ accentColor: '#2e4de5' }} />
              Campaign Tracking
            </label>
            {form.campaignTrackingEnabled && (
              <div style={{ padding: '10px 12px', background: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 8, columnGap: 16 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, color: '#4a4a4a', cursor: 'pointer' }}><input type="checkbox" checked={form.trackOpen} onChange={e => set({ trackOpen: e.target.checked })} style={{ accentColor: '#2e4de5' }} />Open tracking</label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, color: '#4a4a4a', cursor: 'pointer' }}><input type="checkbox" checked={form.trackClick} onChange={e => set({ trackClick: e.target.checked })} style={{ accentColor: '#2e4de5' }} />Click tracking</label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, color: '#4a4a4a', cursor: 'pointer' }}><input type="checkbox" checked={form.trackUtm} onChange={e => set({ trackUtm: e.target.checked })} style={{ accentColor: '#2e4de5' }} />UTM parameters</label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, color: '#4a4a4a', cursor: 'pointer' }}><input type="checkbox" checked={form.trackConversion} onChange={e => set({ trackConversion: e.target.checked })} style={{ accentColor: '#2e4de5' }} />Conversion Rate</label>
              </div>
            )}
          </div>

          <div style={{ borderRadius: 8, border: '1px solid #e8e8e8', overflow: 'hidden', marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#2a2a2a', padding: '9px 12px', background: form.manageReplies ? '#f5f7ff' : '#fafafa', borderBottom: form.manageReplies ? '1px solid #e8e8e8' : 'none' }}>
              <input type="checkbox" checked={form.manageReplies} onChange={e => set({ manageReplies: e.target.checked })} style={{ accentColor: '#2e4de5' }} />
              Manage Replies
            </label>
            {form.manageReplies && (
              <div style={{ padding: '10px 12px', background: '#fff' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <Label required>Reply to Email</Label>
                    <TextInput value={form.replyToEmail} onValueChange={v => set({ replyToEmail: v })} placeholder="reply@alpineresorts.com" size="normal" />
                  </div>
                  <div>
                    <Label>Response Owner</Label>
                    <TextInput value={form.fromName} onValueChange={v => set({ fromName: v })} placeholder="Campaign Team" size="normal" />
                  </div>
                </div>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, color: '#4a4a4a', cursor: 'pointer' }}><input type="checkbox" checked={form.autoAcknowledgment} onChange={e => set({ autoAcknowledgment: e.target.checked })} style={{ accentColor: '#2e4de5' }} />Send auto-acknowledgment</label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, color: '#4a4a4a', cursor: 'pointer' }}><input type="checkbox" checked={form.trackReplyResolution} onChange={e => set({ trackReplyResolution: e.target.checked })} style={{ accentColor: '#2e4de5' }} />Track reply volume &amp; resolution time</label>
                </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Template preview data ────────────────────────────────────────────────────

const TEMPLATE_PREVIEWS: Record<string, {
  subject: string
  preheader: string
  headerBg: string
  headerColor: string
  greeting: string
  body: string
  cta: string
  ctaBg: string
  footer: string
}> = {
  t1: {
    subject: 'Your stay at Alpine Resort is almost here ✨',
    preheader: "We can't wait to welcome you",
    headerBg: '#1a4c8b', headerColor: '#fff',
    greeting: 'Dear [Guest Name],',
    body: "Your arrival is just around the corner! We've prepared everything to make your stay unforgettable. Our spa, dining, and concierge teams are standing by to ensure you have everything you need from the moment you arrive.",
    cta: 'View Your Itinerary',
    ctaBg: '#1a4c8b',
    footer: 'Alpine Resort · 123 Mountain View Drive · Reservations: 1-800-ALPINE',
  },
  t2: {
    subject: 'Thank you for staying with us 🙏',
    preheader: 'We hope to see you again soon',
    headerBg: '#2d6a4f', headerColor: '#fff',
    greeting: 'Dear [Guest Name],',
    body: "It was a true pleasure hosting you at Alpine Resort. We hope every moment of your stay was exceptional. Your feedback means the world to us — please take a moment to share your experience so we can keep improving.",
    cta: 'Share Your Feedback',
    ctaBg: '#2d6a4f',
    footer: 'Alpine Resort · 123 Mountain View Drive · Unsubscribe',
  },
  t3: {
    subject: 'Treat yourself — our spa is calling 🧖',
    preheader: 'Exclusive wellness offers inside',
    headerBg: '#7b5ea7', headerColor: '#fff',
    greeting: 'Hello [Guest Name],',
    body: "Escape the everyday with our signature spa and wellness experiences. From deep-tissue massage to rejuvenating facials, our licensed therapists are ready to help you unwind. Book now and receive a complimentary aromatherapy add-on.",
    cta: 'Book a Spa Treatment',
    ctaBg: '#7b5ea7',
    footer: 'Alpine Resort Spa · Terms apply · Unsubscribe',
  },
  t4: {
    subject: 'Perfect your swing this weekend ⛳',
    preheader: 'Golf packages available now',
    headerBg: '#3a7d44', headerColor: '#fff',
    greeting: 'Hey [Guest Name],',
    body: "Our championship 18-hole course is in peak condition this weekend. We have a limited number of tee times available alongside our weekend golf package — includes greens fees, cart, and a post-round dinner for two.",
    cta: 'Reserve Your Tee Time',
    ctaBg: '#3a7d44',
    footer: 'Alpine Golf Club · Alpine Resort · Unsubscribe',
  },
  t5: {
    subject: "We miss you — here's something special 🎯",
    preheader: "It's been a while. Come back.",
    headerBg: '#c06000', headerColor: '#fff',
    greeting: 'Hi [Guest Name],',
    body: "We noticed it's been some time since your last visit, and we'd love to welcome you back. As a valued loyalty member, we're offering you an exclusive returning-guest rate plus bonus reward points on your next booking.",
    cta: 'Redeem Offer',
    ctaBg: '#c06000',
    footer: 'Agilysys Loyalty · Alpine Resort · Opt-out',
  },
  t6: {
    subject: 'Your booking is confirmed ✅',
    preheader: 'Everything is all set for your stay',
    headerBg: '#2e4de5', headerColor: '#fff',
    greeting: 'Dear [Guest Name],',
    body: "Great news — your reservation has been confirmed! Below you'll find your booking details. If you need to make any changes or have special requests, please don't hesitate to contact our guest services team who are available 24/7.",
    cta: 'Manage My Booking',
    ctaBg: '#2e4de5',
    footer: 'Alpine Resort · Confirmation #[BOOKING_ID] · Support',
  },
}

function TemplateEmailPreview({ templateId, templateName, thumb }: { templateId: string; templateName: string; thumb: string }) {
  const p = TEMPLATE_PREVIEWS[templateId]
  if (!p) return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, color: 'var(--unity-text-placeholder, #aaa)',
    }}>
      <div style={{ fontSize: 20 }}>{thumb}</div>
      <p style={{ fontSize: 14, textAlign: 'center', maxWidth: 200 }}>Start from a blank canvas and build your own layout.</p>
    </div>
  )
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px 16px' }}>
      {/* Email chrome */}
      <div style={{
        borderRadius: 8, overflow: 'hidden',
        border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        background: '#fff',
        fontFamily: 'Georgia, serif',
      }}>
        {/* Subject line bar */}
        <div style={{
          padding: '10px 14px',
          background: 'var(--unity-color-surface-subtle, #f6f6f6)',
          borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--unity-text-strong, #1a1a1a)', fontFamily: 'system-ui', marginBottom: 2 }}>
            {p.subject}
          </p>
          <p style={{ fontSize: 14, color: 'var(--unity-text-placeholder, #aaa)', fontFamily: 'system-ui' }}>
            {p.preheader}
          </p>
        </div>

        {/* Header banner */}
        <div style={{
          background: p.headerBg, color: p.headerColor,
          padding: '24px 20px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>{thumb}</div>
          <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{templateName}</p>
          <p style={{ fontSize: 14, opacity: 0.75, margin: 0, fontFamily: 'system-ui', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Alpine Resort
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 20px 16px' }}>
          <p style={{ fontSize: 14, color: '#1a1a1a', marginBottom: 12, fontWeight: 600 }}>{p.greeting}</p>
          <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, marginBottom: 18 }}>{p.body}</p>

          {/* CTA button */}
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <span style={{
              display: 'inline-block', padding: '10px 22px',
              background: p.ctaBg, color: '#fff',
              borderRadius: 4, fontSize: 14, fontWeight: 700,
              fontFamily: 'system-ui', letterSpacing: '0.02em',
            }}>
              {p.cta}
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#eee', margin: '0 0 14px' }} />

          {/* Placeholder content blocks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[80, 100, 60].map((w, i) => (
              <div key={i} style={{ height: 8, borderRadius: 4, background: '#f0f0f0', width: `${w}%` }} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          background: '#f9f9f9',
          borderTop: '1px solid #eee',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: '#aaa', fontFamily: 'system-ui', lineHeight: 1.6 }}>{p.footer}</p>
        </div>
      </div>
    </div>
  )
}

function StepTemplate({ form, set }: { form: FormState; set: (p: Partial<FormState>) => void }) {
  type BuilderBlockType = 'logo' | 'text' | 'image' | 'button' | 'divider' | 'spacer'
  type TemplateItem = { id: string; name: string; type: string; channel: string; used: string; score: number; thumb: string }
  type BuilderBlock = { id: string; type: BuilderBlockType; content: string }

  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [dragOver, setDragOver] = useState(false)
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<TemplateItem[]>([])
  const [builderName, setBuilderName] = useState('Untitled Email Template')
  const [builderSubject, setBuilderSubject] = useState('')
  const [builderBlocks, setBuilderBlocks] = useState<BuilderBlock[]>([
    { id: 'blk-logo', type: 'logo', content: 'Your Brand Logo' },
    { id: 'blk-text', type: 'text', content: 'Welcome to our latest campaign. Edit this copy from the settings panel.' },
    { id: 'blk-button', type: 'button', content: 'Shop Now' },
  ])
  const [selectedBlockId, setSelectedBlockId] = useState<string>('')
  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const [ruleTemplateId, setRuleTemplateId] = useState<string>('')
  const [ruleDrafts, setRuleDrafts] = useState<AudienceRule[]>([])
  const [ruleLogicDraft, setRuleLogicDraft] = useState<'AND' | 'OR'>('AND')
  const [ruleAiOpen, setRuleAiOpen] = useState(false)
  const [ruleAiPrompt, setRuleAiPrompt] = useState('')
  const [ruleAiMessages, setRuleAiMessages] = useState<Array<{ role: 'assistant' | 'user'; text: string }>>([
    { role: 'assistant', text: 'Describe your targeting intent and I will create rule conditions for you.' },
  ])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const FILTER_TABS = ['All', 'Transactional', 'Promotional', 'Loyalty']

  const templateCatalog: TemplateItem[] = [...TEMPLATES.filter(t => t.id !== 'blank'), ...customTemplates]
  const filtered = templateCatalog.filter(t => {
    if (query.trim() && !t.name.toLowerCase().includes(query.toLowerCase())) return false
    if (activeTab === 'All') return true
    if (activeTab === 'Transactional') return t.type === 'Event Driven'
    if (activeTab === 'Promotional') return t.type === 'On Demand' || t.type === 'Scheduled'
    if (activeTab === 'Loyalty') return t.name.toLowerCase().includes('loyalty') || t.name.toLowerCase().includes('reward')
    return true
  })

  const selectedBlock = builderBlocks.find(b => b.id === selectedBlockId) ?? null

  const ACCEPTED = ['.pdf', '.png', '.doc', '.docx']
  const ACCEPTED_MIME = ['application/pdf', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  const MAX_MB = 10
  const CARD_TAGS: Record<string, string[]> = {
    't1': ['Pre-Arrival', 'Transactional'],
    't2': ['Post-Stay', 'Transactional'],
    't3': ['Spa', 'Promotional'],
    't4': ['Golf', 'Promotional'],
    't5': ['Loyalty', 'Scheduled'],
    't6': ['Confirmation', 'Transactional'],
  }

  function applyTemplateAI() {
    const best = [...filtered].sort((a, b) => b.score - a.score).slice(0, 2)
    const ids = best.length > 0 ? best.map(t => t.id) : ['t1']
    set({ templateIds: ids })
  }

  function addBuilderBlock(type: BuilderBlockType) {
    const defaults: Record<BuilderBlockType, string> = {
      logo: 'Your Brand Logo',
      text: 'Write your message here...',
      image: 'Image Placeholder',
      button: 'Click Here',
      divider: 'Divider',
      spacer: 'Spacer',
    }
    const next = { id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, content: defaults[type] }
    setBuilderBlocks(prev => [...prev, next])
    setSelectedBlockId(next.id)
  }

  function updateBuilderBlock(blockId: string, content: string) {
    setBuilderBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content } : b))
  }

  function removeBuilderBlock(blockId: string) {
    setBuilderBlocks(prev => prev.filter(b => b.id !== blockId))
    if (selectedBlockId === blockId) setSelectedBlockId('')
  }

  function saveCustomTemplate() {
    const trimmedName = builderName.trim() || 'Untitled Email Template'
    const id = `t-custom-${Date.now()}`
    const item: TemplateItem = {
      id,
      name: trimmedName,
      type: 'On Demand',
      channel: 'email',
      used: 'Custom template',
      score: 4,
      thumb: '🧩',
    }
    setCustomTemplates(prev => [item, ...prev])
    set({ templateIds: [...form.templateIds, id] })
    setCreateTemplateOpen(false)
  }

  const ruleTemplate = TEMPLATES.find(t => t.id === ruleTemplateId) ?? null

  function openRuleModal(templateId: string) {
    setRuleTemplateId(templateId)
    setRuleLogicDraft(form.rulesLogic || 'AND')
    setRuleDrafts(form.customRules.length > 0 ? form.customRules.map(r => ({ ...r })) : [makeRule()])
    setRuleAiOpen(false)
    setRuleAiPrompt('')
    setRuleAiMessages([
      { role: 'assistant', text: 'Describe your targeting intent and I will create rule conditions for you.' },
    ])
    setRuleModalOpen(true)
  }

  function closeRuleModal() {
    setRuleModalOpen(false)
  }

  function updateRule(ruleId: string, patch: Partial<AudienceRule>) {
    setRuleDrafts(prev => prev.map(r => {
      if (r.id !== ruleId) return r
      const next = { ...r, ...patch }
      if (patch.field && patch.field !== r.field) {
        next.operator = ''
        next.value = ''
      }
      return next
    }))
  }

  function removeRule(ruleId: string) {
    setRuleDrafts(prev => {
      const next = prev.filter(r => r.id !== ruleId)
      return next.length > 0 ? next : [makeRule()]
    })
  }

  function addCondition() {
    setRuleDrafts(prev => [...prev, makeRule()])
  }

  function getFieldDef(fieldId: string) {
    return RULE_FIELDS.find(f => f.id === fieldId)
  }

  function applyRulesWithAI() {
    if (!ruleTemplate) {
      setRuleLogicDraft('AND')
      setRuleDrafts([
        { ...makeRule(), field: 'email_status', operator: 'is', value: 'subscribed' },
        { ...makeRule(), field: 'last_visit_days', operator: 'within', value: '90' },
      ])
      return
    }

    if (ruleTemplate.type === 'Event Driven') {
      setRuleLogicDraft('AND')
      setRuleDrafts([
        { ...makeRule(), field: 'booking_source', operator: 'is', value: 'direct' },
        { ...makeRule(), field: 'last_visit_days', operator: 'within', value: '45' },
      ])
      return
    }

    if (ruleTemplate.type === 'Scheduled') {
      setRuleLogicDraft('AND')
      setRuleDrafts([
        { ...makeRule(), field: 'loyalty_tier', operator: 'is', value: 'gold' },
        { ...makeRule(), field: 'email_status', operator: 'is', value: 'subscribed' },
      ])
      return
    }

    setRuleLogicDraft('OR')
    setRuleDrafts([
      { ...makeRule(), field: 'total_spend', operator: 'gt', value: '500' },
      { ...makeRule(), field: 'guest_type', operator: 'is', value: 'leisure' },
    ])
  }

  function applyRulesFromPrompt(prompt: string) {
    const lower = prompt.toLowerCase()
    const generated: AudienceRule[] = []
    const numericMatch = prompt.match(/(\d{1,5})/)
    const amount = numericMatch ? numericMatch[1] : ''

    if (lower.includes('direct')) {
      generated.push({ ...makeRule(), field: 'booking_source', operator: 'is', value: 'direct' })
    }
    if (lower.includes('ota')) {
      generated.push({ ...makeRule(), field: 'booking_source', operator: 'is', value: 'ota' })
    }
    if (lower.includes('loyalty') || lower.includes('reward') || lower.includes('member')) {
      generated.push({ ...makeRule(), field: 'loyalty_tier', operator: 'is', value: 'gold' })
    }
    if (lower.includes('subscribed') || lower.includes('email')) {
      generated.push({ ...makeRule(), field: 'email_status', operator: 'is', value: 'subscribed' })
    }
    if (lower.includes('family')) {
      generated.push({ ...makeRule(), field: 'guest_type', operator: 'is', value: 'family' })
    }
    if (lower.includes('business')) {
      generated.push({ ...makeRule(), field: 'guest_type', operator: 'is', value: 'business' })
    }
    if (lower.includes('leisure') || lower.includes('vacation')) {
      generated.push({ ...makeRule(), field: 'guest_type', operator: 'is', value: 'leisure' })
    }

    if (lower.includes('last') && lower.includes('day')) {
      generated.push({ ...makeRule(), field: 'last_visit_days', operator: 'within', value: amount || '90' })
    }

    if (lower.includes('spend') || lower.includes('high value') || lower.includes('vip')) {
      generated.push({ ...makeRule(), field: 'total_spend', operator: 'gt', value: amount || '500' })
    }

    if (generated.length === 0) {
      applyRulesWithAI()
      return {
        logic: ruleLogicDraft,
        appliedCount: 2,
      }
    }

    const deduped: AudienceRule[] = []
    const seen = new Set<string>()
    for (const rule of generated) {
      const key = `${rule.field}:${rule.operator}:${rule.value}`
      if (!seen.has(key)) {
        deduped.push(rule)
        seen.add(key)
      }
    }

    const nextLogic: 'AND' | 'OR' = /\b(or|any)\b/.test(lower) ? 'OR' : 'AND'
    setRuleLogicDraft(nextLogic)
    setRuleDrafts(deduped)

    return {
      logic: nextLogic,
      appliedCount: deduped.length,
    }
  }

  function runRuleAIAssistant() {
    const prompt = ruleAiPrompt.trim()
    if (!prompt) return

    setRuleAiMessages(prev => [...prev, { role: 'user', text: prompt }])
    const outcome = applyRulesFromPrompt(prompt)

    setRuleAiMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        text: `Created ${outcome.appliedCount} rule${outcome.appliedCount > 1 ? 's' : ''} with ${outcome.logic === 'AND' ? 'All' : 'Any'} logic. Review and click Save Rule to apply this segment.`,
      },
    ])
    setRuleAiPrompt('')
  }

  function saveRuleSegment() {
    const completeRules = ruleDrafts.filter(r => r.field && r.operator && r.value.trim())
    if (completeRules.length === 0) return

    const est = estimateReach(completeRules, ruleLogicDraft).toLocaleString()
    const segmentId = `s-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const segmentLabel = ruleTemplate ? `${ruleTemplate.name} segment` : 'AI segment'

    const nextSavedSegments = form.savedSegments.filter(s => s.sourceTemplateId !== ruleTemplateId)

    set({
      customRules: completeRules,
      rulesLogic: ruleLogicDraft,
      audienceMode: 'segment',
      segmentId,
      savedSegments: [
        ...nextSavedSegments,
        {
          id: segmentId,
          label: segmentLabel,
          count: est,
          hint: `${completeRules.length} rule${completeRules.length > 1 ? 's' : ''} (${ruleLogicDraft})`,
          source: 'custom',
          sourceTemplateId: ruleTemplateId || undefined,
        },
      ],
    })

    setRuleModalOpen(false)
  }

  function formatBytes(b: number) {
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / (1024 * 1024)).toFixed(1)} MB`
  }

  function fileIcon(mime: string) {
    if (mime === 'image/png') return '🖼️'
    if (mime === 'application/pdf') return '📄'
    return '📝'
  }

  function processFiles(files: FileList | null) {
    if (!files) return
    const incoming: Attachment[] = []
    Array.from(files).forEach(f => {
      if (!ACCEPTED_MIME.includes(f.type)) return
      if (f.size > MAX_MB * 1024 * 1024) return
      incoming.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: f.name, size: f.size, mimeType: f.type })
    })
    if (incoming.length) set({ attachments: [...form.attachments, ...incoming] })
  }

  function removeAttachment(id: string) {
    set({ attachments: form.attachments.filter(a => a.id !== id) })
  }

  function removeTemplateRule(templateId: string) {
    const removed = form.savedSegments.filter(s => s.sourceTemplateId === templateId).map(s => s.id)
    const nextSaved = form.savedSegments.filter(s => s.sourceTemplateId !== templateId)
    const currentSelectedRemoved = removed.includes(form.segmentId)
    set({
      savedSegments: nextSaved,
      segmentId: currentSelectedRemoved ? '' : form.segmentId,
      ...(currentSelectedRemoved ? { customRules: [] } : {}),
    })
  }

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Choose Template</p>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          border: '1px solid #b8e8b0', background: '#f2faf0', color: '#2e7d1e',
          fontSize: 14, fontWeight: 600, borderRadius: 999, padding: '3px 10px', cursor: 'pointer',
        }}
          onClick={applyTemplateAI}
        >
          <Sparkles size={11} color="#2e7d1e" />
          Use suggestive AI
        </button>
      </div>

      {/* Search + filters + create */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fafafa', flex: 1, minWidth: 180, order: 1 }}>
          <Search size={12} color="#aaa" />
          <input
            type="text"
            placeholder="Search Templates"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, width: '100%', color: '#1a1a1a' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 4, order: 2 }}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '5px 11px', borderRadius: 4, cursor: 'pointer',
                border: `1px solid ${activeTab === tab ? '#2e4de5' : '#e0e0e0'}`,
                background: activeTab === tab ? '#eef1ff' : '#fff',
                color: activeTab === tab ? '#2e4de5' : '#5a5a5a',
                fontSize: 14, fontWeight: activeTab === tab ? 600 : 400, transition: 'all 0.1s',
              }}
            >
              {tab}
            </button>
          ))}
          <button style={{ padding: '5px 11px', borderRadius: 4, border: '1px solid #e0e0e0', background: '#fff', color: '#9a9a9a', fontSize: 14, cursor: 'pointer' }}>
            + 9 more
          </button>
        </div>

        <button
          onClick={() => setCreateTemplateOpen(true)}
          style={{
            padding: '5px 11px', height: 30, borderRadius: 6,
            border: '1px solid #2e4de5', background: '#fff', color: '#2e4de5',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, order: 3,
          }}
        >
          + Create New Template
        </button>
      </div>

      {/* Helper tip */}
      <p style={{ fontSize: 14, color: '#9a9a9a', marginBottom: 12 }}>You can select more than 1 templates</p>

      {/* 2-column template card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 20, alignItems: 'stretch' }}>
        {filtered.map((t, idx) => {
          const active = form.templateIds.includes(t.id)
          const tags = CARD_TAGS[t.id] || [t.type.split(' ')[0]]
          const showInstagram = idx % 2 === 0
          const hasRule = form.savedSegments.some(s => s.sourceTemplateId === t.id)
          const templateRuleSegment = form.savedSegments.find(s => s.sourceTemplateId === t.id)
          return (
            <div
              key={t.id}
              onClick={() => {
                const already = form.templateIds.includes(t.id)
                set({ templateIds: already ? form.templateIds.filter(id => id !== t.id) : [...form.templateIds, t.id] })
              }}
              style={{
                borderRadius: 8, border: `1.5px solid ${active ? '#2e4de5' : '#e8e8e8'}`,
                background: active ? '#f5f7ff' : '#fff', cursor: 'pointer',
                padding: '12px', transition: 'border-color 0.12s, background 0.12s',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 136,
                height: '100%',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.borderColor = '#c0caff' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.borderColor = '#e8e8e8' }}
            >
              {/* Add Rule button appears only for selected template */}
              {active && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    if (hasRule) {
                      removeTemplateRule(t.id)
                      return
                    }
                    openRuleModal(t.id)
                  }}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    fontSize: 14, padding: '2px 7px', borderRadius: 4,
                    border: hasRule ? '1px solid #f2c1c1' : '1px solid #e0e0e0',
                    background: '#fff',
                    color: hasRule ? '#b42318' : '#2e4de5',
                    cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  {hasRule ? 'Remove Rule' : 'Add Rule'}
                </button>
              )}

              {/* Icon + title row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, paddingRight: active ? 54 : 0 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: showInstagram ? '#fde8f2' : '#edf3ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {showInstagram ? (
                      <Instagram size={13} color="#cf2e92" />
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#2e4de5' }}>AG</span>
                    )}
                  </div>
                  {active && (
                    <div style={{
                      position: 'absolute', bottom: -3, right: -3,
                      width: 12, height: 12, borderRadius: '50%',
                      background: '#2e4de5', border: '2px solid #fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={7} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: active ? '#2e4de5' : '#1a1a1a', lineHeight: 1.3, marginTop: 3 }}>{t.name}</p>
              </div>

              {/* Single-line compact meta row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, minHeight: 20, overflow: 'hidden' }}>
                <span style={{
                  fontSize: 12,
                  padding: '1px 6px',
                  borderRadius: 999,
                  border: '1px solid #f2c7df',
                  color: '#b61d7e',
                  background: '#fff7fb',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>Instagram</span>
                <span style={{
                  fontSize: 12,
                  padding: '1px 6px',
                  borderRadius: 999,
                  border: '1px solid #cdd8ff',
                  color: '#2e4de5',
                  background: '#f5f8ff',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>Agilysys</span>
                <span style={{ fontSize: 12, padding: '1px 6px', borderRadius: 10, background: active ? '#dce3ff' : '#eef1ff', color: '#2e4de5', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {tags[0]}
                </span>
                {t.score > 0 && (
                  <span style={{ fontSize: 12, color: '#f5a623', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{'★'.repeat(t.score)}</span>
                )}
              </div>

              {active && hasRule && templateRuleSegment ? (
                <div style={{
                  marginTop: 'auto',
                  borderRadius: 8,
                  border: '1px solid #d0e8c5',
                  background: '#f2faf0',
                  padding: '6px 9px',
                  minHeight: 54,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#2e7d1e',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    ✓
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#2e7d1e', lineHeight: 1.2 }}>Rule reach</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#236618', lineHeight: 1.25 }}>
                      {templateRuleSegment.count} guests matched
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 14, color: '#6e6e6e', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden', marginTop: 'auto' }}>
                  {t.used ? `${t.used} · ` : ''}Sent 24–48 h before check-in with personalised directions and exclusive early check-in offers.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Attachments section */}
      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Paperclip size={13} color="#767676" />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>Attachments</p>
          <span style={{ fontSize: 14, color: '#aaa' }}>PDF, PNG, Word · max {MAX_MB} MB each</span>
          {form.attachments.length > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: '#eef1fd', color: '#2e4de5' }}>
              {form.attachments.length} file{form.attachments.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px',
            borderRadius: 8, cursor: 'pointer',
            border: `1.5px dashed ${dragOver ? '#2e4de5' : '#ccc'}`,
            background: dragOver ? '#eef1fd' : '#f9f9f9', transition: 'all 0.15s',
          }}
        >
          <Upload size={13} color={dragOver ? '#2e4de5' : '#aaa'} />
          <p style={{ fontSize: 14, color: '#5a5a5a' }}>
            Drop files here or <span style={{ color: '#2e4de5', fontWeight: 600 }}>browse</span>
          </p>
          <input ref={fileInputRef} type="file" multiple accept={ACCEPTED.join(',')} style={{ display: 'none' }} onChange={e => { processFiles(e.target.files); (e.target as HTMLInputElement).value = '' }} />
        </div>
        {form.attachments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            {form.attachments.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: '#fff', border: '1px solid #e7e7e7' }}>
                <span style={{ fontSize: 14 }}>{fileIcon(a.mimeType)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                  <p style={{ fontSize: 14, color: '#aaa' }}>{formatBytes(a.size)}</p>
                </div>
                <button onClick={() => removeAttachment(a.id)} style={{ width: 20, height: 20, borderRadius: 4, border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {createTemplateOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 720,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setCreateTemplateOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 'min(1200px, 98vw)',
              height: 'min(820px, 94vh)',
              background: '#fff',
              borderRadius: 10,
              border: '1px solid #e5e5e5',
              boxShadow: '0 18px 48px rgba(0,0,0,0.2)',
              display: 'grid',
              gridTemplateColumns: '240px 1fr 280px',
              overflow: 'hidden',
            }}
          >
            <div style={{ borderRight: '1px solid #ededed', padding: 14, overflowY: 'auto' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>Content blocks</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {([
                  ['logo', 'Logo'],
                  ['text', 'Text'],
                  ['image', 'Image'],
                  ['button', 'Button'],
                  ['divider', 'Divider'],
                  ['spacer', 'Spacer'],
                ] as Array<[BuilderBlockType, string]>).map(([type, label]) => (
                  <button
                    key={type}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('text/plain', type)
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    onClick={() => addBuilderBlock(type)}
                    style={{
                      width: '100%',
                      height: 34,
                      borderRadius: 6,
                      border: '1px solid #e0e0e0',
                      background: '#fff',
                      color: '#444',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'grab',
                    }}
                  >
                    + {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ height: 58, borderBottom: '1px solid #ededed', padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                  <TextInput value={builderName} onValueChange={setBuilderName} placeholder="Template name" size="normal" />
                  <TextInput value={builderSubject} onValueChange={setBuilderSubject} placeholder="Email subject" size="normal" />
                </div>
                <button
                  onClick={saveCustomTemplate}
                  style={{ height: 34, borderRadius: 6, border: '1px solid #2e4de5', background: '#2e4de5', color: '#fff', fontSize: 14, fontWeight: 700, padding: '0 12px', cursor: 'pointer' }}
                >
                  Save template
                </button>
              </div>

              <div
                onDragOver={e => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'copy'
                }}
                onDrop={e => {
                  e.preventDefault()
                  const blockType = e.dataTransfer.getData('text/plain') as BuilderBlockType
                  if (blockType) addBuilderBlock(blockType)
                }}
                style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#f8f9fc' }}
              >
                <div style={{ width: 640, maxWidth: '100%', margin: '0 auto', border: '1px solid #e2e2e2', borderRadius: 8, background: '#fff', minHeight: 520, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {builderBlocks.length === 0 ? (
                    <div style={{ flex: 1, border: '1px dashed #cfd4e6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c92a8', fontSize: 14 }}>
                      Drag blocks here to build your template
                    </div>
                  ) : builderBlocks.map(block => {
                    const selected = selectedBlockId === block.id
                    return (
                      <div
                        key={block.id}
                        onClick={() => setSelectedBlockId(block.id)}
                        style={{
                          border: `1px solid ${selected ? '#2e4de5' : '#e8e8e8'}`,
                          borderRadius: 6,
                          padding: 10,
                          background: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        {block.type === 'logo' && <div style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', color: '#2e4de5' }}>{block.content}</div>}
                        {block.type === 'text' && <p style={{ fontSize: 14, color: '#444', lineHeight: 1.55 }}>{block.content}</p>}
                        {block.type === 'image' && <div style={{ height: 120, borderRadius: 6, border: '1px dashed #d8d8d8', background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8a8a', fontSize: 14 }}>{block.content}</div>}
                        {block.type === 'button' && <div style={{ textAlign: 'center' }}><span style={{ display: 'inline-block', background: '#2e4de5', color: '#fff', borderRadius: 6, padding: '8px 16px', fontSize: 14, fontWeight: 700 }}>{block.content}</span></div>}
                        {block.type === 'divider' && <div style={{ height: 1, background: '#e8e8e8' }} />}
                        {block.type === 'spacer' && <div style={{ height: 24 }} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{ borderLeft: '1px solid #ededed', padding: 14, overflowY: 'auto' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>Block settings</p>
              {selectedBlock ? (
                <>
                  <p style={{ fontSize: 14, color: '#767676', marginBottom: 8 }}>Type: {selectedBlock.type}</p>
                  <textarea
                    value={selectedBlock.content}
                    onChange={e => updateBuilderBlock(selectedBlock.id, e.target.value)}
                    rows={6}
                    style={{ width: '100%', borderRadius: 6, border: '1px solid #d8d8d8', padding: 10, fontSize: 14, color: '#1a1a1a', resize: 'vertical' }}
                  />
                  <button
                    onClick={() => removeBuilderBlock(selectedBlock.id)}
                    style={{ marginTop: 10, height: 32, width: '100%', borderRadius: 6, border: '1px solid #efc8c8', background: '#fff6f6', color: '#b42318', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Remove block
                  </button>
                </>
              ) : (
                <p style={{ fontSize: 14, color: '#9a9a9a' }}>Select a block from the canvas to edit content.</p>
              )}
              <button
                onClick={() => setCreateTemplateOpen(false)}
                style={{ marginTop: 14, height: 32, width: '100%', borderRadius: 6, border: '1px solid #dcdcdc', background: '#fff', color: '#666', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Close builder
              </button>
            </div>
          </div>
        </div>
      )}

      {ruleModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.35)',
            zIndex: 700,
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'flex-end',
          }}
          onClick={closeRuleModal}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: ruleAiOpen ? 'min(1120px, 98vw)' : 'min(783px, 98vw)',
              height: '100vh',
              background: '#fff',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-12px 0 44px rgba(0,0,0,0.18)',
              transition: 'width 0.18s ease',
            }}
          >
            <div style={{
              height: 64,
              borderBottom: '1px solid #ededed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
            }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>Add Rule</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => setRuleAiOpen(v => !v)}
                  style={{
                    height: 32,
                    borderRadius: 999,
                    border: '1px solid #d3ebd1',
                    background: '#f2faf0',
                    color: '#2e7d1e',
                    padding: '0 12px',
                    fontSize: 14,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                  }}
                >
                  <Sparkles size={12} color="#2e7d1e" />
                  AI Assistance
                </button>
                <button
                  onClick={closeRuleModal}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border: '1px solid #e0e0e0',
                    background: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#767676',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: ruleAiOpen ? '1fr 320px' : '1fr', minHeight: 0 }}>
              <div style={{ padding: 16, overflowY: 'auto' }}>
                {ruleTemplate && (
                  <div style={{
                    border: '1px solid #e7e7e7',
                    borderRadius: 8,
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#edf3ff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2e4de5',
                        fontSize: 14,
                        fontWeight: 700,
                      }}>AG</div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ruleTemplate.name}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, color: '#2e4de5', background: '#eef1ff', borderRadius: 10, padding: '1px 6px', fontWeight: 600 }}>
                        {ruleTemplate.type}
                      </span>
                      <span style={{ fontSize: 14, color: '#f5a623' }}>{'★'.repeat(ruleTemplate.score)}</span>
                    </div>
                  </div>
                )}

                <div style={{
                  border: '1px solid #d8ebff',
                  background: '#f5faff',
                  borderRadius: 8,
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 14,
                }}>
                  <Info size={16} color="#2e4de5" />
                  <p style={{ fontSize: 14, color: '#2a4e91' }}>
                    This campaign will reach an estimated {estimateReach(ruleDrafts, ruleLogicDraft).toLocaleString()} guests.
                  </p>
                </div>

                <div style={{ border: '1px solid #ebebeb', borderRadius: 8, background: '#fbfbfb', padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Template matches</p>
                      <div style={{ display: 'inline-flex', border: '1px solid #dcdcdc', borderRadius: 6, overflow: 'hidden' }}>
                        {(['AND', 'OR'] as const).map(l => (
                          <button
                            key={l}
                            onClick={() => setRuleLogicDraft(l)}
                            style={{
                              border: 'none',
                              padding: '5px 10px',
                              background: ruleLogicDraft === l ? '#eef1ff' : '#fff',
                              color: ruleLogicDraft === l ? '#2e4de5' : '#5a5a5a',
                              fontSize: 14,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {l === 'AND' ? 'All' : 'Any'}
                          </button>
                        ))}
                      </div>
                      <p style={{ fontSize: 14, color: '#7a7a7a' }}>of these conditions:</p>
                    </div>

                    <button
                      onClick={applyRulesWithAI}
                      style={{
                        border: '1px solid #b8e8b0', background: '#f2faf0', color: '#2e7d1e',
                        fontSize: 14, fontWeight: 600, borderRadius: 999, padding: '3px 10px', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <Sparkles size={11} color="#2e7d1e" />
                      Use suggestive AI
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ruleDrafts.map((rule, idx) => {
                      const field = getFieldDef(rule.field)
                      const valueOptions = field?.type === 'select' ? field.options || [] : []
                      return (
                        <div key={rule.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 1fr 24px', gap: 10, alignItems: 'center' }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: '#eef1ff',
                            color: '#2e4de5',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 700,
                          }}>
                            {idx + 1}
                          </div>

                          <select
                            value={rule.field}
                            onChange={e => updateRule(rule.id, { field: e.target.value })}
                            style={{ height: 32, borderRadius: 6, border: '1px solid #ddd', padding: '0 10px', fontSize: 14, background: '#fff' }}
                          >
                            <option value="">Select field</option>
                            {RULE_FIELDS.map(f => (
                              <option key={f.id} value={f.id}>{f.label}</option>
                            ))}
                          </select>

                          <select
                            value={rule.operator}
                            onChange={e => updateRule(rule.id, { operator: e.target.value })}
                            disabled={!field}
                            style={{ height: 32, borderRadius: 6, border: '1px solid #ddd', padding: '0 10px', fontSize: 14, background: field ? '#fff' : '#f5f5f5' }}
                          >
                            <option value="">Select operator</option>
                            {(field?.operators || []).map(op => (
                              <option key={op.id} value={op.id}>{op.label}</option>
                            ))}
                          </select>

                          {field?.type === 'select' ? (
                            <select
                              value={rule.value}
                              onChange={e => updateRule(rule.id, { value: e.target.value })}
                              style={{ height: 32, borderRadius: 6, border: '1px solid #ddd', padding: '0 10px', fontSize: 14, background: '#fff' }}
                            >
                              <option value="">Select value</option>
                              {valueOptions.map(op => (
                                <option key={op.id} value={op.id}>{op.label}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={rule.value}
                              onChange={e => updateRule(rule.id, { value: e.target.value })}
                              placeholder={field?.placeholder || 'Enter value'}
                              style={{ height: 32, borderRadius: 6, border: '1px solid #ddd', padding: '0 10px', fontSize: 14, background: '#fff' }}
                            />
                          )}

                          <button
                            onClick={() => removeRule(rule.id)}
                            style={{ width: 24, height: 24, borderRadius: 4, border: 'none', background: 'transparent', color: '#9a9a9a', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Remove condition"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  <button
                    onClick={addCondition}
                    style={{
                      marginTop: 10,
                      width: '100%',
                      border: '1px solid #dcdcdc',
                      background: '#fff',
                      color: '#5a5a5a',
                      height: 28,
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    + Add condition
                  </button>
                </div>
              </div>

              {ruleAiOpen && (
                <div style={{ borderLeft: '1px solid #ededed', background: '#fcfcfc', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid #efefef' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>AI assistance</p>
                    <p style={{ marginTop: 4, fontSize: 14, color: '#7a7a7a' }}>Prompt AI to build your segment rules instantly.</p>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ruleAiMessages.map((m, i) => (
                      <div
                        key={`${m.role}-${i}`}
                        style={{
                          alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                          maxWidth: '100%',
                          padding: '7px 9px',
                          borderRadius: 8,
                          fontSize: 14,
                          lineHeight: 1.45,
                          border: m.role === 'user' ? '1px solid #cad7ff' : '1px solid #dfead9',
                          background: m.role === 'user' ? '#eef3ff' : '#f2faf0',
                          color: '#2a2a2a',
                        }}
                      >
                        {m.text}
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: 12, borderTop: '1px solid #efefef', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[
                        'loyalty members in last 90 days',
                        'direct bookings or family guests',
                        'high spenders above 500',
                      ].map(s => (
                        <button
                          key={s}
                          onClick={() => setRuleAiPrompt(s)}
                          style={{ border: '1px solid #d9e7d7', background: '#fff', color: '#3f6b33', fontSize: 14, borderRadius: 999, padding: '2px 8px', cursor: 'pointer' }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={ruleAiPrompt}
                      onChange={e => setRuleAiPrompt(e.target.value)}
                      placeholder="Prompt AI to generate rules"
                      style={{ width: '100%', minHeight: 74, maxHeight: 120, resize: 'vertical', borderRadius: 8, border: '1px solid #d9d9d9', padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
                    />
                    <button
                      onClick={runRuleAIAssistant}
                      style={{
                        height: 32,
                        borderRadius: 8,
                        border: '1px solid #2e7d1e',
                        background: '#2e7d1e',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                      }}
                    >
                      <Sparkles size={12} color="#fff" />
                      Generate rules
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{
              height: 72,
              borderTop: '1px solid #ededed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              background: '#fff',
            }}>
              <button
                onClick={closeRuleModal}
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid #e0e0e0',
                  background: '#fff',
                  color: '#5a5a5a',
                  padding: '0 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveRuleSegment}
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid #2e4de5',
                  background: '#2e4de5',
                  color: '#fff',
                  padding: '0 16px',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StepAudience({ form, set }: { form: FormState; set: (p: Partial<FormState>) => void }) {
  const [activeTab, setActiveTab] = useState<'send-to' | 'do-not-send'>('send-to')
  const [audienceType, setAudienceType] = useState<'all' | 'predefined' | 'paste'>(
    form.audienceMode === 'segment' ? 'predefined' : 'all'
  )
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Guest Lifecycle': true,
    'Loyalty & Rewards': true,
    'Booking Behavior': false,
    'Email Engagement': false,
    'Revenue': false,
  })
  const [pasteEmails, setPasteEmails] = useState('')
  const [segmentSheetOpen, setSegmentSheetOpen] = useState(false)
  const [segmentName, setSegmentName] = useState('')
  const [segmentRuleDrafts, setSegmentRuleDrafts] = useState<AudienceRule[]>([makeRule()])
  const [segmentRuleLogic, setSegmentRuleLogic] = useState<'AND' | 'OR'>('AND')

  const selected = [...SEGMENTS, ...form.savedSegments].find(s => s.id === form.segmentId)

  type SegmentGroup = { title: string; segments: typeof SEGMENTS }
  const SEGMENT_GROUPS: SegmentGroup[] = [
    { title: 'Guest Lifecycle',    segments: SEGMENTS.filter(s => ['s-recent', 's-loyalty', 's-lapsed'].includes(s.id)) },
    { title: 'Loyalty & Rewards',  segments: SEGMENTS.filter(s => ['s-loyalty', 's-spa', 's-all'].includes(s.id)) },
    { title: 'Booking Behavior',   segments: SEGMENTS.filter(s => ['s-all', 's-recent'].includes(s.id)) },
    { title: 'Email Engagement',   segments: SEGMENTS.filter(s => ['s-loyalty', 's-lapsed'].includes(s.id)) },
    { title: 'Revenue',            segments: SEGMENTS.filter(s => ['s-spa', 's-all'].includes(s.id)) },
  ]

  function toggleGroup(title: string) {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }))
  }

  function applyAudienceAI() {
    if (form.type === 'event-driven') {
      set({ audienceMode: 'segment', segmentId: 's-recent' })
      setAudienceType('predefined')
      return
    }
    if (form.type === 'scheduled') {
      set({ audienceMode: 'segment', segmentId: 's-loyalty' })
      setAudienceType('predefined')
      return
    }
    set({ audienceMode: 'segment', segmentId: 's-all' })
    setAudienceType('all')
  }

  function openCreateSegmentSheet() {
    setSegmentName('')
    setSegmentRuleDrafts([makeRule()])
    setSegmentRuleLogic('AND')
    setSegmentSheetOpen(true)
  }

  function updateSegmentRule(ruleId: string, patch: Partial<AudienceRule>) {
    setSegmentRuleDrafts(prev => prev.map(r => {
      if (r.id !== ruleId) return r
      const next = { ...r, ...patch }
      if (patch.field && patch.field !== r.field) {
        next.operator = ''
        next.value = ''
      }
      return next
    }))
  }

  function removeSegmentRule(ruleId: string) {
    setSegmentRuleDrafts(prev => {
      const next = prev.filter(r => r.id !== ruleId)
      return next.length > 0 ? next : [makeRule()]
    })
  }

  function addSegmentCondition() {
    setSegmentRuleDrafts(prev => [...prev, makeRule()])
  }

  function applySegmentBuilderAI() {
    if (form.type === 'event-driven') {
      setSegmentRuleLogic('AND')
      setSegmentRuleDrafts([
        { ...makeRule(), field: 'booking_source', operator: 'is', value: 'direct' },
        { ...makeRule(), field: 'last_visit_days', operator: 'within', value: '60' },
      ])
      return
    }
    setSegmentRuleLogic('AND')
    setSegmentRuleDrafts([
      { ...makeRule(), field: 'email_status', operator: 'is', value: 'subscribed' },
      { ...makeRule(), field: 'total_spend', operator: 'gt', value: '500' },
    ])
  }

  function saveCreatedSegment() {
    const complete = segmentRuleDrafts.filter(r => r.field && r.operator && r.value.trim())
    if (complete.length === 0) return
    const id = `s-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const label = segmentName.trim() || `Custom segment ${form.savedSegments.length + 1}`
    const count = estimateReach(complete, segmentRuleLogic).toLocaleString()
    const nextSaved = [
      ...form.savedSegments,
      {
        id,
        label,
        count,
        hint: `${complete.length} rule${complete.length > 1 ? 's' : ''} (${segmentRuleLogic})`,
        source: 'custom' as const,
      },
    ]
    set({
      savedSegments: nextSaved,
      customRules: complete,
      rulesLogic: segmentRuleLogic,
      segmentId: id,
      audienceMode: 'segment',
    })
    setAudienceType('predefined')
    setSegmentSheetOpen(false)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Define your audience</p>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            border: '1px solid #b8e8b0', background: '#f2faf0', color: '#2e7d1e',
            fontSize: 14, fontWeight: 600, borderRadius: 999, padding: '3px 10px', cursor: 'pointer',
          }}
            onClick={applyAudienceAI}
          >
            <Sparkles size={11} color="#2e7d1e" />
            Use suggestive AI
          </button>
        </div>
        {selected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#5a5a5a' }}>
            <span>Estimated Reach</span>
            <span style={{ fontWeight: 700, color: '#2e4de5' }}>{selected.count} guests</span>
            <span style={{ color: '#ccc' }}>|</span>
            <span>Excluded: —</span>
          </div>
        )}
      </div>

      {/* Send To / Do not Send tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #efefef', marginBottom: 14 }}>
        {([['send-to', 'Send To'], ['do-not-send', 'Do not Send']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              padding: '9px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 14, fontWeight: activeTab === id ? 700 : 400,
              color: activeTab === id ? '#2e4de5' : '#767676',
              borderBottom: `2px solid ${activeTab === id ? '#2e4de5' : 'transparent'}`,
              marginBottom: -1, transition: 'color 0.1s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Radio group + Create button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
        {([['all', 'All Guests'], ['predefined', 'Pre-defined Segment'], ['paste', 'Paste Emails']] as const).map(([id, label]) => (
          <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 14, color: '#1a1a1a' }}>
            <input
              type="radio"
              name="audience-type"
              value={id}
              checked={audienceType === id}
              onChange={() => {
                setAudienceType(id)
                if (id === 'all') set({ audienceMode: 'segment', segmentId: 's-all' })
                else if (id === 'predefined') set({ audienceMode: 'segment' })
              }}
              style={{ accentColor: '#2e4de5', width: 14, height: 14 }}
            />
            {label}
          </label>
        ))}
        <button
          onClick={openCreateSegmentSheet}
          style={{
          marginLeft: 'auto', border: '1px solid #2e4de5', background: '#fff', color: '#2e4de5',
          padding: '5px 12px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          + Create New Segments
        </button>
      </div>

      {/* All Guests mode */}
      {audienceType === 'all' && (
        <div style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #e8e8e8', background: '#f9f9f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={14} color="#767676" />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>All Guests — 26,000 guests</p>
          </div>
          <p style={{ fontSize: 14, color: '#767676', marginTop: 4 }}>This campaign will be sent to your full guest database.</p>
        </div>
      )}

      {/* Paste Emails mode */}
      {audienceType === 'paste' && (
        <div>
          <p style={{ fontSize: 14, color: '#767676', marginBottom: 8 }}>Paste email addresses separated by comma or newline.</p>
          <textarea
            value={pasteEmails}
            onChange={e => setPasteEmails(e.target.value)}
            placeholder="guest1@example.com, guest2@example.com"
            style={{
              width: '100%', height: 100, borderRadius: 8, border: '1px solid #e0e0e0',
              background: '#fafafa', padding: '10px 12px', fontSize: 14, resize: 'vertical',
              color: '#1a1a1a', outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
      )}

      {/* Pre-defined Segment: grouped collapsible sections */}
      {audienceType === 'predefined' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {form.savedSegments.length > 0 && (
            <div>
              <button
                onClick={() => toggleGroup('Recently Saved')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  padding: '4px 0', marginBottom: expandedGroups['Recently Saved'] ? 8 : 0, width: '100%', textAlign: 'left',
                }}
              >
                {expandedGroups['Recently Saved']
                  ? <ChevronDown size={14} color="#767676" />
                  : <ChevronRight size={14} color="#767676" />
                }
                <span style={{ fontSize: 14, fontWeight: 600, color: '#5a5a5a' }}>Recently Saved</span>
              </button>

              {expandedGroups['Recently Saved'] && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[...form.savedSegments].reverse().map(seg => {
                    const active = form.segmentId === seg.id
                    return (
                      <button
                        key={`recent-${seg.id}`}
                        onClick={() => set({ segmentId: seg.id, audienceMode: 'segment' })}
                        style={{
                          border: `1.5px solid ${active ? '#2e4de5' : '#e8e8e8'}`,
                          background: active ? '#f0f3ff' : '#fff',
                          borderRadius: 8, padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
                          transition: 'border-color 0.12s, background 0.12s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                            background: active ? '#2e4de5' : '#f0f0f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Sparkles size={11} color={active ? '#fff' : '#888'} />
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: active ? '#2e4de5' : '#1a1a1a', lineHeight: 1.2 }}>{seg.label}</p>
                        </div>
                        <p style={{ fontSize: 18, fontWeight: 700, color: active ? '#2e4de5' : '#1a1a1a', lineHeight: 1 }}>{seg.count}</p>
                        <p style={{ fontSize: 14, color: '#9a9a9a', marginBottom: 4 }}>guests</p>
                        <p style={{ fontSize: 14, color: '#9a9a9a', lineHeight: 1.3 }}>{seg.hint}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {SEGMENT_GROUPS.map(group => (
            <div key={group.title}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.title)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  padding: '4px 0', marginBottom: expandedGroups[group.title] ? 8 : 0, width: '100%', textAlign: 'left',
                }}
              >
                {expandedGroups[group.title]
                  ? <ChevronDown size={14} color="#767676" />
                  : <ChevronRight size={14} color="#767676" />
                }
                <span style={{ fontSize: 14, fontWeight: 600, color: '#5a5a5a' }}>{group.title}</span>
              </button>

              {/* 3-column segment cards */}
              {expandedGroups[group.title] && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {group.segments.map(seg => {
                    const active = form.segmentId === seg.id
                    const Icon = seg.icon
                    return (
                      <button
                        key={`${group.title}-${seg.id}`}
                        onClick={() => set({ segmentId: seg.id, audienceMode: 'segment' })}
                        style={{
                          border: `1.5px solid ${active ? '#2e4de5' : '#e8e8e8'}`,
                          background: active ? '#f0f3ff' : '#fff',
                          borderRadius: 8, padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
                          transition: 'border-color 0.12s, background 0.12s',
                        }}
                        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = '#c0caff' }}
                        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8e8e8' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                            background: active ? '#2e4de5' : '#f0f0f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Icon size={11} color={active ? '#fff' : '#888'} />
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: active ? '#2e4de5' : '#1a1a1a', lineHeight: 1.2 }}>{seg.label}</p>
                        </div>
                        <p style={{ fontSize: 18, fontWeight: 700, color: active ? '#2e4de5' : '#1a1a1a', lineHeight: 1 }}>{seg.count}</p>
                        <p style={{ fontSize: 14, color: '#9a9a9a', marginBottom: 4 }}>guests</p>
                        <p style={{ fontSize: 14, color: '#9a9a9a', lineHeight: 1.3 }}>{seg.hint}</p>
                        {active && (
                          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                            <Check size={12} color="#2e4de5" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {segmentSheetOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.35)',
            zIndex: 710,
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'flex-end',
          }}
          onClick={() => setSegmentSheetOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 'min(783px, 98vw)',
              height: '100vh',
              background: '#fff',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-12px 0 44px rgba(0,0,0,0.18)',
            }}
          >
            <div style={{ height: 64, borderBottom: '1px solid #ededed', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>Create new segment</p>
              <button onClick={() => setSegmentSheetOpen(false)} style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#767676' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#5a5a5a', marginBottom: 6 }}>Segment name</p>
                <input
                  value={segmentName}
                  onChange={e => setSegmentName(e.target.value)}
                  placeholder="Name your segment"
                  style={{ height: 34, width: '100%', borderRadius: 6, border: '1px solid #ddd', padding: '0 10px', fontSize: 14, background: '#fff' }}
                />
              </div>

              <div style={{ border: '1px solid #d8ebff', background: '#f5faff', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Info size={16} color="#2e4de5" />
                <p style={{ fontSize: 14, color: '#2a4e91' }}>
                  This segment will include an estimated {estimateReach(segmentRuleDrafts, segmentRuleLogic).toLocaleString()} guests.
                </p>
              </div>

              <div style={{ border: '1px solid #ebebeb', borderRadius: 8, background: '#fbfbfb', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Rule types</p>
                    <div style={{ display: 'inline-flex', border: '1px solid #dcdcdc', borderRadius: 6, overflow: 'hidden' }}>
                      {(['AND', 'OR'] as const).map(l => (
                        <button
                          key={l}
                          onClick={() => setSegmentRuleLogic(l)}
                          style={{
                            border: 'none',
                            padding: '5px 10px',
                            background: segmentRuleLogic === l ? '#eef1ff' : '#fff',
                            color: segmentRuleLogic === l ? '#2e4de5' : '#5a5a5a',
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {l === 'AND' ? 'All' : 'Any'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={applySegmentBuilderAI}
                    style={{ border: '1px solid #b8e8b0', background: '#f2faf0', color: '#2e7d1e', fontSize: 14, fontWeight: 600, borderRadius: 999, padding: '3px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Sparkles size={11} color="#2e7d1e" />
                    Use suggestive AI
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {segmentRuleDrafts.map((rule, idx) => {
                    const field = RULE_FIELDS.find(f => f.id === rule.field)
                    const valueOptions = field?.type === 'select' ? field.options || [] : []
                    return (
                      <div key={rule.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 1fr 24px', gap: 10, alignItems: 'center' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eef1ff', color: '#2e4de5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                          {idx + 1}
                        </div>

                        <select value={rule.field} onChange={e => updateSegmentRule(rule.id, { field: e.target.value })} style={{ height: 32, borderRadius: 6, border: '1px solid #ddd', padding: '0 10px', fontSize: 14, background: '#fff' }}>
                          <option value="">Select field</option>
                          {RULE_FIELDS.map(f => (<option key={f.id} value={f.id}>{f.label}</option>))}
                        </select>

                        <select value={rule.operator} onChange={e => updateSegmentRule(rule.id, { operator: e.target.value })} disabled={!field} style={{ height: 32, borderRadius: 6, border: '1px solid #ddd', padding: '0 10px', fontSize: 14, background: field ? '#fff' : '#f5f5f5' }}>
                          <option value="">Select operator</option>
                          {(field?.operators || []).map(op => (<option key={op.id} value={op.id}>{op.label}</option>))}
                        </select>

                        {field?.type === 'select' ? (
                          <select value={rule.value} onChange={e => updateSegmentRule(rule.id, { value: e.target.value })} style={{ height: 32, borderRadius: 6, border: '1px solid #ddd', padding: '0 10px', fontSize: 14, background: '#fff' }}>
                            <option value="">Select value</option>
                            {valueOptions.map(op => (<option key={op.id} value={op.id}>{op.label}</option>))}
                          </select>
                        ) : (
                          <input value={rule.value} onChange={e => updateSegmentRule(rule.id, { value: e.target.value })} placeholder={field?.placeholder || 'Enter value'} style={{ height: 32, borderRadius: 6, border: '1px solid #ddd', padding: '0 10px', fontSize: 14, background: '#fff' }} />
                        )}

                        <button onClick={() => removeSegmentRule(rule.id)} style={{ width: 24, height: 24, borderRadius: 4, border: 'none', background: 'transparent', color: '#9a9a9a', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>

                <button onClick={addSegmentCondition} style={{ marginTop: 10, width: '100%', border: '1px solid #dcdcdc', background: '#fff', color: '#5a5a5a', height: 28, borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  + Add condition
                </button>
              </div>
            </div>

            <div style={{ height: 72, borderTop: '1px solid #ededed', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: '#fff' }}>
              <button onClick={() => setSegmentSheetOpen(false)} style={{ height: 40, borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', color: '#5a5a5a', padding: '0 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={saveCreatedSegment} style={{ height: 40, borderRadius: 8, border: '1px solid #2e4de5', background: '#2e4de5', color: '#fff', padding: '0 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Save segment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const TIMING_ACTIONS = [
  { id: 'check-in',             label: 'Check-In',             hint: 'Guest arrives & checks in',          showFor: 'both' },
  { id: 'check-out',            label: 'Check-Out',            hint: 'Stay completed',                     showFor: 'both' },
  { id: 'booked',               label: 'Booked',               hint: 'Reservation confirmed',              showFor: 'both' },
  { id: 'arrived',              label: 'Arrived',              hint: 'Guest physically arrived at property', showFor: 'both' },
  { id: 'confirmation',         label: 'Confirmation',         hint: 'Booking confirmation sent',          showFor: 'both' },
  { id: 'room-upgrade',         label: 'Room Upgrade',         hint: 'Upgrade offered or accepted',        showFor: 'both' },
  { id: 'loyalty-milestone',    label: 'Loyalty Milestone',    hint: 'Guest hits a rewards tier',          showFor: 'both' },
  { id: 'pre-arrival',          label: 'Pre-Arrival',          hint: 'Before guest arrives',               showFor: 'after' },
  { id: 'post-stay',            label: 'Post-Stay',            hint: 'After guest checks out',             showFor: 'after' },
  { id: 'no-show',              label: 'No-Show',              hint: 'Guest did not arrive',               showFor: 'after' },
]

function StepSchedule({ form, set }: { form: FormState; set: (p: Partial<FormState>) => void }) {
  const segment = [...SEGMENTS, ...form.savedSegments].find(s => s.id === form.segmentId)

  // Unified "when" maps to form fields
  const when: 'best-time' | 'before' | 'after' =
    form.scheduleType === 'best-time' ? 'best-time'
    : form.timingRelation === 'before' ? 'before'
    : 'after'

  function setWhen(w: 'best-time' | 'before' | 'after') {
    if (w === 'best-time') set({ scheduleType: 'best-time', timingRelation: 'after' })
    else set({ scheduleType: 'custom', timingRelation: w })
  }

  // Guest action chips to show (Figma primary set)
  const GUEST_ACTIONS = TIMING_ACTIONS.filter(a => ['booked', 'confirmation', 'arrived', 'check-in'].includes(a.id))

  function applyScheduleAI() {
    if (form.type === 'event-driven') {
      set({ scheduleType: 'best-time', timingRelation: 'after', timingAction: 'booked', timingValue: '1', timingUnit: 'hours' })
      return
    }
    if (form.type === 'scheduled') {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const yyyy = tomorrow.getFullYear()
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0')
      const dd = String(tomorrow.getDate()).padStart(2, '0')
      set({ scheduleType: 'custom', scheduleDate: `${yyyy}-${mm}-${dd}`, scheduleTime: '09:00', fromDate: `${yyyy}-${mm}-${dd}` })
      return
    }
    set({ scheduleType: 'best-time', timingRelation: 'after' })
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>When Should this campaign send?</p>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          border: '1px solid #b8e8b0', background: '#f2faf0', color: '#2e7d1e',
          fontSize: 14, fontWeight: 600, borderRadius: 999, padding: '3px 10px', cursor: 'pointer',
        }}
          onClick={applyScheduleAI}
        >
          <Sparkles size={11} color="#2e7d1e" />
          Use suggestive AI
        </button>
      </div>

      {/* When radio row */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        {([
          ['best-time', 'Best Time (auto)'],
          ['before', 'Before'],
          ['after', 'After'],
        ] as const).map(([id, label]) => (
          <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 14, color: '#1a1a1a' }}>
            <input
              type="radio"
              name="when-type"
              checked={when === id}
              onChange={() => setWhen(id)}
              style={{ accentColor: '#2e4de5', width: 14, height: 14 }}
            />
            {label}
          </label>
        ))}
      </div>

      {/* Guest Action chips (when Before or After) */}
      {(when === 'before' || when === 'after') && (
        <>
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#5a5a5a', marginBottom: 8 }}>Guest Action</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {GUEST_ACTIONS.map(action => {
                const active = form.timingAction === action.id
                return (
                  <button
                    key={action.id}
                    onClick={() => set({ timingAction: action.id })}
                    style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 14, fontWeight: 500,
                      border: `1.5px solid ${active ? '#2e4de5' : '#e0e0e0'}`,
                      background: active ? '#2e4de5' : '#fff',
                      color: active ? '#fff' : '#3a3a3a',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2e4de5'; (e.currentTarget as HTMLButtonElement).style.color = '#2e4de5' }}}
                    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e0e0e0'; (e.currentTarget as HTMLButtonElement).style.color = '#3a3a3a' }}}
                  >
                    {action.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* How long inputs */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#5a5a5a', marginBottom: 8 }}>
              How long {when}?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={form.timingValue}
                  onChange={e => set({ timingValue: e.target.value })}
                  placeholder="Hours &amp; Minutes"
                  style={{
                    width: '100%', height: 36, borderRadius: 6, fontSize: 14,
                    border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a',
                    padding: '0 12px', outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#2e4de5' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="Days"
                  style={{
                    width: '100%', height: 36, borderRadius: 6, fontSize: 14,
                    border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a',
                    padding: '0 12px', outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#2e4de5' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0' }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Expected Execution Window ── */}
      {(() => {
        const hasFrom = !!form.fromDate
        const hasTo   = !!form.toDate
        const fmt = (d: string) => {
          const [y, m, day] = d.split('-').map(Number)
          return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
        let windowText = ''
        let subText = ''
        if (when === 'best-time') {
          windowText = 'AI will optimise delivery per guest'
          subText = 'Typically Tuesday 9–10 AM or Thursday 2–3 PM based on historical open patterns. Expect ~14% lift vs. fixed schedule.'
        } else if (when === 'before' || when === 'after') {
          const val = form.timingValue || '1'
          const unit = form.timingUnit || 'days'
          const action = TIMING_ACTIONS.find(a => a.id === form.timingAction)?.label || form.timingAction
          windowText = `${val} ${unit} ${when} "${action}"`
          subText = hasFrom && hasTo
            ? `Active window: ${fmt(form.fromDate)} – ${fmt(form.toDate)}`
            : 'Set Campaign Duration below to see the full execution window.'
        } else {
          windowText = form.scheduleDate
            ? `Scheduled for ${fmt(form.scheduleDate)}${form.scheduleTime ? ` at ${form.scheduleTime}` : ''}`
            : 'No send date selected yet'
          subText = hasFrom && hasTo ? `Active window: ${fmt(form.fromDate)} – ${fmt(form.toDate)}` : ''
        }
        return (
          <div style={{ marginBottom: 20, padding: '10px 14px', borderRadius: 8, background: '#f0f7ff', border: '1px solid #c5dcf7', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Clock size={14} color="#1a74a8" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#1a4a72', margin: 0 }}>Expected Execution Window</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1a74a8', margin: '2px 0 0' }}>{windowText}</p>
              {subText && <p style={{ fontSize: 11, color: '#5a7a9a', margin: '2px 0 0', lineHeight: 1.5 }}>{subText}</p>}
            </div>
          </div>
        )
      })()}

      {/* Campaign Duration */}
      <div style={{
        padding: '14px 16px', borderRadius: 8,
        border: '1px solid #e8e8e8', background: '#fafafa',
      }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Campaign Duration</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#5a5a5a', marginBottom: 6 }}>
              From <span style={{ color: '#e51c00' }}>*</span>
            </p>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={form.fromDate}
                onChange={e => set({ fromDate: e.target.value })}
                style={{
                  width: '100%', padding: '8px 32px 8px 12px', borderRadius: 6, fontSize: 14,
                  border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a', outline: 'none',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#2e4de5' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0' }}
              />
              <Calendar size={13} color="#aaa" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#5a5a5a', marginBottom: 6 }}>
              To <span style={{ color: '#e51c00' }}>*</span>
            </p>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={form.toDate}
                min={form.fromDate || undefined}
                onChange={e => set({ toDate: e.target.value })}
                style={{
                  width: '100%', padding: '8px 32px 8px 12px', borderRadius: 6, fontSize: 14,
                  border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a', outline: 'none',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#2e4de5' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0' }}
              />
              <Calendar size={13} color="#aaa" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Shared form helpers ─────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  name: '', type: '', channel: '', deliveryMode: '', senderMode: 'default', senderEmail: '', replyToEmail: '',
  fromName: '', subject: '', previewText: '',
  campaignTrackingEnabled: false, trackOpen: false, trackClick: false, trackUtm: false, trackConversion: false,
  manageReplies: false, autoAcknowledgment: false, trackReplyResolution: false,
  templateIds: [], segmentId: '', audienceMode: 'segment', customRules: [], rulesLogic: 'AND',
  triggerEvent: '', surveyScheduleMode: 'event-driven',
  scheduleType: 'best-time', scheduleDate: '', scheduleTime: '',
  timingAction: 'arrival', timingRelation: 'before', timingValue: '1', timingUnit: 'days',
  fromDate: '', toDate: '', attachments: [], savedSegments: [],
}

function checkCanAdvance(step: number, form: FormState): boolean {
  if (step === 0) {
    const senderValid = isValidEmail(form.senderEmail)
    const replyValid = !form.manageReplies || isValidEmail(form.replyToEmail)
    return form.triggerEvent !== '' && form.deliveryMode !== '' &&
      form.subject.trim().length > 0 && form.fromName.trim().length > 0 &&
      senderValid && replyValid
  }
  if (step === 1) return form.templateIds.length > 0
  if (step === 2) {
    if (form.audienceMode === 'segment') return form.segmentId !== ''
    return form.customRules.some(r => r.field && r.operator && r.value.trim())
  }
  return true
}

function NextBestExperiencePopup({
  open,
  recommendation,
  form,
  showWhy,
  onClose,
  onApplyTemplate,
  onApplyAudience,
  onApplySchedule,
  onToggleWhy,
  onApplyAllAndContinue,
  onContinue,
}: {
  open: boolean
  recommendation: NbxRecommendation | null
  form: FormState
  showWhy: boolean
  onClose: () => void
  onApplyTemplate: () => void
  onApplyAudience: () => void
  onApplySchedule: () => void
  onToggleWhy: () => void
  onApplyAllAndContinue: () => void
  onContinue: () => void
}) {
  if (!open || !recommendation) return null
  const template = TEMPLATES.find(t => t.id === recommendation.templateId)
  const audience = [...SEGMENTS, ...form.savedSegments].find(s => s.id === recommendation.audienceSegmentId)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.32)',
        zIndex: 750,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(760px, 96vw)',
          borderRadius: 12,
          background: '#fff',
          border: '1px solid #dfe9dc',
          boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '86vh',
        }}
      >
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid #e9efe7',
          background: 'linear-gradient(90deg, #f2faf0 0%, #eef6ff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={14} color="#2e7d1e" />
            <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>AI next best experience</p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #d6ddd4', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#767676' }}
          >
            <X size={13} />
          </button>
        </div>

        <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ border: '1px solid #cde8c6', borderRadius: 8, background: '#f3fbf0', padding: '10px 12px' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#245f1b', marginBottom: 4 }}>NBE recommendation</p>
            <p style={{ fontSize: 14, color: '#386c2f' }}>Based on Basics input, AI recommended the best template, audience, and schedule.</p>
          </div>

          <div style={{ border: '1px solid #e6e6e6', borderRadius: 8, padding: '10px 12px', background: '#fff' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#5a5a5a' }}>Template</p>
            <p style={{ marginTop: 4, fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{template?.name || 'Luxury Stay Promotion'}</p>
            <p style={{ marginTop: 4, fontSize: 14, color: '#2e7d1e' }}>Confidence {recommendation.templateConfidence}%</p>
            <p style={{ marginTop: 2, fontSize: 14, color: '#6a6a6a' }}>{recommendation.templateReason}</p>
            <button onClick={onApplyTemplate} style={{ marginTop: 8, height: 36, borderRadius: 7, border: '1px solid #2e4de5', background: '#fff', color: '#2e4de5', padding: '0 12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Apply template</button>
          </div>

          <div style={{ border: '1px solid #e6e6e6', borderRadius: 8, padding: '10px 12px', background: '#fff' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#5a5a5a' }}>Audience</p>
            <p style={{ marginTop: 4, fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{audience?.label || 'Repeat Guests'}</p>
            <p style={{ marginTop: 2, fontSize: 14, color: '#6a6a6a' }}>{recommendation.audienceReason}</p>
            <button onClick={onApplyAudience} style={{ marginTop: 8, height: 36, borderRadius: 7, border: '1px solid #2e4de5', background: '#fff', color: '#2e4de5', padding: '0 12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Apply audience</button>
          </div>

          <div style={{ border: '1px solid #e6e6e6', borderRadius: 8, padding: '10px 12px', background: '#fff' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#5a5a5a' }}>Schedule</p>
            <p style={{ marginTop: 4, fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{recommendation.scheduleDay} · {recommendation.scheduleTime}</p>
            <p style={{ marginTop: 2, fontSize: 14, color: '#6a6a6a' }}>{recommendation.scheduleReason}</p>
            <button onClick={onApplySchedule} style={{ marginTop: 8, height: 36, borderRadius: 7, border: '1px solid #2e4de5', background: '#fff', color: '#2e4de5', padding: '0 12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Apply schedule</button>
          </div>

          <div style={{ border: '1px solid #e6e6e6', borderRadius: 8, padding: '10px 12px', background: '#fff' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#5a5a5a' }}>Prediction</p>
            <p style={{ marginTop: 4, fontSize: 14, color: '#1a1a1a' }}>Open rate: {recommendation.predictionOpenRate} · CTR: {recommendation.predictionCtr} · Revenue: {recommendation.predictionRevenue}</p>
            <button onClick={onToggleWhy} style={{ marginTop: 8, height: 34, borderRadius: 7, border: '1px solid #ddd', background: '#fff', color: '#666', padding: '0 11px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Why these recommendations?</button>
            {showWhy && (
              <p style={{ marginTop: 8, fontSize: 14, color: '#4a5b99', lineHeight: 1.5 }}>
                Recommendations are based on trigger intent, recent campaign outcomes, and audience engagement patterns.
              </p>
            )}
          </div>
        </div>

        <div style={{
          height: 66,
          borderTop: '1px solid #ececec',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: '#fff',
        }}>
          <button
            onClick={onContinue}
            style={{ height: 40, borderRadius: 8, border: '1px solid #d9d9d9', background: '#fff', color: '#5a5a5a', padding: '0 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Continue without applying
          </button>

          <button
            onClick={onApplyAllAndContinue}
            style={{ height: 40, borderRadius: 8, border: '1px solid #2e4de5', background: '#2e4de5', color: '#fff', padding: '0 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Sparkles size={12} color="#fff" />
            Apply all and continue
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Inline (on-page) version ────────────────────────────────────────────────

interface CreateCampaignFlowInlineProps {
  onLaunch?: (campaign: { name: string; type: string; channel: string }) => void
  onSave?: (campaign: { name: string; type: string; channel: string }) => void
  initialStep?: number
  initialType?: CampaignType | ''
  currentStep?: number
  onStepChange?: (step: number) => void
  aiAssistantOpen?: boolean
  hideStepper?: boolean
}

export function CreateCampaignFlowInline({
  onLaunch,
  onSave,
  initialStep = 0,
  initialType = '',
  currentStep,
  onStepChange,
  aiAssistantOpen = false,
  hideStepper = false,
}: CreateCampaignFlowInlineProps) {
  const isControlledStep = typeof currentStep === 'number'
  const [internalStep, setInternalStep] = useState(initialStep)
  const step = isControlledStep ? (currentStep as number) : internalStep
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, type: initialType })
  const [nbeOpen, setNbeOpen] = useState(false)
  const [nbeRecommendation, setNbeRecommendation] = useState<NbxRecommendation | null>(null)
  const [nbeWhyOpen, setNbeWhyOpen] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [testSending, setTestSending] = useState(false)
  const [confirmLaunchOpen, setConfirmLaunchOpen] = useState(false)
  const [launchSuccess, setLaunchSuccess] = useState(false)

  function sendTestCampaign() {
    setTestSending(true)
    setTimeout(() => { setTestSending(false); setTestSent(true) }, 1400)
  }

  function openConfirmLaunch() {
    setConfirmLaunchOpen(true)
  }

  function confirmAndLaunch() {
    setConfirmLaunchOpen(false)
    setLaunchSuccess(true)
  }

  function setStep(next: number) {
    if (!isControlledStep) setInternalStep(next)
    onStepChange?.(next)
  }

  useEffect(() => {
    setStep(initialStep)
    setForm({ ...EMPTY_FORM, type: initialType })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStep, initialType])

  function patch(partial: Partial<FormState>) {
    setForm(prev => ({ ...prev, ...partial }))
  }

  function handleLaunch() {
    onLaunch?.({ name: form.name, type: form.type, channel: form.channel })
  }

  function handleSave() {
    onSave?.({ name: form.name, type: form.type, channel: form.channel })
  }

  function handleReset() {
    setStep(0)
    setForm({ ...EMPTY_FORM, type: initialType })
    setNbeOpen(false)
    setNbeRecommendation(null)
    setNbeWhyOpen(false)
  }

  function applyTemplateRecommendation() {
    if (!nbeRecommendation) return
    patch({ templateIds: [nbeRecommendation.templateId] })
  }

  function applyAudienceRecommendation() {
    if (!nbeRecommendation) return
    patch({ audienceMode: 'segment', segmentId: nbeRecommendation.audienceSegmentId })
  }

  function applyScheduleRecommendation() {
    const nextTue = getNextTuesdayISODate()
    patch({
      scheduleType: 'custom',
      scheduleDate: nextTue,
      scheduleTime: '10:00',
      fromDate: nextTue,
      toDate: nextTue,
      timingRelation: 'after',
      timingAction: form.timingAction || 'booked',
    })
  }

  function applyAllRecommendationsAndContinue() {
    applyTemplateRecommendation()
    applyAudienceRecommendation()
    applyScheduleRecommendation()
    patch({
      campaignTrackingEnabled: true,
      trackOpen: true,
      trackClick: true,
      trackUtm: true,
      trackConversion: true,
    })
    setNbeOpen(false)
    setNbeWhyOpen(false)
    setStep(3)
  }

  function continueAfterNbe() {
    setNbeOpen(false)
    setNbeWhyOpen(false)
    setStep(1)
  }

  function handleNextStep() {
    if (step === 0) {
      setNbeRecommendation(buildNbxRecommendation(form))
      setNbeWhyOpen(false)
      setNbeOpen(true)
      return
    }
    setStep(step + 1)
  }

  const canAdvance = checkCanAdvance(step, form)

  return (
    <>
    <div style={{
      background: 'var(--unity-color-surface-layer-1, #fff)',
      borderRadius: hideStepper ? 0 : 12,
      border: hideStepper ? 'none' : '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
      overflow: 'hidden',
      boxShadow: hideStepper ? 'none' : '0 2px 12px rgba(0,0,0,0.05)',
      display: hideStepper ? 'grid' : 'block',
      gridTemplateColumns: hideStepper ? '1fr 320px' : '1fr',
      height: hideStepper ? '100%' : 'auto',
    }}>
      {/* Left: form area */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, height: hideStepper ? '100%' : 'auto', overflow: hideStepper ? 'hidden' : 'visible' }}>
      {!hideStepper && (
        <div style={{
          padding: '16px 32px',
          background: 'var(--unity-color-surface-subtle, #f8f8f8)',
          borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
        }}>
          <WizardStepper
            steps={STEPS}
            activeStep={step}
            direction="horizontal"
            size="small"
            onStepClick={i => { if (i < step) setStep(i) }}
          />
        </div>
      )}

      {/* Step content */}
      <div style={{ padding: hideStepper ? 0 : '32px 32px 24px', minHeight: hideStepper ? 0 : 420, flex: hideStepper ? 1 : 'unset', overflowY: hideStepper ? 'auto' : 'visible' }}>
        {step === 0 && (
          <div style={{ padding: hideStepper ? '20px 24px' : 0 }}>
            <StepBasics form={form} set={patch} />
          </div>
        )}
        {step === 1 && <div style={{ padding: hideStepper ? '20px 24px' : '24px 28px' }}><StepTemplate form={form} set={patch} /></div>}
        {step === 2 && (
          <div style={{ padding: hideStepper ? '20px 24px' : '24px 28px' }}>
            <StepAudience form={form} set={patch} />
          </div>
        )}
        {step === 3 && <div style={{ padding: hideStepper ? '20px 24px' : '24px 28px' }}><StepSchedule form={form} set={patch} /></div>}
      </div>

      {/* Pre-flight checklist shown on final step */}
      {step === STEPS.length - 1 && (() => {
        const checks = [
          { label: 'Campaign name',   pass: form.name.trim().length > 0 },
          { label: 'Template selected', pass: form.templateIds.length > 0 },
          { label: 'Audience set',    pass: !!form.segmentId || form.customRules.some(r => r.value.trim()) },
          { label: 'Schedule configured', pass: form.scheduleType === 'best-time' || !!form.scheduleDate || !!form.timingValue },
          { label: 'From address valid', pass: isValidEmail(form.senderEmail) },
        ]
        const allPass = checks.every(c => c.pass)
        return (
          <div style={{
            margin: hideStepper ? '0 24px 0' : '0 32px 0',
            padding: '12px 14px',
            borderRadius: 8,
            background: allPass ? '#f2fbf4' : '#fffbf0',
            border: `1px solid ${allPass ? '#b8e2c0' : '#f0d88a'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: allPass ? '#1f6e35' : '#7a5200', margin: 0 }}>
                {allPass ? '✓ Pre-flight checks passed — ready to launch' : 'Pre-flight checklist'}
              </p>
              {testSent ? (
                <span style={{ fontSize: 11, fontWeight: 600, color: '#29845a', display: 'flex', alignItems: 'center', gap: 4 }}>
                  ✓ Test sent to inbox
                </span>
              ) : (
                <button
                  onClick={sendTestCampaign}
                  disabled={testSending}
                  style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 5, border: '1px solid #2e4de5', background: testSending ? '#9fb0ef' : '#fff', color: '#2e4de5', cursor: testSending ? 'default' : 'pointer' }}
                >
                  {testSending ? 'Sending...' : '⚡ Test Campaign'}
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}>
              {checks.map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: c.pass ? '#29845a' : '#e29300', lineHeight: 1 }}>{c.pass ? '✓' : '!'}</span>
                  <span style={{ fontSize: 11, color: c.pass ? '#2a6e35' : '#7a5200' }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 32px', flexShrink: 0,
        background: hideStepper ? 'var(--unity-color-surface-layer-1, #fff)' : 'var(--unity-color-surface-subtle, #f8f8f8)',
        borderTop: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
      }}>
        <button
          onClick={hideStepper && step === 0 ? handleSave : handleReset}
          style={{
            fontSize: 14,
            color: hideStepper && step === 0 ? 'var(--unity-surface-fill-error-strong, #e51c00)' : 'var(--unity-text-subtle, #767676)',
            background: 'none',
            border: `1px solid ${hideStepper && step === 0 ? 'var(--unity-surface-fill-error-strong, #e51c00)' : 'var(--unity-surface-stroke-weak, #e7e7e7)'}`,
            cursor: 'pointer',
            padding: '6px 14px',
            borderRadius: 6,
          }}
        >
          {hideStepper && step === 0 ? 'Cancel' : 'Reset form'}
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" size="small" onClick={handleSave}>
            {hideStepper && step === 0 ? 'Save and Exit' : 'Save'}
          </Button>
          {step > 0 && (
            <Button variant="secondary" size="small" onClick={() => setStep(step - 1)}>
              Previous
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" size="small" disabled={!canAdvance} onClick={handleNextStep}>
              Next
            </Button>
          ) : (
            <Button variant="primary" size="small" onClick={openConfirmLaunch}>
              Launch Campaign
            </Button>
          )}
        </div>
      </div>
      </div>

      {/* Right: Campaign Summary or AI Assistant in embedded mode */}
      {hideStepper && (aiAssistantOpen ? <AIAssistantSidebar step={step} form={form} /> : <CampaignSummarySidebar form={form} step={step} />)}
    </div>
    <NextBestExperiencePopup
      open={nbeOpen}
      recommendation={nbeRecommendation}
      form={form}
      showWhy={nbeWhyOpen}
      onClose={() => setNbeOpen(false)}
      onApplyTemplate={applyTemplateRecommendation}
      onApplyAudience={applyAudienceRecommendation}
      onApplySchedule={applyScheduleRecommendation}
      onToggleWhy={() => setNbeWhyOpen(v => !v)}
      onApplyAllAndContinue={applyAllRecommendationsAndContinue}
      onContinue={continueAfterNbe}
    />

    {/* ── Confirmation modal ── */}
    {confirmLaunchOpen && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.38)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: 'min(440px,96vw)', borderRadius: 14, background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.22)', overflow: 'hidden' }}>
          <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fffbec', border: '1px solid #f0d88a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 22 }}>🚀</div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Launch this campaign?</p>
            <p style={{ fontSize: 13, color: '#5a5a5a', marginTop: 6, lineHeight: 1.55 }}>
              You're about to launch <strong>"{form.name || 'this campaign'}"</strong>. Once live, it will start sending immediately based on your configured schedule.
            </p>
          </div>
          <div style={{ padding: '14px 24px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { icon: '📧', label: 'Channel', val: form.channel || form.deliveryMode || '—' },
              { icon: '👥', label: 'Audience', val: [...SEGMENTS, ...form.savedSegments].find(s => s.id === form.segmentId)?.label || (form.customRules.length ? 'Custom rules' : '—') },
              { icon: '📅', label: 'Schedule', val: form.scheduleType === 'best-time' ? 'AI Best Time' : form.scheduleDate ? `${form.scheduleDate}${form.scheduleTime ? ' at ' + form.scheduleTime : ''}` : 'Event-driven (always on)' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13 }}>{r.icon}</span>
                <span style={{ fontSize: 12, color: '#767676', width: 64, flexShrink: 0 }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{String(r.val)}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '16px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setConfirmLaunchOpen(false)} style={{ height: 36, padding: '0 18px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#5a5a5a', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={confirmAndLaunch} style={{ height: 36, padding: '0 22px', borderRadius: 8, border: 'none', background: '#2e4de5', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              🚀 Yes, Launch
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Full-page success screen ── */}
    {launchSuccess && (
      <div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 950, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        {/* Animated ring + checkmark */}
        <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 28 }}>
          <svg width="96" height="96" viewBox="0 0 96 96" style={{ position: 'absolute', inset: 0 }}>
            <circle cx="48" cy="48" r="44" fill="none" stroke="#d8f0e2" strokeWidth="6" />
            <circle cx="48" cy="48" r="44" fill="none" stroke="#29845a" strokeWidth="6"
              strokeDasharray="276" strokeDashoffset="0"
              style={{ animation: 'successRing 0.7s cubic-bezier(0.4,0,0.2,1) forwards', transformOrigin: '48px 48px', transform: 'rotate(-90deg)' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>✓</div>
        </div>

        <p style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', margin: 0, textAlign: 'center' }}>Campaign Launched!</p>
        <p style={{ fontSize: 15, color: '#5a5a5a', marginTop: 10, textAlign: 'center', maxWidth: 380, lineHeight: 1.6 }}>
          <strong>"{form.name || 'Your campaign'}"</strong> is now live and will start sending based on your configured schedule.
        </p>

        {/* Stats pills */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'Type', val: form.type || '—' },
            { label: 'Channel', val: form.channel || form.deliveryMode || '—' },
            { label: 'Schedule', val: form.scheduleType === 'best-time' ? 'AI Best Time' : form.scheduleDate || 'Event-driven' },
          ].map(p => (
            <div key={p.label} style={{ padding: '6px 16px', borderRadius: 20, background: '#f4f6ff', border: '1px solid #d8dffa', display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#767676' }}>{p.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2e4de5' }}>{String(p.val)}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => { setLaunchSuccess(false); handleLaunch() }}
          style={{ marginTop: 36, height: 48, padding: '0 36px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2e4de5, #1a35c0)', fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 18px rgba(46,77,229,0.35)', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          Go to Dashboard →
        </button>
        <p style={{ fontSize: 12, color: '#aaa', marginTop: 14 }}>You'll see your campaign highlighted in the Active Campaigns table.</p>
      </div>
    )}
    </>
  )
}

// ─── Main (side-sheet version) ────────────────────────────────────────────────

interface CreateCampaignFlowProps {
  open: boolean
  onClose: () => void
  onLaunch?: (campaign: { name: string; type: string; channel: string }) => void
  onSave?: (campaign: { name: string; type: string; channel: string }) => void
}

export default function CreateCampaignFlow({ open, onClose, onLaunch, onSave }: CreateCampaignFlowProps) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM })

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(0)
      setForm({ ...EMPTY_FORM })
    }
  }, [open])

  function patch(partial: Partial<FormState>) {
    setForm(prev => ({ ...prev, ...partial }))
  }

  function handleLaunch() {
    onLaunch?.({ name: form.name, type: form.type, channel: form.channel })
    onClose()
  }

  function handleSave() {
    onSave?.({ name: form.name, type: form.type, channel: form.channel })
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.35)',
          animation: 'fadeIn 0.18s ease',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
          width: 'min(960px, 90vw)',
          display: 'flex', flexDirection: 'column',
          background: 'var(--unity-color-surface-subtle, #f6f6f6)',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.15)',
          animation: 'slideInRight 0.22s cubic-bezier(0.2, 0, 0, 1)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 24px', height: 60, flexShrink: 0,
          background: 'var(--unity-color-surface-layer-1, #fff)',
          borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            background: 'var(--unity-in-fill-strong, #2e4de5)',
          }}>
            <Send size={13} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--unity-text-strong, #1a1a1a)', lineHeight: 1 }}>
              New Campaign
            </p>
            <p style={{ fontSize: 14, color: 'var(--unity-text-subtle, #767676)', marginTop: 2 }}>
              Step {step + 1} of {STEPS.length}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 4, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--unity-text-subtle, #767676)',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--unity-color-surface-subtle, #f0f0f0)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Stepper */}
        <div style={{
          padding: '16px 24px 16px',
          background: 'var(--unity-color-surface-layer-1, #fff)',
          borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
          flexShrink: 0,
        }}>
          <WizardStepper
            steps={STEPS}
            activeStep={step}
            direction="horizontal"
            size="small"
            onStepClick={i => { if (i < step) setStep(i) }}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '32px 32px 24px' }}>
          {step === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32, alignItems: 'start' }}>
              <StepBasics form={form} set={patch} />
              <CampaignSummaryCard form={form} step={0} />
            </div>
          )}
          {step === 1 && <StepTemplate form={form} set={patch} />}
          {step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32, alignItems: 'start' }}>
              <StepAudience form={form} set={patch} />
              <CampaignSummaryCard form={form} step={2} />
            </div>
          )}
          {step === 3 && <StepSchedule form={form} set={patch} />}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px', flexShrink: 0,
          background: 'var(--unity-color-surface-layer-1, #fff)',
          borderTop: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.05)',
        }}>
          <button
            onClick={onClose}
            style={{
              fontSize: 14, color: 'var(--unity-text-subtle, #767676)', background: 'none',
              border: 'none', cursor: 'pointer', padding: '6px 0',
            }}
          >
            Discard & exit
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              variant="secondary"
              size="small"
              onClick={handleSave}
            >
              Save
            </Button>
            {step > 0 && (
              <Button
                variant="secondary"
                size="small"
                onClick={() => setStep(s => s - 1)}
              >
                Previous
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                variant="primary"
                size="small"
                disabled={!checkCanAdvance(step, form)}
                onClick={() => setStep(s => s + 1)}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                size="small"
                onClick={handleLaunch}
              >
                Launch
              </Button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  )
}
