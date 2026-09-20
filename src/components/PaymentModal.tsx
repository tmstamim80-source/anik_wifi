import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { X, CreditCard, CheckCircle2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomer?: Customer | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  initialCustomer,
}) => {
  const { customers, recordPayment, ispProfile } = useCustomer();
  const { addToast } = useToast();
  const { isDark } = useTheme();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Cash' | 'Bank Transfer' | 'Other'>('bKash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialCustomer) {
      setSelectedCustomerId(initialCustomer.id);
      setAmount(initialCustomer.dueAmount > 0 ? initialCustomer.dueAmount : initialCustomer.monthlyBill);
    } else if (customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
      setAmount(customers[0].dueAmount > 0 ? customers[0].dueAmount : customers[0].monthlyBill);
    }
    setPaymentDate(new Date().toISOString().substring(0, 10));
    setTransactionId('');
    setNotes('');
  }, [initialCustomer, isOpen, customers]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    const cust = customers.find((c) => c.id === custId);
    if (cust) {
      setAmount(cust.dueAmount > 0 ? cust.dueAmount : cust.monthlyBill);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      addToast('error', 'Error', 'Please select a customer.');
      return;
    }
    if (amount <= 0) {
      addToast('error', 'Invalid Amount', 'Payment amount must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordPayment({
        customerId: selectedCustomer.id,
        customerUid: selectedCustomer.uid,
        customerName: selectedCustomer.name,
        customerMobile: selectedCustomer.mobile,
        amount: Number(amount),
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        paymentDate,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      addToast('error', 'Payment Failed', err.message || 'Could not record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modalContainerClass = isDark
    ? 'bg-slate-900/95 border-slate-800 text-slate-100'
    : 'glass-panel-colorful border-purple-500/30 text-slate-100';

  const inputClass = isDark
    ? 'bg-slate-900/90 border-slate-700/80 focus:bg-slate-900 focus:border-emerald-400 text-white placeholder-slate-500'
    : 'bg-slate-900/90 border-purple-500/30 focus:bg-slate-900 focus:border-emerald-400 text-white placeholder-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className={`relative w-full max-w-lg border rounded-2xl shadow-2xl overflow-hidden my-auto ${modalContainerClass}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Record Bill Payment</h2>
              <p className="text-xs text-slate-400">Accept MFS, cash, or bank subscription payment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Customer Selection */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Select Customer <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-colors ${inputClass}`}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.name} ({c.uid}) - Due: {ispProfile.currencySymbol}{c.dueAmount}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Customer Quick Info Card */}
          {selectedCustomer && (
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Package & Monthly Bill</span>
                <span className="text-white font-medium">
                  {selectedCustomer.packageName} ({ispProfile.currencySymbol}{selectedCustomer.monthlyBill})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Current Outstanding Due</span>
                <span className={`font-bold font-mono ${selectedCustomer.dueAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {ispProfile.currencySymbol}{selectedCustomer.dueAmount || 0}
                </span>
              </div>
            </div>
          )}

          {/* Amount and Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Payment Amount ({ispProfile.currencySymbol}) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border font-mono font-bold text-emerald-400 text-sm outline-none transition-colors ${inputClass}`}
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Payment Method <span className="text-rose-400">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-colors ${inputClass}`}
              >
                <option value="bKash" className="bg-slate-900 text-white">bKash (Merchant/Personal)</option>
                <option value="Nagad" className="bg-slate-900 text-white">Nagad</option>
                <option value="Rocket" className="bg-slate-900 text-white">Rocket</option>
                <option value="Cash" className="bg-slate-900 text-white">Cash Handover</option>
                <option value="Bank Transfer" className="bg-slate-900 text-white">Bank Transfer / Card</option>
                <option value="Other" className="bg-slate-900 text-white">Other</option>
              </select>
            </div>
          </div>

          {/* Trx ID & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Transaction ID / Reference
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. BK9X882190"
                className={`w-full px-3 py-2 rounded-xl border font-mono text-xs outline-none transition-colors ${inputClass}`}
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Payment Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-colors ${inputClass}`}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Receipt Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared bill for the month of August"
              className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-colors ${inputClass}`}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Recording...' : 'Confirm Payment'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
