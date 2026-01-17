'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Report, UserRole } from '@/types'
import { MapPin, AlertTriangle, Calendar, Image as ImageIcon, Shield, TreePine } from 'lucide-react'
import { AnimatedBorder } from '@/components/ui/AnimatedBorder'
import { GlowCard } from '@/components/ui/GlowCard'
import { cn } from '@/utils/cn'

interface ReportsListProps {
  userRole: UserRole | null
  userId: string | null
}

export default function ReportsList({ userRole, userId }: ReportsListProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true)
      const supabase = createClient()
      
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      // RLS will handle filtering, but we apply client-side as backup
      const { data, error } = await query

      if (error) {
        console.error('Error fetching reports:', error)
        setIsLoading(false)
        return
      }

      let filteredReports = data || []

      if (userRole === 'scout' && userId) {
        filteredReports = filteredReports.filter(r => r.user_id === userId)
      } else if (userRole === 'ranger') {
        filteredReports = filteredReports.filter(r => 
          r.is_invasive === true && 
          ['medium', 'high', 'critical'].includes(r.hazard_rating) &&
          r.hazard_rating !== 'unknown'
        )
      }

      setReports(filteredReports)
      setIsLoading(false)
    }

    if (userRole !== null) {
      fetchReports()

      // Set up realtime subscription
      const supabaseRealtime = createClient()
      const channel = supabaseRealtime
        .channel('reports_list_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reports',
          },
          (payload) => {
            console.log('Realtime update:', payload)
            fetchReports() // Refetch on any change
          }
        )
        .subscribe()

      return () => {
        supabaseRealtime.removeChannel(channel)
      }
    }
  }, [userRole, userId])

  const getHazardColor = (rating: string) => {
    switch (rating) {
      case 'critical': return 'text-red-600 border-red-600/30 bg-red-600/10'
      case 'high': return 'text-red-500 border-red-500/30 bg-red-500/10'
      case 'medium': return 'text-orange-500 border-orange-500/30 bg-orange-500/10'
      case 'low': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
      case 'safe': return 'text-green-500 border-green-500/30 bg-green-500/10'
      case 'unknown': return 'text-gray-500 border-gray-500/30 bg-gray-500/10'
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-zinc-400">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 mb-2">
          {userRole === 'ranger' ? (
            <Shield className="text-orange-500" size={24} />
          ) : (
            <TreePine className="text-emerald-500" size={24} />
          )}
          <h2 className="text-2xl font-bold">
            {userRole === 'ranger' ? 'Threat Reports' : 'My Reports'}
          </h2>
        </div>
        <p className="text-sm text-zinc-400">
          {userRole === 'ranger' 
            ? 'Medium and high-risk invasive species detected'
            : 'All your submitted reports'}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-zinc-500">Total:</span>
          <span className="text-lg font-bold text-emerald-400">{reports.length}</span>
        </div>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {reports.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <MapPin className="mx-auto text-zinc-600 mb-3" size={48} />
              <p className="text-zinc-400">
                {userRole === 'ranger' 
                  ? 'No threat reports found'
                  : 'No reports yet. Start scanning to add reports!'}
              </p>
            </div>
          </div>
        ) : (
          reports.map((report) => (
            <GlowCard
              key={report.id}
              glowColor={report.hazard_rating === 'critical' || report.hazard_rating === 'high' ? 'orange' : 'emerald'}
              intensity="low"
              className="cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => setSelectedReport(report)}
            >
              <div className="p-4">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1 line-clamp-1">
                      {report.species_name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Calendar size={12} />
                      <span>{formatDate(report.created_at)}</span>
                    </div>
                  </div>
                  <AnimatedBorder
                    variant="glow"
                    color={report.hazard_rating === 'critical' || report.hazard_rating === 'high' ? 'orange' : 'emerald'}
                    className="ml-2"
                  >
                    <span className={cn(
                      'px-2 py-1 text-xs font-semibold capitalize rounded',
                      getHazardColor(report.hazard_rating)
                    )}>
                      {report.hazard_rating}
                    </span>
                  </AnimatedBorder>
                </div>

                {/* Image Preview */}
                {report.image_url && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-zinc-800/50">
                    <img
                      src={report.image_url}
                      alt={report.species_name}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2">
                  {report.description && (
                    <p className="text-sm text-zinc-300 line-clamp-2">
                      {report.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-zinc-400">
                    {report.is_invasive && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle size={12} className="text-red-400" />
                        <span className="text-red-400 font-medium">Invasive</span>
                      </div>
                    )}
                    {report.confidence_score !== null && (
                      <div className="flex items-center gap-1">
                        <ImageIcon size={12} />
                        <span>{Math.round(report.confidence_score * 100)}% confidence</span>
                      </div>
                    )}
                    {report.location_name && (
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        <span className="truncate">{report.location_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </GlowCard>
          ))
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedReport(null)}
        >
          <AnimatedBorder
            variant="gradient"
            color="emerald"
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold">{selectedReport.species_name}</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              {selectedReport.image_url && (
                <img
                  src={selectedReport.image_url}
                  alt={selectedReport.species_name}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-zinc-400">Hazard Level:</span>
                  <span className={cn('ml-2 px-2 py-1 text-xs font-semibold capitalize rounded', getHazardColor(selectedReport.hazard_rating))}>
                    {selectedReport.hazard_rating}
                  </span>
                </div>
                
                {selectedReport.description && (
                  <div>
                    <span className="text-sm text-zinc-400">Description:</span>
                    <p className="text-zinc-300 mt-1">{selectedReport.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400">Status:</span>
                    <span className="ml-2 capitalize">{selectedReport.status}</span>
                  </div>
                  {selectedReport.confidence_score !== null && (
                    <div>
                      <span className="text-zinc-400">Confidence:</span>
                      <span className="ml-2">{Math.round(selectedReport.confidence_score * 100)}%</span>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-400">Date:</span>
                    <span className="ml-2">{formatDate(selectedReport.created_at)}</span>
                  </div>
                  {selectedReport.is_invasive && (
                    <div>
                      <span className="text-zinc-400">Type:</span>
                      <span className="ml-2 text-red-400">Invasive Species</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AnimatedBorder>
        </div>
      )}
    </div>
  )
}
