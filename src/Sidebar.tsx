import {
  LayoutDashboard, Send, FileText, Users, BarChart2,
  Settings, ClipboardList, HelpCircle, ChevronDown, ChevronRight, Search,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface NavChild {
  id: string
  label: string
}

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  children?: NavChild[]
}

const MAIN_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'campaigns', label: 'Campaigns', icon: Send,
    children: [
      { id: 'all-campaigns',   label: 'All Campaigns' },
      { id: 'audience-rules',  label: 'Audience Rules' },
    ],
  },
  {
    id: 'templates', label: 'Templates', icon: FileText,
    children: [
      { id: 'email-sms',       label: 'Email & SMS' },
      { id: 'starter-library', label: 'Starter Library' },
      { id: 'print-attach',    label: 'Attachments & Print' },
    ],
  },
  {
    id: 'guests', label: 'Guests', icon: Users,
    children: [
      { id: 'all-guests',  label: 'All Guests' },
      { id: 'segments',    label: 'Segments' },
      { id: 'subscribers', label: 'Lists & Subscribers' },
    ],
  },
  {
    id: 'analytics', label: 'Analytics and Reports', icon: BarChart2,
    children: [
      { id: 'campaign-reports', label: 'Campaign Management' },
      { id: 'opens-clicks',     label: 'Opens & Clicks' },
      { id: 'event-reports',    label: 'Event Reports' },
    ],
  },
  {
    id: 'automations', label: 'Automations', icon: ClipboardList,
    children: [
      { id: 'survey-builder',   label: 'Builder' },
      { id: 'survey-responses', label: 'Responses' },
    ],
  },
]

const BOTTOM_ITEMS: NavItem[] = [
  {
    id: 'settings', label: 'Settings', icon: Settings,
    children: [
      { id: 'sender-defaults',  label: 'Sender Defaults' },
      { id: 'property-consent', label: 'Property & Consent' },
      { id: 'developer-config', label: 'Developer Config' },
    ],
  },
  {
    id: 'help', label: 'Help & Onboarding', icon: HelpCircle,
    children: [
      { id: 'getting-started', label: 'Getting Started' },
      { id: 'setup-checklist', label: 'Setup Checklist' },
    ],
  },
]

interface SidebarProps {
  selectedId: string
  expandedIds: string[]
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  collapsed: boolean
  version: 'v1' | 'v2'
  onVersionChange: (v: 'v1' | 'v2') => void
}

function NavRow({
  item,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
  collapsed,
}: {
  item: NavItem
  selectedId: string
  expandedIds: string[]
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  collapsed: boolean
}) {
  const isExpanded = expandedIds.includes(item.id)
  const hasChildren = Boolean(item.children?.length)
  const isParentActive = selectedId === item.id
  const isChildActive = item.children?.some(c => c.id === selectedId) ?? false
  const isActive = isParentActive || (!isExpanded && isChildActive)
  const [flyoutOpen, setFlyoutOpen] = useState(false)

  const Icon = item.icon

  useEffect(() => {
    if (!collapsed && flyoutOpen) {
      setFlyoutOpen(false)
    }
  }, [collapsed, flyoutOpen])

  function handlePrimaryAction() {
    if (!hasChildren) {
      onSelect(item.id)
      return
    }

    if (collapsed) {
      setFlyoutOpen(current => !current)
      return
    }

    onToggle(item.id)
  }

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => {
        if (collapsed && hasChildren) setFlyoutOpen(true)
      }}
      onMouseLeave={() => {
        if (collapsed && hasChildren) setFlyoutOpen(false)
      }}
    >
      <button
        onClick={handlePrimaryAction}
        title={collapsed ? item.label : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          gap: 8,
          padding: collapsed ? '8px 0' : '7px 10px',
          justifyContent: collapsed ? 'center' : undefined,
          borderRadius: 4,
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          background: isActive ? 'var(--unity-in-fill-subtle, #eef1fd)' : 'transparent',
          color: isActive ? 'var(--unity-in-fill-strong, #2e4de5)' : 'var(--unity-text-subtle, #555)',
          fontWeight: isActive ? 600 : 400,
          fontSize: 13,
          transition: 'background 0.12s, color 0.12s',
          overflow: 'hidden',
        }}
        onMouseEnter={e => {
          if (!isActive) {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = 'var(--unity-color-surface-subtle, #f6f6f6)'
            el.style.color = 'var(--unity-text-strong, #1a1a1a)'
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = 'transparent'
            el.style.color = 'var(--unity-text-subtle, #555)'
          }
        }}
      >
        {!collapsed && (
          <span style={{
            width: 3, height: 16, borderRadius: 2, flexShrink: 0,
            background: isActive ? 'var(--unity-in-fill-strong, #2e4de5)' : 'transparent',
            transition: 'background 0.12s',
          }} />
        )}
        <Icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
        {!collapsed && (
          <>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
              {item.label}
              {item.id === 'automations' && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1c9a5f' }}>NEW</span>
              )}
            </span>
            {hasChildren && (
              <ChevronDown size={13} style={{
                flexShrink: 0, opacity: 0.45,
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.15s',
              }} />
            )}
          </>
        )}
      </button>

      {hasChildren && collapsed && flyoutOpen && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 'calc(100% + 10px)',
            width: 228,
            padding: 10,
            borderRadius: 14,
            border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
            background: 'var(--unity-color-surface-layer-1, #ffffff)',
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.14)',
            zIndex: 80,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, padding: '2px 4px 6px' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--unity-text-strong, #1a1a1a)' }}>{item.label}</span>
            <ChevronRight size={14} color="var(--unity-text-subtle, #767676)" />
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            {item.children!.map(child => {
              const childActive = selectedId === child.id
              return (
                <button
                  key={child.id}
                  onClick={() => {
                    onSelect(child.id)
                    setFlyoutOpen(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    background: childActive ? 'var(--unity-in-fill-subtle, #eef1fd)' : 'transparent',
                    color: childActive ? 'var(--unity-in-fill-strong, #2e4de5)' : 'var(--unity-text-subtle, #555)',
                    fontWeight: childActive ? 600 : 500,
                    transition: 'background 0.12s, color 0.12s',
                  }}
                  onMouseEnter={e => {
                    if (!childActive) {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.background = 'var(--unity-color-surface-subtle, #f6f6f6)'
                      el.style.color = 'var(--unity-text-strong, #1a1a1a)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!childActive) {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.background = 'transparent'
                      el.style.color = 'var(--unity-text-subtle, #555)'
                    }
                  }}
                >
                  {child.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Children — only visible when expanded and not collapsed */}
      {hasChildren && isExpanded && !collapsed && (
        <div style={{ paddingLeft: 36, paddingBottom: 2 }}>
          {item.children!.map(child => {
            const childActive = selectedId === child.id
            return (
              <button
                key={child.id}
                onClick={() => onSelect(child.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  background: childActive ? 'var(--unity-in-fill-subtle, #eef1fd)' : 'transparent',
                  color: childActive ? 'var(--unity-in-fill-strong, #2e4de5)' : 'var(--unity-text-subtle, #767676)',
                  fontWeight: childActive ? 600 : 400,
                  transition: 'background 0.12s, color 0.12s',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (!childActive) {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.background = 'var(--unity-color-surface-subtle, #f6f6f6)'
                    el.style.color = 'var(--unity-text-strong, #1a1a1a)'
                  }
                }}
                onMouseLeave={e => {
                  if (!childActive) {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.background = 'transparent'
                    el.style.color = 'var(--unity-text-subtle, #767676)'
                  }
                }}
              >
                {child.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ selectedId, expandedIds, onSelect, onToggle, collapsed, version, onVersionChange }: SidebarProps) {
  const sidebarWidth = collapsed ? 56 : 240
  const [navSearch, setNavSearch] = useState('')

  const filteredMainItems = useMemo(() => filterNavItems(MAIN_ITEMS, navSearch), [navSearch])
  const filteredBottomItems = useMemo(() => filterNavItems(BOTTOM_ITEMS, navSearch), [navSearch])

  return (
    <aside style={{
      position: 'fixed', top: 56, left: 0, height: 'calc(100vh - 56px)', width: sidebarWidth,
      display: 'flex', flexDirection: 'column', zIndex: 50,
      background: 'var(--unity-color-surface-layer-1, #ffffff)',
      borderRight: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
      overflow: 'hidden',
      transition: 'width 0.2s cubic-bezier(0.4,0,0.2,1)',
    }}>


      {/* Navigation Search */}
      {!collapsed && (
        <div style={{
          padding: '8px 12px', flexShrink: 0,
          borderBottom: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--unity-color-surface-subtle, #f6f7fb)',
            borderRadius: 10,
            border: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
            padding: '8px 10px',
          }}>
            <Search size={14} color="var(--unity-text-subtle, #767676)" style={{ flexShrink: 0 }} />
            <input
              value={navSearch}
              onChange={e => setNavSearch(e.target.value)}
              placeholder="Search navigation"
              aria-label="Search navigation"
              style={{
                width: '100%', border: 'none', outline: 'none', background: 'transparent',
                fontSize: 12, color: 'var(--unity-text-strong, #1a1a1a)',
              }}
            />
          </div>
        </div>
      )}

      {/* Navigation — scrollable vertically, clipped horizontally */}
      <nav style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: collapsed ? '8px 4px 0' : '8px 8px 0',
      }}>
        {filteredMainItems.map(item => (
          <NavRow key={item.id} item={item} selectedId={selectedId}
            expandedIds={expandedIds} onSelect={onSelect} onToggle={onToggle} collapsed={collapsed} />
        ))}

        <hr style={{
          margin: '8px 4px', border: 'none',
          borderTop: '1px solid var(--unity-surface-stroke-weak, #e7e7e7)',
        }} />

        {filteredBottomItems.map(item => (
          <NavRow key={item.id} item={item} selectedId={selectedId}
            expandedIds={expandedIds} onSelect={onSelect} onToggle={onToggle} collapsed={collapsed} />
        ))}
        <div style={{ height: 8 }} />
      </nav>

    </aside>
  )
}

function filterNavItems(items: NavItem[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return items

  return items.flatMap(item => {
    const parentMatch = item.label.toLowerCase().includes(normalizedQuery)
    const matchingChildren = item.children?.filter(child => child.label.toLowerCase().includes(normalizedQuery))

    if (parentMatch) return [item]
    if (matchingChildren && matchingChildren.length > 0) {
      return [{ ...item, children: matchingChildren }]
    }

    return []
  })
}
