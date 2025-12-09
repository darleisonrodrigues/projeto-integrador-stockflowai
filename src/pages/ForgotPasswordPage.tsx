import React, { useState } from 'react';
import { api } from '../services/api';

interface ForgotPasswordPageProps {
    onBack: () => void;
    onNotify: (notification: { type: 'success' | 'error' | 'info' | 'warning'; message: string }) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBack, onNotify }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setLoading(true);
        setSuccess(false);

        try {
            await api.post('/forgot-password', { email });

            setSuccess(true);
            onNotify({ type: 'success', message: 'Email de recuperação enviado com sucesso!' });
        } catch (err: any) {
            onNotify({ type: 'error', message: 'Ocorreu um erro ao tentar enviar o email. Tente novamente.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white dark:bg-[#101922] font-display justify-center items-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#111418] rounded-xl shadow-sm border border-[#dbe0e6] dark:border-gray-700 p-8">
                <header className="mb-8 text-center">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                        <span className="material-symbols-outlined text-[#137fec] text-4xl">lock_reset</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#111418] dark:text-white mb-2">
                        Recuperar Senha
                    </h1>
                    <p className="text-[#617589] dark:text-gray-400">
                        Insira seu email para receber as instruções de redefinição de senha.
                    </p>
                </header>

                {success ? (
                    <div className="text-center">
                        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6 text-sm">
                            <p className="font-bold mb-1">Email enviado!</p>
                            <p>Verifique sua caixa de entrada para redefinir sua senha.</p>
                        </div>
                        <button
                            onClick={onBack}
                            className="text-[#137fec] font-bold hover:underline"
                        >
                            Voltar para o Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">


                        <div>
                            <label className="flex flex-col w-full">
                                <p className="text-[#111418] dark:text-gray-300 text-base font-medium leading-normal pb-2">Email</p>
                                <input
                                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-14 placeholder:text-[#617589] p-[15px] text-base font-normal leading-normal transition-colors duration-200"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    required
                                />
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-[#137fec] text-white text-base font-bold leading-normal tracking-wide hover:bg-[#137fec]/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                        </button>

                        <div className="text-center mt-4">
                            <button
                                type="button"
                                onClick={onBack}
                                className="text-sm font-medium text-[#617589] hover:text-[#111418] dark:hover:text-white transition-colors"
                            >
                                Voltar para o Login
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
