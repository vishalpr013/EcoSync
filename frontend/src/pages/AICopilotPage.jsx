import React from 'react';
import ChatUI from '../components/ai/ChatUI';

const AICopilotPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">EcoSync AI Copilot</h1>
        <p className="text-sm text-gray-500 mt-1">Converse with our context-aware assistant for policy checks, ESG scoring summaries, and carbon calculations.</p>
      </div>
      
      <ChatUI />
    </div>
  );
};

export default AICopilotPage;
