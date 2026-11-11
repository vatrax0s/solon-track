/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Bookmark,
  Share2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Landmark,
  Calendar,
  Gavel,
  BookOpen,
  ScrollText,
  UserCheck,
  Stamp,
  Award,
  Bell,
  BellOff,
  Edit3
} from 'lucide-react';
import { SolonCaseRecord, SolonPublication } from '../solonService.ts';

interface DecisionCardProps {
  record: SolonCaseRecord;
  courtName: string;
  isSaved: boolean;
  onToggleSave: (record: SolonCaseRecord) => void;
  onRefresh?: () => void;
  note?: string;
  onUpdateNote?: (note: string) => void;
  notify?: boolean;
  onToggleNotify?: () => void;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({
  record,
  courtName,
  isSaved,
  onToggleSave,
  note = '',
  onUpdateNote,
  notify = true,
  onToggleNotify,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [localNote, setLocalNote] = useState(note);

  useEffect(() => {
    setLocalNote(note);
  }, [note]);

  // Status badge helper
  const renderStatusBadge = () => {
    switch (record.decisionStatus) {
      case 'positive':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ΕΚΔΟΘΗΚΕ &bull; ΔΕΚΤΗ</span>
          </span>
        );
      case 'negative':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>ΕΚΔΟΘΗΚΕ &bull; ΑΠΟΡΡΙΦΘΗΚΕ</span>
          </span>
        );
      case 'neutral':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>ΕΚΔΟΘΗΚΕ ΑΠΟΦΑΣΗ</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-700/60 text-slate-300 border border-slate-600/50">
            <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>ΕΚΚΡΕΜΕΙ ΕΚΔΟΣΗ</span>
          </span>
        );
    }
  };

  const handleCopy = async () => {
    const textToCopy = `Δικαστήριο: ${courtName}\nΓΑΚ: ${record.gak} | ΕΑΚ: ${record.eak}\nΗμ. Κατάθεσης: ${record.filingDate}\nΑριθμός Απόφασης/Έτος-Είδος Διατακτικού: ${record.decision}\nΑποτέλεσμα Συζήτησης: ${record.hearingResult}\n(Ανάκτηση μέσω ΣΟΛΩΝ Track)`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Απόφαση ${record.decision} - ${courtName}`,
      text: `Αριθμός Απόφασης/Έτος-Είδος Διατακτικού: ${record.decision}\nΔικαστήριο: ${courtName}\nΓΑΚ: ${record.gak}\nΑποτέλεσμα Συζήτησης: ${record.hearingResult}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share dismissed');
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-slate-900 border-2 border-blue-500/40 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
      {/* Top Banner / Case Identifier */}
      <div className="bg-slate-800/90 px-4 py-3 border-b border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-xs font-medium text-slate-300 line-clamp-1">{courtName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Κατάθεση: <strong className="text-slate-200">{record.filingDate}</strong></span>
        </div>
      </div>

      {/* Hero: TARGET COLUMN REQUESTED BY USER */}
      <div className="p-4 sm:p-5 bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900 border-b border-slate-800/80">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Gavel className="w-3.5 h-3.5" />
            Αριθμός Απόφασης / Έτος - Είδος Διατακτικού
          </span>
          {renderStatusBadge()}
        </div>

        {/* Primary Decision Output */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-blue-500/30 shadow-inner">
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight break-words font-mono">
            {record.decision && record.decision.replace(/&nbsp;/gi, '').trim() !== '' && record.decision.replace(/&nbsp;/gi, '').trim() !== '-'
              ? record.decision.replace(/&nbsp;/gi, '').trim()
              : 'Δεν έχει εκδοθεί απόφαση (Εκκρεμεί)'}
          </div>

          {/* Quick Context Chips */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
            <div className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
              Γ.Α.Κ.: <span className="font-mono font-semibold text-white">{record.gak}</span>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
              Ε.Α.Κ.: <span className="font-mono font-semibold text-white">{record.eak}</span>
            </div>
            {record.hearingResult && record.hearingResult !== '-' && (
              <div className="px-2.5 py-1 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                Συζήτηση: <span className="font-semibold text-white">{record.hearingResult}</span>
              </div>
            )}
          </div>

          {/* User Comment / Note for this decision */}
          <div className="mt-3 pt-3 border-t border-slate-800/80">
            {isEditingNote ? (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={localNote}
                  onChange={(e) => setLocalNote(e.target.value)}
                  placeholder="Σχόλιο (π.χ. Αγωγή κατά Τράπεζας, Μίσθωμα, Διατροφή...)"
                  className="flex-1 bg-slate-900 border border-blue-500 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onUpdateNote?.(localNote.trim());
                      setIsEditingNote(false);
                    }
                    if (e.key === 'Escape') setIsEditingNote(false);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    onUpdateNote?.(localNote.trim());
                    setIsEditingNote(false);
                  }}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                >
                  Αποθήκευση
                </button>
                {note && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateNote?.('');
                      setIsEditingNote(false);
                    }}
                    className="px-2 py-1 bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 rounded-lg text-xs"
                    title="Διαγραφή σχολίου"
                  >
                    Διαγραφή
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditingNote(false)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Ακύρωση
                </button>
              </div>
            ) : note ? (
              <div className="flex items-center justify-between gap-2 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-1.5 text-xs text-amber-200">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-semibold text-amber-300 shrink-0">Σχόλιο:</span>
                  <span className="truncate text-slate-100">{note}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLocalNote(note);
                    setIsEditingNote(true);
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
                  setLocalNote('');
                  setIsEditingNote(true);
                }}
                className="text-[11px] text-slate-400 hover:text-blue-300 flex items-center gap-1.5 transition py-0.5"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>+ Προσθήκη σχολίου (π.χ. Αγωγή κατά Τράπεζας, Μίσθωμα...)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="px-4 py-2.5 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between gap-2 text-xs flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Save to Device Button */}
          <button
            onClick={() => onToggleSave(record)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              isSaved
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{isSaved ? 'Αποθηκευμένο' : 'Αποθήκευση'}</span>
          </button>

          {/* Individual Notification Toggle Button */}
          {onToggleNotify && (
            <button
              type="button"
              onClick={onToggleNotify}
              title={notify ? "Ειδοποιήσεις: Ενεργές (Κλικ για σίγαση)" : "Ειδοποιήσεις: Σε σίγαση (Κλικ για ενεργοποίηση)"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors border ${
                notify
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {notify ? (
                <Bell className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              ) : (
                <BellOff className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{notify ? 'Ειδοποίηση: Ενεργή' : 'Σε Σίγαση'}</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Αντιγράφηκε!' : 'Αντιγραφή'}</span>
          </button>
        </div>

        {/* Share Button (Android Native Share) */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-medium transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Κοινοποίηση</span>
        </button>
      </div>

      {/* Accordion Toggle for Detailed Case Attributes & Publications */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800/70 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-between transition-colors border-t border-slate-800"
      >
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span>Λεπτομέρειες ΣΟΛΩΝ &amp; Δημοσιεύσεις ({isExpanded ? 'Σύμπτυξη' : 'Προβολή'})</span>
          {record.publications && record.publications.length > 0 && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {record.publications.length} {record.publications.length === 1 ? 'Δημοσίευση' : 'Δημοσιεύσεις'}
            </span>
          )}
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {/* Extended Case Data Table & Publications Section */}
      {isExpanded && (
        <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 text-xs space-y-4">
          {/* SECTION A: Δημοσιεύσεις (Καρτέλα "Δημοσιεύσεις" από ΣΟΛΩΝ) */}
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

                    {/* Operative / Δια ταύτα if populated */}
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

          {/* SECTION B: Στοιχεία Δικογράφου */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5 text-[11px]">
              <Gavel className="w-3.5 h-3.5 text-blue-400" />
              Στοιχεία Δικογράφου (ΣΟΛΩΝ)
            </span>
            <div className="divide-y divide-slate-800/60">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Διαδικασία:</span>
                <span className="font-semibold text-slate-100 text-right max-w-[65%]">{record.procedure}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Αντικείμενο:</span>
                <span className="font-medium text-slate-200 text-right max-w-[65%]">{record.subject}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Είδος:</span>
                <span className="font-medium text-slate-200 text-right">{record.kind}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Αριθμός Πινακίου:</span>
                <span className="font-mono text-slate-200 text-right max-w-[65%]">{record.docket}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Αποτέλεσμα Συζήτησης:</span>
                <span className="font-medium text-slate-200 text-right">{record.hearingResult}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
