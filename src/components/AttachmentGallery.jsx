import { useState } from 'react';
import { X, Trash2, Download, Play, Maximize2, Edit2, Check } from 'lucide-react';
import { deleteAttachment, updateAttachmentCaption, formatFileSize } from '../services/attachmentService';

export default function AttachmentGallery({ attachments, onDelete, editable = false }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingCaption, setEditingCaption] = useState(null);
  const [captionText, setCaptionText] = useState('');
  const [deleting, setDeleting] = useState(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const navigate = (direction) => {
    setCurrentIndex(prev => {
      const next = prev + direction;
      if (next < 0) return attachments.length - 1;
      if (next >= attachments.length) return 0;
      return next;
    });
  };

  const handleDelete = async (attachmentId) => {
    if (!confirm('Delete this attachment?')) return;
    
    setDeleting(attachmentId);
    const { success, error } = await deleteAttachment(attachmentId);
    setDeleting(null);

    if (error) {
      alert('Failed to delete: ' + error.message);
      return;
    }

    if (onDelete) {
      onDelete(attachmentId);
    }
  };

  const startEditCaption = (attachment) => {
    setEditingCaption(attachment.id);
    setCaptionText(attachment.caption || '');
  };

  const saveCaption = async (attachmentId) => {
    const { error } = await updateAttachmentCaption(attachmentId, captionText);
    if (error) {
      alert('Failed to save caption: ' + error.message);
      return;
    }
    setEditingCaption(null);
  };

  const downloadFile = (attachment) => {
    const link = document.createElement('a');
    link.href = attachment.public_url;
    link.download = attachment.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentAttachment = attachments[currentIndex];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Attachments ({attachments.length})
      </h4>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {attachments.map((attachment, index) => (
          <div
            key={attachment.id}
            className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer"
            onClick={() => openLightbox(index)}
          >
            {attachment.file_type === 'image' ? (
              <img
                src={attachment.public_url}
                alt={attachment.caption || attachment.file_name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                <Play className="w-8 h-8 text-gray-500" />
              </div>
            )}

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="w-6 h-6 text-white" />
            </div>

            {attachment.file_type === 'video' && (
              <div className="absolute bottom-1 right-1 bg-black/70 rounded px-1.5 py-0.5 text-xs text-white">
                Video
              </div>
            )}
          </div>
        ))}
      </div>

      {lightboxOpen && currentAttachment && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="flex items-center justify-between p-4 text-white">
            <div className="flex-1">
              <p className="font-medium">{currentAttachment.file_name}</p>
              <p className="text-sm text-gray-400">
                {formatFileSize(currentAttachment.file_size)} - {new Date(currentAttachment.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => downloadFile(currentAttachment)} className="p-2 hover:bg-white/10 rounded-lg" title="Download">
                <Download className="w-5 h-5" />
              </button>
              {editable && (
                <button
                  onClick={() => handleDelete(currentAttachment.id)}
                  disabled={deleting === currentAttachment.id}
                  className="p-2 hover:bg-white/10 rounded-lg text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button onClick={() => setLightboxOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 relative">
            {attachments.length > 1 && (
              <>
                <button onClick={() => navigate(-1)} className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white text-xl">
                  &#8592;
                </button>
                <button onClick={() => navigate(1)} className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white text-xl">
                  &#8594;
                </button>
              </>
            )}

            {currentAttachment.file_type === 'image' ? (
              <img
                src={currentAttachment.public_url}
                alt={currentAttachment.caption || currentAttachment.file_name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <video src={currentAttachment.public_url} controls className="max-h-full max-w-full" />
            )}
          </div>

          <div className="p-4 text-white">
            {editingCaption === currentAttachment.id ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                  placeholder="Add caption..."
                  className="flex-1 bg-white/10 rounded px-3 py-2 text-white placeholder-gray-400"
                  autoFocus
                />
                <button onClick={() => saveCaption(currentAttachment.id)} className="p-2 bg-green-600 rounded">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={() => setEditingCaption(null)} className="p-2 bg-gray-600 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="flex-1 text-sm text-gray-300">
                  {currentAttachment.caption || 'No caption'}
                </p>
                {editable && (
                  <button onClick={() => startEditCaption(currentAttachment)} className="p-1 hover:bg-white/10 rounded">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <p className="text-center text-sm text-gray-500 mt-2">
              {currentIndex + 1} / {attachments.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
