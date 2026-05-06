import { useEffect, useRef, useState } from 'react';
import { Bot, LoaderCircle, Send, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const welcomeMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'مرحبًا، أنا مساعد AI لإدارة المتجر. اسألني عن المخزون، الفواتير، الزبائن، المبيعات أو الطلبات الأونلاين.',
};

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-violet-100 text-violet-500' : 'bg-rose-100 text-rose-500'
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div
        className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${
          isUser
            ? 'bg-violet-500 text-white'
            : message.error
            ? 'border border-red-200 bg-red-50 text-red-600'
            : 'border border-rose-100 bg-white text-violet-900'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export default function AiAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    const userMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: question,
    };
    const history = messages
      .filter((message) => message.id !== 'welcome' && !message.error)
      .map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setLoading(true);

    try {
      if (!user) {
        throw new Error('سجل الدخول إلى لوحة الإدارة أولًا حتى أستطيع قراءة قاعدة البيانات.');
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: question, history }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'تعذر الاتصال بمساعد الذكاء الاصطناعي.');
      }

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: data.reply || 'لم يصل رد من الذكاء الاصطناعي.',
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content: error.message,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      sendMessage(e);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-5xl flex-col gap-4" dir="rtl">
      <div>
        <h1 className="text-2xl font-extrabold text-gold-700">مساعد AI</h1>
        <p className="text-sm text-violet-400">مساعد خاص بإدارة المتجر والمخزون والفواتير والزبائن والمبيعات الأونلاين</p>
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-rose-100 bg-white/80 shadow-soft backdrop-blur">
        <div className="flex items-center gap-3 border-b border-rose-100 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-l from-gold-400 to-rose-400 text-white">
            <Bot size={20} />
          </div>
          <div>
            <div className="font-extrabold text-violet-700">محادثة الإدارة الذكية</div>
            <div className="text-xs text-violet-400">متصل عبر Backend ثم Gemini API</div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {loading && (
            <div className="flex items-center justify-end gap-2 text-sm font-bold text-rose-500">
              <LoaderCircle size={16} className="animate-spin" />
              <span>الذكاء الاصطناعي يكتب...</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <form onSubmit={sendMessage} className="border-t border-rose-100 bg-white/90 p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="input min-h-[52px] resize-none leading-7"
              placeholder="اكتب سؤالك هنا..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} className="btn-primary h-[52px] shrink-0 px-5">
              <Send size={18} />
              <span className="hidden sm:inline">إرسال</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
