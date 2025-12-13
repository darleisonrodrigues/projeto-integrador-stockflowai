import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { AppSettings, Notification } from '../types';

interface SettingsPageProps {
    onNotify: (n: Notification) => void;
    goBack: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNotify, goBack }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'backup'>('profile');
    const [settings, setSettings] = useState<AppSettings>({
        companyName: '',
        cnpj: '',
        email: '',
        phone: '',
        address: '',
        addressStreet: '',
        addressNumber: '',
        addressNeighborhood: '',
        addressCity: '',
        addressState: '',
        addressZip: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await db.getSettings();
            if (data && Object.keys(data).length > 0) {
                // Compatibility for old address field
                if (data.address && !data.addressStreet) {
                    data.addressStreet = data.address; // Map old blob to street initially
                }
                setSettings({ ...settings, ...data });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            onNotify({ type: 'error', message: 'Erro ao carregar configurações.' });
        }
    };

    const [saved, setSaved] = useState(false);

    // ...

    const handleSaveProfile = async () => {
        console.log('Attempting to save settings:', settings);
        if (!settings.companyName || !settings.email) {
            onNotify({ type: 'error', message: 'Nome da empresa e Email são obrigatórios.' });
            return;
        }

        // Basic Email Validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
            onNotify({ type: 'error', message: 'Email inválido.' });
            return;
        }

        setLoading(true);
        try {
            await db.updateSettings(settings);
            console.log('Settings saved successfully');
            onNotify({ type: 'success', message: 'Configurações salvas com sucesso!' });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Error saving settings:', error);
            onNotify({ type: 'error', message: 'Erro ao salvar configurações.' });
        } finally {
            setLoading(false);
        }
    };

    // Masks
    const maskCNPJ = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const maskPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d)(\d{4})$/, '$1-$2')
            .substring(0, 15);
    };

    const maskCEP = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{5})(\d)/, '$1-$2')
            .substring(0, 9);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!confirm('Deseja realmente restaurar este backup? Todos os dados atuais serão substituídos.')) {
            event.target.value = '';
            return;
        }

        setLoading(true);
        try {
            await db.uploadBackup(file);
            onNotify({ type: 'success', message: 'Backup restaurado com sucesso! Atualize a página.' });
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            console.error('Error restoring backup:', error);
            onNotify({ type: 'error', message: 'Falha ao restaurar backup.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadBackup = async () => {
        try {
            onNotify({ type: 'success', message: 'Iniciando download...' });
            await db.downloadBackup();
        } catch (error) {
            console.error('Download error:', error);
            onNotify({ type: 'error', message: 'Erro ao baixar backup.' });
        }
    };

    return (
        <div className="animate-fade-in h-full flex flex-col">
            {/* Header */}
            <div className="flex-none flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#111418] dark:text-white tracking-tight">Configurações</h1>
                    <p className="text-[#637588] dark:text-gray-400 text-sm mt-1">Gerencie o perfil da empresa e dados do sistema.</p>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-hidden bg-white dark:bg-[#111418] rounded-xl border border-[#dbe0e6] dark:border-gray-700 flex flex-col md:flex-row">

                {/* Sidebar / Tabs */}
                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#dbe0e6] dark:border-gray-700 p-4 bg-gray-50 dark:bg-[#1a1d21]">
                    <div className="flex flex-row md:flex-col gap-2 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all whitespace-nowrap
                                ${activeTab === 'profile'
                                    ? 'bg-[#137fec] text-white shadow-lg shadow-blue-500/20'
                                    : 'text-[#637588] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            <span className="material-symbols-outlined">business</span>
                            Perfil da Empresa
                        </button>
                        <button
                            onClick={() => setActiveTab('backup')}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all whitespace-nowrap
                                ${activeTab === 'backup'
                                    ? 'bg-[#137fec] text-white shadow-lg shadow-blue-500/20'
                                    : 'text-[#637588] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            <span className="material-symbols-outlined">database</span>
                            Backup & Dados
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {activeTab === 'profile' && (
                        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                            <section>
                                <h2 className="text-xl font-bold text-[#111418] dark:text-white pb-4 border-b border-[#dbe0e6] dark:border-gray-700 mb-6">
                                    Dados Gerais
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-bold text-[#111418] dark:text-white mb-1 block">Nome da Empresa</label>
                                        <input
                                            type="text"
                                            className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-base focus:border-[#137fec] outline-none"
                                            value={settings.companyName}
                                            onChange={e => setSettings({ ...settings, companyName: e.target.value })}
                                            placeholder="Ex: Minha Loja Ltda"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-[#111418] dark:text-white mb-1 block">CNPJ</label>
                                        <input
                                            type="text"
                                            className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-base focus:border-[#137fec] outline-none"
                                            value={settings.cnpj}
                                            onChange={e => setSettings({ ...settings, cnpj: maskCNPJ(e.target.value) })}
                                            placeholder="00.000.000/0000-00"
                                            maxLength={18}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-[#111418] dark:text-white mb-1 block">Telefone</label>
                                        <input
                                            type="text"
                                            className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-base focus:border-[#137fec] outline-none"
                                            value={settings.phone}
                                            onChange={e => setSettings({ ...settings, phone: maskPhone(e.target.value) })}
                                            placeholder="(00) 00000-0000"
                                            maxLength={15}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-bold text-[#111418] dark:text-white mb-1 block">E-mail de Contato</label>
                                        <input
                                            type="email"
                                            className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-base focus:border-[#137fec] outline-none"
                                            value={settings.email}
                                            onChange={e => setSettings({ ...settings, email: e.target.value })}
                                            placeholder="contato@empresa.com"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-[#111418] dark:text-white pb-4 border-b border-[#dbe0e6] dark:border-gray-700 mb-6">
                                    Endereço
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-bold text-[#111418] dark:text-white mb-1 block">CEP</label>
                                        <input
                                            type="text"
                                            className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-base focus:border-[#137fec] outline-none"
                                            value={settings.addressZip || ''}
                                            onChange={e => setSettings({ ...settings, addressZip: maskCEP(e.target.value) })}
                                            placeholder="00000-000"
                                            maxLength={9}
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-sm font-bold text-[#111418] dark:text-white mb-1 block">Cidade</label>
                                        <input
                                            type="text"
                                            className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-base focus:border-[#137fec] outline-none"
                                            value={settings.addressCity || ''}
                                            onChange={e => setSettings({ ...settings, addressCity: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-sm font-bold text-[#111418] dark:text-white mb-1 block">UF</label>
                                        <input
                                            type="text"
                                            className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-base focus:border-[#137fec] outline-none"
                                            value={settings.addressState || ''}
                                            onChange={e => setSettings({ ...settings, addressState: e.target.value.toUpperCase() })}
                                            maxLength={2}
                                        />
                                    </div>

                                    <div className="md:col-span-4">
                                        <label className="text-sm font-bold text-[#111418] dark:text-white mb-1 block">Logradouro (Rua, Av.)</label>
                                        <input
                                            type="text"
                                            className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-base focus:border-[#137fec] outline-none"
                                            value={settings.addressStreet || ''}
                                            onChange={e => setSettings({ ...settings, addressStreet: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-bold text-[#111418] dark:text-white mb-1 block">Número</label>
                                        <input
                                            type="text"
                                            className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-base focus:border-[#137fec] outline-none"
                                            value={settings.addressNumber || ''}
                                            onChange={e => setSettings({ ...settings, addressNumber: e.target.value })}
                                        />
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="text-sm font-bold text-[#111418] dark:text-white mb-1 block">Bairro</label>
                                        <input
                                            type="text"
                                            className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-base focus:border-[#137fec] outline-none"
                                            value={settings.addressNeighborhood || ''}
                                            onChange={e => setSettings({ ...settings, addressNeighborhood: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={loading}
                                    className="px-8 py-3 bg-[#137fec] text-white font-bold rounded-xl hover:bg-[#137fec]/90 transition-all shadow-lg shadow-[#137fec]/30 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-xl">save</span>
                                            Salvar Alterações
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                            <h2 className="text-xl font-bold text-[#111418] dark:text-white pb-4 border-b border-[#dbe0e6] dark:border-gray-700">
                                Backup e Restauração
                            </h2>

                            {/* Download Section */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300">
                                        <span className="material-symbols-outlined text-2xl">download</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-2">Backup do Sistema</h3>
                                        <p className="text-[#637588] dark:text-gray-400 text-sm mb-4">
                                            Baixe uma cópia completa de todos os seus dados (produtos, clientes, vendas, etc).
                                            Recomendamos fazer isso regularmente.
                                        </p>
                                        <button
                                            onClick={handleDownloadBackup}
                                            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <span className="material-symbols-outlined text-lg">download</span>
                                            Baixar Backup (.db)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Restore Section */}
                            <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center text-red-600 dark:text-red-300">
                                        <span className="material-symbols-outlined text-2xl">upload</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-2">Restaurar Dados</h3>
                                        <p className="text-[#637588] dark:text-gray-400 text-sm mb-4">
                                            Importe um arquivo de backup (.db).
                                            <br />
                                            <span className="font-bold text-red-600 dark:text-red-400">ATENÇÃO: Isso substituirá TODOS os dados atuais.</span>
                                        </p>
                                        <div className="relative inline-block">
                                            <input
                                                type="file"
                                                accept=".db"
                                                onChange={handleFileUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                disabled={loading}
                                            />
                                            <button
                                                className="px-6 py-2.5 bg-white dark:bg-transparent border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                                            >
                                                {loading ? (
                                                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-lg">upload_file</span>
                                                )}
                                                Selecionar Arquivo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone - Reset Database */}
                            <div className="mt-8 border-t border-red-200 dark:border-red-900/50 pt-8">
                                <h3 className="text-lg font-bold text-red-600 dark:text-red-500 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined">warning</span>
                                    Zona de Perigo
                                </h3>
                                <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-200 dark:border-red-900/30">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div>
                                            <h4 className="text-base font-bold text-[#111418] dark:text-white mb-1">Resetar Aplicação</h4>
                                            <p className="text-sm text-[#637588] dark:text-gray-400">
                                                Apaga <strong>TODOS</strong> os produtos, vendas, pedidos e movimentações do banco de dados.<br />
                                                Essa ação é irreversível e ideal para limpar dados de teste na produção.
                                            </p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (confirm('TEM CERTEZA? Isso apagará TODOS os dados do sistema (exceto usuários). Essa ação NÃO pode ser desfeita.')) {
                                                    setLoading(true);
                                                    try {
                                                        const response = await db.resetDatabase(); // Need to implement in db.ts
                                                        onNotify({ type: 'success', message: 'Sistema resetado com sucesso!' });
                                                        setTimeout(() => window.location.reload(), 2000);
                                                    } catch (err: any) {
                                                        onNotify({ type: 'error', message: err.message || 'Erro ao resetar.' });
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }
                                            }}
                                            className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 whitespace-nowrap"
                                        >
                                            Resetar Tudo
                                        </button>
                                    </div>
                                </div>
                            </div>


                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
