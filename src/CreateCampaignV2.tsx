import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, Calendar, ChevronDown, ChevronRight, ClipboardList, Globe,
  MessageSquare, MousePointer, PenLine, Send, Sparkles, Pencil, Check,
} from 'lucide-react'
import { CreateCampaignFlowInline } from './CreateCampaignFlow'

type CampaignType = 'event-driven' | 'scheduled' | 'on-demand' | 'internal-survey' | 'external-survey'

type CampaignCard = {
  title: string
  description: string
  type: CampaignType
  icon: React.ElementType
  iconBg: string
  iconColor: string
}

interface CreateCampaignV2Props {
  onLaunch?: (campaign: { name: string; type: string; channel: string }) => void
  aiAssistantOpen?: boolean
  aiAutoStartCampaign?: { type: CampaignType; token: number } | null
}

const CAMPAIGN_GROUPS: Array<{ title: string; cards: CampaignCard[] }> = [
  {
    title: 'Campaigns',
    cards: [
      {
        title: 'Regular Email',
        description: 'Create an regular email campaign to your target audience',
        type: 'scheduled',
        icon: Send,
        iconBg: '#E8F2FF',
        iconColor: '#2E4DE5',
      },
      {
        title: 'Event Driven',
        description: 'Send Automatically when an guest reaches a trigger',
        type: 'event-driven',
        icon: Sparkles,
        iconBg: '#EAF7EE',
        iconColor: '#1C9A5F',
      },
      {
        title: 'Scheduled',
        description: 'Send to an audience at specific date and time',
        type: 'scheduled',
        icon: Calendar,
        iconBg: '#EEEAFE',
        iconColor: '#5E45E2',
      },
      {
        title: 'On Demand',
        description: 'Send immediately to the guest list whenever you are ready',
        type: 'on-demand',
        icon: MousePointer,
        iconBg: '#FCEFE8',
        iconColor: '#C46A3A',
      },
    ],
  },
  {
    title: 'Survey Campaigns',
    cards: [
      {
        title: 'External Survey',
        description: 'Send an survey to guest on post-stay or In-stay to collect feedback',
        type: 'external-survey',
        icon: Globe,
        iconBg: '#FFECEE',
        iconColor: '#D8435A',
      },
      {
        title: 'Internal Survey',
        description: 'Send a survey to staff of internal team to collect feedback',
        type: 'internal-survey',
        icon: ClipboardList,
        iconBg: '#F8F3E7',
        iconColor: '#B68A23',
      },
      {
        title: 'Pop-up Form',
        description: 'Expand your email and SMS list with customizable popups.',
        type: 'external-survey',
        icon: MessageSquare,
        iconBg: '#FCEBFA',
        iconColor: '#C13EA8',
      },
      {
        title: 'Embedded Form',
        description: 'Create a customizable form to collect customer info on any website.',
        type: 'external-survey',
        icon: PenLine,
        iconBg: '#EAF7EE',
        iconColor: '#1C9A5F',
      },
    ],
  },
  {
    title: 'Landing Page',
    cards: [
      {
        title: 'From Scratch',
        description: 'Build your own web page to attract customers, and increase conversion.',
        type: 'on-demand',
        icon: PenLine,
        iconBg: '#F3FAE9',
        iconColor: '#7DA619',
      },
      {
        title: 'Landing Page Templates',
        description: 'Pick an template and modify to run your campaign',
        type: 'scheduled',
        icon: ClipboardList,
        iconBg: '#EAF0FF',
        iconColor: '#4968E5',
      },
      {
        title: 'Sign Up Page',
        description: 'Build your own web page to attract customers, and increase conversion.',
        type: 'scheduled',
        icon: PenLine,
        iconBg: '#FDF2E9',
        iconColor: '#B06A2A',
      },
    ],
  },
]

function StepLegend({ activeStep }: { activeStep: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {['Basics', 'Template', 'Audience', 'Schedule'].map((label, i) => {
        const done = i < activeStep
        const active = i === activeStep
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            {/* connector line before step (not first) */}
            {i > 0 && (
              <div style={{ width: 20, height: 1.5, background: done || active ? '#2e4de5' : '#d8d8d8', marginTop: 0 }} />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px' }}>
              <span style={{
                width: 20, height: 20, borderRadius: 10,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, flexShrink: 0,
                background: done ? '#2e7d1e' : active ? '#2e4de5' : '#f0f0f0',
                color: done || active ? '#fff' : '#9a9a9a',
              }}>
                {done ? '✓' : i + 1}
              </span>
              <span style={{
                fontSize: 14, fontWeight: active ? 700 : 500,
                color: done ? '#2e7d1e' : active ? '#2e4de5' : '#9a9a9a',
              }}>
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function CreateCampaignV2({ onLaunch, aiAssistantOpen = false, aiAutoStartCampaign = null }: CreateCampaignV2Props) {
  const [stage, setStage] = useState<'select' | 'wizard'>('select')
  const [wizardStep, setWizardStep] = useState(0)
  const [selectedType, setSelectedType] = useState<CampaignType>('event-driven')
  const [selectedTitle, setSelectedTitle] = useState('Event Driven')
  const [campaignName, setCampaignName] = useState('Untitled')
  const [isEditingName, setIsEditingName] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Campaigns: true,
    'Survey Campaigns': true,
    'Landing Page': true,
  })
  const lastAiAutoToken = useRef<number | null>(null)

  const breadcrumb = useMemo(() => {
    if (stage === 'select') return 'Operations / Campaigns / Create campaign'
    return `Operations / Campaigns / ${campaignName || 'Untitled'}`
  }, [stage, campaignName])

  function startFlow(card: CampaignCard) {
    setSelectedType(card.type)
    setSelectedTitle(card.title)
    setCampaignName('Untitled')
    setIsEditingName(false)
    setWizardStep(0)
    setStage('wizard')
  }

  function toggleGroup(group: string) {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))
  }

  function toSentenceCase(value: string) {
    if (!value) return value
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
  }

  useEffect(() => {
    if (!aiAutoStartCampaign) return
    if (lastAiAutoToken.current === aiAutoStartCampaign.token) return
    const card = CAMPAIGN_GROUPS.flatMap(group => group.cards).find(c => c.type === aiAutoStartCampaign.type)
    if (!card) return
    lastAiAutoToken.current = aiAutoStartCampaign.token
    startFlow(card)
  }, [aiAutoStartCampaign])

  return (
    <div style={{
      height: 'calc(100vh - 56px)',
      background: 'var(--unity-color-surface-subtle, #f6f6f6)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        background: 'var(--unity-color-surface-layer-1, #fff)',
        borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
        padding: '8px 12px',
      }}>
        <p style={{ fontSize: 14, color: 'var(--unity-text-subtle, #767676)' }}>{breadcrumb}</p>
        <div style={{
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {stage === 'wizard' && (
              <button
                onClick={() => setStage('select')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: 'var(--unity-in-fill-strong, #2e4de5)',
                }}
              >
                <ArrowLeft size={14} />
              </button>
            )}
            {stage === 'select' ? (
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--unity-text-strong, #1a1a1a)' }}>
                Select campaign type
              </h1>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                {isEditingName ? (
                  <>
                    <input
                      value={campaignName}
                      onChange={e => setCampaignName(e.target.value)}
                      autoFocus
                      onBlur={() => setIsEditingName(false)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') setIsEditingName(false)
                      }}
                      style={{
                        height: 30,
                        minWidth: 220,
                        maxWidth: 360,
                        borderRadius: 6,
                        border: '1px solid #d8d8d8',
                        padding: '0 10px',
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--unity-text-strong, #1a1a1a)',
                        outline: 'none',
                        background: '#fff',
                      }}
                    />
                    <button
                      onClick={() => setIsEditingName(false)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        border: '1px solid #d8d8d8',
                        background: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#2e4de5',
                      }}
                    >
                      <Check size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <h1 style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: 'var(--unity-text-strong, #1a1a1a)',
                      margin: 0,
                      maxWidth: 360,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {campaignName || 'Untitled'}
                    </h1>
                    <button
                      onClick={() => setIsEditingName(true)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        border: '1px solid #e0e0e0',
                        background: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#767676',
                      }}
                      title="Edit campaign title"
                    >
                      <Pencil size={12} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {stage === 'wizard' && <StepLegend activeStep={wizardStep} />}
        </div>
      </div>

      {/* ── Page body: flex row, left content + right fixed sidebar ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: scrollable (select) or fixed-height grid (wizard) */}
        <div style={stage === 'select'
          ? { flex: 1, overflowY: 'auto', padding: '20px 28px' }
          : { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }
        }>
          {stage === 'select' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
              {CAMPAIGN_GROUPS.map(group => (
                <section key={group.title}>
                  <button
                    onClick={() => toggleGroup(group.title)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: 'none',
                      background: 'transparent',
                      padding: '4px 0',
                      marginBottom: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#3f3f3f', margin: 0 }}>
                      {toSentenceCase(group.title)}
                    </p>
                    {expandedGroups[group.title]
                      ? <ChevronDown size={14} color="#aaa" />
                      : <ChevronRight size={14} color="#aaa" />}
                  </button>

                  {expandedGroups[group.title] && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, alignItems: 'stretch' }}>
                      {group.cards.map(card => (
                        <button
                          key={card.title}
                          onClick={() => startFlow(card)}
                          style={{
                            borderRadius: 12,
                            border: '1px solid #e8e8e8',
                            background: '#fff',
                            padding: '12px 12px 10px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'border-color 0.12s, box-shadow 0.12s, transform 0.12s',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            gap: 6,
                            minHeight: 152,
                            height: '100%',
                          }}
                          onMouseEnter={e => {
                            const el = e.currentTarget as HTMLButtonElement
                            el.style.borderColor = '#2e4de5'
                            el.style.boxShadow = '0 8px 20px rgba(46,77,229,0.10)'
                            el.style.transform = 'translateY(-1px)'
                          }}
                          onMouseLeave={e => {
                            const el = e.currentTarget as HTMLButtonElement
                            el.style.borderColor = '#e8e8e8'
                            el.style.boxShadow = 'none'
                            el.style.transform = 'translateY(0)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: 10,
                              background: card.iconBg,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <card.icon size={16} color={card.iconColor} />
                            </div>
                            <ChevronRight size={14} color="#bdbdbd" />
                          </div>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.3 }}>
                            {toSentenceCase(card.title)}
                          </p>
                          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, color: '#767676' }}>
                            {toSentenceCase(card.description)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              ))}

              <div style={{ paddingTop: 6, borderTop: '1px solid #f0f0f0' }}>
                <p style={{ fontSize: 14, color: '#8a8a8a', fontStyle: 'italic' }}>More campaign types coming soon - ad campaigns and automations</p>
              </div>
            </div>
          ) : (
            <CreateCampaignFlowInline
              key={selectedType}
              onLaunch={onLaunch}
              initialType={selectedType}
              initialStep={0}
              currentStep={wizardStep}
              onStepChange={setWizardStep}
              aiAssistantOpen={aiAssistantOpen}
              hideStepper
            />
          )}
        </div>

      </div>
    </div>
  )
}
