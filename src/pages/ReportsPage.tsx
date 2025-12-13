import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export const ReportsPage: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Olá! Sou sua Inteligência Artificial de Estoque. Posso analisar seus dados e gerar relatórios. O que você gostaria de saber hoje?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (messageText: string = '') => {
        const textToSend = messageText || input;
        if (!textToSend.trim() || loading) return;

        const userMsg: Message = { role: 'user', content: textToSend, timestamp: new Date() };
        setMessages((prev: Message[]) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Chamada via Proxy do Node.js (BFF - Backend for Frontend)
            // O frontend chama a API principal, que redireciona para o serviço Python interno
            const response = await api.post('/api/ai/analyze', { query: userMsg.content });

            // Adapter: A API api.post já retorna o JSON, não o Response object
            const result = response.result;

            const aiMsg: Message = {
                role: 'assistant',
                content: typeof result === 'string' ? result : JSON.stringify(result),
                timestamp: new Date()
            };
            setMessages((prev: Message[]) => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: Message = {
                role: 'assistant',
                content: 'Desculpe, tive um problema ao analisar seus dados. Por favor, tente novamente mais tarde ou contate o suporte.',
                timestamp: new Date()
            };
            setMessages((prev: Message[]) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="animate-fade-in h-full flex flex-col overflow-hidden">
            <div className="flex-none mb-6">
                <h1 className="text-3xl font-black text-[#111418] dark:text-white tracking-tight">Relatórios Inteligentes</h1>
                <p className="text-[#637588] dark:text-gray-400 text-sm mt-1">Converse com sua base de dados para obter insights valiosos.</p>
            </div>

            <div className="flex-1 flex flex-col bg-white dark:bg-[#111418] rounded-2xl border border-[#dbe0e6] dark:border-gray-700 shadow-sm overflow-hidden">
                {/* Área do Chat */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg: Message, idx: number) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                ? 'bg-[#137fec] text-white rounded-tr-none'
                                : 'bg-[#f0f4f8] dark:bg-gray-800 text-[#111418] dark:text-white rounded-tl-none border border-[#dbe0e6] dark:border-gray-700'
                                }`}>
                                <div className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                                <div className={`text-[10px] mt-1 font-medium ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-[#f0f4f8] dark:bg-gray-800 rounded-2xl p-4 rounded-tl-none border border-[#dbe0e6] dark:border-gray-700 flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Chips de Perguntas Recomendadas */}
                <div className="px-6 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-2 border-t border-[#dbe0e6] dark:border-gray-700 bg-gray-50 dark:bg-[#1a1d21]">
                    {[
                        "Qual produto mais vendido?",
                        "Produtos vencendo",
                        "Faça um inventário",
                        "Valor total do estoque",
                        "Estratégia para o mês"
                    ].map((question, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(question)}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-gray-800 text-[#637588] dark:text-gray-300 border border-[#dbe0e6] dark:border-gray-600 hover:bg-[#137fec] hover:text-white hover:border-[#137fec] transition-colors"
                        >
                            {question}
                        </button>
                    ))}
                </div>

                {/* Área de Input */}
                <div className="p-4 bg-gray-50 dark:bg-[#1a1d21]">
                    <div className="flex gap-4 max-w-4xl mx-auto">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Pergunte algo sobre seu estoque... (Ex: Qual produto mais vendido?)"
                            className="flex-1 bg-white dark:bg-gray-800 border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-[#137fec]/20 outline-none text-[#111418] dark:text-white placeholder-gray-400 shadow-sm"
                            disabled={loading}
                        />
                        <button
                            onClick={() => handleSend()}
                            aria-label="Send Query"
                            disabled={!input.trim() || loading}
                            className="bg-[#137fec] hover:bg-[#137fec]/90 text-white rounded-xl px-6 py-4 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
                        >
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
