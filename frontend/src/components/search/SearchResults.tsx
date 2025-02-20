import { Video } from '@/types/video';
import { Card, CardContent } from '@/components/ui/card';
import { formatTime } from '@/lib/utils/format';

interface SearchResultsProps {
  results: {
    video: Video;
    timestamp: number;
    confidence: number;
  }[];
  onResultClick: (videoId: string, timestamp: number) => void;
}

export const SearchResults = ({ results, onResultClick }: SearchResultsProps) => {
  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <Card
          key={`${result.video.id}-${index}`}
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => onResultClick(result.video.id, result.timestamp)}
        >
          <CardContent className="flex items-start gap-4 p-4">
            <div className="relative aspect-video w-40">
              <img
                src={result.video.thumbnailUrl}
                alt={result.video.title}
                className="rounded object-cover"
              />
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {formatTime(result.timestamp)}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{result.video.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Match confidence: {(result.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};