import { useState, useEffect } from 'react';
import { HiPencil, HiCheck, HiXMark, HiEnvelope, HiPhone, HiMapPin, HiTrash, HiEye, HiChatBubbleLeftRight } from 'react-icons/hi2';
import { portfolioAPI, contactAPI } from '../../services/api';

export default function ContactManager() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    location: '',
    availability: '',
  });

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchContactData();
    fetchMessages();
  }, []);

  const fetchContactData = async () => {
    try {
      setLoading(true);
      const data = await portfolioAPI.getPortfolio();
      setFormData({
        email: data.contact?.email || '',
        phone: data.contact?.phone || '',
        location: data.profile?.location || '',
        availability: data.profile?.availability || 'Available for freelance work',
      });
    } catch (error) {
      console.error('Error fetching contact data:', error);
      alert('Failed to load contact data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setMessagesLoading(true);
      const messages = await contactAPI.getMessages();
      setMessages(Array.isArray(messages) ? messages : []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      alert('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSave = async () => {
    if (saving) return; // Prevent duplicate submissions
    
    try {
      setSaving(true);
      const updateData = {
        contact: {
          email: formData.email,
          phone: formData.phone,
        },
        profile: {
          location: formData.location,
          availability: formData.availability,
        },
      };
      await portfolioAPI.updatePortfolio(updateData);
      setIsEditing(false);
      alert('Contact information updated successfully!');
    } catch (error) {
      console.error('Error saving contact data:', error);
      alert('Failed to save contact data: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchContactData();
    setIsEditing(false);
  };

  const toggleMessageRead = async (id, currentReadStatus) => {
    try {
      await contactAPI.markAsRead(id, !currentReadStatus);
      setMessages(messages.map(msg => 
        msg._id === id ? { ...msg, read: !currentReadStatus } : msg
      ));
    } catch (error) {
      console.error('Error updating message:', error);
      alert('Failed to update message status');
    }
  };

  const deleteMessage = async (id) => {
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        await contactAPI.deleteMessage(id);
        setMessages(messages.filter(msg => msg._id !== id));
        if (selectedMessage?._id === id) {
          setSelectedMessage(null);
        }
        alert('Message deleted successfully');
      } catch (error) {
        console.error('Error deleting message:', error);
        alert('Failed to delete message');
      }
    }
  };

  const viewMessage = (message) => {
    setSelectedMessage(message);
    setReplyText(message.reply || '');
    if (!message.isRead) {
      toggleMessageRead(message._id, message.isRead);
    }
  };

  const saveReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    
    try {
      await contactAPI.addReply(selectedMessage._id, replyText);
      setMessages(messages.map(msg => 
        msg._id === selectedMessage._id 
          ? { ...msg, reply: replyText } 
          : msg
      ));
      alert('Reply saved successfully!');
      setSelectedMessage(null);
      setReplyText('');
    } catch (error) {
      console.error('Error saving reply:', error);
      alert('Failed to save reply');
    }
  };

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold font-display text-gradient mb-6">Contact Management</h2>

      {/* Contact Information */}
      <div className="glass-card p-6 rounded-2xl mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-200">Contact Information</h3>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-primary text-sm" disabled={loading}>
              <HiPencil className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSave} className="btn-primary text-sm" disabled={saving}>
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <HiCheck className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
              <button onClick={handleCancel} className="btn-outline text-sm" disabled={saving}>
                <HiXMark className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <HiEnvelope className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing}
              className="form-input disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <HiPhone className="w-4 h-4" />
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              className="form-input disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <HiMapPin className="w-4 h-4" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              disabled={!isEditing}
              className="form-input disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Availability Status</label>
            <input
              type="text"
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              disabled={!isEditing}
              className="form-input disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Messages Inbox */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-200">
            Messages Inbox
            {unreadCount > 0 && (
              <span className="ml-2 text-xs px-2 py-1 rounded-full bg-[#00d4ff]/20 text-[#00d4ff]">
                {unreadCount} new
              </span>
            )}
          </h3>
          <button 
            onClick={fetchMessages}
            className="btn-outline text-sm"
            disabled={messagesLoading}
          >
            {messagesLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {messagesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No messages yet</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`p-4 rounded-xl border transition-all ${
                  msg.isRead
                    ? 'bg-white/[0.02] border-white/[0.05]'
                    : 'bg-[#00d4ff]/[0.05] border-[#00d4ff]/20'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-200">{msg.name}</h4>
                      {msg.reply && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                          Replied
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{msg.email}</p>
                    <p className="text-sm text-slate-300 font-medium mt-1">{msg.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => viewMessage(msg)}
                      className="p-1.5 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-[#00d4ff] transition-colors"
                      title="View message"
                    >
                      <HiEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleMessageRead(msg._id, msg.isRead)}
                      className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                        msg.isRead
                          ? 'bg-white/[0.04] text-slate-400 hover:text-slate-200'
                          : 'bg-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/30'
                      }`}
                    >
                      {msg.isRead ? 'Mark Unread' : 'Mark Read'}
                    </button>
                    <button
                      onClick={() => deleteMessage(msg._id)}
                      className="p-1.5 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2">{msg.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-200">{selectedMessage.subject}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  From: {selectedMessage.name} ({selectedMessage.email})
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-slate-200"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white/[0.02] rounded-xl p-4 mb-4">
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedMessage.message}</p>
            </div>

            {selectedMessage.reply && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <HiChatBubbleLeftRight className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">Your Reply</span>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedMessage.reply}</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">
                {selectedMessage.reply ? 'Update Reply' : 'Add Reply'}
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                className="form-input resize-none"
                placeholder="Type your reply here..."
              />
              <div className="flex gap-2">
                <button
                  onClick={saveReply}
                  className="btn-primary text-sm"
                  disabled={!replyText.trim()}
                >
                  <HiCheck className="w-4 h-4" />
                  Save Reply
                </button>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="btn-outline text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
