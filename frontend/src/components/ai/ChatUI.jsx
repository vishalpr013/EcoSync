import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, Send, Plus, Trash2, Sparkles, Loader } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { Card } from '../ui/DataDisplay';
import { Button } from '../ui/FormControls';

const ChatUI = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef(null);

  // Quick prompt suggestions
  const prompts = [
    { title: 'Carbon reduction suggestions', query: 'Give me 5 actionable ways our department can reduce carbon emissions.' },
    { title: 'ESG compliance summary', query: 'Summarize our ESG policies and list compliance audit checklists.' },
    { title: 'CSR campaign ideas', query: 'Suggest 3 engaging CSR ideas to boost employee participation and gamify XP.' },
    { title: 'Risk assessment', query: 'Perform an ESG risk detection analysis for our manufacturing activities.' }
  ];

  // Load conversations on startup
  useEffect(() => {
    fetchConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConvId) {
      fetchMessages(currentConvId);
    } else {
      setMessages([]);
    }
  }, [currentConvId]);

  // Autoscroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const fetchConversations = async () => {
    try {
      const list = await aiService.getConversations();
      setConversations(list || []);
      if (list && list.length > 0 && !currentConvId) {
        setCurrentConvId(list[0].id);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const fetchMessages = async (id) => {
    try {
      const details = await aiService.getConversation(id);
      setMessages(details.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleStartNewConversation = async () => {
    try {
      const result = await aiService.createConversation('New Chat');
      await fetchConversations();
      setCurrentConvId(result.id);
    } catch (err) {
      console.error('Error starting chat:', err);
    }
  };

  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await aiService.deleteConversation(id);
      if (currentConvId === id) {
        setCurrentConvId(null);
      }
      await fetchConversations();
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    let activeConvId = currentConvId;
    
    // Create new conversation if none selected
    if (!activeConvId) {
      try {
        const result = await aiService.createConversation(text.substring(0, 30) + '...');
        activeConvId = result.id;
        setCurrentConvId(activeConvId);
        await fetchConversations();
      } catch (err) {
        console.error('Failed to auto-create conversation:', err);
        return;
      }
    }

    // Append user message
    const userMsg = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);
    setStreamingContent('');

    try {
      // Execute chat message streaming
      let assistantText = '';
      await aiService.sendChatMessage(activeConvId, text, (chunk) => {
        assistantText += chunk;
        setStreamingContent(assistantText);
      });

      // Once streaming finishes, re-load actual database message records
      await fetchMessages(activeConvId);
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages((prev) => [
        ...prev,
        { id: 'error', role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      setStreamingContent('');
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl border border-gray-200/80 bg-white dark:bg-gray-950 dark:border-gray-800 overflow-hidden shadow-sm">
      {/* Thread History Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/10 flex flex-col">
        <div className="p-3">
          <Button
            onClick={handleStartNewConversation}
            className="w-full flex items-center justify-center gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1.5">
          {conversations.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-6">No previous chats</p>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === currentConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setCurrentConvId(conv.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors group
                    ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900'
                    }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{conv.title || 'Untitled Discussion'}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-950">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.length === 0 && !streamingContent && (
            <div className="h-full flex flex-col justify-center items-center max-w-lg mx-auto">
              <Sparkles className="w-12 h-12 text-indigo-500 animate-pulse mb-3" />
              <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-200">
                Meet EcoSync AI Copilot
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1.5 mb-6">
                I can assist you with carbon accounting analysis, department sustainability rankings, governance audit guidelines, or gamification rules. Select a quick prompt below or type your question:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                {prompts.map((p) => (
                  <Card
                    key={p.title}
                    onClick={() => handleSendMessage(p.query)}
                    className="hover:scale-[1.01] hover:border-indigo-400/50 hover:bg-indigo-50/5 cursor-pointer flex flex-col justify-start"
                  >
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> {p.title}
                    </span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                      {p.query}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-650 flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-md">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed border
                    ${
                      isUser
                        ? 'bg-indigo-600 text-white border-transparent shadow-sm'
                        : 'bg-gray-50/50 dark:bg-gray-900/10 border-gray-150 dark:border-gray-850 dark:text-gray-255'
                    }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            );
          })}

          {streamingContent && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-indigo-650 flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-md">
                AI
              </div>
              <div className="max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed border bg-gray-50/50 dark:bg-gray-900/10 border-gray-150 dark:border-gray-850 dark:text-gray-255">
                <ReactMarkdown>{streamingContent}</ReactMarkdown>
              </div>
            </div>
          )}

          {loading && !streamingContent && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-indigo-650 flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-md">
                AI
              </div>
              <div className="px-4 py-2.5 bg-gray-50/50 border dark:bg-gray-900/10 dark:border-gray-850 rounded-xl">
                <Loader className="w-4 h-4 text-indigo-500 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input panel */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-850">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2.5"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything about EcoSync ESG data..."
              className="flex-1 px-4 py-2.5 text-sm bg-gray-50 text-gray-800 border border-gray-250 rounded-lg outline-none transition-all focus:bg-white focus:border-indigo-500 dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:focus:bg-gray-900/60"
              disabled={loading}
            />
            <Button type="submit" disabled={loading} className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
