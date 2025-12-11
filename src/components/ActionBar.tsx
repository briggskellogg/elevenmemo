import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  BrandCopyIcon, 
  BrandCheckIcon,
} from '@/components/ui/brand-icons'

function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd className={cn(
      'inline-flex items-center justify-center px-1.5 py-0.5 rounded-md',
      'bg-background/60 border border-border/40 text-[10px] font-medium text-muted-foreground/80',
      'min-w-[20px] backdrop-blur-sm',
      className
    )}>
      {children}
    </kbd>
  )
}

interface ActionBarProps {
  hasContent: boolean
  onCopy: () => void
  copyTriggered?: boolean
}

export function ActionBar({
  hasContent,
  onCopy,
  copyTriggered = false,
}: ActionBarProps) {
  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={onCopy}
        disabled={!hasContent}
        className={cn(
          'h-9 px-2 gap-1 transition-all',
          copyTriggered && 'bg-[#2DD28D]/20'
        )}
        aria-label="Copy transcript"
      >
        {copyTriggered ? (
          <BrandCheckIcon size={21} />
        ) : (
          <BrandCopyIcon size={21} />
        )}
        <Kbd>C</Kbd>
      </Button>
    </div>
  )
}
