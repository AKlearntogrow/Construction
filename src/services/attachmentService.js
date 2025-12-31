/**
 * ChangeFlow AI - Attachment Service
 * Handles photo/video uploads to Supabase Storage
 */

import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'ticket-attachments';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  video: ['video/mp4', 'video/quicktime', 'video/webm']
};

export async function uploadAttachment(file, ticketId) {
  try {
    if (file.size > MAX_FILE_SIZE) {
      return { 
        data: null, 
        error: { message: 'File too large. Maximum size is 50MB' }
      };
    }

    const fileType = getFileType(file.type);
    if (!fileType) {
      return { 
        data: null, 
        error: { message: 'File type not supported. Allowed: JPG, PNG, WebP, MP4, MOV, WebM' }
      };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${ticketId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { data: null, error: uploadError };
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const { data: attachmentData, error: dbError } = await supabase
      .from('ticket_attachments')
      .insert({
        ticket_id: ticketId,
        file_name: file.name,
        file_type: fileType,
        mime_type: file.type,
        file_size: file.size,
        storage_path: fileName,
        public_url: urlData.publicUrl
      })
      .select()
      .single();

    if (dbError) {
      await supabase.storage.from(BUCKET_NAME).remove([fileName]);
      return { data: null, error: dbError };
    }

    return { data: attachmentData, error: null };

  } catch (err) {
    console.error('Upload exception:', err);
    return { data: null, error: { message: err.message } };
  }
}

export async function uploadMultipleAttachments(files, ticketId) {
  const results = { successful: [], failed: [] };

  for (const file of files) {
    const { data, error } = await uploadAttachment(file, ticketId);
    if (error) {
      results.failed.push({ file: file.name, error: error.message });
    } else {
      results.successful.push(data);
    }
  }

  return results;
}

export async function getTicketAttachments(ticketId) {
  const { data, error } = await supabase
    .from('ticket_attachments')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

export async function deleteAttachment(attachmentId) {
  try {
    const { data: attachment, error: fetchError } = await supabase
      .from('ticket_attachments')
      .select('storage_path')
      .eq('id', attachmentId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError };
    }

    await supabase.storage
      .from(BUCKET_NAME)
      .remove([attachment.storage_path]);

    const { error: dbError } = await supabase
      .from('ticket_attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) {
      return { success: false, error: dbError };
    }

    return { success: true, error: null };

  } catch (err) {
    return { success: false, error: { message: err.message } };
  }
}

export async function updateAttachmentCaption(attachmentId, caption) {
  const { data, error } = await supabase
    .from('ticket_attachments')
    .update({ caption })
    .eq('id', attachmentId)
    .select()
    .single();

  return { data, error };
}

function getFileType(mimeType) {
  if (ALLOWED_TYPES.image.includes(mimeType)) return 'image';
  if (ALLOWED_TYPES.video.includes(mimeType)) return 'video';
  return null;
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
