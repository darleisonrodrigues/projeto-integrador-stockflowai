import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, Notification } from '../types';

interface UsersPageProps {
    onNotify: (n: Notification) => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ onNotify }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [editingUser, setEditingUser] = useState<User | null>(null);

    // New User Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE' as 'ADMIN' | 'EMPLOYEE'
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await api.get('/users');
            setUsers(data);
        } catch (error: any) {
            onNotify({ type: 'error', message: 'Erro ao carregar usuários.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingUser) {
                // Update
                await api.put(`/users/${editingUser.id}`, {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role
                    // Password NOT sent during regular update to keep simple. use reset password if needed.
                });
                onNotify({ type: 'success', message: 'Usuário atualizado com sucesso!' });
            } else {
                // Create
                await api.post('/users', formData);
                onNotify({ type: 'success', message: 'Usuário criado com sucesso!' });
            }

            setShowForm(false);
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'EMPLOYEE' });
            loadUsers();
        } catch (error: any) {
            onNotify({ type: 'error', message: error.message || 'Erro ao salvar usuário.' });
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Password not required for update
            role: user.role
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'EMPLOYEE' });
    };

    const handleToggleActive = async (user: User) => {
        try {
            await api.patch(`/users/${user.id}/status`, { active: !user.active });
            onNotify({ type: 'success', message: `Usuário ${user.active ? 'desativado' : 'ativado'} com sucesso.` });
            // Updates local state optimistically or reloads
            setUsers(users.map(u => u.id === user.id ? { ...u, active: !u.active } : u));
        } catch (error: any) {
            onNotify({ type: 'error', message: 'Erro ao alterar status.' });
        }
    };

    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setLoading(true);
        try {
            await api.delete(`/users/${userToDelete.id}`);
            onNotify({ type: 'success', message: 'Usuário excluído com sucesso!' });
            loadUsers();
        } catch (error: any) {
            onNotify({ type: 'error', message: error.message || 'Erro ao excluir usuário.' });
        } finally {
            setLoading(false);
            setUserToDelete(null);
        }
    };

    return (
        <div className="animate-fade-in h-full flex flex-col">
            {/* Header */}
            <div className="flex-none flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#111418] dark:text-white tracking-tight">Gerenciar Usuários</h1>
                    <p className="text-[#637588] dark:text-gray-400 text-sm mt-1">
                        Controle de acesso e contas de colaboradores.
                    </p>
                </div>
                <button
                    onClick={() => showForm ? resetForm() : setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white font-bold rounded-lg hover:bg-[#137fec]/90 transition-all shadow-lg shadow-blue-500/30"
                >
                    <span className="material-symbols-outlined">{showForm ? 'close' : 'add'}</span>
                    {showForm ? 'Cancelar' : 'Novo Usuário'}
                </button>
            </div>

            {/* Access Links Card */}
            <div className="bg-white dark:bg-[#111418] rounded-xl border border-[#dbe0e6] dark:border-gray-700 p-6 mb-6">
                <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#137fec]">link</span>
                    Links de Acesso
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-bold text-[#637588] dark:text-gray-400 mb-2 block">
                            Link para Novos Gestores (Cadastro Liberado)
                        </label>
                        <div className="flex gap-2">
                            <input
                                readOnly
                                value={window.location.origin}
                                className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-[#dbe0e6] dark:border-gray-700 rounded-lg text-sm"
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.origin);
                                    onNotify({ type: 'success', message: 'Link copiado!' });
                                }}
                                className="px-4 py-2 bg-[#f0f4f8] hover:bg-[#dbe0e6] text-[#111418] font-bold rounded-lg transition-colors text-sm"
                            >
                                Copiar
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Envie este link para professores ou quem deve ter acesso total.</p>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-[#637588] dark:text-gray-400 mb-2 block">
                            Link para Colaboradores (Apenas Login)
                        </label>
                        <div className="flex gap-2">
                            <input
                                readOnly
                                value={`${window.location.origin}/?mode=login`}
                                className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-[#dbe0e6] dark:border-gray-700 rounded-lg text-sm"
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/?mode=login`);
                                    onNotify({ type: 'success', message: 'Link copiado!' });
                                }}
                                className="px-4 py-2 bg-[#f0f4f8] hover:bg-[#dbe0e6] text-[#111418] font-bold rounded-lg transition-colors text-sm"
                            >
                                Copiar
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Envie este link para funcionários que você já cadastrou manualmente.</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6">
                {/* User List */}
                <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111418] rounded-xl border border-[#dbe0e6] dark:border-gray-700">
                    {loading && users.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">Carregando...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-[#1a1d21] sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 text-sm font-bold text-[#637588] dark:text-gray-400 border-b border-[#dbe0e6] dark:border-gray-700">Nome</th>
                                    <th className="p-4 text-sm font-bold text-[#637588] dark:text-gray-400 border-b border-[#dbe0e6] dark:border-gray-700">Email</th>
                                    <th className="p-4 text-sm font-bold text-[#637588] dark:text-gray-400 border-b border-[#dbe0e6] dark:border-gray-700">Função</th>
                                    <th className="p-4 text-sm font-bold text-[#637588] dark:text-gray-400 border-b border-[#dbe0e6] dark:border-gray-700">Status</th>
                                    <th className="p-4 text-sm font-bold text-[#637588] dark:text-gray-400 border-b border-[#dbe0e6] dark:border-gray-700 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b border-[#dbe0e6] dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="p-4 text-[#111418] dark:text-white font-medium">{u.name}</td>
                                        <td className="p-4 text-sm text-[#637588] dark:text-gray-400">{u.email}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                            ${u.role === 'ADMIN'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                {u.role === 'ADMIN' ? 'Gestor' : 'Funcionário'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`flex items-center gap-1.5 text-sm font-medium ${u.active ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                                <span className={`w-2 h-2 rounded-full ${u.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {u.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => startEditing(u)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Editar Usuário"
                                                >
                                                    <span className="material-symbols-outlined">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(u)}
                                                    className={`p-2 rounded-lg transition-colors ${u.active
                                                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                        : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                                                    title={u.active ? "Desativar Acesso" : "Reativar Acesso"}
                                                >
                                                    <span className="material-symbols-outlined">{u.active ? 'block' : 'check_circle'}</span>
                                                </button>
                                                <button
                                                    onClick={() => setUserToDelete(u)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Excluir Usuário"
                                                >
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Create/Edit User Form Side Panel */}
                {showForm && (
                    <div className="w-full lg:w-96 bg-white dark:bg-[#111418] rounded-xl border border-[#dbe0e6] dark:border-gray-700 p-6 h-fit animate-fade-in">
                        <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-6">
                            {editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}
                        </h2>
                        <form onSubmit={handleCreateOrUpdateUser} className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-[#111418] dark:text-white mb-1 block">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-base focus:border-[#137fec] outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Ana Souza"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-[#111418] dark:text-white mb-1 block">Email (Login)</label>
                                <input
                                    type="email"
                                    required
                                    className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-base focus:border-[#137fec] outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="ana@empresa.com"
                                />
                            </div>
                            {!editingUser && (
                                <div>
                                    <label className="text-sm font-bold text-[#111418] dark:text-white mb-1 block">Senha Inicial</label>
                                    <input
                                        type="password"
                                        required
                                        className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-base focus:border-[#137fec] outline-none"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-bold text-[#111418] dark:text-white mb-1 block">Nível de Acesso</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'EMPLOYEE' })}
                                        className={`p-3 rounded-xl border text-sm font-bold transition-all ${formData.role === 'EMPLOYEE'
                                            ? 'border-[#137fec] bg-blue-50 text-[#137fec] dark:bg-blue-900/20'
                                            : 'border-[#dbe0e6] dark:border-gray-600 text-gray-500'}`}
                                    >
                                        Funcionário
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                                        className={`p-3 rounded-xl border text-sm font-bold transition-all ${formData.role === 'ADMIN'
                                            ? 'border-purple-500 bg-purple-50 text-purple-600 dark:bg-purple-900/20'
                                            : 'border-[#dbe0e6] dark:border-gray-600 text-gray-500'}`}
                                    >
                                        Gestor (Admin)
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {formData.role === 'ADMIN'
                                        ? 'Pode acessar tudo, criar usuários e configurações.'
                                        : 'Acesso restrito a Vendas, Estoque e Pedidos.'}
                                </p>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-[#137fec] text-white font-bold rounded-xl hover:bg-[#137fec]/90 transition-all shadow-lg shadow-[#137fec]/30 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span> : (editingUser ? 'Salvar Alterações' : 'Criar Usuário')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {userToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#111418] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#dbe0e6] dark:border-gray-700">
                        <div className="p-6 flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2">
                                <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-500">warning</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#111418] dark:text-white">Excluir Usuário?</h3>
                            <p className="text-[#637588] dark:text-gray-400">
                                Você está prestes a excluir o usuário <span className="font-bold text-[#111418] dark:text-white">"{userToDelete.name}"</span>.
                                <br />
                                Essa ação não pode ser desfeita.
                            </p>
                        </div>
                        <div className="flex border-t border-[#dbe0e6] dark:border-gray-700">
                            <button
                                onClick={() => setUserToDelete(null)}
                                className="flex-1 px-6 py-4 text-sm font-bold text-[#637588] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                className="flex-1 px-6 py-4 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-l border-[#dbe0e6] dark:border-gray-700"
                            >
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
