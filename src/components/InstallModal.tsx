/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Sparkles,
  Share2,
  RotateCcw,
  PackageCheck,
  FileCode,
  Layers
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwabuilder' | 'mobile'>('pwabuilder');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);

  if (!isOpen) return null;

  const pwabuilderUrl = 'https://ais-pre-fdjiaashsyqgrt67fucewi-658228181857.europe-west1.run.app';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : pwabuilderUrl;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}&bgcolor=0f172a&color=ffffff&margin=10`;

  const manifestData = {
    id: "/",
    name: "Solon Track - Έκδοση Αποφάσεων",
    short_name: "SolonTrack",
    description: "Παρακολούθηση πορείας υποθέσεων και έκδοσης δικαστικών αποφάσεων από το portal ΣΟΛΩΝ.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#020617",
    theme_color: "#0f172a",
    lang: "el",
    dir: "ltr",
    categories: ["legal", "utilities", "productivity"],
    prefer_related_applications: false,
    related_applications: [],
    icons: [
      {
        src: "https://fonts.gstatic.com/s/e/notoemoji/latest/2696_fe0f/512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "https://fonts.gstatic.com/s/e/notoemoji/latest/2696_fe0f/512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Balance%20scale/3D/balance_scale_3d.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any"
      }
    ]
  };

  const manifestJsonString = JSON.stringify(manifestData, null, 2);

  const handleCopyUrl = (urlToCopy: string) => {
    navigator.clipboard.writeText(urlToCopy);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(manifestJsonString);
    setCopiedManifest(true);
    setTimeout(() => setCopiedManifest(false), 3000);
  };

  const handleDownloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDirectInstall = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Δημιουργία APK &amp; Εγκατάσταση</h2>
              <p className="text-xs text-slate-400">PWABuilder Android Package &amp; Οδηγός κινητού</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('pwabuilder')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'pwabuilder'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Δημιουργία APK (PWABuilder)</span>
          </button>
          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'mobile'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Εγκατάσταση στο Κινητό</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-300 flex-1">
          {/* TAB 1: PWABUILDER GUIDE & MANIFEST EXPORT */}
          {activeTab === 'pwabuilder' && (
            <div className="space-y-4">
              {/* Step 1: Which URL to put */}
              <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center">1</span>
                    Σύνδεσμος για το PWABuilder:
                  </span>
                  <a
                    href="https://www.pwabuilder.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium underline"
                  >
                    <span>Άνοιγμα PWABuilder</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Στο πεδίο του <strong>PWABuilder (pwabuilder.com)</strong> επικολλήστε αυτόν τον σύνδεσμο:
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pwabuilderUrl}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-blue-300 font-mono truncate focus:outline-none select-all"
                  />
                  <button
                    onClick={() => handleCopyUrl(pwabuilderUrl)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shrink-0 shadow-sm"
                  >
                    {copiedUrl ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Αντιγράφηκε!' : 'Αντιγραφή'}</span>
                  </button>
                </div>
              </div>

              {/* Step 2: What to do if PWABuilder complains about Manifest */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <h4 className="font-bold text-amber-300">
                      Αν το PWABuilder εμφανίσει: «No manifest found» / «Missing Manifest»:
                    </h4>
                    <p className="text-amber-200/90 leading-relaxed">
                      Αυτό συμβαίνει επειδή οι διακομιστές Cloud Run της Google προστατεύουν τις προεπισκοπήσεις με cookie ασφαλείας, εμποδίζοντας το εξωτερικό bot του PWABuilder να διαβάσει απευθείας το αρχείο.
                    </p>
                    <p className="text-emerald-400 font-semibold pt-0.5">
                      👉 <strong>Άμεση Λύση:</strong> Προσθέστε το Manifest με 1 κλικ!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-blue-400" />
                      Έτοιμο Manifest JSON (με πλήρεις διαδρομές εικόνων)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyManifest}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                      >
                        {copiedManifest ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedManifest ? 'Αντιγράφηκε!' : 'Αντιγραφή JSON'}</span>
                      </button>
                      <button
                        onClick={() => handleDownloadFile('manifest.json', manifestJsonString, 'application/json')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Λήψη .json</span>
                      </button>
                    </div>
                  </div>

                  <pre className="text-[11px] font-mono bg-slate-900/90 p-2.5 rounded border border-slate-800 text-slate-300 max-h-36 overflow-y-auto">
                    {manifestJsonString}
                  </pre>
                </div>

                {/* Step-by-step in PWABuilder */}
                <div className="text-xs text-slate-300 space-y-1.5 pt-1">
                  <div className="font-semibold text-slate-200">Πώς το εισάγετε στο PWABuilder:</div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                    <li>Στο PWABuilder, πηγαίνετε στην καρτέλα <strong>Manifest</strong>.</li>
                    <li>Πατήστε <strong>Edit Manifest</strong> (ή <strong>Upload</strong>) και κάντε επικόλληση του JSON.</li>
                    <li>
                      Πατήστε <strong>Package for Stores</strong> ➔ <strong>Android</strong> ➔ <strong>Generate Package</strong>.
                    </li>
                  </ol>
                </div>
              </div>

              {/* Direct Icon downloads and CDN URL */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-white block">Επίσημα Εικονίδια PNG (192px &amp; 512px)</span>
                    <span className="text-slate-400 text-[11px] block">Δημόσιο CDN URL χωρίς 403 blocks για το PWABuilder</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="/icon-192.png"
                      download="icon-192.png"
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs flex items-center gap-1 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>192px</span>
                    </a>
                    <a
                      href="/icon-512.png"
                      download="icon-512.png"
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs flex items-center gap-1 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>512px</span>
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-300 truncate font-mono">
                      512x512 CDN (Google Noto): fonts.gstatic.com/.../512.png
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("https://fonts.gstatic.com/s/e/notoemoji/latest/2696_fe0f/512.png");
                        alert("Αντιγράφηκε το URL του εικονιδίου 512x512!");
                      }}
                      className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-[11px] font-medium shrink-0 flex items-center gap-1 active:scale-95"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Αντιγραφή 512px URL</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 truncate font-mono">
                      256x256 CDN (Fluent 3D): jsdelivr.net/.../balance_scale_3d.png
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Balance%20scale/3D/balance_scale_3d.png");
                        alert("Αντιγράφηκε το URL του εικονιδίου 256x256!");
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium shrink-0 flex items-center gap-1 active:scale-95"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Αντιγραφή 256px URL</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT MOBILE INSTALL */}
          {activeTab === 'mobile' && (
            <div className="space-y-4">
              {/* Quick Force Reload / Clear Cache */}
              <div className="bg-blue-950/40 border border-blue-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-white block">Δεν βλέπετε τις τελευταίες αλλαγές;</span>
                  <span className="text-slate-300 text-[11px] block">Καθαρισμός μνήμης cache &amp; άμεση λήψη της νέας έκδοσης</span>
                </div>
                <button
                  onClick={() => {
                    if (typeof (window as any).forceReloadLatestVersion === 'function') {
                      (window as any).forceReloadLatestVersion();
                    } else {
                      window.location.reload();
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs shrink-0 transition flex items-center gap-1.5 active:scale-95 shadow-md shadow-blue-900/30"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Φόρτωση Τώρα</span>
                </button>
              </div>

              {/* Direct Install Button if supported */}
              {isInstallable && !isInstalled && (
                <div className="bg-blue-600/15 border border-blue-500/30 rounded-xl p-4 text-center space-y-2">
                  <p className="text-xs text-blue-200">
                    Ο περιηγητής σας υποστηρίζει άμεση εγκατάσταση με 1 κλικ:
                  </p>
                  <button
                    onClick={handleDirectInstall}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Εγκατάσταση Τώρα στη Συσκευή
                  </button>
                </div>
              )}

              {/* Instructions for Android Chrome */}
              <div className="space-y-3 bg-slate-800/40 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Οδηγίες Εγκατάστασης σε 2 Βήματα στο Android
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <p>
                      Ανοίξτε το link στον <strong>Google Chrome</strong> στο κινητό σας.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <div>
                      <p>
                        Πατήστε τις <strong>τρεις τελείες (⋮)</strong> επάνω δεξιά στον Chrome και επιλέξτε:
                      </p>
                      <p className="font-semibold text-emerald-400 mt-0.5">
                        «Εγκατάσταση εφαρμογής» ή «Προσθήκη στην αρχική οθόνη»
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Link / QR Code to open on mobile */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-300">
                  Σύνδεσμος για να τον ανοίξετε στο κινητό:
                </h4>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono truncate focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopyUrl(currentUrl)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition active:scale-95 shrink-0"
                  >
                    {copiedUrl ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedUrl ? 'Αντιγράφηκε!' : 'Αντιγραφή'}
                  </button>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={async () => {
                        try {
                          await navigator.share({
                            title: 'Solon Track - Έκδοση Αποφάσεων',
                            text: 'Παρακολούθηση πορείας υποθέσεων και έκδοσης δικαστικών αποφάσεων από το portal ΣΟΛΩΝ:',
                            url: currentUrl,
                          });
                        } catch (e) {
                          // user dismissed
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition active:scale-95 shrink-0 shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Κοινοποίηση</span>
                    </button>
                  )}
                </div>

                {/* QR Code */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="w-24 h-24 bg-slate-950 p-1 rounded-lg border border-slate-700 flex items-center justify-center shrink-0">
                    <img
                      src={qrUrl}
                      alt="QR Code"
                      className="w-full h-full object-contain rounded"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p className="font-medium text-slate-300">Σκανάρετε με την κάμερα:</p>
                    <p>
                      Στρέψτε την κάμερα του κινητού σας στο QR code για να ανοίξει απευθείας η εφαρμογή στον Chrome.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition"
          >
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  );
};
