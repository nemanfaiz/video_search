import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { VideoList } from "@/components/video/VideoList"

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <DashboardStats />
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-lg font-medium mb-4 text-foreground">Recent Videos</h2>
        <VideoList limit={5} />
      </div>
    </div>
  )
}