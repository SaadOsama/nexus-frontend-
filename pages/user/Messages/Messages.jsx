import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Send, Search, MessageSquare } from 'lucide-react';
import { socket } from '../../../src/api/client/socket.js';
import api from '../../../src/api/axios.js';

// Short helper to build the "Name — Project Title" label used everywhere
// so the same two users can be told apart across different project chats.
const formatConversationLabel = (name, projectTitle) => {
  if (!projectTitle) return name;
  const shortTitle = projectTitle.split(' ').slice(0, 3).join(' ');
  return `${name} — ${shortTitle}`;
};

// A conversation is now identified by BOTH the other user's id AND the
// project id — the same two people can have separate threads per project.
const conversationKey = (userId, projectId) => `${projectId}_${userId}`;

const Messages = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const { user: currentUser } = useSelector((state) => state.user || state.auth || {});

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null); // { id, projectId, name, projectTitle }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Initial Conversations Fetching
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get('/messages/conversations');
        const data = response.data;
        const list = data.conversations || data || [];
        const normalized = list.map((c) => ({
          id: Number(c.id || c.user_id || c.sender_id),
          projectId: c.projectId || c.project_id,
          name: c.name || c.username || c.sender_name || 'Project Owner',
          projectTitle: c.projectTitle || c.project_title || '',
          lastMessage: c.lastMessage || c.message || 'No messages yet',
        }));
        setConversations(normalized);
      } catch (err) {
        console.error('Failed to load conversations', err);
      }
    };

    fetchConversations();
  }, [navigate]);

  // 2. Discover / Collaboration page selected owner+project handler
  // NOTE: whichever screen navigates here (Discover, CollaborationRequestCard,
  // MyProjects, etc.) must now pass BOTH selectedUserId and selectedProjectId
  // (+ selectedProjectTitle) in location.state — see note below this file.
  useEffect(() => {
    if (location.state?.selectedUserId && location.state?.selectedProjectId) {
      const incomingConversation = {
        id: Number(location.state.selectedUserId),
        projectId: Number(location.state.selectedProjectId),
        name: location.state.selectedUserName || 'Project Owner',
        projectTitle: location.state.selectedProjectTitle || '',
        lastMessage: 'New Chat',
      };

      setActiveConversation(incomingConversation);

      setConversations((prev) => {
        const exists = prev.some(
          (c) => conversationKey(c.id, c.projectId) === conversationKey(incomingConversation.id, incomingConversation.projectId)
        );
        return exists ? prev : [incomingConversation, ...prev];
      });
    }
  }, [location.state]);

  // 3. Socket Connection and Registration
  useEffect(() => {
    if (!currentUser?.id) return;

    if (!socket.connected) {
      socket.connect();
    }

    const register = () => {
      socket.emit('register_user', currentUser.id);
    };

    if (socket.connected) {
      register();
    } else {
      socket.on('connect', register);
    }

    return () => {
      socket.off('connect', register);
    };
  }, [currentUser]);

  // 4. Real-time Incoming Message Listener
  useEffect(() => {
    const handleReceiveMessage = (data) => {
      const incomingSenderId = Number(data.senderId || data.sender_id);
      const incomingProjectId = Number(data.projectId || data.project_id);
      const messageContent = data.text || data.message;

      setActiveConversation((currentActive) => {
        if (
          currentActive &&
          Number(currentActive.id) === incomingSenderId &&
          Number(currentActive.projectId) === incomingProjectId
        ) {
          setMessages((prevMsgs) => [
            ...prevMsgs,
            { ...data, senderId: incomingSenderId, text: messageContent },
          ]);
        }
        return currentActive;
      });

      setConversations((prevConvs) => {
        const key = conversationKey(incomingSenderId, incomingProjectId);
        const exists = prevConvs.some((c) => conversationKey(c.id, c.projectId) === key);
        if (exists) {
          return prevConvs.map((c) =>
            conversationKey(c.id, c.projectId) === key
              ? { ...c, lastMessage: messageContent }
              : c
          );
        } else {
          return [
            {
              id: incomingSenderId,
              projectId: incomingProjectId,
              name: data.senderName || 'New User',
              projectTitle: data.projectTitle || '',
              lastMessage: messageContent,
            },
            ...prevConvs,
          ];
        }
      });
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, []);

  // 5. Fetch Chat History when active conversation changes
  useEffect(() => {
    if (!activeConversation) return;

    // 🟢 Guard: a conversation MUST carry a projectId. If it doesn't, the
    // screen that started this conversation (Discover / "Message Owner"
    // button / collaboration accept flow) forgot to pass selectedProjectId
    // in navigate(..., { state }). Fail loudly instead of hitting
    // /api/messages/undefined/<id>.
    if (!activeConversation.projectId) {
      console.error(
        '❌ activeConversation is missing projectId — the screen that started this chat did not pass selectedProjectId in navigate() state.',
        activeConversation
      );
      setMessages([]);
      return;
    }

    const fetchChatHistory = async () => {
      try {
        const response = await api.get(
          `/messages/${activeConversation.projectId}/${activeConversation.id}`
        );
        const data = response.data;
        setMessages(data.messages || data || []);
      } catch (err) {
        console.error('Failed to load chat history', err);
      }
    };

    fetchChatHistory();
  }, [activeConversation]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Message Handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !currentUser) return;

    if (!activeConversation.projectId) {
      console.error('❌ Cannot send message — activeConversation has no projectId.', activeConversation);
      alert('Ye conversation kisi project se linked nahi hai. Please Discover se dobara "Message" button dabao.');
      return;
    }

    const messageText = newMessage.trim();

    const msgData = {
      senderId: Number(currentUser.id),
      senderName: currentUser.name || 'User',
      receiverId: Number(activeConversation.id),
      projectId: Number(activeConversation.projectId),
      projectTitle: activeConversation.projectTitle,
      text: messageText,
      message: messageText,
      createdAt: new Date().toISOString(),
    };

    // Socket Emit — real-time relay only, no DB write happens here
    socket.emit('send_message', msgData);

    // Local UI update for sender (optimistic)
    setMessages((prev) => [...prev, { ...msgData, sender: 'me' }]);

    setConversations((prev) =>
      prev.map((c) =>
        conversationKey(c.id, c.projectId) === conversationKey(activeConversation.id, activeConversation.projectId)
          ? { ...c, lastMessage: messageText }
          : c
      )
    );

    setNewMessage('');

    // Single DB write happens here via REST
    try {
      const response = await api.post('/messages/send', {
        receiverId: Number(activeConversation.id),
        projectId: Number(activeConversation.projectId),
        message: messageText,
      });
      console.log('✅ Message saved in DB with ID:', response.data.id);
    } catch (err) {
      console.error('❌ Error saving message:', err);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    formatConversationLabel(c.name, c.projectTitle).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto h-[calc(100vh-120px)] p-2 sm:p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm h-full flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-full sm:w-80 md:w-96 border-r border-slate-100 flex flex-col h-full bg-slate-50/50">
          <div className="p-4 border-b border-slate-100 bg-white">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Messages</h2>
            <p className="text-xs text-slate-500 mb-3">
              {conversations.length} conversation{conversations.length !== 1 && 's'}
            </p>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0f9f59]/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((usr) => {
                const key = conversationKey(usr.id, usr.projectId);
                const isActive =
                  activeConversation &&
                  conversationKey(activeConversation.id, activeConversation.projectId) === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveConversation(usr)}
                    className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-[#0f9f59] font-medium'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#0f9f59]/10 text-[#0f9f59] flex items-center justify-center font-bold text-sm shrink-0">
                      {usr.name ? usr.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {formatConversationLabel(usr.name, usr.projectTitle)}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {usr.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-10 px-4 text-slate-400 text-xs">
                No conversations found
              </div>
            )}
          </div>
        </div>

        {/* Right Main Chat Window */}
        <div className="hidden sm:flex flex-1 flex-col h-full bg-white">
          {activeConversation ? (
            <>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0f9f59]/10 text-[#0f9f59] flex items-center justify-center font-bold text-sm">
                    {activeConversation.name ? activeConversation.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {formatConversationLabel(activeConversation.name, activeConversation.projectTitle)}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                    <p>Start a new conversation with {activeConversation.name}</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe =
                      msg.sender === 'me' ||
                      Number(msg.senderId || msg.sender_id) === Number(currentUser?.id);
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-[#0f9f59] text-white rounded-br-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                          }`}
                        >
                          {msg.text || msg.message}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {(msg.createdAt || msg.created_at)
                            ? new Date(msg.createdAt || msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Just now'}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0f9f59]/20"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-[#0f9f59] hover:bg-[#0d8a4e] text-white rounded-xl disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">Select a user to start messaging</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Choose a conversation from the left or message a project owner from the Discover section.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
