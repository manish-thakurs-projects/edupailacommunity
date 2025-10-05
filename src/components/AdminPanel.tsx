'use client';

import React, { useEffect, useState } from 'react';

type Attachment = {
  name: string;
  content: string;
  type?: string;
  size?: number;
  preview?: string | null;
};

// Icons (You can replace these with your preferred icon library)
const Icons = {
  Send: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  Logout: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Add: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Remove: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Attachment: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>,
  Video: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Error: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

export default function AdminPanel() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState('');
  const [videoLinks, setVideoLinks] = useState<string[]>([]);
  const [videoInput, setVideoInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('adminToken');
    setAdminToken(token);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'adminToken') setAdminToken(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const logout = () => {
    localStorage.removeItem('adminToken');
    setAdminToken(null);
    setMessage('Logged out');
    setResults([]);
  };

  const addVideoLink = () => {
    const link = videoInput.trim();
    if (!link) return;
    setVideoLinks((s) => [...s, link]);
    setVideoInput('');
  };

  const removeVideoLink = (idx: number) => {
    setVideoLinks((s) => s.filter((_, i) => i !== idx));
  };

  const fileToBase64 = (file: File): Promise<Attachment> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('File read error'));
      reader.onload = () => {
        const result = String(reader.result || '');
        const parts = result.split(',');
        const base64 = parts.length > 1 ? parts[1] : parts[0];
        const preview = file.type.startsWith('image/') ? result : null;
        resolve({
          name: file.name,
          content: base64,
          type: file.type,
          size: file.size,
          preview,
        });
      };
      reader.readAsDataURL(file);
    });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const arr = Array.from(files);
      const mapped = await Promise.all(arr.map(fileToBase64));
      setAttachments((s) => [...s, ...mapped]);
    } catch (err) {
      console.error('[AdminPanel] file read error', err);
      setMessage('Failed to read one or more files');
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments((s) => s.filter((_, i) => i !== idx));
  };

  const sendEmails = async () => {
    setMessage(null);
    setResults([]);
    if (!adminToken) {
      setMessage('No admin token found. Login first.');
      return;
    }
    if (!subject.trim() || !content.trim()) {
      setMessage('Subject and content are required.');
      return;
    }
    setSending(true);

    try {
      const body: any = {
        subject,
        content,
        videoLinks,
        attachments: attachments.map((a) => ({ name: a.name, content: a.content, type: a.type })),
      };
      if (recipients.trim()) {
        body.recipientEmails = recipients
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean);
      }

      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok && res.status !== 207) {
        setMessage(json.error || `Send failed (${res.status})`);
      } else {
        setMessage(json.message || 'Emails processed');
        if (json.results) setResults(json.results);
      }
    } catch (err) {
      console.error('[AdminPanel] sendEmails error', err);
      setMessage('Network error sending emails');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 lg:mb-12">
          <div>
            <h1 className="text-2xl lg:text-3xl font-light text-black tracking-tight">Broadcast</h1>
            <p className="text-gray-600 text-sm mt-1">Send emails to your audience</p>
          </div>
          {adminToken && (
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-black text-black hover:bg-black hover:text-white transition-all duration-200 rounded-lg"
            >
              <Icons.Logout />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>

        {/* Auth Status */}
        {!adminToken && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2 text-red-800">
              <Icons.Error />
              <span className="text-sm font-medium">Not authenticated</span>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="space-y-6">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              placeholder="Enter email subject"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all h-48"
              placeholder="Compose your message..."
            />
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Recipients
              <span className="text-gray-500 font-normal ml-1">(optional)</span>
            </label>
            <input
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              placeholder="Leave blank for all users, or enter comma-separated emails"
            />
          </div>

          {/* Video Links */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Video Links</label>
            <div className="flex gap-2 mb-3">
              <input
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                placeholder="https://youtube.com/..."
              />
              <button
                onClick={addVideoLink}
                className="flex items-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all"
              >
                <Icons.Add />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
            {videoLinks.length > 0 && (
              <div className="space-y-2">
                {videoLinks.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Icons.Video />
                      <a
                        href={v}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 truncate hover:underline"
                      >
                        {v}
                      </a>
                    </div>
                    <button
                      onClick={() => removeVideoLink(i)}
                      className="p-1 hover:bg-gray-200 rounded transition-all"
                    >
                      <Icons.Remove />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Attachments</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-all">
              <input
                type="file"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Icons.Attachment />
                <p className="text-sm text-gray-600 mt-2">Click to upload files or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">Images, PDF, DOCX, etc.</p>
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="mt-4 space-y-3">
                {attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                    {a.preview ? (
                      <img
                        src={a.preview}
                        alt={a.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg">
                        <Icons.Attachment />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">{a.name}</p>
                      <p className="text-xs text-gray-500">
                        {a.type} • {((a.size ?? 0) / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => removeAttachment(i)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                    >
                      <Icons.Remove />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={sendEmails}
              disabled={sending || !adminToken}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex-1 justify-center"
            >
              <Icons.Send />
              <span>{sending ? 'Sending...' : 'Send Broadcast'}</span>
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div className={`p-4 rounded-lg border ${
              message.includes('failed') || message.includes('error') || message.includes('Not authenticated')
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              <div className="flex items-center gap-2">
                {message.includes('failed') || message.includes('error') || message.includes('Not authenticated') ? (
                  <Icons.Error />
                ) : (
                  <Icons.Check />
                )}
                <span className="text-sm">{message}</span>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-black">Delivery Results</h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                      r.success ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    {r.success ? (
                      <Icons.Check  />
                    ) : (
                      <Icons.Error  />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black">{r.to}</p>
                      {!r.success && (
                        <p className="text-xs text-red-600 mt-1">{r.error || 'Unknown error'}</p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        r.success
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {r.success ? 'Sent' : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}