import React from 'react';
import ChatbotWidget from './components/ChatbotWidget';

const App = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <header className="mb-10 rounded-3xl bg-white shadow-lg border border-slate-200 p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-3">LocalMart</h1>
              <p className="text-slate-600 text-lg">
                Welcome! Your chatbot assistant is ready to help find nearby products. Click the bot icon in the corner to open the chat.
              </p>
            </div>
            <div className="inline-flex items-center gap-4 rounded-3xl bg-orange-100 px-5 py-4">
              <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl">🤖</div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Chatbot live</p>
                <p className="text-sm text-slate-600">Tap the floating bot button to ask about products.</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-3">Chatbot search</h2>
            <p className="text-slate-600">
              Click the chat icon and ask for a product. The assistant calls the backend at `/api/chatbot/search` and returns nearby matches.
            </p>
          </div>
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-3">How it works</h2>
            <ul className="list-disc list-inside text-slate-600 space-y-2">
              <li>Chat widget sends a POST to the chatbot search adapter.</li>
              <li>The backend forwards the query to the search service.</li>
              <li>Products are shown in the chat panel when available.</li>
            </ul>
          </div>
        </section>
      </div>

      <ChatbotWidget />
    </div>
  );
};

export default App;