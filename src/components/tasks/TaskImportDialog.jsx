import React, { useState } from 'react';
import Papa from 'papaparse';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TaskImportDialog({ open, onOpenChange, projectId, taskStatuses, onImport }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  const downloadTemplate = () => {
    const template = [
      ['Title', 'Description', 'Status', 'Priority', 'Due Date (YYYY-MM-DD)', 'Estimated Hours'],
      ['Example Task 1', 'Task description here', 'To Do', 'high', '2026-02-15', '5'],
      ['Example Task 2', 'Another task', 'In Progress', 'medium', '2026-02-20', '3'],
    ];
    
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'task_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error parsing CSV file');
          return;
        }
        setPreview(results.data.slice(0, 5));
      },
      error: () => {
        setError('Failed to read CSV file');
      }
    });
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const tasks = results.data
            .filter(row => row.Title?.trim())
            .map(row => {
              // Find matching status by name
              const statusName = row.Status?.trim() || 'To Do';
              const matchedStatus = taskStatuses.find(s => 
                s.name.toLowerCase() === statusName.toLowerCase()
              );

              return {
                title: row.Title.trim(),
                description: row.Description?.trim() || '',
                status_id: matchedStatus?.id || taskStatuses[0]?.id,
                priority: ['low', 'medium', 'high'].includes(row.Priority?.toLowerCase()) 
                  ? row.Priority.toLowerCase() 
                  : 'medium',
                due_date: row['Due Date (YYYY-MM-DD)']?.trim() || null,
                estimated_hours: parseFloat(row['Estimated Hours']) || null,
              };
            });

          await onImport(tasks);
          onOpenChange(false);
          setFile(null);
          setPreview([]);
        } catch (err) {
          setError('Failed to import tasks: ' + err.message);
        } finally {
          setImporting(false);
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Tasks from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Need a template?</p>
              <p className="text-xs text-slate-500">Download our CSV template to get started</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          <div>
            <label className="block">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-[#9B63E9] transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">
                  {file ? file.name : 'Click to upload CSV file'}
                </p>
                <p className="text-xs text-slate-500 mt-1">or drag and drop</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {preview.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Preview (first 5 rows):</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Title</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{row.Title}</td>
                        <td className="px-3 py-2">{row.Status}</td>
                        <td className="px-3 py-2">{row.Priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!file || importing}
              className="bg-[#9B63E9] hover:bg-[#8A52D8]"
            >
              {importing ? 'Importing...' : 'Import Tasks'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}