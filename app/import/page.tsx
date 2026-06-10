'use client';

import { useState, useRef } from 'react';
import NavBar from '@/components/NavBar';
import ImportPreview from '@/components/ImportPreview';
import type { NewTransaction } from '@/lib/schema';
import { UploadCloud, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParseResult { transactions: NewTransaction[]; filtered: number; duplicates: number; }

export default function ImportPage() {
  const [result,   setResult]   = useState<ParseResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | File[]) {
    const pdfs = Array.from(files).filter(f => f.name.endsWith('.pdf'));
    if (!pdfs.length) { setError('Por favor selecione ficheiros PDF'); return; }
    setLoading(true); setError(''); setSuccess(''); setResult(null);
    try {
      const fd = new FormData();
      pdfs.forEach(f => fd.append('files', f));
      const res  = await fetch('/api/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erro ao processar PDF'); return; }
      setResult({ transactions: data.transactions, filtered: data.filtered, duplicates: data.duplicates });
    } catch { setError('Erro de ligação ao servidor'); }
    finally  { setLoading(false); }
  }

  async function handleConfirm() {
    if (!result) return;
    const res  = await fetch('/api/import/confirm', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions: result.transactions }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Erro ao guardar'); return; }
    setSuccess(`${data.saved} transações importadas · ${data.skipped} duplicadas ignoradas`);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="flex min-h-screen bg-background">
      <NavBar />
      <main className="flex-1 min-w-0 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold text-foreground mb-1">Importar Extractos</h1>
          <p className="text-sm text-muted-foreground mb-6">NovoBanco (Rodrigo) e Millennium BCP (Mariana)</p>

          {!result && !loading && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
              className={cn(
                'rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer',
                dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-white/[0.02]'
              )}
              onClick={() => fileRef.current?.click()}
            >
              <UploadCloud className={cn('w-10 h-10 mx-auto mb-3', dragging ? 'text-primary' : 'text-muted-foreground')} />
              <p className="text-sm font-medium text-foreground mb-1">Arraste PDFs aqui ou clique para seleccionar</p>
              <p className="text-xs text-muted-foreground">Extrato Integrado (Novo Banco) · Extrato Combinado (Millennium)</p>
              <input ref={fileRef} type="file" multiple accept=".pdf"
                onChange={e => e.target.files && handleFiles(e.target.files)} className="hidden" />
            </div>
          )}

          {loading && (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-sm text-foreground font-medium">A processar PDF…</p>
              <p className="text-xs text-muted-foreground mt-1">A extrair e classificar transações</p>
            </div>
          )}

          {error && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              {success}
            </div>
          )}

          {result && !loading && (
            <div className="mt-5">
              <ImportPreview {...result}
                onConfirm={handleConfirm}
                onCancel={() => { setResult(null); if (fileRef.current) fileRef.current.value = ''; }} />
            </div>
          )}

          {/* Instructions */}
          <div className="mt-7 rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" /> Instruções
            </h3>
            <div className="grid sm:grid-cols-2 gap-5 text-xs text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1.5">Novo Banco · Rodrigo</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Descarregar "Extrato Integrado" no NetBanking</li>
                  <li>IBAN PT50 0007 0011… detectado automaticamente</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1.5">Millennium BCP · Mariana</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Descarregar "Extrato Combinado" no ActivoBank</li>
                  <li>IBAN PT50 0033 0000… detectado automaticamente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
