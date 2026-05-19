'use client';

import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';

export default function PDFToTxtConverter() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/convert-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Conversion failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadTxt = () => {
    if (!result || !result.content) return;

    const element = document.createElement('a');
    const file = new Blob([result.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = result.filename || 'voertuig_opties.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">Firstgear PDF Converter</h1>
          <p className="text-slate-400">Converteer voertuig-PDF's naar gestandaardiseerde optielijsten</p>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
          <div className="p-8">
            <form onSubmit={handleSubmit}>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleChange}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer block">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-lg font-semibold text-white mb-2">
                    Sleep je PDF hier naartoe
                  </p>
                  <p className="text-sm text-slate-400">of klik om een bestand te kiezen</p>
                </label>
              </div>

              {file && (
                <div className="mt-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold">Geselecteerd:</span> {file.name}
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!file || loading}
                className="w-full mt-6 py-3 px-6 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
              >
                {loading ? 'Converteren...' : 'Converteer naar TXT'}
              </button>
            </form>
          </div>

          {result && (
            <div className="border-t border-slate-700 p-8 bg-slate-700/50">
              <div className="flex items-start gap-3 mb-6">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-400">Conversie succesvol!</p>
                  <p className="text-sm text-slate-300 mt-1">
                    {result.vehicleInfo}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto border border-slate-600">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words">
                  {result.content.substring(0, 500)}...
                </pre>
              </div>

              <button
                onClick={downloadTxt}
                className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
              >
                <Download className="w-5 h-5" />
                Download TXT-bestand
              </button>
            </div>
          )}
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-white mb-3">Ondersteunde formaten</h3>
            <ul className="text-sm text-slate-400 space-y-2">
              <li>✓ VWE SilverDAT raporten</li>
              <li>✓ Fabrieksinformatie rapporten</li>
              <li>✓ Range Rover configuraties</li>
              <li>✓ Alle automerken</li>
            </ul>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-white mb-3">Output format</h3>
            <ul className="text-sm text-slate-400 space-y-2">
              <li>✓ Gestandaardiseerde TXT</li>
              <li>✓ Met voertuiggegevens</li>
              <li>✓ Opties gesorteerd</li>
              <li>✓ Klaar voor website</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
