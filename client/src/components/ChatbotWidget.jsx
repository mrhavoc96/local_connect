import { useState, useEffect, useRef } from 'react';

const ChatbotWidget = ({ apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api/chatbot' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your LocalMart assistant. Tell me what you're looking for and I'll find products near you!",
      products: [],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [sessionId] = useState(() => crypto.randomUUID());
  const apiToken = import.meta.env.VITE_API_TOKEN || '';
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        () => {
          setLat(0);
          setLng(0);
        }
      );
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiToken) {
        headers.Authorization = `Bearer ${apiToken}`;
      }

      const res = await fetch(`${apiBase}/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: text, lat, lng, radius: 10, sessionId }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();
      const payload = data?.data || data || {};
      const products = payload.results || payload.products || [];
      let replyText = payload.message;

      if (!replyText) {
        if (products.length > 0) {
          replyText = `Found ${products.length} product${products.length === 1 ? '' : 's'} near you.`;
        } else if (payload.status === 'no_sellers_in_radius') {
          replyText = 'No sellers were found within the requested radius.';
        } else if (payload.status === 'not_in_catalogue') {
          replyText = 'No matching products were found in the catalogue.';
        } else {
          replyText = 'Search completed. No products were found.';
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: replyText,
          products,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I couldn't connect to the server. Please make sure the backend is running on http://localhost:3000 and try again. ${error.message}`,
          products: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 z-50"
        aria-label="Toggle chat"
      >
        <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="30" fill="white" />
          <rect x="16" y="20" width="32" height="20" rx="10" fill="#F97316" />
          <circle cx="24" cy="30" r="3" fill="white" />
          <circle cx="40" cy="30" r="3" fill="white" />
          <path d="M24 38C26.5 42 30.5 42 33 38" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[360px] max-h-[580px] bg-slate-950 text-white rounded-[32px] shadow-[0_25px_70px_-20px_rgba(15,23,42,0.8)] flex flex-col overflow-hidden z-50 border border-white/10">
          <div className="bg-slate-900 px-4 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-3xl bg-orange-500 flex items-center justify-center text-white shadow-lg">
                <span className="text-lg font-bold">🤖</span>
              </div>
              <div>
                <p className="text-sm font-semibold">LocalConnect AI</p>
                <p className="text-[11px] text-emerald-400">Online — powered by AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`${msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
                <div className={`max-w-[84%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="inline-flex items-center gap-2 text-[10px] text-slate-400 mb-1">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center">AI</span>
                      <span>LocalConnect Assistant</span>
                    </div>
                  )}
                  <div
                    className={`inline-block px-4 py-3 rounded-3xl text-sm leading-relaxed break-words ${
                      msg.role === 'user'
                        ? 'bg-orange-500 text-white rounded-br-[10px] rounded-tl-3xl rounded-tr-3xl'
                        : 'bg-slate-800 text-slate-100 rounded-bl-[10px] rounded-tr-3xl rounded-tl-3xl'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {messages.some((msg) => msg.products?.length > 0) && (
              <div className="space-y-3">
                {messages
                  .flatMap((msg) => msg.products || [])
                  .map((product) => (
                    <div key={product.seller_product_id} className="bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-sm">
                      <div className="flex gap-3 items-start">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.model_name} className="w-14 h-14 rounded-2xl object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-slate-800" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {product.brand} {product.model_name}
                          </p>
                          <p className="text-sm text-orange-400 font-medium">₹{product.seller_price}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {product.shop_name} · {product.distance_km?.toFixed(1)}km
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-3xl bg-slate-800 flex items-center justify-center">AI</div>
                <div className="bg-slate-800 rounded-3xl p-3">
                  <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '100ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '200ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="bg-slate-900 border-t border-slate-800 px-4 py-3">
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about electronics..."
                className="flex-1 bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputText.trim()}
                className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
