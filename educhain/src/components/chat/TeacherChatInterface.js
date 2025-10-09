import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { Send, X, PlusCircle } from 'lucide-react';

// set backend host for websocket connection
const BACKEND_HOST = 'educhain-ai.onrender.com';

const TeacherChatInterface = ({ isOpen, onClose, updateTotalUnreadMessages }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableParents, setAvailableParents] = useState([]);
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  const messagesEndRef = useRef(null); // Ref for auto-scrolling

  const ws = useRef(null); // WebSocket instance ref
  const [isConnected, setIsConnected] = useState(false);
  const [wsError, setWsError] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getConversationTitle = (conversation, currentUser) => {
    // For teacher_parent conversations, always display the parent's name or email.
    if (conversation.conversation_type === 'teacher_parent' && conversation.parent) {
      const parent = conversation.parent;
      return parent.first_name && parent.last_name
        ? `${parent.first_name} ${parent.last_name}`
        : parent.first_name || parent.email || `Parent ${parent.id}`;
    }
    // Fallback for other conversation types or if parent data is missing.
    // We will not display the `conversation.title` for teacher_parent conversations on the frontend
    return `Conversation ${conversation.id}`;
  };

  // Fetch conversations and parents when component mounts or becomes open
  useEffect(() => {
    console.log("TeacherChatInterface: Main useEffect triggered.", { isOpen, user, currentConversation });
    if (!isOpen) {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log("TeacherChatInterface: Closing WS due to isOpen = false");
        ws.current.close();
      }
      return;
    }

    const accessToken = localStorage.getItem('access_token');
    if (!accessToken || !user?.id) {
      console.error("TeacherChatInterface: Authentication token or user ID is missing.", { accessToken: !!accessToken, userId: user?.id });
      setError("Authentication token or user ID is missing.");
      return;
    }

    const fetchConversationsAndParents = async () => {
      setIsLoading(true);
      try {
        const conversationsResponse = await axiosInstance.get('/chat/conversations/');
        let fetchedConversations = conversationsResponse.data;

        setConversations(fetchedConversations);

        const unreadCount = fetchedConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
        if (updateTotalUnreadMessages) {
          updateTotalUnreadMessages(unreadCount);
        }

        if (!currentConversation && fetchedConversations.length > 0) {
          const convToSet = fetchedConversations[0];
          setCurrentConversation(convToSet);

          // Establish WebSocket connection for the first conversation
          if (convToSet.id && accessToken) {
            console.log("TeacherChatInterface: Attempting to connect WS from initial load for conversation:", convToSet.id);
            const websocketUrl = `wss://${BACKEND_HOST}/ws/chat/${convToSet.id}/?token=${accessToken}`;
            console.log("TeacherChatInterface: WebSocket URL (initial):", websocketUrl);
            
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
              ws.current.close();
            }
            ws.current = new WebSocket(websocketUrl);

            ws.current.onopen = () => {
              console.log('WebSocket connection opened.');
              setIsConnected(true);
              setWsError(null);
            };

            ws.current.onmessage = (event) => {
              const data = JSON.parse(event.data);
              console.log('Received message via WebSocket:', data);
              setMessages(prevMessages => [...prevMessages, {
                  id: data.message_id,
                  sender: { id: data.sender_id, first_name: data.sender_first_name },
                  content: data.message,
                  timestamp: data.timestamp,
              }]);
              // Refresh conversations to update unread counts
              fetchConversationsAndParents(); 
            };

            ws.current.onclose = (event) => {
              console.log('WebSocket connection closed.', event);
              setIsConnected(false);
              if (!event.wasClean) {
                setWsError('WebSocket connection lost unexpectedly. Please refresh.');
              }
            };

            ws.current.onerror = (err) => {
              console.error('WebSocket error:', err);
              setWsError('WebSocket connection error. Please try again.');
            };
          }
        }
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
        setError('Failed to load conversations.');
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchParents = async () => {
      if (user?.role !== 'TEACHER') return;
      setIsLoadingParents(true);
      try {
        const studentsResponse = await axiosInstance.get('/students/all/');
        const uniqueParents = new Map();
        studentsResponse.data.forEach(student => {
          student.parents.forEach(parent => {
            if (parent.id) {
              const parentName = parent.first_name && parent.last_name 
                                 ? `${parent.first_name} ${parent.last_name}`
                                 : parent.first_name || parent.last_name || parent.email || `Parent ${parent.id}`;
              uniqueParents.set(parent.id, { id: parent.id, name: parentName });
            }
          });
        });
        setAvailableParents(Array.from(uniqueParents.values()));
      } catch (err) {
        console.error('Failed to fetch parents for new conversation:', err);
        setError('Failed to load parents.');
      } finally {
        setIsLoadingParents(false);
      }
    };

    fetchConversationsAndParents();
    if (user?.role === 'TEACHER') {
        fetchParents();
    }
  }, [isOpen, user, currentConversation, updateTotalUnreadMessages]);

  // Re-establish WebSocket when currentConversation changes (if already open)
  useEffect(() => {
    console.log("TeacherChatInterface: Reconnect useEffect triggered.", { isOpen, currentConversation, user });
    if (!isOpen || !currentConversation?.id || !user?.id) {
      console.log("TeacherChatInterface: Skipping WS reconnect.", { isOpen, currentConversationId: currentConversation?.id, userId: user?.id });
      return;
    }

    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      console.error("TeacherChatInterface: Authentication token is missing for WebSocket reconnect.");
      setError("Authentication token is missing for WebSocket.");
      return;
    }

    console.log("TeacherChatInterface: Attempting to reconnect WS for conversation:", currentConversation.id);
    const websocketUrl = `wss://${BACKEND_HOST}/ws/chat/${currentConversation.id}/?token=${accessToken}`;
    console.log("TeacherChatInterface: WebSocket URL (reconnect):", websocketUrl);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.close();
    }

    ws.current = new WebSocket(websocketUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connection opened for new conversation.');
      setIsConnected(true);
      setWsError(null);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message via WebSocket:', data);
      setMessages(prevMessages => [...prevMessages, {
          id: data.message_id,
          sender: { id: data.sender_id, first_name: data.sender_first_name },
          content: data.message,
          timestamp: data.timestamp,
      }]);
      axiosInstance.get('/chat/conversations/').then(response => {
        const updatedConversations = response.data;
        setConversations(updatedConversations);
        const unreadCount = updatedConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
        if (updateTotalUnreadMessages) {
          updateTotalUnreadMessages(unreadCount);
        }
      });
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket connection closed for new conversation.', event);
      setIsConnected(false);
      if (!event.wasClean) {
        setWsError('WebSocket connection lost unexpectedly. Please refresh.');
      }
    };

    ws.current.onerror = (err) => {
      console.error('WebSocket error:', err);
      setWsError('WebSocket connection error. Please try again.');
    };

    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };

  }, [currentConversation, isOpen, user, updateTotalUnreadMessages]);

  // Fetch messages for the current conversation via REST API
  useEffect(() => {
    if (!currentConversation) {
      setMessages([]);
      return;
    }

    const fetchHistoricalMessages = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get(`/chat/conversations/${currentConversation.id}/messages/`);
        setMessages(response.data);
        await axiosInstance.post(`/chat/conversations/${currentConversation.id}/mark-read/`);
        if (updateTotalUnreadMessages) {
          const updatedConversationsResponse = await axiosInstance.get('/chat/conversations/');
          const updatedConversations = updatedConversationsResponse.data;
          const unreadCount = updatedConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
          updateTotalUnreadMessages(unreadCount);
        }
      } catch (err) {
        console.error('Failed to fetch historical messages:', err);
        setError('Failed to load messages.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistoricalMessages();
  }, [currentConversation, updateTotalUnreadMessages]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageContent.trim() || !currentConversation) return;

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const messageData = {
        conversation: currentConversation.id,
        message: newMessageContent,
      };
      ws.current.send(JSON.stringify(messageData));
      setNewMessageContent('');
    } else {
      setError("Not connected to chat. Please wait or refresh.");
    }
  };

  const startConversationWithParent = async (parentId, parentName) => {
    // Check if a conversation with this parent already exists
    const existingConversation = conversations.find(
      (conv) => conv.conversation_type === 'teacher_parent' && conv.parent?.id === parentId
    );

    if (existingConversation) {
      setCurrentConversation(existingConversation);
      setError(null);
      return;
    }

    const title = `Conversation with ${parentName}`; // This will be overwritten by the backend title, but is a good fallback
    try {
      const response = await axiosInstance.post('/chat/conversations/create/', {
        title: title,
        conversation_type: 'teacher_parent',
        teacher: user.id,
        parent: parentId,
      });
      setConversations(prev => [response.data, ...prev]);
      setCurrentConversation(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError('Failed to start conversation.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50">
      <div className="chat-container bg-white rounded-lg shadow-xl flex h-5/6 w-11/12 md:w-2/3 lg:w-1/2">
        
        {/* Chat Sidebar */}
        <div className="chat-sidebar w-1/3 border-r border-gray-200 flex flex-col">
          <div className="sidebar-header p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800">Conversations</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition duration-150">
              <X size={24} />
            </button>
          </div>
          <div className="conversations-list flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="text-gray-500">Loading conversations...</div>
            ) : error ? (
              <div className="text-red-500">Error: {error}</div>
            ) : (
              <>
                {/* Display existing conversations */}
                {conversations.length > 0 && (
                  <div className="mb-6">
                    {conversations.map(conv => (
                      <div
                        key={conv.id}
                        className={`conversation-item p-3 cursor-pointer rounded-md mb-2 ${currentConversation?.id === conv.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-50 text-gray-700'}`}
                        onClick={() => setCurrentConversation(conv)}
                      >
                        <div className="conversation-name font-semibold flex justify-between items-center">
                          {getConversationTitle(conv, user)}
                          {conv.unread_count > 0 && (
                            <span className="unread-badge ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{conv.unread_count}</span>
                          )}
                        </div>
                        {conv.last_message && (
                          <div className="conversation-preview text-sm text-gray-600 truncate">
                            {conv.last_message.sender_id === user.id
                              ? "You"
                              : conv.last_message.sender_id === conv.teacher.id
                                ? conv.teacher.first_name
                                : conv.last_message.sender_id === conv.parent.id
                                  ? conv.parent.first_name
                                  : "Someone"}: {conv.last_message.content?.substring(0, 30)}...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Display "Start New Chat" section for teachers below conversations */}
                {user?.role === 'TEACHER' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Start New Chat</h3>
                    {isLoadingParents ? (
                      <p className="text-gray-500">Loading parents...</p>
                    ) : availableParents.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2 mb-4">
                        {availableParents.map(parent => (
                          <div
                            key={parent.id}
                            className="p-2 cursor-pointer hover:bg-gray-100 rounded-md flex justify-between items-center"
                            onClick={() => startConversationWithParent(parent.id, parent.name)}
                          >
                            <span className="font-medium text-gray-800">{parent.name}</span>
                            <PlusCircle size={20} className="text-blue-500" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No parents available to start a conversation with.</p>
                    )}
                  </div>
                )}
                {conversations.length === 0 && user?.role !== 'TEACHER' && (
                    <p className="text-gray-500 text-sm">No conversations yet.</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Chat Main Section */}
        <div className="chat-main flex-1 flex flex-col">
          <div className="chat-header p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              {currentConversation ? getConversationTitle(currentConversation, user)
                                   : "Select a conversation or start a new one"}
            </h2>
          </div>

          <div className="chat-messages flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col" ref={messagesEndRef}>
            {currentConversation ? (
              messages.map(message => (
                <div
                  key={message.id}
                  className={`message mb-3 p-3 rounded-lg max-w-[70%] ${message.sender.id === user.id ? 'self-end ml-auto bg-blue-500 text-white' : 'self-start mr-auto bg-gray-200 text-gray-800'}`}
                >
                  <div className="message-info font-semibold text-sm mb-1">
                    {message.sender.id === user.id ? "You" : message.sender.first_name}
                  </div>
                  {message.content}
                  <div className="message-timestamp text-xs mt-1 opacity-75">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">Select a conversation or start a new one.</div>
            )}
            <div /> {/* Invisible div for scrolling to bottom */}
          </div>

          {currentConversation && (
            <form onSubmit={handleSendMessage} className="chat-input-container p-4 border-t border-gray-200 bg-white flex items-center">
              <div className="chat-input-wrapper flex-1 flex items-center border border-gray-300 rounded-lg pr-2">
                <textarea 
                  id="chat-input" 
                  className="chat-input flex-1 p-2 resize-none outline-none overflow-hidden h-10"
                  placeholder="Type your message here..."
                  rows="1"
                  value={newMessageContent}
                  onChange={(e) => setNewMessageContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button type="submit" className="send-button bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg flex-shrink-0">
                  <Send size={20} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherChatInterface;
