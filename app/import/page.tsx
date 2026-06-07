'use client';

import { useState, useRef } from 'react';
import NavBar from '@/components/NavBar';
import ImportPreview from '@/components/ImportPreview';
import type { NewTransaction } from '@/lib/schema';

interface ParseResult {
  transactions: NewTransaction[];
  filtered: number;
  duplicates: number;
}

export default function ImportPage() {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | File[]) {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (pdfFiles.length === 0) {
      setError('Por favor selecione ficheiros PDF');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setParseResult(null);

    try {
      const formData = new FormData();
      for (const file of pdfFiles) {
        formData.append('files', file);
      }

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao processar PDF');
        return;
      }

      setParseResult({
        transactions: data.transactions,
        filtered: data.filtered,
        duplicates: data.duplicates,
      });
    } catch (err) {
      setError('Erro de ligação ao servidor');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!parseResult) return;

    const res = await fetch('/api/import/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions: parseResult.transactions }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Erro ao guardar transações');
      return;
    }

    setSuccess(`Importação concluída: ${data.saved} transações guardadas, ${data.skipped} duplicadas ignoradas`);
    setParseResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleCancel() {
    setParseResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Importar Extractos</h2>

          {!parseResult && (
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                dragging
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 bg-white'
              }`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div className="text-4xl mb-4">📄</div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Arraste PDFs aqui ou clique para seleccionar
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Suportados: Novo Banco (Extrato Integrado) e Millennium BCP (Extrato Combinado)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf"
                onChange={e => e.target.files && handleFiles(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer transition-colors"
              >
                Seleccionar PDFs
              </label>
            </div>
          )}

          {loading && (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-4 animate-pulse">⏳</div>
              <p className="text-gray-600">A processar PDF{loading ? 's' : ''}...</p>
              <p className="text-sm text-gray-400 mt-1">A extrair e classificar transações</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {parseResult && !loading && (
            <div className="mt-6">
              <ImportPreview
                transactions={parseResult.transactions}
                filtered={parseResult.filtered}
                duplicates={parseResult.duplicates}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
              />
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Instruções</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Novo Banco (Rodrigo)</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Descarregue o "Extrato Integrado" do NetBanking</li>
                  <li>Selecione o período desejado</li>
                  <li>O IBAN PT50 0007 0011... é detectado automaticamente</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Millennium BCP (Mariana)</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Descarregue o "Extrato Combinado" do ActivoBank/Millennium</li>
                  <li>Selecione o período desejado</li>
                  <li>O IBAN PT50 0033 0000... é detectado automaticamente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
