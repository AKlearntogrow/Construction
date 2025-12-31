import { useState, useRef } from 'react';
import { Camera, Video, Upload, X, Loader, CheckCircle, AlertCircle, Image } from 'lucide-react';
import { uploadAttachment, formatFileSize } from '../services/attachmentService';

export default function FileUpload({ ticketId, onUploadComplete, disabled = false }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelect = (selectedFiles) => {
    const newFiles = Array.from(selectedFiles).map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      status: 'pending',
      error: null
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (fileId) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const uploadFiles = async () => {
    if (!ticketId) {
      alert('Please save the ticket first before uploading attachments.');
      return;
    }

    setUploading(true);
    const pendingFiles = files.filter(f => f.status === 'pending');

    for (const fileObj of pendingFiles) {
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { ...f, status: 'uploading' } : f
      ));

      const { data, error } = await uploadAttachment(fileObj.file, ticketId);

      setFiles(prev => prev.map(f => 
        f.id === fileObj.id 
          ? { ...f, status: error ? 'error' : 'success', error: error?.message, data }
          : f
      ));
    }

    setUploading(false);
    
    const successfulUploads = files.filter(f => f.status === 'success').map(f => f.data);
    if (successfulUploads.length > 0 && onUploadComplete) {
      onUploadComplete(successfulUploads);
    }
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'uploading':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={disabled ? undefined : handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-2">
            <Image className="w-8 h-8 text-gray-400" />
            <Video className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-blue-600 dark:text-blue-400">Click to upload</span>
            {' '}or drag and drop
          </p>
          <p className="text-xs text-gray-500">Photos (JPG, PNG) or Videos (MP4, MOV) up to 50MB</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={disabled}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          <Camera className="w-4 h-4" />
          Take Photo
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Files ({files.length})
            </span>
            {successCount > 0 && (
              <span className="text-xs text-green-600">{successCount} uploaded</span>
            )}
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((fileObj) => (
              <div key={fileObj.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {fileObj.preview ? (
                    <img src={fileObj.preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{fileObj.file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(fileObj.file.size)}</p>
                  {fileObj.error && <p className="text-xs text-red-500 truncate">{fileObj.error}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon status={fileObj.status} />
                  {fileObj.status === 'pending' && (
                    <button type="button" onClick={() => removeFile(fileObj.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingCount > 0 && (
        <button
          type="button"
          onClick={uploadFiles}
          disabled={uploading || disabled || !ticketId}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <><Loader className="w-4 h-4 animate-spin" />Uploading...</>
          ) : (
            <><Upload className="w-4 h-4" />Upload {pendingCount} {pendingCount === 1 ? 'file' : 'files'}</>
          )}
        </button>
      )}

      {!ticketId && files.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Save the ticket first, then you can upload attachments.
        </p>
      )}
    </div>
  );
}
