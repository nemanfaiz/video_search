import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Combine classes with tailwind-merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to human readable string
export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// Format duration in seconds to MM:SS format
export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Format file size in bytes to human readable string
export function formatFileSize(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}