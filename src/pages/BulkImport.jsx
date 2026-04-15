import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Download,
  ShieldCheck,
  XCircle
} from 'lucide-react'
import Papa from 'papaparse'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/audit'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import SecurityDialog from '../components/SecurityDialog'

export default function BulkImport() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [data, setData] = useState([])
  const [success, setSuccess] = useState(0)
  const [importError, setImportError] = useState(null)
  const [isPinOpen, setIsPinOpen] = useState(false)

  const downloadTemplate = () => {
    const headers = 'full_name,phone,plan_type,fees_paid,payment_mode,joining_date,expiry_date,registration_no\n'
    const sample = 'John Doe,9876543210,Monthly,1500,Cash,2026-04-01,2026-05-01,BJG-1001\n'
    const blob = new Blob([headers + sample], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'BajrangGym_Bulk_Template.csv'
    a.click()
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportError(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const { data: latestMembers } = await supabase
          .from('members')
          .select('registration_no')
          .order('registration_no', { ascending: false })
          .limit(1)

        let lastNum = 1000
        if (latestMembers?.[0]?.registration_no) {
          const match = latestMembers[0].registration_no.match(/\d+/)
          if (match) lastNum = parseInt(match[0])
        }

        const cleanedData = results.data.map((row) => {
          if (!row.registration_no || row.registration_no.trim() === '') {
            lastNum++
            row.registration_no = `BJG-${lastNum}`
          }
          return {
            full_name: row.full_name,
            phone: row.phone,
            plan_type: row.plan_type || 'Monthly',
            fees_paid: parseInt(row.fees_paid) || 0,
            payment_mode: row.payment_mode || 'Cash',
            joining_date: row.joining_date || new Date().toISOString().split('T')[0],
            expiry_date: row.expiry_date || new Date().toISOString().split('T')[0],
            registration_no: row.registration_no,
            qr_code_data: `BAJRANG-${row.registration_no}-${Date.now()}`
          }
        })
        setData(cleanedData)
      },
      error: (error) => {
        setImportError("CSV Parsing Error: " + error.message)
      }
    })
  }

  const uploadMutation = useMutation({
    mutationFn: async (membersToUpload) => {
      // 1. Bulk Insert Members
      const { data: insertedMembers, error: memberError } = await supabase
        .from('members')
        .insert(membersToUpload)
        .select()

      if (memberError) throw memberError

      // 2. Map and Bulk Insert Initial Payments
      const paymentsToUpload = insertedMembers.map(member => {
        // Find the original data to get the joining_date
        const originalData = membersToUpload.find(m => m.registration_no === member.registration_no)

        return {
          member_id: member.id,
          amount: member.fees_paid,
          plan_type: member.plan_type,
          payment_mode: member.payment_mode,
          expiry_date_after_payment: member.expiry_date,
          payment_date: originalData?.joining_date || new Date().toISOString().split('T')[0]
        }
      })

      if (paymentsToUpload.length > 0) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert(paymentsToUpload)

        if (paymentError) throw paymentError
      }

      return insertedMembers
    },
    onSuccess: (data) => {
      setSuccess(data.length)
      queryClient.invalidateQueries(['members'])
      logAction('bulk_import', { count: data.length })
    },
    onError: (error) => {
      setImportError(error.message)
    }
  })

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/members')} className="p-3 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">Bulk Migration</h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Database Ingestion Engine</p>
        </div>
      </div>

      {!data.length ? (
        <div className="card p-12 flex flex-col items-center border-dashed border-2 border-white/5 bg-zinc-950/50">
          <div className="w-20 h-20 bg-brand-red/10 text-brand-red rounded-3xl flex items-center justify-center mb-6">
            <Upload size={32} />
          </div>
          <h3 className="text-xl font-black italic uppercase text-white mb-2 tracking-tight">Drop your CSV Sheet</h3>
          <p className="text-xs text-zinc-500 mb-8 text-center max-w-sm">Upload your Excel or CSV file to enroll multiple athletes instantly. Ensure columns match our template.</p>

          <div className="flex gap-4">
            <label className="btn-primary px-8 py-4 flex items-center gap-3 cursor-pointer">
              <FileSpreadsheet size={18} /> Select File
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
            <button onClick={downloadTemplate} className="px-8 py-4 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all flex items-center gap-2">
              <Download size={14} /> Template
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card p-8 bg-zinc-950 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h4 className="font-black italic uppercase text-white tracking-tight">Sheet Parsed Ready</h4>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none mt-1">{data.length} New Athletes Detected</p>
                </div>
              </div>

              {!uploadMutation.isPending && !success && (
                <button
                  onClick={() => setIsPinOpen(true)}
                  className="btn-primary flex items-center gap-3 px-10 shadow-lg shadow-brand-red/20"
                >
                  <ShieldCheck size={20} /> Confirm Import
                </button>
              )}
            </div>

            {importError && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500">
                <AlertCircle size={20} />
                <p className="text-xs font-bold uppercase tracking-wide">{importError}</p>
              </div>
            )}

            {uploadMutation.isPending && (
              <div className="py-12 flex flex-col items-center gap-4 animate-pulse">
                <Loader2 className="animate-spin text-brand-red" size={48} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red">Synchronizing Database...</p>
              </div>
            )}

            {success > 0 && (
              <div className="py-12 flex flex-col items-center gap-4 animate-bounce">
                <CheckCircle2 className="text-emerald-500" size={64} />
                <h3 className="text-2xl font-black italic uppercase text-emerald-500">Import Successful!</h3>
                <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest text-center">{success} New Legends Enrolled in Bajrang Gym 2.0</p>
              </div>
            )}

            {!uploadMutation.isPending && !success && (
              <div className="max-h-[400px] overflow-y-auto rounded-2xl border border-white/5 bg-zinc-900/40 shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-zinc-950 border-b border-white/5 z-10">
                    <tr>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Athlete</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Phone</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Registration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.slice(0, 50).map((row, i) => (
                      <tr key={i} className="hover:bg-brand-red/5 transition-colors">
                        <td className="p-4 text-xs font-black italic uppercase text-white">{row.full_name}</td>
                        <td className="p-4 text-xs font-bold text-zinc-500">{row.phone}</td>
                        <td className="p-4 text-[10px] font-black text-brand-red uppercase">{row.registration_no}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!uploadMutation.isPending && !success && (
            <button
              onClick={() => setData([])}
              className="w-full py-4 border border-rose-500/20 text-rose-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/10 transition-all font-bold"
            >
              Discard and Try New Sheet
            </button>
          )}
        </div>
      )}

      <SecurityDialog
        isOpen={isPinOpen}
        onClose={() => setIsPinOpen(false)}
        onVerified={() => uploadMutation.mutate(data)}
        title="Authorize Import?"
      />
    </div>
  )
}
