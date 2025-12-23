
import React, { useState, useRef } from 'react';
import { 
  FileText, 
  RefreshCw, 
  Copy, 
  Download, 
  Scale, 
  Gavel, 
  ShieldCheck, 
  AlertCircle,
  ArrowRight,
  Upload,
  Loader2
} from 'lucide-react';
import { summarizeDocument } from './services/geminiService';
import { SummarizationTone, SummaryResult } from './types';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const SAMPLE_DOCUMENT = `LOAN AND SECURITY AGREEMENT
This LOAN AND SECURITY AGREEMENT (this “Agreement”) is entered into as of October 24, 2023, by and between APEX TECHNOLOGIES INC., a Delaware corporation (“Borrower”), and LENDING PARTNERS LLC, a New York limited liability company (“Lender”).

1. LOAN TERMS.
1.1 Credit Extension. Subject to the terms and conditions of this Agreement, Lender agrees to lend to Borrower an amount not to exceed One Million Dollars ($1,000,000) (the “Loan”).
1.2 Interest Rate. The Loan shall bear interest on the outstanding principal amount thereof at a rate per annum equal to eight percent (8.00%).
1.3 Maturity Date. All outstanding principal and accrued interest shall be due and payable in full on October 24, 2025 (the “Maturity Date”).

2. SECURITY INTEREST.
Borrower hereby grants to Lender a continuing security interest in all of Borrower’s right, title, and interest in and to the following property, whether now owned or hereafter acquired (the “Collateral”): all inventory, equipment, accounts, and intellectual property. Borrower authorizes Lender to file financing statements in all appropriate jurisdictions to perfect Lender’s security interest.

3. COVENANTS.
Borrower shall not, without Lender’s prior written consent: (a) undergo a Change in Control; (b) create or permit to exist any Lien on any of its property; or (c) pay any dividends or make any distributions on its capital stock.

4. EVENTS OF DEFAULT.
The occurrence of any of the following shall constitute an Event of Default: (a) Borrower fails to make any payment of principal or interest when due; (b) Borrower breaches any negative covenant in Section 3; or (c) Borrower becomes insolvent or files for bankruptcy protection.`;

export default function App() {
  const [inputText, setInputText] = useState('');
  const [tone, setTone] = useState<SummarizationTone>(SummarizationTone.EXECUTIVE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      setError("Please provide a document to summarize.");
      return;
    }

    setError(null);
    setIsProcessing(true);
    try {
      const summary = await summarizeDocument(inputText, tone);
      setResult({
        originalText: inputText,
        summary,
        timestamp: Date.now()
      });
    } catch (err: any) {
      setError(err.message || "An error occurred during processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const extractTextFromPDF = async (file: File) => {
    setIsExtracting(true);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n\n";
      }
      
      setInputText(fullText.trim());
    } catch (err) {
      setError("Failed to extract text from PDF. Ensure the file is not password protected.");
      console.error(err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      extractTextFromPDF(file);
    } else if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (event) => setInputText(event.target?.result as string);
      reader.readAsText(file);
    } else {
      setError("Unsupported file format. Please upload a .pdf or .txt file.");
    }
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLoadSample = () => {
    setInputText(SAMPLE_DOCUMENT);
    setError(null);
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.summary);
      alert("Summary copied to clipboard!");
    }
  };

  const handleDownload = () => {
    if (result) {
      const blob = new Blob([result.summary], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Summary_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-legal-cream text-legal-dark">
      {/* Header */}
      <header className="bg-legal-dark border-b border-legal-dark sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white text-legal-dark p-2 rounded-lg shadow-sm">
              <Scale size={24} />
            </div>
            <h1 className="text-xl font-bold text-legal-cream tracking-tight serif-font">AI Legal Summarizer</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-legal-gray hidden sm:inline font-medium tracking-wide">AI DOCUMENT REVIEW SYSTEM</span>
            <button 
              onClick={() => {
                setInputText('');
                setResult(null);
                setError(null);
              }}
              className="p-2 text-legal-gray hover:text-white transition-colors"
              title="Clear all"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:py-12">
        <div className="mb-10 text-center lg:text-left flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-bold text-legal-dark mb-3 serif-font">Review Your Documents</h2>
            <p className="text-legal-muted max-w-2xl text-lg font-medium">
              Upload PDF files or paste legal text to generate a concise one-page brief.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf,.txt" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-white border-2 border-legal-dark text-legal-dark px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-legal-dark hover:text-white transition-all shadow-sm active:scale-95"
            >
              <Upload size={16} />
              Upload Document
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Input Side */}
          <div className="space-y-4 flex flex-col">
            <div className="bg-white rounded-xl shadow-lg border border-legal-gray overflow-hidden flex flex-col h-full relative">
              {isExtracting && (
                <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                  <Loader2 size={40} className="text-legal-dark animate-spin mb-4" />
                  <span className="font-bold text-legal-dark uppercase tracking-widest text-xs">Extracting Content...</span>
                </div>
              )}
              <div className="p-4 border-b border-legal-gray bg-legal-muted text-white flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-xs">
                  <FileText size={16} />
                  Original Document
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-legal-gray uppercase font-bold tracking-widest">
                    Characters: {inputText.length.toLocaleString()}
                  </span>
                  <button 
                    onClick={handleLoadSample}
                    className="text-[10px] font-black uppercase text-legal-cream hover:text-white underline tracking-widest transition-all"
                  >
                    Try Sample
                  </button>
                </div>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste legal text here or upload a file above..."
                className="w-full h-[550px] p-8 bg-white text-legal-dark placeholder-legal-muted focus:outline-none focus:ring-4 focus:ring-legal-dark/5 resize-none leading-relaxed text-base font-medium"
              />
              <div className="p-4 bg-legal-cream/30 border-t border-legal-gray flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[10px] font-black text-legal-muted uppercase mb-1 tracking-widest">Summary Focus</label>
                  <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value as SummarizationTone)}
                    className="w-full bg-white border border-legal-gray rounded-lg px-3 py-2 text-sm text-legal-dark font-bold focus:outline-none focus:ring-2 focus:ring-legal-dark"
                  >
                    {Object.values(SummarizationTone).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleSummarize}
                  disabled={isProcessing || isExtracting}
                  className="bg-legal-dark text-white px-10 py-4 rounded-lg font-black uppercase tracking-[0.2em] text-xs hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto shadow-md active:scale-95"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Analysing...
                    </>
                  ) : (
                    <>
                      Summarize
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-start gap-2 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>

          {/* Output Side */}
          <div className="space-y-4 flex flex-col h-full min-h-[550px]">
            {result ? (
              <div className="bg-white rounded-xl shadow-lg border border-legal-gray overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="p-4 border-b border-legal-gray bg-legal-dark text-white flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-xs">
                    <ShieldCheck size={16} className="text-legal-gray" />
                    Summarized Legal Document
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleCopy} className="p-1.5 text-legal-gray hover:text-white hover:bg-legal-muted rounded-md transition-all" title="Copy">
                      <Copy size={16} />
                    </button>
                    <button onClick={handleDownload} className="p-1.5 text-legal-gray hover:text-white hover:bg-legal-muted rounded-md transition-all" title="Download">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-10 flex-1 overflow-y-auto bg-white">
                  <div className="flex items-center gap-2 mb-8">
                    <span className="px-4 py-1.5 bg-legal-cream border border-legal-gray text-legal-dark text-[10px] font-black uppercase rounded tracking-widest">
                      One Page Brief: {tone}
                    </span>
                    <div className="h-px bg-legal-gray flex-1"></div>
                  </div>
                  <div className="text-legal-dark whitespace-pre-wrap leading-[2] text-lg serif-font max-w-2xl mx-auto">
                    {result.summary}
                  </div>
                </div>
                <div className="p-4 bg-legal-cream border-t border-legal-gray flex items-center justify-between text-[10px] font-black text-legal-muted uppercase tracking-widest">
                  <div className="flex items-center gap-1">
                    <Gavel size={12} />
                    Final AI Brief
                  </div>
                  <div className="flex gap-4">
                    <span>Summary Length: {result.summary.length} characters</span>
                    <span>Words: {result.summary.split(/\s+/).length}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/40 rounded-xl border-2 border-dashed border-legal-gray h-full flex flex-col items-center justify-center p-12 text-center group transition-colors hover:border-legal-muted">
                <div className="w-24 h-24 bg-legal-gray/30 rounded-full flex items-center justify-center text-legal-muted mb-8 group-hover:scale-110 transition-transform">
                  <FileText size={48} />
                </div>
                <h3 className="text-3xl font-bold text-legal-dark mb-4 serif-font">Review your document</h3>
                <p className="text-legal-muted text-sm max-w-xs leading-relaxed font-bold uppercase tracking-[0.15em]">
                  Paste text or upload a document to generate a high-precision summary.
                </p>
                <div className="mt-8 flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-legal-muted/20"></div>
                  <div className="w-2 h-2 rounded-full bg-legal-muted/20"></div>
                  <div className="w-2 h-2 rounded-full bg-legal-muted/20"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-legal-dark py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Scale size={24} className="text-legal-cream" />
            <span className="text-xl font-bold text-legal-cream serif-font">LexiBrief</span>
          </div>
          <div className="h-px bg-legal-muted w-24 mx-auto mb-6"></div>
          <p className="text-legal-gray text-xs font-bold uppercase tracking-[0.2em]">
            LexiBrief AI-Based Document Review System
          </p>
          <p className="text-legal-gray/50 text-xs mt-4">
            &copy; {new Date().getFullYear()} LexiBrief Systems.
          </p>
        </div>
      </footer>
    </div>
  );
}
