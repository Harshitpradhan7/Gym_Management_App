import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, ArrowLeft, Loader2, CheckCircle, AlertCircle, FileText, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format, addMonths } from 'date-fns'
import Papa from 'papaparse'

export default function BulkImport() {
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const planDurations = {
    'Monthly': 1,
    'Quarterly': 3,
    'Half Yearly': 6,
    'Annual': 12
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setResults(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const { data: existingMembers } = await supabase.from('members').select('phone, full_name')
          const existingPhones = new Set(existingMembers.map(m => m.phone))
          const existingNames = new Set(existingMembers.map(m => m.full_name.toLowerCase()))

          const toInsert = []
          let skipped = 0

          for (const row of results.data) {
            const name = row.Name || row.full_name || row['Full Name']
            const phone = row.Phone || row.phone || row['Phone Number']
            const joinDate = row.JoiningDate || row.joining_date || row['Joining Date']
            const plan = row.Plan || row.plan_type || row['Plan Type'] || 'Monthly'
            const fees = row.Fees || row.fees_paid || row['Fees Paid'] || 0
            const mode = row.Mode || row.payment_mode || row['Payment Mode'] || 'Cash'

            if (!name || !phone) {
              skipped++
              continue
            }

            // Clean phone number (keep only 10 digits)
            const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10)

            // Check if exists
            if (existingPhones.has(cleanPhone) || existingNames.has(name.toLowerCase())) {
              skipped++
              continue
            }

            // Calculate expiry
            const joining = joinDate ? new Date(joinDate) : new Date()
            const months = planDurations[plan] || 1
            const expiry = addMonths(joining, months)

            toInsert.push({
              full_name: name,
              phone: cleanPhone,
              plan_type: plan,
              joining_date: format(joining, 'yyyy-MM-dd'),
              expiry_date: format(expiry, 'yyyy-MM-dd'),
              fees_paid: Number(fees),
              payment_mode: mode,
              status: 'active',
              qr_code_data: `BG-${Date.now()}-${cleanPhone}-${Math.random().toString(36).substring(7)}`,
              registration_no: `BJG-HIST-${Math.floor(1000 + Math.random() * 9000)}`
            })
          }

          if (toInsert.length > 0) {
            const { error: insertError } = await supabase.from('members').insert(toInsert)
            if (insertError) throw insertError
          }

          setResults({
            added: toInsert.length,
            skipped: skipped
          })
        } catch (err) {
          console.error('Bulk upload error:', err)
          setError(err.message || 'Error processing CSV file.')
        } finally {
          setUploading(false)
        }
      },
      error: (err) => {
        setError('Error reading CSV file.')
        setUploading(false)
      }
    })
  }

  const downloadSample = () => {
    const csvContent = "Name,Phone,JoiningDate,Plan,Fees,Mode\nRohit Kumar,9876543210,2024-01-10,Monthly,1000,Cash\nSonia Sharma,9988776655,2024-02-15,Quarterly,3000,UPI"
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('hidden', '')
    a.setAttribute('href', url)
    a.setAttribute('download', 'bajrang_gym_sample.csv')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-3xl font-black uppercase italic">Bulk <span className="text-brand-red">Migration</span></h2>
      </div>

      <div className="card p-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mb-6 border border-brand-red/20 shadow-[0_0_50px_rgba(255,62,62,0.1)]">
          <FileText size={40} className="text-brand-red" />
        </div>

        <h3 className="text-xl font-black mb-2 uppercase italic">Upload Historical Data</h3>
        <p className="text-zinc-500 mb-8 max-w-sm text-sm">Transfer your old Excel or Google Sheet records directly into your gym database. We will check for duplicates automatically.</p>

        {results ? (
          <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-8">
            <CheckCircle className="text-emerald-500 mx-auto mb-4" size={32} />
            <h4 className="text-emerald-400 font-black uppercase italic text-lg mb-1">Import Complete!</h4>
            <p className="text-zinc-400 text-sm">Successfully added **{results.added}** new members. Skipped {results.skipped} duplicates.</p>
            <button onClick={() => navigate('/members')} className="mt-6 btn-primary px-8 py-2 text-xs font-black uppercase tracking-widest">Go to Members List</button>
          </div>
        ) : error ? (
          <div className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-8 text-center text-red-400">
            <AlertCircle className="mx-auto mb-2" />
            <p className="text-sm font-bold uppercase">{error}</p>
          </div>
        ) : (
          <div className="w-full space-y-6">
            <input
              type="file"
              accept=".csv"
              id="csv-upload"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <label
              htmlFor="csv-upload"
              className={`w-full btn-primary py-5 rounded-2xl flex items-center justify-center gap-3 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {uploading ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
              <span className="font-black uppercase tracking-[0.2em]">{uploading ? 'Processing Data...' : 'Select CSV File'}</span>
            </label>

            <button onClick={downloadSample} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mx-auto text-xs uppercase font-black tracking-widest">
              <Download size={14} /> Download Sample Template
            </button>
          </div>
        )}

        <div className="mt-10 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl w-full text-left">
          <h4 className="text-[10px] uppercase font-black text-zinc-500 tracking-widest mb-3 italic">Instructions:</h4>
          <ul className="space-y-2 text-[10px] text-zinc-400 uppercase font-black leading-relaxed tracking-wider">
            <li className="flex gap-2"><span>1.</span> Export your Google Sheet as a .CSV file.</li>
            <li className="flex gap-2"><span>2.</span> Ensure columns are named: Name, Phone, JoiningDate, Plan.</li>
            <li className="flex gap-2"><span>3.</span> Date format should be YYYY-MM-DD (e.g. 2024-03-24).</li>
            <li className="flex gap-2 text-brand-red"><span>4.</span> No double entries: We skip any phone number or name already in use.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
