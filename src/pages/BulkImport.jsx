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

export default function BulkImport() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [data, setData] = useState([])
  const [success, setSuccess] = useState(0)
  const [importError, setImportError] = useState(null)

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
      complete: (results) => {
        // 🔥 Start sequence from a timestamp-based base to ensure uniqueness
        let idSequence = Math.floor(Date.now() / 100000) % 10000;

        const validatedData = results.data.map((row, index) => {
          const name = row.full_name || row.Name || row['Full Name'] || ''
          const phone = row.phone || row.Phone || row['Phone Number'] || ''

          // 🛡️ INTELLIGENT ID GENERATION: If blank, create BJG-XXXX
          let finalRegNo = (row.registration_no || row.registration_ || row['Reg No'] || '').trim();
          if (!finalRegNo) {
            finalRegNo = `BJG-${idSequence + index}`;
          }

          return {
            full_name: name.trim(),
            phone: phone.toString().trim().replace(/\D/g, '').slice(-10),
            registration_no: finalRegNo,
            plan_type: row.plan_type || row.Plan || 'Monthly',
            fees_paid: Number(row.fees_paid || row.Fees || 0),
            payment_mode: row.payment_mode || row.Mode || 'Cash',
            joining_date: row.joining_date || row.JoiningDate || new Date().toISOString().split('T')[0],
            expiry_date: row.expiry_date || row.ExpiryDate || null,
            qr_code_data: finalRegNo,
            status: 'active'
          }
        }).filter(item => item.full_name && item.phone)

        setData(validatedData)
      }
    })
  }

  const uploadMutation = useMutation({
    mutationFn: async (athletes) => {
      setImportError(null)
      const { data: result, error } = await supabase
        .from('members')
        .insert(athletes)
        .select()

      if (error) throw error
      return result
    },
    onSuccess: (result) => {
      setSuccess(result.length)
      logAction('Bulk Upload Successful', `Enrolled ${result.length} athletes`)
      queryClient.invalidateQueries(['members'])
      queryClient.invalidateQueries(['dashboard-stats'])
      setTimeout(() => navigate('/members'), 2500)
    },
    onError: (err) => {
      console.error('Import Fail:', err)
      setImportError(err.message || 'Database rejected the import. Please check for duplicate phones.')
    }
  })

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-page">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-[var(--text-main)]">Bulk <span className="text-brand-red">Migration</span></h1>
        <button onClick={downloadTemplate} className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-red hover:underline tracking-widest">
          <Download size={14} /> Sample Template
        </button>
      </div>

      {!data.length ? (
        <label className="group relative block cursor-pointer">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-red to-orange-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative card p-16 md:p-24 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-[2.5rem] hover:border-brand-red/40 transition-all">
            <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mb-6 text-brand-red group-hover:scale-110 transition-transform">
              <Upload size={40} />
            </div>
            <h3 className="text-xl font-black italic uppercase text-[var(--text-main)] mb-2">Drop Athlete Sheet</h3>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.3em]">CSV files only | Headers: Name, Phone, Plan, Fees</p>
            <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
          </div>
        </label>
      ) : (
        <div className="space-y-6">
          {importError && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
              <XCircle className="text-rose-500 flex-shrink-0" size={32} />
              <div>
                <h4 className="text-rose-500 font-black uppercase italic tracking-widest">Import Shield Triggered</h4>
                <p className="text-[10px] font-bold text-rose-500/70 uppercase mt-1">{importError}</p>
              </div>
            </div>
          )}

          <div className="card p-8 bg-gradient-to-br from-brand-red/5 to-transparent shadow-[var(--shadow-main)]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h4 className="font-black italic uppercase text-[var(--text-main)] tracking-tight">Sheet Parsed Ready</h4>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none mt-1">{data.length} New Athletes Detected</p>
                </div>
              </div>

              {!uploadMutation.isPending && !success && (
                <button
                  onClick={() => uploadMutation.mutate(data)}
                  className="btn-primary flex items-center gap-3 px-10"
                >
                  <ShieldCheck size={20} /> Confirm Import
                </button>
              )}
            </div>

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
                <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest text-center">{success} New Legends Enrolled in Bajrang Gym 2.0</p>
              </div>
            )}

            {!uploadMutation.isPending && !success && (
              <div className="max-h-[400px] overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-input)] shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] z-10">
                    <tr>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Athlete</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Phone</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Generated Registration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {data.slice(0, 50).map((row, i) => (
                      <tr key={i} className="hover:bg-brand-red/5 transition-colors">
                        <td className="p-4 text-xs font-black italic uppercase text-[var(--text-main)]">{row.full_name}</td>
                        <td className="p-4 text-xs font-bold text-[var(--text-muted)]">{row.phone}</td>
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
    </div>
  )
}
