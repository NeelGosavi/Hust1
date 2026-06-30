// src/components/student/ResumeUploader.tsx
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ResumeUploaderProps {
  onUpload: (file: File, text: string) => void;
  onError?: (error: string) => void;
  className?: string;
  accept?: string[];
  maxSize?: number;
}

export function ResumeUploader({ 
  onUpload, 
  onError,
  className = '',
  accept = ['.pdf'],
  maxSize = 5 * 1024 * 1024 // 5MB
}: ResumeUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: accept.reduce((acc, ext) => ({ ...acc, [ext]: [] }), {}),
    maxFiles: 1,
    maxSize,
    onDrop: async (acceptedFiles, rejectedFiles) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors.some(e => e.code === 'file-too-large')) {
          setError(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
        } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
          setError(`Invalid file type. Please upload ${accept.join(', ')}`);
        } else {
          setError('Failed to upload file. Please try again.');
        }
        if (onError) onError(error || 'Upload failed');
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      setFile(file);
      setError(null);
      setUploading(true);

      try {
        // Read file as text (for PDF we'd need a PDF parser)
        // This is a simplified version - in production, use PDF.js or similar
        const text = await file.text();
        setUploadComplete(true);
        onUpload(file, text);
      } catch (err) {
        setError('Failed to read file. Please try again.');
        if (onError) onError('Failed to read file');
      } finally {
        setUploading(false);
      }
    }
  });

  const handleRemove = () => {
    setFile(null);
    setUploadComplete(false);
    setError(null);
  };

  return (
    <div className={className}>
      {!file && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here, or click to browse'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Supports {accept.join(', ')} • Max {maxSize / (1024 * 1024)}MB
          </p>
        </div>
      )}

      {file && (
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center gap-3 min-w-0">
            <File className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {uploading && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Uploading...</span>
              </div>
            )}
            {uploadComplete && !uploading && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Uploaded</span>
              </div>
            )}
            <button
              onClick={handleRemove}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              disabled={uploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}