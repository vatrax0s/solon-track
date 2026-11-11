/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  Clock,
  ShieldCheck,
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Smartphone,
  Info,
  FileText,
  Landmark,
  Gavel
} from 'lucide-react';
import { notificationService } from '../services/notificationService.ts';
import { SavedSearchItem } from './SavedCases.tsx';

export interface AutoCheckConfig {
  enabled: boolean;
  intervalMinutes: number; // e.g. 1440, 720, 2880, 10080, 60
  lastCheckedTime?: number;
}

export interface CaseStatusChange {
  id: string;
  timestamp: string;
  courtName: string;
  gak: string;
  oldDecision: string;
  newDecision: string;
}

interface AutoCheckSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoCheckConfig;
  onChangeConfig: (newConfig: AutoCheckConfig) => void;
  savedCases: SavedSearchItem[];
  onToggleNotify: (id: string) => void;
  onRunCheckNow: () => void;
  isCheckingNow: boolean;
  changesHistory: CaseStatusChange[];
}

export const AutoCheckSettingsModal: React.FC<AutoCheckSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  savedCases,
  onToggleNotify,
  onRunCheckNow,
  isCheckingNow,
  changesHistory,
}) => {
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [permission, setPermission] = useState<string>(notificationService.getPermission());

  if (!isOpen) return null;

  const totalCount = savedCases.length;
  const monitoredCases = savedCases.filter((c) => c.notify !== false);
  const monitoredCount = monitoredCases.length;

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermission(notificationService.getPermission());
    if (granted) {
      setTestStatus('Η άδεια ειδοποιήσεων δόθηκε επιτυχώς!');
    } else {
      setTestStatus('Οι ειδοποιήσεις απορρίφθηκαν. Ενεργοποιήστε τες από τις ρυθμίσεις του browser σας.');
    }
    setTimeout(() => setTestStatus(null), 4000);
  };

  const handleTestNotification = async () => {
    const sent = await notificationService.sendTestNotification();
    if (sent) {
      setTestStatus('Εστάλη δοκιμαστική ειδοποίηση με ήχο στο κινητό σας!');
    } else {
      setTestStatus('Απαιτείται πρώτα να επιτρέψετε τις ειδοποιήσεις.');
    }
    setTimeout(() => setTestStatus(null), 4000);
  };

  const intervals = [
    { value: 1440, label: '24 ώρες (1 φορά την ημέρα / Καθημερινά)', badge: 'Προτεινόμενο' },
    { value: 720, label: '12 ώρες (2 φορές την ημέρα)' },
    { value: 2880, label: '48 ώρες (Κάθε 2 ημέρες)' },
    { value: 10080, label: '7 ημέρες (1 φορά την εβδομάδα)' },
    { value: 60, label: '1 ώρα (Συχνός έλεγχος / Επείγον)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/75 backdrop-blur-xs p-0 sm:p-4">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[92vh] shadow-2xl animate-in slide-in-from-bottom-6 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Handle for mobile */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Αυτόματος Έλεγχος &amp; Ειδοποιήσεις</h2>
              <p className="text-xs text-slate-400">Ειδοποίηση στο κινητό όταν εκδοθεί απόφαση</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Notification feedback message */}
          {testStatus && (
            <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-200 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{testStatus}</span>
            </div>
          )}

          {/* Master Toggle */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3 shadow-inner">
            <div className="space-y-0.5 pr-2">
              <div className="text-sm font-semibold text-white">Ενεργοποίηση Αυτόματου Ελέγχου</div>
              {totalCount === 0 ? (
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Δεν έχετε αποθηκεύσει ακόμη καμία υπόθεση. Μόλις εκτελέσετε μια αναζήτηση, θα αποθηκευτεί αυτόματα και θα μπορείτε να επιλέξετε αν θέλετε ειδοποιήσεις.
                </p>
              ) : monitoredCount === 0 ? (
                <p className="text-amber-300 text-[11px] leading-relaxed">
                  Έχετε <strong>{totalCount}</strong> αποθηκευμένες υποθέσεις, αλλά <strong>όλες είναι σε σίγαση</strong>. Επιλέξτε παρακάτω ποιες υποθέσεις θέλετε να παρακολουθούνται.
                </p>
              ) : (
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Η εφαρμογή θα ελέγχει περιοδικά τις <strong>{monitoredCount}</strong> επιλεγμένες υποθέσεις σας (από σύνολο {totalCount}) και θα σας ειδοποιεί όταν υπάρξει αλλαγή στο διατακτικό.
                </p>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => {
                  onChangeConfig({ ...config, enabled: e.target.checked });
                  if (e.target.checked && permission !== 'granted') {
                    handleRequestPermission();
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* PER-CASE NOTIFICATION SELECTION LIST (Requested by user: "η επιλογή ειδοποίησης πρέπει να είναι για όποια υπόθεση επιλέγει ο χρήστης, όχι για όλες") */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Επιλογή Υποθέσεων για Ειδοποίηση</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {monitoredCount} από {totalCount} ενεργές
              </span>
            </div>

            {totalCount === 0 ? (
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-slate-400 text-[11px]">
                Δεν υπάρχουν ακόμη αποθηκευμένες υποθέσεις.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-800/80 bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
                {savedCases.map((item) => {
                  const isMonitored = item.notify !== false;
                  const firstRec = item.records[0];
                  return (
                    <div
                      key={item.id}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-slate-200 truncate">{item.courtName}</span>
                          <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-semibold">
                            {item.query.searchType}: {item.query.number}/{item.query.year}
                          </span>
                        </div>
                        {item.notes && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-300 truncate">
                            <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{item.notes}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 truncate font-mono">
                          {firstRec?.decision && firstRec.decision.trim() !== '-'
                            ? firstRec.decision
                            : 'Εκκρεμεί απόφαση'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleNotify(item.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition border shrink-0 ${
                          isMonitored
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-xs'
                            : 'bg-slate-800/80 border-slate-700 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {isMonitored ? (
                          <Bell className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                        ) : (
                          <BellOff className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>{isMonitored ? 'Ενεργή' : 'Σίγαση'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interval Selection */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Συχνότητα Ελέγχου</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {intervals.map((item) => {
                const isSelected = config.intervalMinutes === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, intervalMinutes: item.value })}
                    className={`text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold'
                        : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Notifications Permission & Test Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Κατάσταση Ειδοποιήσεων Android</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  permission === 'granted'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                {permission === 'granted' ? 'ΕΝΕΡΓΕΣ' : 'ΑΠΑΙΤΕΙΤΑΙ ΑΔΕΙΑ'}
              </span>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Για να εμφανίζονται ειδοποιήσεις στην οθόνη του κινητού σας (push alert με ήχο), επιτρέψτε τις ειδοποιήσεις στον browser σας.
            </p>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {permission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors"
                >
                  Επιτρέψτε τις Ειδοποιήσεις
                </button>
              )}

              <button
                type="button"
                onClick={handleTestNotification}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3 h-3 text-amber-400" />
                <span>Δοκιμή Ειδοποίησης στο Κινητό</span>
              </button>
            </div>
          </div>

          {/* Manual Run Now Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onRunCheckNow}
              disabled={isCheckingNow || monitoredCount === 0}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <RotateCcw className={`w-4 h-4 text-blue-400 ${isCheckingNow ? 'animate-spin' : ''}`} />
              <span>
                {isCheckingNow
                  ? 'Έλεγχος υποθέσεων σε εξέλιξη...'
                  : monitoredCount === 0
                  ? 'Δεν έχουν επιλεγεί υποθέσεις για έλεγχο'
                  : `Έλεγχος Τώρα των ${monitoredCount} Επιλεγμένων Υποθέσεων`}
              </span>
            </button>
          </div>

          {/* Recent Changes Log */}
          {changesHistory.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Ιστορικό Αλλαγών &amp; Ειδοποιήσεων ({changesHistory.length})</span>
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto divide-y divide-slate-800/80">
                {changesHistory.map((item) => (
                  <div key={item.id} className="pt-2 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-medium text-slate-200">{item.courtName} (ΓΑΚ: {item.gak})</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg font-mono text-emerald-400">
                      {item.newDecision}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Αποθήκευση &amp; Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  );
};
