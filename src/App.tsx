import { useState, useRef, useEffect } from 'react'
import { Avatar, ThemeProvider } from 'agilysys-unity-widget-react'
import Sidebar from './Sidebar'
import ADMHomeDashboard from './ADMHomeDashboard'
import ADMHomeDashboardV2 from './ADMHomeDashboardV2'
import AllCampaignsPage from './AllCampaignsPage'
import CampaignManagementPage from './CampaignManagementPage'
import CreateCampaignFlow from './CreateCampaignFlow'
import CreateCampaignV2 from './CreateCampaignV2'
import { CheckCircle, X, Bell, ChevronDown, Mic, SendHorizontal } from 'lucide-react'

interface LaunchedCampaign {
  id: number
  name: string
  type: string
  channel: string
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

type CampaignType = 'event-driven' | 'scheduled' | 'on-demand' | 'internal-survey' | 'external-survey'

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  'all-campaigns': 'All Campaigns',
  'create-campaign': 'Create Campaign',
}

const AI_ASSISTANT_ICON = 'http://localhost:3845/assets/75a7a32664fd6bf1de9f5c22f79166e5188802ed.svg'

export default function App() {
  const [selectedId, setSelectedId] = useState('dashboard')
  const [expandedIds, setExpandedIds] = useState<string[]>(['campaigns'])
  const [createOpen, setCreateOpen] = useState(false)
  const createRef = useRef<HTMLDivElement>(null)
  const [campaignFlowOpen, setCampaignFlowOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [launchedCampaigns, setLaunchedCampaigns] = useState<LaunchedCampaign[]>([])
  const [justLaunchedId, setJustLaunchedId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ visible: boolean; campaign: LaunchedCampaign | null }>({ visible: false, campaign: null })
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const [version, setVersion] = useState<'v1' | 'v2'>('v2')
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiPromptInput, setAiPromptInput] = useState('')
  const [aiListening, setAiListening] = useState(false)
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ role: 'assistant' | 'user'; text: string }>>([])
  const [aiAutoStartCampaign, setAiAutoStartCampaign] = useState<{ type: CampaignType; token: number } | null>(null)
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null)

  // Auto-dismiss toast after 5s
  useEffect(() => {
    if (!toast.visible) return
    const t = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000)
    return () => clearTimeout(t)
  }, [toast.visible])

  function handleLaunch(campaign: { name: string; type: string; channel: string }) {
    const c: LaunchedCampaign = { id: Date.now(), ...campaign }
    setLaunchedCampaigns(prev => [c, ...prev])
    setJustLaunchedId(c.id)
    setToast({ visible: true, campaign: c })
    // Navigate to dashboard so the user sees the newly launched row
    setSelectedId('dashboard')
    // Clear highlight after 4s
    setTimeout(() => setJustLaunchedId(null), 4000)
  }

  useEffect(() => {
    if (!createOpen) return
    function handleClick(e: MouseEvent) {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [createOpen])

  useEffect(() => {
    if (!notifOpen) return
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [notifOpen])

  function handleSelect(id: string) {
    setSelectedId(id)
  }

  function handleToggle(id: string) {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  useEffect(() => {
    if (version !== 'v2') return
    setSidebarCollapsed(selectedId === 'create-campaign')
  }, [selectedId, version])

  const showGlobalAiPanel = aiPanelOpen && !(selectedId === 'create-campaign' && version === 'v2')
  const inCampaignTypeSelection = selectedId === 'create-campaign' && version === 'v2'

  const dashboardActions = [
    { id: 'dash-summary', label: 'Summarize active campaigns and open rates' },
    { id: 'dash-top', label: 'Show top performing campaign this month' },
    { id: 'dash-anomaly', label: 'Identify anomalies in send performance' },
  ]

  const campaignTypeActions = [
    { id: 'camp-reengage', label: 'Recommend best campaign type for re-engagement', type: 'on-demand' as CampaignType },
    { id: 'camp-trigger', label: 'Suggest event driven trigger for check-in journey', type: 'event-driven' as CampaignType },
    { id: 'camp-convert', label: 'Pick channel mix for highest conversion', type: 'scheduled' as CampaignType },
  ]

  function sendAiPrompt(text?: string) {
    const prompt = (text ?? aiPromptInput).trim()
    if (!prompt) return
    setAiChatMessages(prev => [
      ...prev,
      { role: 'user', text: prompt },
      { role: 'assistant', text: 'Got it. I am preparing suggestions based on current page context.' },
    ])
    setAiPromptInput('')
    setAiListening(false)
  }

  function runDashboardAction(actionId: string, label: string) {
    setSelectedId('dashboard')

    if (!dashboardMetrics) {
      setAiChatMessages(prev => [
        ...prev,
        { role: 'user', text: label },
        { role: 'assistant', text: 'Dashboard metrics are loading. Please try this action again in a moment.' },
      ])
      return
    }

    const avgOpenText = dashboardMetrics.averageOpenRate !== null
      ? `${dashboardMetrics.averageOpenRate}%`
      : 'N/A'

    const assistantText =
      actionId === 'dash-summary'
        ? `Currently showing ${dashboardMetrics.activeCampaigns} active campaigns out of ${dashboardMetrics.totalVisibleCampaigns}, with ${dashboardMetrics.emailsSent.toLocaleString()} emails sent and an average open rate of ${avgOpenText}.`
        : actionId === 'dash-top'
          ? (dashboardMetrics.topCampaign
              ? `${dashboardMetrics.topCampaign.name} is the top performer at ${dashboardMetrics.topCampaign.open}% open rate (${dashboardMetrics.topCampaign.sent.toLocaleString()} sent).`
              : 'No campaign with measurable open-rate data is available yet.')
          : (dashboardMetrics.anomalies.length > 0
              ? `Detected ${dashboardMetrics.anomalies.length} campaign${dashboardMetrics.anomalies.length > 1 ? 's' : ''} needing attention: ${dashboardMetrics.anomalies.slice(0, 3).join(', ')}${dashboardMetrics.anomalies.length > 3 ? '...' : ''}.`
              : 'No major anomalies detected from visible campaign table data.')

    setAiChatMessages(prev => [
      ...prev,
      { role: 'user', text: label },
      { role: 'assistant', text: assistantText },
    ])
  }

  function runCampaignAction(label: string, type: CampaignType) {
    setSelectedId('create-campaign')
    setAiAutoStartCampaign({ type, token: Date.now() })
    setAiChatMessages(prev => [
      ...prev,
      { role: 'user', text: label },
      { role: 'assistant', text: `Opening Create Campaign and preparing a ${type.replace('-', ' ')} flow for you.` },
    ])
  }

  return (
    <ThemeProvider defaultMode="light">
      <div
        style={{
          height: '100vh', display: 'flex', flexDirection: 'column',
          fontFamily: 'var(--unity-font-family-base, Inter, system-ui, sans-serif)',
          background: 'var(--unity-color-surface-subtle, #f6f6f6)',
        }}
      >
        <Sidebar
          selectedId={selectedId}
          expandedIds={expandedIds}
          onSelect={handleSelect}
          onToggle={handleToggle}
          collapsed={sidebarCollapsed}
          version={version}
          onVersionChange={setVersion}
        />

        {/* Global Header — Figma 967:20722 — full viewport width */}
        <div
          style={{
            height: 56, display: 'flex', alignItems: 'center',
            padding: '0 16px', gap: 10,
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            background: '#ffffff',
            borderBottom: '1px solid #e8e8e8',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
            {/* Hamburger — sidebar toggle */}
            <button
              onClick={() => setSidebarCollapsed(v => !v)}
              title={sidebarCollapsed ? 'Open navigation' : 'Close navigation'}
              style={{
                display: 'flex', flexDirection: 'column', gap: 4,
                width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
                border: 'none', background: 'transparent', cursor: 'pointer',
                borderRadius: 4, padding: 0, flexShrink: 0,
              }}
            >
              <span style={{ width: 14, height: 1.5, background: '#555', borderRadius: 1, display: 'block' }} />
              <span style={{ width: 14, height: 1.5, background: '#555', borderRadius: 1, display: 'block' }} />
              <span style={{ width: 14, height: 1.5, background: '#555', borderRadius: 1, display: 'block' }} />
            </button>

            {/* Agilysys logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              <svg width="22" height="19" viewBox="0 0 33 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M26.3006 11.6585C27.4558 11.6585 28.585 11.3166 29.5456 10.6761C30.5061 10.0356 31.2547 9.12516 31.6968 8.06001C32.1389 6.99485 32.2545 5.82278 32.0292 4.69202C31.8038 3.56126 31.2475 2.52258 30.4307 1.70735C29.6138 0.892115 28.5731 0.336933 27.4401 0.11201C26.307 -0.112913 25.1326 0.0025257 24.0654 0.443728C22.9981 0.884929 22.0859 1.63208 21.4441 2.59069C20.8023 3.54931 20.4597 4.67633 20.4597 5.82925C20.4597 7.37526 21.0751 8.85795 22.1705 9.95115C23.2658 11.0443 24.7515 11.6585 26.3006 11.6585Z" fill="#0299D6"/>
                <path d="M18.2159 8.39577C19.0376 9.5575 19.4494 10.9587 19.3867 12.3793V20.8235H16.8144V19.0708C16.2246 19.725 15.5016 20.2459 14.6938 20.5987C13.886 20.9515 13.012 21.1281 12.1302 21.1165C11.6045 21.1512 11.0773 21.0754 10.5828 20.8939C10.0882 20.7124 9.63738 20.4294 9.25933 20.0631C8.88128 19.6969 8.58447 19.2555 8.38809 18.7675C8.19171 18.2795 8.10013 17.7559 8.11927 17.2304C8.11927 14.6632 10.0813 13.3734 13.1254 13.1689C14.3841 13.0804 15.6135 13.0521 16.7559 13.0521V12.4386C16.7559 10.0724 15.79 8.6401 13.474 8.6401C12.1692 8.64676 10.8881 8.98948 9.75488 9.6351L9.1402 7.70618C10.5951 6.85972 12.2612 6.44342 13.9441 6.5058C14.3907 6.50413 14.8363 6.54623 15.2746 6.63151C12.681 5.58509 9.78736 5.55365 7.17156 6.54346C4.55575 7.53328 2.41036 9.47148 1.16387 11.971C-0.0826215 14.4705 -0.338453 17.3473 0.447469 20.0268C1.23339 22.7063 3.00322 24.9913 5.40346 26.4254C7.80371 27.8595 10.6577 28.3372 13.3954 27.763C16.1331 27.1888 18.553 25.6051 20.1718 23.328C21.7906 21.051 22.4891 18.2483 22.1279 15.4797C21.7666 12.7111 20.3721 10.1804 18.223 8.39312" fill="#7EB941"/>
                <path d="M11.2216 16.7071C11.2216 18.0048 12.0305 18.6395 13.4178 18.6395C14.1427 18.6201 14.8558 18.4512 15.5122 18.1434C16.1685 17.8357 16.754 17.3958 17.2318 16.8513V14.2842C16.0788 14.3417 15.0933 14.4285 14.1105 14.5436C12.4926 14.7206 11.2207 15.2066 11.2207 16.7071" fill="#7EB941"/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.01em' }}>agilysys</span>
            </div>

            {/* Vertical divider */}
            <div style={{ width: 1, height: 18, background: '#e0e0e0', flexShrink: 0 }} />

            {/* Property selector */}
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 30, padding: '0 10px', borderRadius: 6,
              border: '1px solid #e0e0e0', background: '#fff',
              fontSize: 12, fontWeight: 500, color: '#1a1a1a', cursor: 'pointer',
              flexShrink: 0,
            }}>
              Alpine Resort
              <ChevronDown size={11} color="#767676" />
            </button>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Right controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {/* AI Assistant */}
              <button
                onClick={() => setAiPanelOpen(o => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  height: 30,
                  padding: '0 12px',
                  borderRadius: 4,
                  border: '1px solid #64a91f',
                  background: 'linear-gradient(180deg, #fafdff 0%, #edfae4 100%)',
                  color: '#1a1a1a',
                  fontSize: 14,
                  fontWeight: 400,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <img
                  src={AI_ASSISTANT_ICON}
                  alt=""
                  style={{ width: 16, height: 16, display: 'block' }}
                />
                AI Assistant
              </button>

              {/* Notifications */}
              <div ref={notifRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  onClick={() => setNotifOpen(o => !o)}
                  style={{
                    position: 'relative',
                    width: 32, height: 32, borderRadius: 6,
                    border: '1px solid #e0e0e0',
                    background: notifOpen ? '#f4f4f4' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#767676',
                  }}
                >
                  <Bell size={14} />
                  <span style={{
                    position: 'absolute', top: 5, right: 5,
                    minWidth: 14, height: 14, borderRadius: 7,
                    background: '#e8e8e8', color: '#767676',
                    fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 2px',
                  }}>0</span>
                </button>

                {notifOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: 300, borderRadius: 10,
                    background: 'var(--unity-color-surface-layer-1, #fff)',
                    border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    zIndex: 200, overflow: 'hidden',
                  }}>
                    {/* Header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px 10px',
                      borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Bell size={13} color="var(--unity-text-strong, #1a1a1a)" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--unity-text-strong, #1a1a1a)' }}>Notifications</span>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
                        background: 'var(--unity-color-surface-subtle, #f0f0f0)',
                        color: 'var(--unity-text-subtle, #767676)',
                      }}>0 new</span>
                    </div>

                    {/* Empty state */}
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '32px 20px', gap: 10,
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'var(--unity-color-surface-subtle, #f4f4f4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Bell size={20} color="var(--unity-text-placeholder, #bbb)" />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--unity-text-strong, #1a1a1a)', marginBottom: 4 }}>You're all caught up</p>
                        <p style={{ fontSize: 11, color: 'var(--unity-text-subtle, #767676)', lineHeight: 1.5 }}>No new notifications right now.<br />Check back later.</p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                      padding: '8px 14px',
                      borderTop: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
                      textAlign: 'center',
                    }}>
                      <button style={{
                        fontSize: 11, color: 'var(--unity-in-fill-strong, #2e4de5)',
                        background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                      }}>View all activity</button>
                    </div>
                  </div>
                )}
              </div>

              {/* User profile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 4, cursor: 'pointer' }}>
                <Avatar initials="MS" size="small" />
                <div style={{ lineHeight: 1.15 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>Michael Smith</p>
                  <p style={{ fontSize: 10, color: '#767676' }}>Administrator</p>
                </div>
                <ChevronDown size={11} color="#767676" />
              </div>
            </div>
          </div>

        {/* Content area — offset below fixed header and beside fixed sidebar */}
        <div style={{
          marginTop: 56,
          marginLeft: sidebarCollapsed ? 56 : 240,
          marginRight: showGlobalAiPanel ? 320 : 0,
          transition: 'margin-left 0.2s cubic-bezier(0.4,0,0.2,1)',
          flex: 1,
          height: 'calc(100vh - 56px)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          {/* Page content */}
          {selectedId === 'create-campaign' && version === 'v2' ? (
            <CreateCampaignV2
              onLaunch={handleLaunch}
              aiAssistantOpen={aiPanelOpen}
              aiAutoStartCampaign={aiAutoStartCampaign}
            />
          ) : selectedId === 'campaign-reports' ? (
            <CampaignManagementPage />
          ) : selectedId === 'all-campaigns' ? (
            <AllCampaignsPage />
          ) : selectedId === 'dashboard' && version === 'v2' ? (
            <ADMHomeDashboardV2
              onNewCampaign={() => setSelectedId('create-campaign')}
              onMetricsChange={setDashboardMetrics}
            />
          ) : (
            <ADMHomeDashboard
              onNewCampaign={() => version === 'v2' ? setSelectedId('create-campaign') : setCampaignFlowOpen(true)}
              launchedCampaigns={launchedCampaigns}
              onMetricsChange={setDashboardMetrics}
              justLaunchedId={justLaunchedId}
            />
          )}
        </div>

        {showGlobalAiPanel && (
          <aside
            style={{
              position: 'fixed',
              top: 56,
              right: 0,
              bottom: 0,
              width: 320,
              background: '#ffffff',
              borderLeft: '1px solid #e7e7e7',
              zIndex: 120,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid #efefef', display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={AI_ASSISTANT_ICON} alt="" style={{ width: 18, height: 18, display: 'block' }} />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>AI Assistant</p>
                <p style={{ fontSize: 12, color: '#6f6f6f' }}>Enabled for this workspace</p>
              </div>
            </div>

            <div style={{
              padding: 12,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              flex: 1,
              minHeight: 0,
            }}>
              <div style={{ border: '1px solid #d8eecf', background: '#f4fbef', borderRadius: 8, padding: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#2a6e1b', marginBottom: 4 }}>Quick insights</p>
                <p style={{ fontSize: 12, lineHeight: 1.45, color: '#3f5f39' }}>
                  AI assistance is active. Ask for campaign recommendations, audience suggestions, and send-time guidance.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#1f2b57' }}>Dashboard actions</p>
                {dashboardActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => runDashboardAction(action.id, action.label)}
                    style={{
                      textAlign: 'left',
                      border: '1px solid #e3e8f8',
                      background: '#f8faff',
                      color: '#2e4de5',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1f2b57' }}>Campaign type selection actions</p>
                  <span style={{ fontSize: 11, color: inCampaignTypeSelection ? '#2e7d1e' : '#888' }}>
                    {inCampaignTypeSelection ? 'Context active' : 'Available when Create Campaign is open'}
                  </span>
                </div>
                {campaignTypeActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => runCampaignAction(action.label, action.type)}
                    style={{
                      textAlign: 'left',
                      border: '1px solid #e4efe1',
                      background: '#f8fcf5',
                      color: '#2a6e1b',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              {aiChatMessages.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 2 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1f2b57' }}>Chat</p>
                  {aiChatMessages.slice(-6).map((m, idx) => (
                    <div
                      key={`${m.role}-${idx}`}
                      style={{
                        width: '100%',
                        borderRadius: 8,
                        padding: '7px 9px',
                        fontSize: 12,
                        lineHeight: 1.4,
                        border: m.role === 'user' ? '1px solid #d6e0ff' : '1px solid #deecda',
                        background: m.role === 'user' ? '#eef3ff' : '#f3faf0',
                        color: '#2a2a2a',
                        textAlign: 'left',
                      }}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              borderTop: '1px solid #efefef',
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              background: '#fff',
              marginTop: 'auto',
              flexShrink: 0,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                border: '1px solid #dde3f2',
                background: '#fff',
                borderRadius: 8,
                padding: '6px 6px 6px 10px',
              }}>
                <input
                  value={aiPromptInput}
                  onChange={e => setAiPromptInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      sendAiPrompt()
                    }
                  }}
                  placeholder={aiListening ? 'Listening... speak now' : 'Ask AI...'}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: 12,
                    color: '#1a1a1a',
                    background: 'transparent',
                  }}
                />
                <button
                  onClick={() => setAiListening(v => !v)}
                  title={aiListening ? 'Stop audio input' : 'Start audio input'}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: `1px solid ${aiListening ? '#5ea733' : '#d8dce8'}`,
                    background: aiListening ? '#eff8e8' : '#f7f8fc',
                    color: aiListening ? '#2e7d1e' : '#6a6f84',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Mic size={14} />
                </button>
                <button
                  onClick={() => sendAiPrompt()}
                  title="Send"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: '1px solid #2e4de5',
                    background: '#2e4de5',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <SendHorizontal size={13} />
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#7a7a7a' }}>
                Use the mic for audio prompts or type your request.
              </p>
            </div>
          </aside>
        )}
      </div>
      <CreateCampaignFlow open={campaignFlowOpen} onClose={() => setCampaignFlowOpen(false)} onLaunch={handleLaunch} />

      {/* Launch toast */}
      {toast.visible && toast.campaign && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 300,
          width: 340,
          background: 'var(--unity-color-surface-layer-1, #fff)',
          borderRadius: 8,
          border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
          borderLeft: '4px solid var(--unity-surface-stroke-success-strong, #29845a)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          overflow: 'hidden',
          animation: 'toastSlideUp 0.22s cubic-bezier(0.2,0,0,1)',
        }}>
          <div style={{ padding: '14px 14px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <CheckCircle size={16} style={{ color: 'var(--unity-surface-stroke-success-strong, #29845a)', flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--unity-text-strong, #1a1a1a)', marginBottom: 3 }}>
                Campaign launched!
              </p>
              <p style={{ fontSize: 12, color: 'var(--unity-text-subtle, #767676)', lineHeight: 1.45 }}>
                &ldquo;{toast.campaign.name}&rdquo; is now live and sending.
              </p>
              <button
                onClick={() => setToast(prev => ({ ...prev, visible: false }))}
                style={{
                  marginTop: 8, fontSize: 12, fontWeight: 600,
                  color: 'var(--unity-in-fill-strong, #2e4de5)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                View Campaign &rarr;
              </button>
            </div>
            <button
              onClick={() => setToast(prev => ({ ...prev, visible: false }))}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: 'var(--unity-text-placeholder, #aaa)',
              }}
            >
              <X size={13} />
            </button>
          </div>
          {/* Auto-dismiss progress bar */}
          <div style={{ height: 3, background: 'var(--unity-surface-fill-success-weak, #e6f4ed)' }}>
            <div style={{
              height: '100%',
              background: 'var(--unity-surface-stroke-success-strong, #29845a)',
              transformOrigin: 'left',
              animation: 'toastProgress 5s linear forwards',
            }} />
          </div>
        </div>
      )}
    </ThemeProvider>
  )
}
