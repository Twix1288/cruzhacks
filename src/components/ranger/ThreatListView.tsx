'use client';

import React, { useState } from 'react';
import { Check, Clock, AlertTriangle, MapPin, Calendar } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Report } from '@/types';

interface ThreatListViewProps {
  reports: Report[];
  onReportsUpdate: () => void; // Callback to refresh the reports list
}

const ThreatListView: React.FC<ThreatListViewProps> = ({ reports, onReportsUpdate }) => {
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());
  const supabase = createClient();

  const handleResolve = async (reportId: string) => {
    setResolvingIds(prev => new Set(prev).add(reportId));

    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

      if (error) {
        throw error;
      }

      toast.success('Report resolved successfully');
      onReportsUpdate(); // Trigger UI refresh
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('Failed to resolve report');
    } finally {
      setResolvingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const getHazardColor = (rating: string) => {
    switch (rating) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-green-400 bg-green-500/20 border-green-500/30';
    }
  };

  const getConfidenceColor = (score: number | null) => {
    if (!score) return 'text-zinc-400';
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter to only show pending reports
  const pendingReports = reports.filter(report => report.status === 'pending');

  if (pendingReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Check className="w-16 h-16 text-green-500 mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-zinc-300 mb-2">All Clear</h3>
        <p className="text-zinc-500">No pending threats in your sector</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-200">Active Threats</h3>
        <div className="text-sm text-zinc-500">
          {pendingReports.length} pending report{pendingReports.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {pendingReports.map((report) => (
          <div
            key={report.id}
            className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-4 hover:bg-zinc-800/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Species Name and Hazard Level */}
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-zinc-200 truncate">
                    {report.species_name}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getHazardColor(report.hazard_rating)}`}>
                    {report.hazard_rating.toUpperCase()}
                  </span>
                  {report.is_invasive && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium text-red-400 bg-red-500/20 border border-red-500/30">
                      INVASIVE
                    </span>
                  )}
                </div>

                {/* Location and Time */}
                <div className="flex items-center gap-4 text-sm text-zinc-500 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{report.location_name || 'Unknown Location'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{formatDate(report.created_at)}</span>
                  </div>
                </div>

                {/* Confidence Score */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-400">Confidence:</span>
                  <span className={`font-medium ${getConfidenceColor(report.confidence_score)}`}>
                    {report.confidence_score ? `${Math.round(report.confidence_score * 100)}%` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Resolve Button */}
              <div className="ml-4">
                <button
                  onClick={() => handleResolve(report.id)}
                  disabled={resolvingIds.has(report.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {resolvingIds.has(report.id) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Resolving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Resolve</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThreatListView;
