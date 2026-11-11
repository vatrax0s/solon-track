/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bookmark,
  RotateCcw,
  Trash2,
  Calendar,
  Landmark,
  CheckCircle2,
  AlertCircle,
  Gavel,
  ChevronDown,
  ChevronUp,
  Search,
  Share2,
  Copy,
  Check,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ScrollText,
  UserCheck,
  Stamp,
  Award,
  Bell,
  BellOff,
  FileText,
  Edit3
} from 'lucide-react';
import { SolonCaseRecord, SolonQuery, SolonPublication } from '../solonService.ts';

export interface SavedSearchItem {
  id: string;
  savedAt: string;
  lastCheckedAt: string;
  courtOfficeOC: string;
  courtName: string;
  query: SolonQuery;
  records: SolonCaseRecord[];
  notes?: string;
  notify?: boolean;
}

interface SavedCasesProps {
  savedCases: SavedSearchItem[];
  onRemove: (id: string) => void;
  onRecheck: (item: SavedSearchItem) => void;
  onSelect: (item: SavedSearchItem) => void;
  onClearAll: () => void;
  onToggleNotify?: (id: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  isLoading: boolean;
  activeRecheckingId?: string | null;
  compactMode?: boolean;
}

export const SavedCases: React.FC<SavedCasesProps> = ({
  savedCases,
  onRemove,
  onRecheck,
  onSelect,
  onClearAll,
  onToggleNotify,
  onUpdateNotes,
  isLoading,
  activeRecheckingId,
  compactMode = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');

  const filteredCases = savedCases.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const court = item.courtName.toLowerCase();
    const gak = (item.records[0]?.gak || '').toLowerCase();
    const eak = (item.records[0]?.eak || '').toLowerCase();
    const decision = (item.records[0]?.decision || '').toLowerCase();
    const num = item.query.number.toLowerCase();
    const note = (item.notes || '').toLowerCase();
    return court.includes(term) || gak.includes(term) || eak.includes(term) || decision.includes(term) || num.includes(term) || note.includes(term);
  });

  const handleCopy = async (item: SavedSearchItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const record = item.records[0];
    if (!record) return;

    const textToCopy = `Δικαστήριο: ${item.courtName}\nΓΑΚ: ${record.gak} | ΕΑΚ: ${record.eak}\nΗμ. Κατάθεσης: ${record.filingDate}\nΑριθμός Απόφασης/Έτος-Είδος Διατακτικού: ${record.decision}\nΔιαδικασία: ${record.procedure}\nΑντικείμενο: ${record.subject}\nΠινάκιο: ${record.docket}\nΑποτέλεσμα Συζήτησης: ${record.hearingResult}\n(Ανάκτηση μέσω ΣΟΛΩΝ Track: ${new Date(item.lastCheckedAt).toLocaleString('el-GR')})`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async (item: SavedSearchItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const record = item.records[0];
    if (!record) return;

    const shareData = {
      title: `Απόφαση ${record.decision} - ${item.courtName}`,
      text: `Αριθμός Απόφασης/Έτος-Είδος Διατακτικού: ${record.decision}\nΔικαστήριο: ${item.courtName}\nΓΑΚ: ${record.gak}\nΑποτέλεσμα: ${record.hearingResult}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share dismissed');
      }
    } else {
      handleCopy(item, e);
    }
  };

  const renderStatusBadge = (record?: SolonCaseRecord) => {
    if (!record) return null;
    switch (record.decisionStatus) {
      case 'positive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>ΕΚΔΟΘΗΚΕ &bull; ΔΕΚΤΗ</span>
          </span>
        );
      case 'negative':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>ΕΚΔΟΘΗΚΕ &bull; ΑΠΟΡΡΙΦΘΗΚΕ</span>
          </span>
        );
      case 'neutral':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>ΕΚΔΟΘΗΚΕ</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700/60 text-slate-300 border border-slate-600/50">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>ΕΚΚΡΕΜΕΙ</span>
          </span>
        );
    }
  };

  if (savedCases.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-md">
        <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
          <Bookmark className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-white">Δεν υπάρχουν αποθηκευμένες αναζητήσεις</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          Κάθε αναζήτηση που εκτελείτε αποθηκεύεται αυτόματα εδώ με όλες τις ανακτηθείσες πληροφορίες (Απόφαση, Ημερομηνία, ΓΑΚ/ΕΑΚ, Διαδικασία κ.λπ.), ώστε να είναι διαθέσιμη όποτε ανοίγετε την εφαρμογή.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-amber-400 fill-amber-400" />
          <h2 className="text-sm font-bold text-white">
            Αποθηκευμένες Αναζητήσεις ({savedCases.length})
          </h2>
        </div>
        {!compactMode && savedCases.length > 1 && (
          <button
            onClick={onClearAll}
            className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
          >
            Εκκαθάριση όλων
          </button>
        )}
      </div>

      {/* Filter / Search within saved cases if more than 3 */}
      {savedCases.length > 3 && !compactMode && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Φιλτράρισμα αποθηκευμένων (δικαστήριο, αριθμός, απόφαση)..."
            className="w-full bg-slate-900/90 text-white placeholder-slate-500 pl-9 pr-3 py-2 rounded-xl border border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Cards List */}
      <div className="space-y-3.5">
        {filteredCases.map((item) => {
          const record = item.records[0];
          const isRechecking = activeRecheckingId === item.id;
          const isExpanded = expandedCardId === item.id;

          return (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg transition-all"
            >
              {/* Top Court & Filing Header */}
              <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 max-w-[70%]">
                  <Landmark className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                    {item.courtName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {onToggleNotify && (
                    <button
                      type="button"
                      onClick={() => onToggleNotify(item.id)}
                      title={item.notify !== false ? "Ειδοποιήσεις ενεργές (Κλικ για σίγαση)" : "Ειδοποιήσεις σε σίγαση (Κλικ για ενεργοποίηση)"}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition border ${
                        item.notify !== false
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {item.notify !== false ? (
                        <Bell className="w-3 h-3 text-amber-400 fill-amber-400/30" />
                      ) : (
                        <BellOff className="w-3 h-3 text-slate-500" />
                      )}
                      <span>{item.notify !== false ? 'Ειδοποίηση' : 'Σίγαση'}</span>
                    </button>
                  )}
                  <span className="font-mono text-xs font-bold text-white bg-slate-900/80 border border-slate-700/80 px-2.5 py-0.5 rounded-lg">
                    {item.query.searchType}: {item.query.number}/{item.query.year}
                  </span>
                  <button
                    onClick={() => onRemove(item.id)}
                    title="Διαγραφή από τα αποθηκευμένα"
                    className="p-1 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* USER COMMENT / NOTES SECTION */}
              <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80">
                {editingNoteId === item.id ? (
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      value={draftNote}
                      onChange={(e) => setDraftNote(e.target.value)}
                      placeholder="Σχόλιο (π.χ. Αγωγή κατά Τράπεζας, Μίσθωμα, Διατροφή...)"
                      className="flex-1 bg-slate-900 border border-blue-500 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateNotes?.(item.id, draftNote.trim());
                          setEditingNoteId(null);
                        }
                        if (e.key === 'Escape') setEditingNoteId(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateNotes?.(item.id, draftNote.trim());
                        setEditingNoteId(null);
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                    >
                      Αποθήκευση
                    </button>
                    {item.notes && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateNotes?.(item.id, '');
                          setEditingNoteId(null);
                        }}
                        className="px-2 py-1 bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 rounded-lg text-xs"
                        title="Διαγραφή σχολίου"
                      >
                        Διαγραφή
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingNoteId(null)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                    >
                      Ακύρωση
                    </button>
                  </div>
                ) : item.notes ? (
                  <div className="flex items-center justify-between gap-2 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-1.5 text-xs text-amber-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-semibold text-amber-300 shrink-0">Σχόλιο:</span>
                      <span className="truncate text-slate-100">{item.notes}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteId(item.id);
                        setDraftNote(item.notes || '');
                      }}
                      className="p-1 hover:bg-amber-500/20 text-amber-300 rounded transition shrink-0"
                      title="Επεξεργασία σχολίου"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNoteId(item.id);
                      setDraftNote('');
                    }}
                    className="text-[11px] text-slate-400 hover:text-blue-300 flex items-center gap-1.5 transition py-0.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>+ Προσθήκη σχολίου για αυτή την υπόθεση</span>
                  </button>
                )}
              </div>

              {/* CORE HIGHLIGHT: The decision column requested by the user */}
              <div className="p-4 bg-gradient-to-b from-slate-900 via-slate-950/60 to-slate-900 border-b border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <Gavel className="w-3 h-3" />
                    Αριθμός Απόφασης / Έτος - Είδος Διατακτικού
                  </span>
                  {renderStatusBadge(record)}
                </div>

                {/* Primary Decision Text Box */}
                <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800 shadow-inner">
                  <div className="text-base sm:text-lg font-bold font-mono text-white tracking-tight break-words">
                    {record && record.decision && record.decision.replace(/&nbsp;/gi, '').trim() !== '' && record.decision.replace(/&nbsp;/gi, '').trim() !== '-'
                      ? record.decision.replace(/&nbsp;/gi, '').trim()
                      : 'Δεν έχει εκδοθεί απόφαση (Εκκρεμεί)'}
                  </div>

                  {/* Context chips */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                    <div className="px-2 py-0.5 rounded bg-slate-800/90 font-mono">
                      Γ.Α.Κ.: <strong className="text-white">{record?.gak || '-'}</strong>
                    </div>
                    <div className="px-2 py-0.5 rounded bg-slate-800/90 font-mono">
                      Ε.Α.Κ.: <strong className="text-white">{record?.eak || '-'}</strong>
                    </div>
                    <div className="px-2 py-0.5 rounded bg-slate-800/90 font-mono">
                      Ημ. Κατάθεσης: <strong className="text-white">{record?.filingDate || '-'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* RE-RUN SEARCH BUTTON (User requested: "με το πάτημα ενός κουμπιού να εκτελείται πάλι η αναζήτηση") */}
              <div className="px-4 py-2.5 bg-slate-900/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <button
                  onClick={() => onRecheck(item)}
                  disabled={isLoading}
                  className="w-full sm:w-auto flex-1 py-2 px-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRechecking ? 'animate-spin' : ''}`} />
                  <span>{isRechecking ? 'Σύνδεση με ΣΟΛΩΝ...' : 'Επανεκτέλεση Αναζήτησης'}</span>
                </button>

                <div className="flex items-center justify-end gap-1.5 shrink-0">
                  {/* Copy Button */}
                  <button
                    onClick={(e) => handleCopy(item, e)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                    title="Αντιγραφή στοιχείων"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={(e) => handleShare(item, e)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                    title="Κοινοποίηση"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Expand / Details Toggle Button */}
                  <button
                    onClick={() => setExpandedCardId(isExpanded ? null : item.id)}
                    className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 font-medium transition-colors"
                  >
                    <span>{isExpanded ? 'Σύμπτυξη' : 'Λεπτομέρειες'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* ALL RETRIEVED INFORMATION ACCORDION (User requested: "να περιλαμβάνονται όλες οι πληροφορίες που έχουν ανακτηθεί") */}
              {isExpanded && record && (
                <div className="p-4 bg-slate-950/70 border-t border-slate-800/80 text-xs space-y-4">
                  {/* Publications Section from Solon Track Details */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 text-[11px]">
                        <ScrollText className="w-4 h-4 text-amber-400" />
                        Στοιχεία Δημοσιεύσεων (Solon Track LdoDetails)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {record.publications && record.publications.length > 0
                          ? `${record.publications.length} εγγραφή/ές`
                          : 'Εκκρεμεί / Δεν υπάρχουν'}
                      </span>
                    </div>

                    {record.publications && record.publications.length > 0 ? (
                      <div className="space-y-3">
                        {record.publications.map((pub, idx) => (
                          <div
                            key={pub.id || idx}
                            className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-sm"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white text-sm">
                                  {pub.decisionNumberYear !== '-' ? pub.decisionNumberYear : record.decision}
                                </span>
                                {pub.dispositiveType && pub.dispositiveType !== '-' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    {pub.dispositiveType}
                                  </span>
                                )}
                              </div>
                              {pub.publicationDate && pub.publicationDate !== '-' && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-300 font-medium">
                                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                  <span>Ημ. Δημοσίευσης: <strong className="text-white">{pub.publicationDate}</strong></span>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300 border-t border-slate-800/80">
                              {pub.judge && pub.judge !== '-' && (
                                <div className="flex items-start gap-1.5">
                                  <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-slate-400">Δικαστής: </span>
                                    <span className="font-semibold text-white">{pub.judge}</span>
                                  </div>
                                </div>
                              )}

                              {pub.result && pub.result !== '-' && (
                                <div className="flex items-start gap-1.5">
                                  <Award className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-slate-400">Αποτέλεσμα: </span>
                                    <span className="font-semibold text-white">{pub.result}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Operative / Δια ταύτα */}
                            {pub.operativeSummary && pub.operativeSummary !== '-' && pub.operativeSummary.trim() !== '' && (
                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/70 text-[11px] text-slate-300">
                                <span className="text-slate-400 font-semibold block mb-0.5">Δια Ταύτα:</span>
                                <p className="leading-relaxed">{pub.operativeSummary}</p>
                              </div>
                            )}

                            {/* Timeline / Θεωρήσεις & Καθαρογραφή */}
                            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/70 space-y-1.5 text-[10px]">
                              <div className="font-semibold text-slate-400 flex items-center gap-1">
                                <Stamp className="w-3 h-3 text-slate-400" />
                                <span>Στάδια Επεξεργασίας &amp; Θεωρήσεων:</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-400">
                                <div>
                                  Καθαρογραφή:{' '}
                                  <span className="font-medium text-slate-200 block sm:inline">
                                    {pub.cleanDraftDate !== '-' ? pub.cleanDraftDate : '—'}
                                  </span>
                                </div>
                                <div>
                                  Υπογραφή Δικαστή:{' '}
                                  <span className="font-medium text-slate-200 block sm:inline">
                                    {pub.judgeSignDate !== '-' ? pub.judgeSignDate : '—'}
                                  </span>
                                </div>
                                <div>
                                  Υπογραφή Προέδρου:{' '}
                                  <span className="font-medium text-slate-200 block sm:inline">
                                    {pub.presidentSignDate !== '-' ? pub.presidentSignDate : '—'}
                                  </span>
                                </div>
                                <div>
                                  Αρχειοθέτηση:{' '}
                                  <span className="font-medium text-slate-200 block sm:inline">
                                    {pub.archiveDate !== '-' ? pub.archiveDate : '—'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center text-slate-400 text-[11px] leading-relaxed">
                        Δεν υπάρχουν ακόμη καταχωρημένες εγγραφές στην καρτέλα <strong>&quot;Δημοσιεύσεις&quot;</strong> του ΣΟΛΩΝ για αυτή την υπόθεση.
                      </div>
                    )}
                  </div>

                  {/* Case attributes */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                      Στοιχεία Δικογράφου (ΣΟΛΩΝ):
                    </div>
                    <div className="divide-y divide-slate-800/60">
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-400">Ημ. Κατάθεσης:</span>
                        <span className="font-semibold text-slate-100 font-mono">{record.filingDate}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-400">Γενικός Αριθμός Κατάθεσης (ΓΑΚ):</span>
                        <span className="font-semibold text-slate-100 font-mono">{record.gak}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-400">Ειδικός Αριθμός Κατάθεσης (ΕΑΚ):</span>
                        <span className="font-semibold text-slate-100 font-mono">{record.eak}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-400">Διαδικασία:</span>
                        <span className="font-medium text-slate-200 text-right max-w-[65%]">{record.procedure}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-400">Αντικείμενο:</span>
                        <span className="font-medium text-slate-200 text-right max-w-[65%]">{record.subject}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-400">Είδος:</span>
                        <span className="font-medium text-slate-200">{record.kind}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-400">Αριθμός Πινακίου:</span>
                        <span className="font-mono text-slate-200 text-right max-w-[65%]">{record.docket}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-400">Αποτέλεσμα Συζήτησης:</span>
                        <span className="font-semibold text-slate-100">{record.hearingResult}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 text-[10px] text-slate-500">
                        <span>Τελευταία ανάκτηση από ΣΟΛΩΝ:</span>
                        <span>{new Date(item.lastCheckedAt).toLocaleString('el-GR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Footer with timestamp */}
              <div className="px-4 py-1.5 bg-slate-950 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Ενημερώθηκε: {new Date(item.lastCheckedAt).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                <span className="text-slate-400 font-mono">ID: #{item.courtOfficeOC}-{item.query.number}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
