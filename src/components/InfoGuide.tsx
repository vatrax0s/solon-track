/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HelpCircle, ExternalLink, Smartphone, BookOpen, Scale, CheckCircle2 } from 'lucide-react';

export const InfoGuide: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-5 text-slate-300">
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
          <BookOpen className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Οδηγίες Χρήσης &amp; Επεξηγήσεις</h2>
          <p className="text-[11px] text-slate-400">Σύστημα ΣΟΛΩΝ &bull; TrackLdoPublic</p>
        </div>
      </div>

      {/* Target Column Info */}
      <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3.5 space-y-2">
        <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
          <Scale className="w-4 h-4" />
          <span>Στήλη: «Αριθμός Απόφασης/Έτος - Είδος Διατακτικού»</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Εμφανίζει τον <strong>επίσημο αριθμό της δικαστικής απόφασης</strong>, το <strong>έτος έκδοσης</strong> και το <strong>είδος του διατακτικού</strong>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="font-semibold text-emerald-400">ΔΕΚΤΗ</span>: Η αίτηση ή αγωγή έγινε δεκτή από το δικαστήριο.
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="font-semibold text-rose-400">ΑΠΟΡΡΙΠΤΕΤΑΙ</span>: Η αίτηση ή αγωγή απορρίφθηκε.
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="font-semibold text-amber-300">ΕΝ ΜΕΡΕΙ ΔΕΚΤΗ</span>: Έγινε δεκτή για μέρος των αιτημάτων.
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="font-semibold text-sky-300">ΑΝΑΒΟΛΗ / ΜΑΤΑΙΩΣΗ</span>: Η συζήτηση αναβλήθηκε ή ματαιώθηκε.
          </div>
        </div>
      </div>

      {/* Solon Details & Publications Tab */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
        <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>Καρτέλα «Δημοσιεύσεις» &amp; Στοιχεία Σειράς (Solon Details)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Μέσω της επιλογής <strong>«Λεπτομέρειες»</strong>, η εφαρμογή επιλέγει αυτόματα τη γραμμή της υπόθεσης στο ΣΟΛΩΝ και ανακτά από την καρτέλα <strong>«Δημοσιεύσεις»</strong> όλα τα καταχωρημένα στοιχεία:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300 list-disc list-inside">
          <li><strong>Ημερομηνία Δημοσίευσης</strong> απόφασης</li>
          <li><strong>Ονοματεπώνυμο Δικαστή</strong> που εξέδωσε την απόφαση</li>
          <li><strong>Ανωνυμοποιημένο Δια Ταύτα</strong> (αν έχει καταχωρηθεί)</li>
          <li><strong>Στάδιο Καθαρογραφής</strong> &amp; Ημερομηνία</li>
          <li><strong>Ημερομηνίες Θεώρησης</strong> Δικαστή, Προέδρου &amp; Γραμματέα</li>
          <li><strong>Ημερομηνία Αρχειοθέτησης</strong></li>
        </ul>
      </div>

      {/* 24 Hours Periodic Check */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
        <div className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-sky-400" />
          <span>Αυτόματος Έλεγχος &amp; Περιοδικότητα 24 ωρών</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Επειδή οι δικαστικές αποφάσεις δημοσιεύονται σε ημερήσια βάση (εργάσιμες ημέρες), η προτεινόμενη συχνότητα είναι <strong>24 ώρες (1 φορά την ημέρα)</strong>. Όταν υπάρξει αλλαγή στο διατακτικό (από εκκρεμές σε έκδοση), η εφαρμογή στέλνει άμεσα <strong>ειδοποίηση push με ήχο</strong> στο κινητό σας.
        </p>
      </div>

      {/* GAK vs EAK */}
      <div className="space-y-2 text-xs">
        <h3 className="font-semibold text-white">Τι είναι το Γ.Α.Κ. και το Ε.Α.Κ.;</h3>
        <ul className="space-y-1.5 list-disc list-inside text-slate-300">
          <li>
            <strong>Γ.Α.Κ. (Γενικός Αριθμός Κατάθεσης)</strong>: Ο γενικός μοναδικός αριθμός που λαμβάνει το δικόγραφο κατά την κατάθεσή του στη γραμματεία του δικαστηρίου.
          </li>
          <li>
            <strong>Ε.Α.Κ. (Ειδικός Αριθμός Κατάθεσης)</strong>: Ο ειδικός αριθμός κατάθεσης ανά διαδικασία (π.χ. Ασφαλιστικά, Τακτική, Διαταγές Πληρωμής).
          </li>
        </ul>
      </div>

      {/* Android Installation Instructions & APK */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="text-xs font-bold text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Εγκατάσταση στο κινητό Android (WebAPK &amp; APK)</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            NATIVE ANDROID
          </span>
        </div>

        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            <strong>1. Αυτόματη εγκατάσταση ως Native App (Προτεινόμενο - σε 5 δευτερόλεπτα):</strong><br />
            Στο Android δεν χρειάζεται να κατεβάζετε χειροκίνητα αρχεία `.apk` με κινδύνους ασφαλείας. Το λειτουργικό σύστημα Android, μέσω της τεχνολογίας <strong>WebAPK</strong> της Google, μετατρέπει και εγκαθιστά την εφαρμογή ως κανονικό <strong>Native Android APK</strong>:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 text-[11px]">
            <li>Ανοίξτε το link της εφαρμογής στον <strong>Google Chrome</strong> στο κινητό σας.</li>
            <li>Πατήστε το κουμπί <strong>«Εγκατάσταση»</strong> επάνω δεξιά ή πατήστε τις <strong>3 τελείες (⋮)</strong> του Chrome και επιλέξτε <strong>«Εγκατάσταση εφαρμογής»</strong>.</li>
            <li>Το Android θα εγκαταστήσει το <strong>ΣΟΛΩΝ Track</strong> με το εικονίδιό του, πλήρη οθόνη (χωρίς url bar) και υποστήριξη push notifications!</li>
          </ol>

          <p className="pt-1">
            <strong>2. Δημιουργία και λήψη αυτόνομου αρχείου .apk:</strong><br />
            Αν χρειάζεστε το ίδιο το φυσικό αρχείο <strong>.apk</strong> (π.χ. για αποστολή σε άλλη συσκευή), μπορείτε να το εξάγετε δωρεάν μέσω του επίσημου εργαλείου <strong>PWABuilder (Microsoft / Google)</strong>:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 text-[11px]">
            <li>Μεταβείτε στο <a href="https://www.pwabuilder.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">pwabuilder.com</a>.</li>
            <li>Επικολλήστε τη διεύθυνση URL της εφαρμογής σας.</li>
            <li>Επιλέξτε <strong>«Package for Stores» &rarr; «Android»</strong>.</li>
            <li>Πατήστε <strong>«Download Package»</strong> και θα λάβετε το έτοιμο αρχείο <strong>.apk</strong> για άμεση εγκατάσταση!</li>
          </ol>
        </div>
      </div>

      {/* Official Link */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-400">Επίσημη Πύλη:</span>
        <a
          href="https://extapps.solon.gov.gr/mojwp/faces/TrackLdoPublic"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
        >
          <span>extapps.solon.gov.gr/TrackLdoPublic</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
