import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Upload, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TaskCSVImport({ open, onOpenChange, onImport, projectId, statuses }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);

  const handleDownloadTemplate = () => {
    const template = `Title,Description,Status,Priority,Due Date,Estimated Hours
Example Task 1,This is a sample task,To Do,high,2026-02-15,5
Example Task 2,Another example,In Progress,medium,2026-02-20,3
Example Task 3,Final example,Review,low,2026-02-25,2`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'task_import_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success('Template downloaded');
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const tasks = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const task = {};

      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        if (header === 'title') task.title = value;
        else if (header === 'description') task.description = value;
        else if (header === 'status') {
          // Find matching status
          const status = statuses.find(s => 
            s.name.toLowerCase() === value.toLowerCase() || 
            s.key.toLowerCase() === value.toLowerCase()
          );
          task.status_id = status?.id || statuses[0]?.id;
        }
        else if (header === 'priority') {
          task.priority = ['low', 'medium', 'high'].includes(value.toLowerCase()) 
            ? value.toLowerCase() 
            : 'medium';
        }
        else if (header === 'due date' || header === 'due_date') {
          task.due_date = value || null;
        }
        else if (header === 'estimated hours' || header === 'estimated_hours') {
          task.estimated_hours = parseFloat(value) || null;
        }
      });

      if (task.title) {
        tasks.push(task);
      }
    }

    return tasks;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const text = await file.text();
      const tasks = parseCSV(text);
      
      if (tasks.length === 0) {
        throw new Error('No valid tasks found in CSV file');
      }

      await onImport(tasks);
      toast.success(`Imported ${tasks.length} tasks`);
      onOpenChange(false);
      setFile(null);
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message);
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Tasks from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple tasks at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Download Template</p>
                <p className="text-xs text-slate-500">Get the CSV template with examples</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              Download
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-[#9B63E9] file:text-white
                hover:file:bg-[#8A52D8]
                file:cursor-pointer cursor-pointer"
            />
            {file && (
              <p className="text-xs text-slate-600 mt-2">
                Selected: {file.name}
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="text-xs text-slate-500 space-y-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="font-medium text-blue-900">CSV Format Requirements:</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-800">
              <li>Title (required)</li>
              <li>Description, Status, Priority (optional)</li>
              <li>Due Date (YYYY-MM-DD format)</li>
              <li>Estimated Hours (number)</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || importing}
            className="bg-[#9B63E9] hover:bg-[#8A52D8]"
          >
            {importing ? (
              <>Importing...</>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import Tasks
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}