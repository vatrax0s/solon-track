/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Scale, Download, ShieldCheck, ExternalLink, Bell, Smartphone, RefreshCw } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

interface HeaderProps {
  onOpenInfo: () => void;
  onOpenAutoCheck: () => void;
  onOpenInstall: () => void;
  isAutoCheckEnabled: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenInfo, onOpenAutoCheck, onOpenInstall, isAutoCheckEnabled }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 shadow-md shadow-blue-900/20 flex items-center justify-center text-white">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">ΣΟΛΩΝ Track</h1>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Έκδοση Αποφάσεων &bull; Υπ. Δικαιοσύνης
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Auto-check & Notification trigger button */}
          <button
            onClick={onOpenAutoCheck}
            title="Ρυθμίσεις Αυτόματου Ελέγχου & Ειδοποιήσεων"
            className={`relative p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
              isAutoCheckEnabled
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 font-medium'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <Bell className="w-4 h-4" />
            {isAutoCheckEnabled && (
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-1 animate-pulse" />
            )}
            <span className="hidden sm:inline text-xs">
              {isAutoCheckEnabled ? 'Αυτόματος Έλεγχος' : 'Ειδοποιήσεις'}
            </span>
          </button>

          {/* Install Button for Android / Desktop - always accessible so user is never locked out */}
          <button
            onClick={isInstallable ? install : onOpenInstall}
            title="Εγκατάσταση εφαρμογής στο κινητό (Android)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all active:scale-95"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Εγκατάσταση</span>
          </button>

          {/* Quick Refresh / Force Update Button */}
          <button
            onClick={() => {
              if (typeof (window as any).forceReloadLatestVersion === 'function') {
                (window as any).forceReloadLatestVersion();
              } else {
                window.location.reload();
              }
            }}
            title="Ανανέωση στην τελευταία έκδοση & καθαρισμός cache"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-colors active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Quick link to official portal */}
          <a
            href="https://extapps.solon.gov.gr/mojwp/faces/TrackLdoPublic"
            target="_blank"
            rel="noopener noreferrer"
            title="Άνοιγμα επίσημης πύλης Solon"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
