// src/components/professor/CourseQRCode.tsx
import React, { useState, useEffect } from 'react';
import { professorApi } from '../../api/professor';
import { Download, Copy, Check, RefreshCw } from 'lucide-react';

interface CourseQRCodeProps {
  courseId: string;
  className?: string;
}

export function CourseQRCode({ courseId, className = '' }: CourseQRCodeProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchQRCode();
  }, [courseId]);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      const response = await professorApi.getQRCode(courseId);
      setQrCode(response.data.qrCode);
      setError(null);
    } catch (err) {
      console.error('Error fetching QR code:', err);
      setError('Failed to load QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.download = `course-${courseId}-qr.png`;
    link.href = qrCode;
    link.click();
  };

  const handleCopyLink = async () => {
    if (!qrCode) return;
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-gray-400">Loading QR code...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchQRCode}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline-block mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Course QR Code</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopyLink}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Copy QR code link"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Download QR code"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center">
        {qrCode ? (
          <img 
            src={qrCode} 
            alt="Course QR Code" 
            className="w-48 h-48 object-contain border rounded-lg p-2"
          />
        ) : (
          <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-400">No QR code</span>
          </div>
        )}
        <p className="mt-4 text-sm text-gray-500">
          Scan to enroll in this course
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Course ID: {courseId}
        </p>
      </div>
    </div>
  );
}