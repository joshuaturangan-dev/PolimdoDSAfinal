import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle, Package, Calendar, User, BookOpen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useData } from '../context/DataContext.jsx';

export function BorrowModal({ item, onClose, onSuccess }) {
  const { lang, t } = useLanguage();
  const { submitBookingRequest } = useData();

  const [formData, setFormData] = useState({
    borrowerName: '',
    nim: '',
    className: 'D4-TL-3A',
    quantity: 1,
    borrowDate: new Date().toISOString().split('T')[0],
    returnDate: new Date().toISOString().split('T')[0],
    purpose: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.borrowerName || !formData.nim || !formData.purpose) {
      setErrorMsg('Harap isi Nama, NIM, dan Keperluan Praktikum.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        itemId: item.id,
        ...formData,
        quantity: Number(formData.quantity)
      };

      const res = await submitBookingRequest(payload);
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 2000);
      } else {
        setErrorMsg(res.message || 'Gagal mengajukan peminjaman.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative glass-panel-glow">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">
              {t('borrowModalTitle')}
            </h3>
            <p className="text-xs text-cyan-400 font-semibold truncate max-w-xs">
              {item.name} ({item.code})
            </p>
          </div>
        </div>

        {/* Item Summary Pill */}
        <div className="p-2.5 mb-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Tersedia di Lab:</span>
          <span className="font-extrabold text-emerald-400">
            {item.availableStock} {item.unit}
          </span>
        </div>

        {/* Success Alert */}
        {isSuccess ? (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-white">
              {t('bookingSuccess')}
            </h4>
            <p className="text-xs text-emerald-300">
              Formulir telah diteruskan ke sistem teknisi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {t('borrowerName')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Christian Rumagit"
                  value={formData.borrowerName}
                  onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 text-xs rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {t('nim')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 22023045"
                  value={formData.nim}
                  onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 text-xs rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {t('className')}
                </label>
                <select
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 text-xs rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="D4-TL-1A">D4 Teknik Listrik 1A</option>
                  <option value="D4-TL-1B">D4 Teknik Listrik 1B</option>
                  <option value="D4-TL-3A">D4 Teknik Listrik 3A</option>
                  <option value="D4-TL-3B">D4 Teknik Listrik 3B</option>
                  <option value="D4-TL-5A">D4 Teknik Listrik 5A</option>
                  <option value="D4-TL-5B">D4 Teknik Listrik 5B</option>
                  <option value="D4-TL-7A">D4 Teknik Listrik 7A</option>
                  <option value="D4-TL-7B">D4 Teknik Listrik 7B</option>
                  <option value="Dosen/Staf">Dosen / Staf Pengajar</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {t('borrowQuantity')} (Maks: {item.availableStock})
                </label>
                <input
                  type="number"
                  min="1"
                  max={item.availableStock || 1}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 text-xs rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {t('borrowDate')}
                </label>
                <input
                  type="date"
                  value={formData.borrowDate}
                  onChange={(e) => setFormData({ ...formData, borrowDate: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 text-xs rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {t('returnDate')}
                </label>
                <input
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 text-xs rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {t('borrowPurpose')} *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Praktikum Instalasi Tenaga (Meja 3)"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 text-xs rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all"
              >
                {t('cancel')}
              </button>

              <button
                type="submit"
                disabled={isSubmitting || item.availableStock <= 0}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Mengirim...' : t('submitBooking')}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
