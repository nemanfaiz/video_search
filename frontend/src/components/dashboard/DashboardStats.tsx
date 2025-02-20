import { Film, Search, MessageSquare, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const stats = [
  {
    title: "Total Videos",
    value: "24",
    icon: Film,
  },
  {
    title: "Searches",
    value: "120",
    icon: Search,
  },
  {
    title: "Chat Messages",
    value: "42",
    icon: MessageSquare,
  },
  {
    title: "Avg. Duration",
    value: "2:15",
    icon: Clock,
  },
]

export function DashboardStats() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="flex items-center p-6">
            <div className="bg-secondary p-3 rounded-lg">
              <stat.icon className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </p>
              <p className="text-2xl font-semibold mt-1">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}