import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadFileToFirebaseStorage } from '../lib/firebaseSync';

interface DocumentUploaderProps {
  path: string;
  label?: string;
  description?: string;
  acceptedTypes?: string;
  onUploadComplete: (url: string, file: File) => void;
  onError?: (err: Error) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  path,
  label = 'Upload Document',
  description = 'Drag & drop a file here, or click to browse',
  acceptedTypes = 'image/*,.pdf,.doc,.docx',
  onUploadComplete,
  onError
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    setUploadedUrl(null);

    try {
      const url = await uploadFileToFirebaseStorage(file, `${path}/${file.name}`);
      setUploadedUrl(url);
      onUploadComplete(url, file);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to upload file');
      if (onError) onError(err);
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  if (uploadedUrl) {
    return (
      <div className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50 rounded-xl">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">File uploaded successfully</p>
            <a href={uploadedUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline break-all">
              View File
            </a>
          </div>
        </div>
        <button 
          onClick={() => {
            setUploadedUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          className="text-xs text-slate-500 hover:text-slate-800 underline"
        >
          Replace
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>}
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragging ? 'border-emerald-500 bg-emerald-50' : 
          errorMsg ? 'border-rose-300 bg-rose-50' : 
          'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={onChange}
          accept={acceptedTypes}
          className="hidden" 
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 size={24} className="text-emerald-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            {errorMsg ? (
              <>
                <AlertCircle size={24} className="text-rose-500" />
                <p className="text-sm font-semibold text-rose-700">{errorMsg}</p>
                <p className="text-xs text-slate-500">Click to try again</p>
              </>
            ) : (
              <>
                <UploadCloud size={24} className="text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">Click or Drag & Drop</p>
                <p className="text-xs text-slate-400">{description}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
