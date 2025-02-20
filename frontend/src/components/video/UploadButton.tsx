"use client"

import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function UploadButton() {
  return (
    <Link href="/upload">
      <Button>
        <Upload className="mr-2 h-4 w-4" />
        Upload Video
      </Button>
    </Link>
  )
}