// app/videos/[videoId]/not-found.tsx
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Video Not Found</h1>
      <p className="text-muted-foreground">The video you're looking for doesn't exist or was removed.</p>
      <Button asChild>
        <Link href="/videos">Back to Videos</Link>
      </Button>
    </div>
  )
}