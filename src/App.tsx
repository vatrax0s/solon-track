/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Bookmark,
  BookOpen,
  WifiOff,
  AlertCircle,
  FileCheck2,
  Sparkles,
  ArrowRight,
  Gavel,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  History,
  Bell,
  Clock,
  Settings,
  Download
} from 'lucide-react';
import { Header } from './components/Header.tsx';
import { SearchForm } from './components/SearchForm.tsx';
import { CourtSelectorModal } from './components/CourtSelectorModal.tsx';
import { DecisionCard } from './components/DecisionCard.tsx';
import { SavedCases, SavedSearchItem } from './components/SavedCases.tsx';
import { InfoGuide } from './components/InfoGuide.tsx';
import {
  AutoCheckSettingsModal,
  AutoCheckConfig,
  CaseStatusChange
} from './components/AutoCheckSettingsModal.tsx';
import { InstallModal } from './components/InstallModal.tsx';
import { usePWAInstall } from './hooks/usePWAInstall.ts';
import { notificationService } from './services/notificationService.ts';
import { SolonCourt, SolonQuery, SolonQueryResult, SolonCaseRecord } from './solonService.ts';
import fallbackCourts from './data/courts.json';

// Helper to sanitize decision strings from &nbsp; and non-breaking spaces
function sanitizeDecision(text: string): string {
  const cleaned = (text || '').replace(/&nbsp;/gi, '').trim();
  return cleaned && cleaned !== '-' ? cleaned : 'Δεν έχει εκδοθεί απόφαση (Εκκρεμεί)';
}

function formatIntervalLabel(minutes: number): string {
  if (minutes === 1440) return '24 ώρες (Καθημερινά)';
  if (minutes === 720) return '12 ώρες (2x/ημέρα)';
  if (minutes === 2880) return '48 ώρες (2 ημέρες)';
  if (minutes === 10080) return '7 ημέρες';
  if (minutes >= 60) return `${Math.round(minutes / 60)} ώρες`;
  return `${minutes} λεπτά`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'results' | 'saved' | 'info'>('search');
  const [courts, setCourts] = useState<SolonCourt[]>(fallbackCourts as SolonCourt[]);
  const [selectedCourt, setSelectedCourt] = useState<SolonCourt | null>(null);
  const [isCourtModalOpen, setIsCourtModalOpen] = useState(false);
  const [isAutoCheckModalOpen, setIsAutoCheckModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // Search query state
  const [query, setQuery] = useState<SolonQuery>({
    courtOfficeOC: '4', // Default to Ειρηνοδικείο Αθηνών
    searchType: 'GAK',
    number: '',
    year: new Date().getFullYear().toString(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingNow, setIsCheckingNow] = useState(false);
  const [activeRecheckingId, setActiveRecheckingId] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('');
  const [searchResult, setSearchResult] = useState<SolonQueryResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Auto-check configuration state - 24 hours (1440 min) as requested
  const [autoCheckConfig, setAutoCheckConfig] = useState<AutoCheckConfig>(() => {
    try {
      const stored = localStorage.getItem('solon_autocheck_config');
      return stored ? JSON.parse(stored) : { enabled: false, intervalMinutes: 1440, lastCheckedTime: Date.now() };
    } catch {
      return { enabled: false, intervalMinutes: 1440, lastCheckedTime: Date.now() };
    }
  });

  // Changes history log
  const [changesHistory, setChangesHistory] = useState<CaseStatusChange[]>(() => {
    try {
      const stored = localStorage.getItem('solon_changes_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Saved searches in localStorage - persistent across app sessions
  const [savedCases, setSavedCases] = useState<SavedSearchItem[]>(() => {
    try {
      const stored = localStorage.getItem('solon_saved_searches');
      let items: any[] = [];
      if (stored) {
        items = JSON.parse(stored);
      } else {
        const older = localStorage.getItem('solon_saved_cases');
        if (older) {
          items = JSON.parse(older);
        }
      }

      if (Array.isArray(items)) {
        return items.map((item: any) => {
          const recs = item.records || (item.record ? [item.record] : []);
          const sanitizedRecords = recs.map((r: any) => {
            const dec = sanitizeDecision(r.decision);
            const isIssued = dec !== 'Δεν έχει εκδοθεί απόφαση (Εκκρεμεί)';
            return {
              ...r,
              decision: dec,
              decisionIssued: isIssued,
              decisionStatus: isIssued ? (r.decisionStatus || 'neutral') : 'pending',
            };
          });

          return {
            id: item.id || `case-${item.query?.courtOfficeOC || '4'}-${item.query?.number || ''}`,
            savedAt: item.savedAt || new Date().toISOString(),
            lastCheckedAt: item.lastCheckedAt || new Date().toISOString(),
            courtOfficeOC: item.query?.courtOfficeOC || item.courtOfficeOC || '4',
            courtName: item.courtName || 'Δικαστήριο',
            query: item.query || { courtOfficeOC: '4', searchType: 'GAK', number: '', year: '2023' },
            records: sanitizedRecords,
            notes: item.notes || '',
            notify: item.notify !== undefined ? Boolean(item.notify) : true,
          };
        });
      }
      return [];
    } catch {
      return [];
    }
  });

  // Connectivity
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch courts list from backend on mount
  useEffect(() => {
    fetch('/api/courts')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCourts(data);
          const found = data.find((c: SolonCourt) => c.value === query.courtOfficeOC);
          if (found) setSelectedCourt(found);
        }
      })
      .catch((e) => console.log('Using bundled courts data:', e));
  }, []);

  // Set default court if not set
  useEffect(() => {
    if (!selectedCourt && courts.length > 0) {
      const defaultCourt = courts.find((c) => c.value === query.courtOfficeOC) || courts[0];
      setSelectedCourt(defaultCourt);
    }
  }, [courts]);

  // Persist saved searches to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('solon_saved_searches', JSON.stringify(savedCases));
    } catch (e) {
      console.error('Failed to save searches to local storage:', e);
    }
  }, [savedCases]);

  // Persist auto-check config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('solon_autocheck_config', JSON.stringify(autoCheckConfig));
    } catch (e) {
      console.error('Failed to save autocheck config:', e);
    }
  }, [autoCheckConfig]);

  // Persist changes history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('solon_changes_history', JSON.stringify(changesHistory));
    } catch (e) {
      console.error('Failed to save changes history:', e);
    }
  }, [changesHistory]);

  // Automatic Scheduled Background / Periodic Check Timer
  useEffect(() => {
    const monitoredCount = savedCases.filter((c) => c.notify !== false).length;
    if (!autoCheckConfig.enabled || monitoredCount === 0) return;

    const intervalTimer = setInterval(() => {
      const now = Date.now();
      const last = autoCheckConfig.lastCheckedTime || 0;
      const intervalMs = autoCheckConfig.intervalMinutes * 60 * 1000;

      if (now - last >= intervalMs && !isLoading && !isCheckingNow && isOnline) {
        runAllCasesCheck();
      }
    }, 25000); // Poll every 25 seconds to see if interval expired

    return () => clearInterval(intervalTimer);
  }, [autoCheckConfig, savedCases, isLoading, isCheckingNow, isOnline]);

  const handleSelectCourt = (court: SolonCourt) => {
    setSelectedCourt(court);
    setQuery((prev) => ({
      ...prev,
      courtOfficeOC: court.value,
      courtName: court.name,
    }));
  };

  const handleExecuteSearch = async (targetQuery: SolonQuery, triggeredFromSavedId?: string) => {
    if (!isOnline) {
      setErrorMsg('Δεν υπάρχει σύνδεση στο διαδίκτυο. Παρακαλώ ελέγξτε τη σύνδεσή σας.');
      return;
    }

    setIsLoading(true);
    if (triggeredFromSavedId) {
      setActiveRecheckingId(triggeredFromSavedId);
    }
    setErrorMsg(null);
    setSuccessToast(null);
    setLoadingStep('1/4: Σύνδεση με πύλη ΣΟΛΩΝ...');

    const stepTimer1 = setTimeout(() => setLoadingStep('2/4: Έλεγχος περιόδου & ViewState...'), 1200);
    const stepTimer2 = setTimeout(() => setLoadingStep('3/4: Αποστολή αιτήματος αναζήτησης...'), 2600);
    const stepTimer3 = setTimeout(() => setLoadingStep('4/4: Ανάκτηση απόφασης δικογράφου...'), 4200);

    try {
      const res = await fetch('/api/solon/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtOfficeOC: targetQuery.courtOfficeOC,
          searchType: targetQuery.searchType,
          number: targetQuery.number,
          year: targetQuery.year,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      const data: SolonQueryResult = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Σφάλμα κατά την επικοινωνία με την πύλη ΣΟΛΩΝ.');
        setSearchResult(data);
      } else {
        // Sanitize any &nbsp; or empty decisions
        const sanitizedRecords = (data.records || []).map((r) => {
          const dec = sanitizeDecision(r.decision);
          const isIssued = dec !== 'Δεν έχει εκδοθεί απόφαση (Εκκρεμεί)';
          return {
            ...r,
            decision: dec,
            decisionIssued: isIssued,
            decisionStatus: isIssued ? r.decisionStatus : 'pending',
            publications: r.publications || [],
            publicationsChecked: true,
          };
        });

        data.records = sanitizedRecords;
        setSearchResult(data);

        // AUTOMATICALLY SAVE / UPDATE SEARCH IN PERSISTENT STORAGE
        const courtName = data.courtName || selectedCourt?.name || `Δικαστήριο #${targetQuery.courtOfficeOC}`;
        const searchId = `${targetQuery.courtOfficeOC}-${targetQuery.searchType}-${targetQuery.number}-${targetQuery.year}`;

        setSavedCases((prev) => {
          const existingIdx = prev.findIndex(
            (sc) =>
              sc.courtOfficeOC === targetQuery.courtOfficeOC &&
              sc.query.searchType === targetQuery.searchType &&
              sc.query.number === targetQuery.number &&
              sc.query.year === targetQuery.year
          );

          const existingItem = existingIdx >= 0 ? prev[existingIdx] : null;

          const updatedItem: SavedSearchItem = {
            id: searchId,
            savedAt: existingItem ? existingItem.savedAt : new Date().toISOString(),
            lastCheckedAt: new Date().toISOString(),
            courtOfficeOC: targetQuery.courtOfficeOC,
            courtName,
            query: { ...targetQuery, courtName },
            records: sanitizedRecords,
            notes: existingItem?.notes || '',
            notify: existingItem?.notify !== undefined ? existingItem.notify : true,
          };

          if (existingIdx >= 0) {
            const next = [...prev];
            next[existingIdx] = updatedItem;
            return next;
          } else {
            return [updatedItem, ...prev];
          }
        });

        const firstDecision = sanitizedRecords[0]?.decision;
        if (firstDecision) {
          setSuccessToast(`Η αναζήτηση ολοκληρώθηκε! Απόφαση: ${firstDecision}`);
          setTimeout(() => setSuccessToast(null), 5000);
        }

        // If triggered from rechecking button, stay in current view, else show results tab
        if (!triggeredFromSavedId) {
          setActiveTab('results');
        }
      }
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setErrorMsg('Αδυναμία σύνδεσης με τον διακομιστή. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setIsLoading(false);
      setActiveRecheckingId(null);
      setLoadingStep('');
    }
  };

  // Re-check monitored saved cases and detect any changes
  const runAllCasesCheck = async () => {
    const monitoredCases = savedCases.filter((c) => c.notify !== false);
    if (monitoredCases.length === 0 || isLoading || isCheckingNow) {
      if (savedCases.length > 0 && monitoredCases.length === 0) {
        setSuccessToast('Δεν έχουν επιλεγεί υποθέσεις για έλεγχο (είναι όλες σε σίγαση).');
        setTimeout(() => setSuccessToast(null), 4000);
      }
      return;
    }
    setIsCheckingNow(true);

    let updatedCount = 0;
    const newChanges: CaseStatusChange[] = [];
    const currentSaved = [...savedCases];

    for (let i = 0; i < currentSaved.length; i++) {
      const item = currentSaved[i];
      if (item.notify === false) continue; // Skip cases where user muted notifications
      try {
        const res = await fetch('/api/solon/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courtOfficeOC: item.query.courtOfficeOC,
            searchType: item.query.searchType,
            number: item.query.number,
            year: item.query.year,
          }),
        });

        const data: SolonQueryResult = await res.json();
        if (data.success && data.records.length > 0) {
          const sanitizedRecords = (data.records || []).map((r) => {
            const dec = sanitizeDecision(r.decision);
            const isIssued = dec !== 'Δεν έχει εκδοθεί απόφαση (Εκκρεμεί)';
            return {
              ...r,
              decision: dec,
              decisionIssued: isIssued,
              decisionStatus: isIssued ? r.decisionStatus : 'pending',
              publications: r.publications || item.records[0]?.publications || [],
              publicationsChecked: true,
            };
          });

          const oldDecision = sanitizeDecision(item.records[0]?.decision || '');
          const newDecision = sanitizedRecords[0]?.decision || '';

          const hasStatusChange =
            oldDecision &&
            newDecision &&
            oldDecision !== newDecision &&
            (oldDecision.includes('Εκκρεμεί') || !newDecision.includes('Εκκρεμεί'));

          if (hasStatusChange) {
            const changeEvent: CaseStatusChange = {
              id: `chg-${Date.now()}-${i}`,
              timestamp: new Date().toISOString(),
              courtName: item.courtName,
              gak: item.records[0]?.gak || `${item.query.number}/${item.query.year}`,
              oldDecision,
              newDecision,
            };
            newChanges.push(changeEvent);

            // Send notification with audio chime to mobile
            await notificationService.notifyCaseChange({
              courtName: item.courtName,
              gak: changeEvent.gak,
              newDecision: changeEvent.newDecision,
              oldDecision: changeEvent.oldDecision,
              caseId: item.id,
            });
          }

          currentSaved[i] = {
            ...item,
            lastCheckedAt: new Date().toISOString(),
            records: sanitizedRecords,
          };
          updatedCount++;
        }
      } catch (err) {
        console.error('Error auto-checking case:', item.id, err);
      }
    }

    setSavedCases(currentSaved);

    if (newChanges.length > 0) {
      setChangesHistory((prev) => [...newChanges, ...prev].slice(0, 50));
      setSuccessToast(`⚖️ Εντοπίστηκε αλλαγή σε ${newChanges.length} υπόθεση/εις! Εστάλη ειδοποίηση.`);
    } else {
      setSuccessToast(`✓ Ελέγχθηκαν επιτυχώς ${updatedCount} υποθέσεις (καμία αλλαγή).`);
    }
    setTimeout(() => setSuccessToast(null), 5000);

    setAutoCheckConfig((prev) => ({
      ...prev,
      lastCheckedTime: Date.now(),
    }));
    setIsCheckingNow(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteSearch(query);
  };

  const handleLoadExample = (example: { courtValue: string; searchType: 'GAK' | 'EAK'; number: string; year: string }) => {
    const court = courts.find((c) => c.value === example.courtValue);
    if (court) setSelectedCourt(court);
    const newQuery: SolonQuery = {
      courtOfficeOC: example.courtValue,
      courtName: court ? court.name : undefined,
      searchType: example.searchType,
      number: example.number,
      year: example.year,
    };
    setQuery(newQuery);
    handleExecuteSearch(newQuery);
  };

  const handleToggleSave = (record: SolonCaseRecord) => {
    const searchId = `${query.courtOfficeOC}-${query.searchType}-${query.number}-${query.year}`;
    const exists = savedCases.some((sc) => sc.id === searchId);

    if (exists) {
      setSavedCases((prev) => prev.filter((sc) => sc.id !== searchId));
      setSuccessToast('Η υπόθεση αφαιρέθηκε από τα αποθηκευμένα.');
    } else {
      const courtName = selectedCourt ? selectedCourt.name : query.courtOfficeOC;
      const cleanRec = {
        ...record,
        decision: sanitizeDecision(record.decision),
      };
      const newItem: SavedSearchItem = {
        id: searchId,
        savedAt: new Date().toISOString(),
        lastCheckedAt: new Date().toISOString(),
        courtOfficeOC: query.courtOfficeOC,
        courtName,
        query: { ...query, courtName },
        records: [cleanRec],
        notes: '',
        notify: true,
      };
      setSavedCases((prev) => [newItem, ...prev]);
      setSuccessToast('Η υπόθεση αποθηκεύτηκε επιτυχώς!');
    }
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleToggleNotify = (id: string) => {
    setSavedCases((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, notify: item.notify === false ? true : false } : item
      );
      try {
        localStorage.setItem('solon_saved_searches', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist notification toggle:', e);
      }
      return updated;
    });
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setSavedCases((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, notes } : item));
      try {
        localStorage.setItem('solon_saved_searches', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist note update:', e);
      }
      return updated;
    });
    setSuccessToast(notes.trim() ? 'Το σχόλιο αποθηκεύτηκε επιτυχώς!' : 'Το σχόλιο αφαιρέθηκε.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleRecheckSavedCase = (item: SavedSearchItem) => {
    const targetCourt = courts.find((c) => c.value === item.courtOfficeOC);
    if (targetCourt) setSelectedCourt(targetCourt);
    setQuery(item.query);
    handleExecuteSearch(item.query, item.id);
  };

  const handleSelectSavedCase = (item: SavedSearchItem) => {
    const fakeResult: SolonQueryResult = {
      success: true,
      courtName: item.courtName,
      query: item.query,
      timestamp: item.lastCheckedAt,
      count: item.records.length,
      records: item.records,
    };
    setSearchResult(fakeResult);
    setActiveTab('results');
  };

  const handleRemoveSavedCase = (id: string) => {
    setSavedCases((prev) => prev.filter((sc) => sc.id !== id));
  };

  const handleClearAllSaved = () => {
    if (window.confirm('Είστε βέβαιοι ότι θέλετε να διαγράψετε όλες τις αποθηκευμένες αναζητήσεις;')) {
      setSavedCases([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24">
      {/* Top App Bar */}
      <Header
        onOpenInfo={() => setActiveTab('info')}
        onOpenAutoCheck={() => setIsAutoCheckModalOpen(true)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        isAutoCheckEnabled={autoCheckConfig.enabled}
      />

      {/* Prominent Mobile Install & Version Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-blue-500/30 px-4 py-2 flex items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Download className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white truncate">ΣΟΛΩΝ Track v4</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Νέα Έκδοση
              </span>
            </div>
            <span className="text-slate-300 text-[11px] truncate block">
              Μπλε εικονίδιο &bull; Αποθήκευση σχολίων
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (typeof (window as any).forceReloadLatestVersion === 'function') {
                (window as any).forceReloadLatestVersion();
              } else {
                window.location.reload();
              }
            }}
            title="Καθαρισμός cache & φόρτωση νέας έκδοσης"
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 rounded-xl text-xs transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Ανανέωση</span>
          </button>
          <button
            onClick={async () => {
              if (isInstallable) {
                const ok = await install();
                if (!ok) {
                  setIsInstallModalOpen(true);
                }
              } else {
                setIsInstallModalOpen(true);
              }
            }}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-xl shadow-md shadow-blue-900/30 text-xs transition flex items-center gap-1.5"
          >
            <span>Εγκατάσταση</span>
          </button>
        </div>
      </div>

      {/* Offline Toast */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs px-4 py-2 flex items-center justify-center gap-2 font-medium shadow-sm">
          <WifiOff className="w-4 h-4" />
          <span>Λειτουργία εκτός σύνδεσης &bull; Προβολή μόνο αποθηκευμένων υποθέσεων</span>
        </div>
      )}

      {/* Success Notification Banner */}
      {successToast && (
        <div className="max-w-3xl w-full mx-auto px-4 pt-3">
          <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-emerald-200 text-xs shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-emerald-400 hover:text-white font-bold ml-2 text-sm"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 sm:py-6 space-y-6">
        {/* Error Banner */}
        {errorMsg && (
          <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-3.5 flex items-start gap-3 text-rose-200 text-xs shadow-md animate-in fade-in duration-150">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-rose-300">Προσοχή:</div>
              <div>{errorMsg}</div>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white font-bold ml-2">
              &times;
            </button>
          </div>
        )}

        {/* TAB 1: SEARCH & SAVED CASES AVAILABLE IMMEDIATELY UPON OPENING */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Auto-check status card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    autoCheckConfig.enabled
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>Αυτόματος Έλεγχος &amp; Ειδοποιήσεις</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        autoCheckConfig.enabled
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {autoCheckConfig.enabled ? `ΕΝΕΡΓΟΣ (${formatIntervalLabel(autoCheckConfig.intervalMinutes)})` : 'ΑΝΕΝΕΡΓΟΣ'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {autoCheckConfig.enabled
                      ? `Ελέγχει αυτόματα τις αποθηκευμένες υποθέσεις κάθε ${formatIntervalLabel(autoCheckConfig.intervalMinutes)}.`
                      : 'Λάβετε ειδοποίηση στο κινητό όταν εκδοθεί απόφαση.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAutoCheckModalOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Ρύθμιση</span>
              </button>
            </div>

            {/* Search Input Form */}
            <SearchForm
              courts={courts}
              selectedCourt={selectedCourt}
              onOpenCourtModal={() => setIsCourtModalOpen(true)}
              onSelectCourt={handleSelectCourt}
              query={query}
              setQuery={setQuery}
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
              loadingStep={loadingStep}
              onLoadExample={handleLoadExample}
            />

            {/* SAVED SEARCHES SECTION: AVAILABLE IMMEDIATELY ON HOME SCREEN WITH ALL INFORMATION */}
            {savedCases.length > 0 && (
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">
                      Αποθηκευμένες Αναζητήσεις ({savedCases.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Έτοιμες για επανεκτέλεση με 1 πάτημα
                  </span>
                </div>

                <SavedCases
                  savedCases={savedCases}
                  onRemove={handleRemoveSavedCase}
                  onRecheck={handleRecheckSavedCase}
                  onSelect={handleSelectSavedCase}
                  onClearAll={handleClearAllSaved}
                  onToggleNotify={handleToggleNotify}
                  onUpdateNotes={handleUpdateNotes}
                  isLoading={isLoading || isCheckingNow}
                  activeRecheckingId={activeRecheckingId}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE RESULTS VIEW */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            {searchResult && (
              <>
                {/* Result Header */}
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-emerald-400" />
                      <span>Αποτέλεσμα Αναζήτησης</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchResult.courtName} &bull; {searchResult.query.searchType}: {searchResult.query.number}/{searchResult.query.year}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2.5 py-1 bg-blue-600/10 rounded-lg border border-blue-500/20"
                  >
                    Νέα Αναζήτηση
                  </button>
                </div>

                {/* If records found */}
                {searchResult.records.length > 0 ? (
                  <div className="space-y-4">
                    {searchResult.records.map((record) => {
                      const searchId = `${searchResult.query.courtOfficeOC}-${searchResult.query.searchType}-${searchResult.query.number}-${searchResult.query.year}`;
                      const matchedItem = savedCases.find(
                        (sc) =>
                          sc.id === searchId ||
                          (sc.records.some((r) => r.gak === record.gak) && String(sc.courtOfficeOC).trim() === String(searchResult.query.courtOfficeOC).trim())
                      );
                      const isSaved = !!matchedItem;
                      return (
                        <DecisionCard
                          key={record.id}
                          record={record}
                          courtName={searchResult.courtName}
                          isSaved={isSaved}
                          onToggleSave={handleToggleSave}
                          onRefresh={() => handleExecuteSearch(searchResult.query)}
                          note={matchedItem?.notes || ''}
                          onUpdateNote={(newNote) => {
                            if (matchedItem) {
                              handleUpdateNotes(matchedItem.id, newNote);
                            } else {
                              const cleanRec = {
                                ...record,
                                decision: sanitizeDecision(record.decision),
                              };
                              const newItem: SavedSearchItem = {
                                id: searchId,
                                savedAt: new Date().toISOString(),
                                lastCheckedAt: new Date().toISOString(),
                                courtOfficeOC: searchResult.query.courtOfficeOC,
                                courtName: searchResult.courtName,
                                query: searchResult.query,
                                records: [cleanRec],
                                notes: newNote,
                                notify: true,
                              };
                              setSavedCases((prev) => {
                                const next = [newItem, ...prev.filter((sc) => sc.id !== searchId)];
                                try {
                                  localStorage.setItem('solon_saved_searches', JSON.stringify(next));
                                } catch (e) {
                                  console.error('Failed to persist new saved case with note:', e);
                                }
                                return next;
                              });
                              setSuccessToast(newNote.trim() ? 'Η υπόθεση και το σχόλιο αποθηκεύτηκαν επιτυχώς!' : 'Η υπόθεση αποθηκεύτηκε!');
                              setTimeout(() => setSuccessToast(null), 3500);
                            }
                          }}
                          notify={matchedItem ? matchedItem.notify !== false : true}
                          onToggleNotify={() => {
                            if (matchedItem) {
                              handleToggleNotify(matchedItem.id);
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  /* No records found */
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-amber-400" />
                    </div>
                    <h3 className="text-base font-semibold text-white">Δεν βρέθηκαν εγγραφές</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      Δεν εντοπίστηκε δικόγραφο για το <strong>{searchResult.courtName}</strong> με{' '}
                      {searchResult.query.searchType} <strong>{searchResult.query.number}/{searchResult.query.year}</strong>.
                      Ελέγξτε αν ο αριθμός ή το έτος κατάθεσης είναι σωστά.
                    </p>
                    <button
                      onClick={() => setActiveTab('search')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Επιστροφή στη φόρμα</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {!searchResult && (
              <div className="text-center py-16 space-y-3">
                <Search className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Δεν έχει γίνει ακόμα αναζήτηση.</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                >
                  Μετάβαση στην Αναζήτηση
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DEDICATED SAVED SEARCHES TAB */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-300">
                  Αυτόματος έλεγχος: <strong>{autoCheckConfig.enabled ? `Ενεργός (${formatIntervalLabel(autoCheckConfig.intervalMinutes)})` : 'Ανενεργός'}</strong>
                </span>
              </div>
              <button
                onClick={() => setIsAutoCheckModalOpen(true)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                Ρυθμίσεις Ειδοποιήσεων
              </button>
            </div>

            <SavedCases
              savedCases={savedCases}
              onRemove={handleRemoveSavedCase}
              onRecheck={handleRecheckSavedCase}
              onSelect={handleSelectSavedCase}
              onClearAll={handleClearAllSaved}
              onToggleNotify={handleToggleNotify}
              onUpdateNotes={handleUpdateNotes}
              isLoading={isLoading || isCheckingNow}
              activeRecheckingId={activeRecheckingId}
            />
          </div>
        )}

        {/* TAB 4: INFO & GUIDE */}
        {activeTab === 'info' && <InfoGuide />}
      </main>

      {/* Auto-check & Notification Settings Modal */}
      <AutoCheckSettingsModal
        isOpen={isAutoCheckModalOpen}
        onClose={() => setIsAutoCheckModalOpen(false)}
        config={autoCheckConfig}
        onChangeConfig={setAutoCheckConfig}
        savedCases={savedCases}
        onToggleNotify={handleToggleNotify}
        onRunCheckNow={runAllCasesCheck}
        isCheckingNow={isCheckingNow}
        changesHistory={changesHistory}
      />

      {/* Court Selector Modal */}
      <CourtSelectorModal
        isOpen={isCourtModalOpen}
        onClose={() => setIsCourtModalOpen(false)}
        courts={courts}
        selectedCourtValue={query.courtOfficeOC}
        onSelect={handleSelectCourt}
      />

      {/* Install on Mobile Modal */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Android Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-2">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1 text-center">
          {/* Tab 1: Search */}
          <button
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              activeTab === 'search'
                ? 'text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === 'search' ? 'bg-blue-500/20' : ''}`}>
              <Search className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Αναζήτηση</span>
          </button>

          {/* Tab 2: Result */}
          <button
            onClick={() => setActiveTab('results')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all relative ${
              activeTab === 'results'
                ? 'text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === 'results' ? 'bg-blue-500/20' : ''}`}>
              <FileCheck2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Απόφαση</span>
            {searchResult && searchResult.records.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1/4" />
            )}
          </button>

          {/* Tab 3: Saved */}
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all relative ${
              activeTab === 'saved'
                ? 'text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === 'saved' ? 'bg-blue-500/20' : ''}`}>
              <Bookmark className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Αποθηκευμένα</span>
            {savedCases.length > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-amber-500 text-slate-950 absolute top-1 right-1/4">
                {savedCases.length}
              </span>
            )}
          </button>

          {/* Tab 4: Info */}
          <button
            onClick={() => setActiveTab('info')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              activeTab === 'info'
                ? 'text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === 'info' ? 'bg-blue-500/20' : ''}`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Οδηγίες</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
