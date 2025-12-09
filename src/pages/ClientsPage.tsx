import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Client, Notification, User } from '../types';

interface ClientsPageProps {
    onNotify: (n: Notification) => void;
    goBack: () => void;
    user: User;
}

const DeleteConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#111418] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#dbe0e6] dark:border-gray-700 transform transition-all scale-100">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-500">delete</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#111418] dark:text-white">Excluir Cliente?</h3>
                    <p className="text-[#637588] dark:text-gray-400">
                        Você tem certeza que deseja excluir este cliente?
                        <br />
                        Essa ação não pode ser desfeita.
                    </p>
                </div>
                <div className="flex border-t border-[#dbe0e6] dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-4 text-sm font-bold text-[#637588] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-6 py-4 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-l border-[#dbe0e6] dark:border-gray-700"
                    >
                        Sim, Excluir
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ClientsPage: React.FC<ClientsPageProps> = ({ onNotify, goBack, user }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentClient, setCurrentClient] = useState<Partial<Client>>({});
    const [mode, setMode] = useState<'list' | 'edit'>('list');
    const [clientToDelete, setClientToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const data = await db.listClients();
            setClients(data);
        } catch (err: any) {
            onNotify({ type: 'error', message: 'Erro ao carregar clientes.' });
        }
    };

    const handleSave = async () => {
        if (!currentClient.name) return onNotify({ type: 'error', message: 'Nome é obrigatório.' });

        try {
            if (isEditing && currentClient.id) {
                await db.updateClient(currentClient.id, currentClient as Client);
                onNotify({ type: 'success', message: 'Cliente atualizado com sucesso!' });
            } else {
                await db.createClient(currentClient as Client);
                onNotify({ type: 'success', message: 'Cliente cadastrado com sucesso!' });
            }
            setMode('list');
            fetchClients();
        } catch (err: any) {
            onNotify({ type: 'error', message: err.message });
        }
    };

    const handleDeleteClick = (id: string) => {
        setClientToDelete(id);
    };

    const confirmDelete = async () => {
        if (!clientToDelete) return;

        try {
            await db.deleteClient(clientToDelete);
            onNotify({ type: 'success', message: 'Cliente excluído com sucesso!' });
            fetchClients();
            setClientToDelete(null);
        } catch (err: any) {
            onNotify({ type: 'error', message: err.message });
        }
    };

    const startEdit = (client?: Client) => {
        if (client) {
            setCurrentClient(client);
            setIsEditing(true);
        } else {
            setCurrentClient({ type: 'PF' });
            setIsEditing(false);
        }
        setMode('edit');
    };

    const formatDocument = (value: string) => {
        const v = value.replace(/\D/g, '');
        if (v.length <= 11) {
            // CPF: 000.000.000-00
            return v.replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        // CNPJ: 00.000.000/0000-00
        return v.replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    };

    const formatPhone = (value: string) => {
        const v = value.replace(/\D/g, '');
        // (00) 00000-0000
        return v.replace(/^(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2');
    };

    const formatZipCode = (value: string) => {
        const v = value.replace(/\D/g, '');
        // 00000-000
        return v.replace(/^(\d{5})(\d)/, '$1-$2');
    };

    if (mode === 'edit') {
        return (
            <div className="animate-fade-in h-full flex flex-col overflow-hidden">
                <div className="flex-none flex items-center justify-between gap-4 mb-6">
                    <h1 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight">
                        {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
                    </h1>
                    <button
                        onClick={() => setMode('list')}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 bg-[#e8eef3] dark:bg-gray-700 hover:bg-[#dbe0e6] dark:hover:bg-gray-600 transition-colors text-sm font-bold text-[#111418] dark:text-white"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Voltar
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-[#111418] rounded-xl border border-[#dbe0e6] dark:border-gray-700 p-6">
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#111418] dark:text-white">Nome Completo</label>
                            <input
                                className="form-input flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 h-12 px-4 text-base focus:border-[#137fec] outline-none transition-all"
                                value={currentClient.name || ''}
                                onChange={e => setCurrentClient({ ...currentClient, name: e.target.value })}
                                placeholder="Ex: João da Silva"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-[#111418] dark:text-white">Tipo</label>
                                <select
                                    className="form-select flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 h-12 px-4 text-base focus:border-[#137fec] outline-none transition-all"
                                    value={currentClient.type || 'PF'}
                                    onChange={e => setCurrentClient({ ...currentClient, type: e.target.value as 'PF' | 'PJ' })}
                                >
                                    <option value="PF">Pessoa Física</option>
                                    <option value="PJ">Pessoa Jurídica</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-[#111418] dark:text-white">Documento (CPF/CNPJ)</label>
                                <input
                                    className="form-input flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 h-12 px-4 text-base focus:border-[#137fec] outline-none transition-all"
                                    value={currentClient.document || ''}
                                    onChange={e => setCurrentClient({ ...currentClient, document: formatDocument(e.target.value) })}
                                    maxLength={18}
                                    placeholder="CPF ou CNPJ (apenas números)"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-[#111418] dark:text-white">Telefone</label>
                                <input
                                    className="form-input flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 h-12 px-4 text-base focus:border-[#137fec] outline-none transition-all"
                                    value={currentClient.phone || ''}
                                    onChange={e => setCurrentClient({ ...currentClient, phone: formatPhone(e.target.value) })}
                                    maxLength={15}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-[#111418] dark:text-white">Email</label>
                                <input
                                    className="form-input flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 h-12 px-4 text-base focus:border-[#137fec] outline-none transition-all"
                                    value={currentClient.email || ''}
                                    onChange={e => setCurrentClient({ ...currentClient, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-[#111418] dark:text-white">CEP</label>
                                <input
                                    className="form-input flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 h-12 px-4 text-base focus:border-[#137fec] outline-none transition-all"
                                    value={currentClient.zipCode || ''}
                                    onChange={e => setCurrentClient({ ...currentClient, zipCode: formatZipCode(e.target.value) })}
                                    maxLength={9}
                                    placeholder="00000-000"
                                />
                            </div>
                            <div className="flex flex-col gap-2 md:col-span-3">
                                <label className="text-sm font-bold text-[#111418] dark:text-white">Rua / Logradouro</label>
                                <input
                                    className="form-input flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 h-12 px-4 text-base focus:border-[#137fec] outline-none transition-all"
                                    value={currentClient.street || ''}
                                    onChange={e => setCurrentClient({ ...currentClient, street: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-[#111418] dark:text-white">Número</label>
                                <input
                                    className="form-input flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 h-12 px-4 text-base focus:border-[#137fec] outline-none transition-all"
                                    value={currentClient.number || ''}
                                    onChange={e => setCurrentClient({ ...currentClient, number: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-2 md:col-span-3">
                                <label className="text-sm font-bold text-[#111418] dark:text-white">Bairro</label>
                                <input
                                    className="form-input flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 h-12 px-4 text-base focus:border-[#137fec] outline-none transition-all"
                                    value={currentClient.neighborhood || ''}
                                    onChange={e => setCurrentClient({ ...currentClient, neighborhood: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-[#111418] dark:text-white">Cidade</label>
                                <input
                                    className="form-input flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 h-12 px-4 text-base focus:border-[#137fec] outline-none transition-all"
                                    value={currentClient.city || ''}
                                    onChange={e => setCurrentClient({ ...currentClient, city: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-[#111418] dark:text-white">Estado</label>
                                <input
                                    className="form-input flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 h-12 px-4 text-base focus:border-[#137fec] outline-none transition-all"
                                    value={currentClient.state || ''}
                                    onChange={e => setCurrentClient({ ...currentClient, state: e.target.value })}
                                    maxLength={2}
                                    placeholder="UF"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[#dbe0e6] dark:border-gray-700">
                            <button
                                onClick={handleSave}
                                className="w-full h-12 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                            >
                                Salvar Cliente
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in h-full flex flex-col overflow-hidden">
            <div className="flex-none flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#111418] dark:text-white tracking-tight">Gestão de Clientes</h1>
                    <p className="text-[#637588] dark:text-gray-400 text-sm mt-1">Gerencie sua carteira de clientes.</p>
                </div>
                <button
                    onClick={() => startEdit()}
                    className="flex items-center gap-2 bg-[#137fec] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-[#137fec]/90 transition-colors shadow-sm"
                >
                    <span className="material-symbols-outlined text-xl">add</span>
                    Novo Cliente
                </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pb-2">
                <div className="grid grid-cols-1 gap-4">
                    {clients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#111418] rounded-xl border border-dashed border-[#dbe0e6] dark:border-gray-700 h-[300px]">
                            <div className="w-16 h-16 bg-[#e8eef3] dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-[#9ca3af]">person_add</span>
                            </div>
                            <h3 className="text-lg font-bold text-[#111418] dark:text-white">Nenhum cliente cadastrado</h3>
                            <p className="text-[#637588] dark:text-gray-400 text-sm mt-1">Cadastre seus clientes para gerenciar vendas e orçamentos.</p>
                        </div>
                    ) : (
                        clients.map(client => (
                            <div key={client.id} className="bg-white dark:bg-[#111418] p-5 rounded-xl border border-[#dbe0e6] dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 group">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-1 group-hover:text-[#137fec] transition-colors flex items-center gap-2">
                                                    {client.name}
                                                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                                                        {client.type}
                                                    </span>
                                                </h3>
                                                <div className="flex flex-col gap-1 mt-2">
                                                    {client.document && (
                                                        <div className="flex items-center gap-2 text-sm text-[#637588] dark:text-gray-400">
                                                            <span className="material-symbols-outlined text-base">badge</span>
                                                            {client.document}
                                                        </div>
                                                    )}
                                                    {client.phone && (
                                                        <div className="flex items-center gap-2 text-sm text-[#637588] dark:text-gray-400">
                                                            <span className="material-symbols-outlined text-base">call</span>
                                                            {client.phone}
                                                        </div>
                                                    )}
                                                    {client.email && (
                                                        <div className="flex items-center gap-2 text-sm text-[#637588] dark:text-gray-400">
                                                            <span className="material-symbols-outlined text-base">mail</span>
                                                            {client.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => startEdit(client)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                                                >
                                                    <span className="material-symbols-outlined text-xl">edit</span>
                                                </button>
                                                {user.role === 'ADMIN' && (
                                                    <button
                                                        onClick={() => handleDeleteClick(client.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <DeleteConfirmationModal
                isOpen={!!clientToDelete}
                onClose={() => setClientToDelete(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
};
