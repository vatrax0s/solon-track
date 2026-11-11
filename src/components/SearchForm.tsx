/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Landmark, Hash, Calendar, Search, ChevronRight, RotateCcw } from 'lucide-react';
import { SolonCourt, SolonQuery } from '../solonService.ts';

interface SearchFormProps {
  courts: SolonCourt[];
  selectedCourt: SolonCourt | null;
  onOpenCourtModal: () => void;
  onSelectCourt: (court: SolonCourt) => void;
  query: SolonQuery;
  setQuery: React.Dispatch<React.SetStateAction<SolonQuery>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  loadingStep: string;
  onLoadExample?: (example: { courtValue: string; searchType: 'GAK' | 'EAK'; number: string; year: string }) => void;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  courts,
  selectedCourt,
  onOpenCourtModal,
  onSelectCourt,
  query,
  setQuery,
  onSubmit,
  isLoading,
  loadingStep,
}) => {
  const currentYear = new Date().getFullYear().toString();
  const recentYears = [currentYear, '2024', '2023', '2022'];

  // Quick popular courts
  const popularCourts = [
    { value: '169', name: 'Πρωτοδικείο Αθηνών' },
    { value: '4', name: 'Ειρηνοδικείο Αθηνών' },
    { value: '172', name: 'Πρωτοδικείο Θεσσαλονίκης' },
    { value: '170', name: 'Πρωτοδικείο Πειραιά' },
    { value: '150', name: 'Εφετείο Αθηνών' },
  ];

  return (
    <form onSubmit={onSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      {/* Court Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-blue-400" /> Κατάστημα / Δικαστήριο
          </span>
          <span className="text-[10px] text-amber-400 font-normal">*Υποχρεωτικό</span>
        </label>

        {/* Selected Court Trigger Button */}
        <button
          type="button"
          onClick={onOpenCourtModal}
          className="w-full text-left bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between text-white transition-all active:scale-[0.99] group"
        >
          <div className="flex-1 pr-2">
            <div className="text-sm font-medium line-clamp-1">
              {selectedCourt ? selectedCourt.name : 'Επιλέξτε Δικαστήριο (π.χ. Ειρηνοδικείο Αθηνών)'}
            </div>
            {selectedCourt && (
              <div className="text-[11px] text-slate-400 mt-0.5">Κωδικός ΣΟΛΩΝ: #{selectedCourt.value}</div>
            )}
          </div>
          <div className="flex items-center gap-1 text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0 text-xs font-medium">
            <span>Αλλαγή</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        {/* Quick Court Suggestions */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs">
          <span className="text-[11px] text-slate-400 shrink-0">Συχνά:</span>
          {popularCourts.map((pc) => {
            const isSel = selectedCourt?.value === pc.value;
            return (
              <button
                key={pc.value}
                type="button"
                onClick={() => {
                  const match = courts.find((c) => c.value === pc.value) || pc;
                  onSelectCourt(match);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  isSel
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 font-medium'
                    : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700/50'
                }`}
              >
                {pc.name.replace('ΠΡΩΤΟΔΙΚΕΙΟ', 'Πρωτ.').replace('ΕΙΡΗΝΟΔΙΚΕΙΟ', 'Ειρην.').replace('ΕΦΕΤΕΙΟ', 'Εφετ.')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Criteria: GAK vs EAK */}
      <div className="space-y-1.5 pt-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Αναζήτηση Βάσει
        </label>
        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setQuery((prev) => ({ ...prev, searchType: 'GAK' }))}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${
              query.searchType === 'GAK'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Γ.Α.Κ.</span>
            <span className="text-[10px] font-normal opacity-85">Γενικός Αριθμός</span>
          </button>
          <button
            type="button"
            onClick={() => setQuery((prev) => ({ ...prev, searchType: 'EAK' }))}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${
              query.searchType === 'EAK'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Ε.Α.Κ.</span>
            <span className="text-[10px] font-normal opacity-85">Ειδικός Αριθμός</span>
          </button>
        </div>
      </div>

      {/* Number and Year Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Number Input */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-blue-400" />
              {query.searchType === 'GAK' ? 'Γ.Α.Κ. Αριθμός' : 'Ε.Α.Κ. Αριθμός'}
            </span>
            <span className="text-[10px] text-amber-400">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={query.number}
            onChange={(e) => setQuery((prev) => ({ ...prev, number: e.target.value.replace(/\D/g, '') }))}
            placeholder={query.searchType === 'GAK' ? 'π.χ. 100' : 'π.χ. 40'}
            required
            className="w-full bg-slate-800 text-white placeholder-slate-500 px-3.5 py-2.5 rounded-xl border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
          />
        </div>

        {/* Year Input */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              {query.searchType === 'GAK' ? 'Γ.Α.Κ. Έτος' : 'Ε.Α.Κ. Έτος'}
            </span>
            <span className="text-[10px] text-amber-400">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={query.year}
            onChange={(e) => setQuery((prev) => ({ ...prev, year: e.target.value.replace(/\D/g, '') }))}
            placeholder="π.χ. 2023"
            required
            className="w-full bg-slate-800 text-white placeholder-slate-500 px-3.5 py-2.5 rounded-xl border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
          />
        </div>
      </div>

      {/* Quick Year Selection Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
        <span className="text-[11px] text-slate-400 shrink-0">Έτος:</span>
        {recentYears.map((yr) => (
          <button
            key={yr}
            type="button"
            onClick={() => setQuery((prev) => ({ ...prev, year: yr }))}
            className={`px-2.5 py-0.5 rounded-md text-xs font-mono transition-colors ${
              query.year === yr
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {yr}
          </button>
        ))}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading || !query.courtOfficeOC || !query.number || !query.year}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99] flex flex-col items-center justify-center gap-1"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 animate-spin text-white" />
              <span>{loadingStep || 'Σύνδεση με ΣΟΛΩΝ...'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Αναζήτηση Απόφασης</span>
            </div>
          )}
        </button>
      </div>
    </form>
  );
};
