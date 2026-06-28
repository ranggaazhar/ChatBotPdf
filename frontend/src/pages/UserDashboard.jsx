import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import DashboardLayout from '../components/DashboardLayout';
import ChatSidebar from '../components/ChatSidebar';
import ChatArea from '../components/ChatArea';

/**
 * User Dashboard Page acting as the layout and state connector.
 */
const UserDashboard = () => {
  const { user, logout } = useAuth();
  const {
    threads,
    activeThreadId,
    messages,
    loading,
    threadsLoading,
    selectThread,
    deleteThread,
    sendMessage
  } = useChat();

  const [input, setInput] = useState('');
  const [docSearch, setDocSearch] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini');

  const handleSelectThread = (threadId) => {
    selectThread(threadId);
  };

  const handleDeleteThread = (threadId) => {
    deleteThread(threadId);
  };

  const handleSendMessage = (e, suggestedText = null) => {
    if (e) e.preventDefault();
    
    const queryText = suggestedText || input;
    if (!queryText || queryText.trim() === '') return;

    sendMessage(queryText, selectedModel);
    setInput('');
  };

  const activeThread = threads.find(t => t.id === activeThreadId);

  return (
    <DashboardLayout
      logoIcon="🤖"
      logoText="ChatAI Tarjih"
      user={user}
      logout={logout}
      sidebarContent={
        <ChatSidebar
          threads={threads}
          activeThreadId={activeThreadId}
          threadsLoading={threadsLoading}
          docSearch={docSearch}
          setDocSearch={setDocSearch}
          onSelectThread={handleSelectThread}
          onDeleteThread={handleDeleteThread}
        />
      }
    >
      <ChatArea
        activeThread={activeThread}
        messages={messages}
        loading={loading}
        input={input}
        setInput={setInput}
        onSendMessage={handleSendMessage}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />
    </DashboardLayout>
  );
};

export default UserDashboard;
