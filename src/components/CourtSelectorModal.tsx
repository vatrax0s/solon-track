/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Search, X, Check, Landmark, Building2, MapPin } from 'lucide-react';
import { SolonCourt } from '../solonService.ts';

interface CourtSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  courts: SolonCourt[];
  selectedCourtValue: string;
  onSelect: (court: SolonCourt) => void;
}

export const CourtSelectorModal: React.FC<CourtSelectorModalProps> = ({
  isOpen,
  onClose,
  courts,
  selectedCourtValue,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PRWT' | 'EIRHN' | 'EFET' | 'ATHENS'>('ALL');

  const filteredCourts = useMemo(() => {
    let list = courts;
    const term = searchTerm.trim().toUpperCase();

    if (categoryFilter === 'PRWT') {
      list = list.filter((c) => c.name.includes('ΠΡΩΤΟΔΙΚΕΙΟ'));
    } else if (categoryFilter === 'EIRHN') {
      list = list.filter((c) => c.name.includes('ΕΙΡΗΝΟΔΙΚΕΙΟ'));
    } else if (categoryFilter === 'EFET') {
      list = list.filter((c) => c.name.includes('ΕΦΕΤΕΙΟ'));
    } else if (categoryFilter === 'ATHENS') {
      list = list.filter((c) => c.name.includes('ΑΘΗΝ') || c.name.includes('ΠΕΙΡΑΙ') || c.name.includes('ΜΑΡΟΥΣ'));
    }

    if (!term) return list;

    return list.filter((c) => {
      const normalizedName = c.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      const normalizedTerm = term.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      return normalizedName.includes(normalizedTerm) || c.value === term;
    });
  }, [courts, searchTerm, categoryFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/70 backdrop-blur-xs p-0 sm:p-4">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[85vh] shadow-2xl animate-in slide-in-from-bottom-6 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Handle for Android Mobile */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Επιλογή Δικαστηρίου</h2>
              <p className="text-xs text-slate-400">279 Καταστήματα σε όλη την Ελλάδα</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
            aria-label="Κλείσιμο"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-slate-800/80 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Αναζήτηση (π.χ. Αθηνών, Θεσσαλονίκης)..."
              autoFocus
              className="w-full bg-slate-800/80 text-white placeholder-slate-400 pl-10 pr-9 py-2.5 rounded-xl border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category filter chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                categoryFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Όλα ({courts.length})
            </button>
            <button
              onClick={() => setCategoryFilter('ATHENS')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 font-medium ${
                categoryFilter === 'ATHENS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <MapPin className="w-3 h-3" /> Αττική
            </button>
            <button
              onClick={() => setCategoryFilter('PRWT')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                categoryFilter === 'PRWT'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Πρωτοδικεία
            </button>
            <button
              onClick={() => setCategoryFilter('EIRHN')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                categoryFilter === 'EIRHN'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Ειρηνοδικεία
            </button>
            <button
              onClick={() => setCategoryFilter('EFET')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                categoryFilter === 'EFET'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Εφετεία
            </button>
          </div>
        </div>

        {/* Court List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
          {filteredCourts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <Building2 className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              Δεν βρέθηκε δικαστήριο με αυτά τα στοιχεία.
            </div>
          ) : (
            filteredCourts.map((court) => {
              const isSelected = court.value === selectedCourtValue;
              return (
                <button
                  key={court.value}
                  onClick={() => {
                    onSelect(court);
                    onClose();
                  }}
                  className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-300 font-medium'
                      : 'hover:bg-slate-800/60 text-slate-200'
                  }`}
                >
                  <div className="pr-3">
                    <div className="text-xs text-slate-400 font-mono">#{court.value}</div>
                    <div className="text-sm leading-snug">{court.name}</div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
