import React, { useState } from 'react';
import { ExportReportCenter } from '@/components/desktop/bulk/ExportReportCenter';
import { StatementUploaderModal } from '@/components/desktop/bulk/StatementUploaderModal';
import { FileSpreadsheet, Upload, Download, Sparkles } from 'lucide-react';

export const DesktopBulkCenterScreen: React.FC = () => {
  const [showUploader, setShowUploader] = useState(false);

  return (
    <div data-testid="desktop-bulk-center-screen" className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Bulk Actions & Import/Export Center</h1>
            <p className="text-xs text-text-muted">Import bank statements with column mapping and export Excel/PDF reports</p>
          </div>
        </div>

        {/* Import Trigger Button */}
        <button
          onClick={() => setShowUploader(true)}
          data-testid="open-statement-uploader-btn"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-text font-bold text-xs hover:opacity-95 shadow-sm active:scale-98 transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>+ Import Bank Mutasi CSV</span>
        </button>
      </div>

      {/* Quick Action Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-text-primary">Bank Mutasi Statement Importer</h3>
            <p className="text-xs text-text-muted">
              Batch import CSV statements from BCA, Mandiri, BSI, GoPay, OVO with interactive column mapping preview.
            </p>
            <button
              onClick={() => setShowUploader(true)}
              className="text-xs font-bold text-accent hover:underline inline-flex items-center gap-1 pt-1"
            >
              Start Bank Import &rarr;
            </button>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-text-primary">Official Statement Generator</h3>
            <p className="text-xs text-text-muted">
              Export multi-tab Excel workbooks (.xlsx) with category summaries or download branded PDF E-Statements.
            </p>
          </div>
        </div>
      </div>

      {/* Export Report Center Component */}
      <ExportReportCenter />

      {/* Statement Uploader Modal */}
      <StatementUploaderModal open={showUploader} onClose={() => setShowUploader(false)} />
    </div>
  );
};

