"use client"

import { useState, useRef, useEffect, forwardRef } from "react"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  src: string
  title: string
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  function VideoPlayer({ src, title }, ref) {
    const internalVideoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showControls, setShowControls] = useState(true)

    const videoRef = (ref as React.RefObject<HTMLVideoElement>) || internalVideoRef

    useEffect(() => {
      const video = videoRef.current
      if (!video) return

      const handleTimeUpdate = () => {
        setProgress((video.currentTime / video.duration) * 100)
        setCurrentTime(video.currentTime)
      }

      const handleLoadedMetadata = () => {
        setDuration(video.duration)
      }

      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('loadedmetadata', handleLoadedMetadata)

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }, [videoRef])

    const togglePlay = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause()
        } else {
          videoRef.current.play()
        }
        setIsPlaying(!isPlaying)
      }
    }

    const handleProgressChange = (value: number[]) => {
      const video = videoRef.current
      if (video) {
        const newTime = (value[0] / 100) * video.duration
        video.currentTime = newTime
        setProgress(value[0])
      }
    }

    const handleVolumeChange = (value: number[]) => {
      const newVolume = value[0] / 100
      setVolume(newVolume)
      if (videoRef.current) {
        videoRef.current.volume = newVolume
      }
      setIsMuted(newVolume === 0)
    }

    const toggleMute = () => {
      if (videoRef.current) {
        videoRef.current.muted = !isMuted
        setIsMuted(!isMuted)
        if (isMuted) {
          setVolume(1)
          videoRef.current.volume = 1
        } else {
          setVolume(0)
          videoRef.current.volume = 0
        }
      }
    }

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        videoRef.current?.requestFullscreen()
        setIsFullscreen(true)
      } else {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }

    const formatTime = (time: number) => {
      const minutes = Math.floor(time / 60)
      const seconds = Math.floor(time % 60)
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    // const seek = (seconds: number) => {
    //   if (videoRef.current) {
    //     videoRef.current.currentTime += seconds
    //   }
    // }
    const seek = async (seconds: number) => {
      const video = videoRef.current;
      if (video) {
        try {
          const wasPlaying = !video.paused;
          const newTime = Math.min(Math.max(0, video.currentTime + seconds), video.duration);
          
          // pause then seek
          video.pause();
          video.currentTime = newTime;
          
          // wait for seeking to complete
          await new Promise<void>((resolve) => {
            const handleSeeked = () => {
              video.removeEventListener('seeked', handleSeeked);
              resolve();
            };
            video.addEventListener('seeked', handleSeeked);
          });

          setProgress((newTime / video.duration) * 100);
          
          // resume if it was playing
          if (wasPlaying) {
            try {
              await video.play();
            } catch (error) {
              console.warn('Failed to resume playback:', error);
            }
          }
        } catch (error) {
          console.error('Error during seeking:', error);
        }
      }
    }

    return (
      <div 
        className="relative group bg-black rounded-lg overflow-hidden"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          className="w-full aspect-video"
          src={src}
          onClick={togglePlay}
        />
        
        {/* video controls */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity",
          showControls ? "opacity-100" : "opacity-0"
        )}>
          {/* progress Bar */}
          <Slider
            value={[progress]}
            max={100}
            step={0.1}
            onValueChange={handleProgressChange}
            className="mb-4"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* play and pause */}
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              {/* skip */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => seek(-10)}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => seek(10)}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              {/* volume */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Slider
                  value={[volume * 100]}
                  max={100}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>

              {/* time */}
              <span className="text-sm text-white">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    )
})
