import ADMHomeDashboard from './ADMHomeDashboard'

interface ADMHomeDashboardV2Props {
  onNewCampaign?: () => void
  onMetricsChange?: (metrics: {
    activeCampaigns: number
    totalVisibleCampaigns: number
    pausedCampaigns: number
    emailsSent: number
    averageOpenRate: number | null
    topCampaign: { name: string; open: number; sent: number; type: string } | null
    anomalies: string[]
  }) => void
}

export default function ADMHomeDashboardV2({ onNewCampaign, onMetricsChange }: ADMHomeDashboardV2Props) {
  return <ADMHomeDashboard onNewCampaign={onNewCampaign} onMetricsChange={onMetricsChange} />
}
