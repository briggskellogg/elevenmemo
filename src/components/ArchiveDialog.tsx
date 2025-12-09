import { useState, useEffect, useCallback } from 'react'
import {
  BrandHistoryIcon,
  BrandSearchIcon,
  BrandCloseIcon,
  BrandCopyIcon,
  BrandTrashIcon,
  EmptyArchiveIcon,
} from '@/components/ui/brand-icons'
import { Download, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CategoryTag,
  CategorySelector,
} from '@/components/ui/category-tag'
import { useSettingsStore } from '@/store/settings'
import { useArchive } from '@/hooks/useArchive'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd className={cn(
      'inline-flex items-center justify-center px-1.5 py-0.5 rounded',
      'bg-muted/80 border border-border/50 text-[10px] font-medium text-muted-foreground',
      'min-w-[18px]',
      className
    )}>
      {children}
    </kbd>
  )
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const day = date.getDate()
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const year = date.getFullYear()
  const time = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
  return `${month} ${day}, ${year}, ${time}`
}

function truncateText(text: string, maxLength = 150): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

const ITEMS_PER_PAGE = 10

export function ArchiveDialog() {
  const { archiveDialogOpen, setArchiveDialogOpen } = useSettingsStore()
  const { archivedTranscripts, deleteTranscript, updateTranscript, exportToCSV } = useArchive()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCategorySelector, setShowCategorySelector] = useState<string | null>(null)
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingTitleValue, setEditingTitleValue] = useState('')
  const [currentPage, setCurrentPage] = useState(0)

  // Filter transcripts based on search
  const filteredTranscripts = archivedTranscripts.filter(t => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      t.text.toLowerCase().includes(query) ||
      (t.title && t.title.toLowerCase().includes(query)) ||
      (t.category && t.category.toLowerCase().includes(query))
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredTranscripts.length / ITEMS_PER_PAGE)
  const paginatedTranscripts = filteredTranscripts.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  )

  // Reset selection when dialog opens/closes or search changes
  useEffect(() => {
    if (archiveDialogOpen) {
      setSelectedIndex(0)
      setSearchQuery('')
      setCurrentPage(0)
    }
  }, [archiveDialogOpen])

  useEffect(() => {
    setSelectedIndex(0)
    setCurrentPage(0)
  }, [searchQuery])

  const copyTranscript = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy')
    }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteTranscript(id)
      if (expandedId === id) {
        setExpandedId(null)
      }
      toast.success('Deleted')
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error('Failed to delete')
    }
  }, [deleteTranscript, expandedId])

  const handleCategoryChange = useCallback(async (id: string, category: string) => {
    try {
      await updateTranscript(id, { category })
    } catch (error) {
      console.error('Failed to update category:', error)
      toast.error('Failed to update')
    }
  }, [updateTranscript])

  const handleTitleEdit = useCallback((id: string, currentTitle: string) => {
    setEditingTitleId(id)
    setEditingTitleValue(currentTitle || '')
  }, [])

  const handleTitleSave = useCallback(async (id: string) => {
    try {
      await updateTranscript(id, { title: editingTitleValue.trim() || 'Untitled' })
      setEditingTitleId(null)
      setEditingTitleValue('')
    } catch (error) {
      console.error('Failed to update title:', error)
      toast.error('Failed to update title')
    }
  }, [updateTranscript, editingTitleValue])

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTitleSave(id)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditingTitleId(null)
      setEditingTitleValue('')
    }
  }, [handleTitleSave])

  // Keyboard navigation inside dialog
  useEffect(() => {
    if (!archiveDialogOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow typing in inputs
      if (e.target instanceof HTMLInputElement) {
        if (e.key === 'Escape') {
          e.preventDefault()
          if (editingTitleId) {
            setEditingTitleId(null)
            setEditingTitleValue('')
          } else if (searchQuery) {
            setSearchQuery('')
          } else if (showCategorySelector) {
            setShowCategorySelector(null)
          } else {
            setArchiveDialogOpen(false)
          }
        }
        return
      }

      if (paginatedTranscripts.length === 0) {
        if (e.key === 'Escape') {
          setArchiveDialogOpen(false)
        }
        return
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(0, prev - 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(paginatedTranscripts.length - 1, prev + 1))
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (currentPage > 0) {
            setCurrentPage(prev => prev - 1)
            setSelectedIndex(0)
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (currentPage < totalPages - 1) {
            setCurrentPage(prev => prev + 1)
            setSelectedIndex(0)
          }
          break
        case 'Enter':
          e.preventDefault()
          {
            const selected = paginatedTranscripts[selectedIndex]
            if (selected) {
              setExpandedId(expandedId === selected.id ? null : selected.id)
            }
          }
          break
        case 'c':
          e.preventDefault()
          {
            const toCopy = paginatedTranscripts[selectedIndex]
            if (toCopy) {
              copyTranscript(toCopy.text)
            }
          }
          break
        case 'd':
        case 'Backspace':
        case 'Delete':
          e.preventDefault()
          {
            const toDelete = paginatedTranscripts[selectedIndex]
            if (toDelete) {
              handleDelete(toDelete.id)
              if (selectedIndex >= paginatedTranscripts.length - 1) {
                setSelectedIndex(Math.max(0, paginatedTranscripts.length - 2))
              }
            }
          }
          break
        case '/':
          e.preventDefault()
          document.getElementById('archive-search')?.focus()
          break
        case 'Escape':
          setArchiveDialogOpen(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [archiveDialogOpen, paginatedTranscripts, selectedIndex, expandedId, copyTranscript, handleDelete, setArchiveDialogOpen, searchQuery, showCategorySelector, currentPage, totalPages, editingTitleId])

  return (
    <Sheet open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2 gap-1.5"
          aria-label="Archive"
        >
          <BrandHistoryIcon size={21} />
          <Kbd>H</Kbd>
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="h-[75vh] rounded-t-2xl border-t-2 border-border shadow-2xl bg-background/95 backdrop-blur-sm"
      >
        <div className="h-full flex flex-col px-6 sm:px-10 max-w-4xl mx-auto pt-4">
          {/* Close button with ESC hint */}
          <button
            onClick={() => setArchiveDialogOpen(false)}
            className="absolute top-4 left-4 flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <BrandCloseIcon size={18} />
            <Kbd>ESC</Kbd>
          </button>

          <SheetHeader className="pb-4">
            <div className="flex items-center justify-center gap-3">
              <SheetTitle className="text-xl">
                Archive
              </SheetTitle>
              {archivedTranscripts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await exportToCSV()
                      toast.success(`Exported ${archivedTranscripts.length} transcripts to CSV`)
                    } catch (error) {
                      console.error('Export failed:', error)
                      toast.error('Failed to export')
                    }
                  }}
                  className="h-8 gap-1.5 px-2.5 text-xs font-medium border-[#2DD28D]/40 text-[#2DD28D] hover:bg-[#2DD28D]/10 hover:border-[#2DD28D]/60 hover:text-[#2DD28D] transition-colors"
                  aria-label="Export all transcripts to CSV"
                  title="Export to CSV"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold">CSV</span>
                </Button>
              )}
            </div>
          </SheetHeader>

          {/* Search bar - fixed width */}
          <div className="relative mb-4 w-full">
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <BrandSearchIcon size={19} />
            </div>
            <Input
              id="archive-search"
              type="text"
              placeholder="Search transcripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <BrandCloseIcon size={17} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto -mx-6 sm:-mx-10 px-6 sm:px-10">
            {filteredTranscripts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <EmptyArchiveIcon size={64} className="text-muted-foreground/30 mb-4" />
                <p className="text-xs text-muted-foreground/40">
                  {searchQuery ? 'No matches' : 'No transcripts'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 pb-8">
                {paginatedTranscripts.map((transcript, index) => {
                  return (
                    <div
                      key={transcript.id}
                      className={cn(
                        'rounded-xl border-2 bg-card p-4 transition-all cursor-pointer',
                        selectedIndex === index 
                          ? 'border-primary shadow-lg shadow-primary/10' 
                          : 'border-border/50 hover:border-border',
                      )}
                      onClick={() => {
                        setSelectedIndex(index)
                        setExpandedId(expandedId === transcript.id ? null : transcript.id)
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Title row with category and indicators */}
                          <div className="flex items-center gap-2 mb-1.5">
                            {/* Editable Title */}
                            {editingTitleId === transcript.id ? (
                              <Input
                                value={editingTitleValue}
                                onChange={(e) => setEditingTitleValue(e.target.value)}
                                onKeyDown={(e) => handleTitleKeyDown(e, transcript.id)}
                                onBlur={() => handleTitleSave(transcript.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-6 text-sm font-medium px-1 py-0 w-auto min-w-[100px] max-w-[200px]"
                                autoFocus
                              />
                            ) : (
                              <h3 
                                className="font-medium text-sm truncate cursor-text hover:bg-muted/50 px-1 py-0.5 -mx-1 rounded"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleTitleEdit(transcript.id, transcript.title || '')
                                }}
                                title="Click to edit title"
                              >
                                {transcript.title || 'Untitled'}
                              </h3>
                            )}
                            
                            {/* Category pill tag - clickable to change */}
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <CategoryTag
                                category={transcript.category || 'Note'}
                                size="sm"
                                onClick={() => setShowCategorySelector(
                                  showCategorySelector === transcript.id ? null : transcript.id
                                )}
                              />
                              
                              {/* Category selector dropdown */}
                              {showCategorySelector === transcript.id && (
                                <div className="absolute top-full left-0 mt-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-10 min-w-[200px]">
                                  <CategorySelector
                                    value={transcript.category || 'Note'}
                                    onChange={(cat) => {
                                      handleCategoryChange(transcript.id, cat)
                                      setShowCategorySelector(null)
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Date */}
                          <div className="mb-2 text-[11px] text-muted-foreground/60">
                            <span>{formatDate(transcript.createdAt)}</span>
                          </div>
                          
                          {/* Transcript text */}
                          <p className="text-sm leading-relaxed text-foreground/80">
                            {expandedId === transcript.id
                              ? transcript.text
                              : truncateText(transcript.text)
                            }
                          </p>
                        </div>
                        
                        {/* Action buttons with hotkey hints */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 gap-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyTranscript(transcript.text)
                            }}
                            aria-label="Copy transcript"
                          >
                            <BrandCopyIcon size={17} />
                            <Kbd>C</Kbd>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 gap-1 hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(transcript.id)
                            }}
                            aria-label="Delete transcript"
                          >
                            <BrandTrashIcon size={17} />
                            <Kbd>D</Kbd>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-4 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentPage(prev => prev - 1)
                  setSelectedIndex(0)
                }}
                disabled={currentPage === 0}
                className="h-8 px-2 gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs">Prev</span>
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentPage(prev => prev + 1)
                  setSelectedIndex(0)
                }}
                disabled={currentPage === totalPages - 1}
                className="h-8 px-2 gap-1"
              >
                <span className="text-xs">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
