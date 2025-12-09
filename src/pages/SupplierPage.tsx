import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Notification, Supplier, User } from '../types';

interface SupplierPageProps {
  onNotify: (n: Notification) => void;
  goBack: () => void;
  user: User;
}

const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ isOpen, itemName, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#111418] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#dbe0e6] dark:border-gray-700 transform transition-all scale-100">
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-500">warning</span>
          </div>
          <h3 className="text-xl font-bold text-[#111418] dark:text-white">Excluir Fornecedor?</h3>
          <p className="text-[#637588] dark:text-gray-400">
            Você está prestes a excluir <span className="font-bold text-[#111418] dark:text-white">"{itemName}"</span>.
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

export const SupplierPage: React.FC<SupplierPageProps> = ({ onNotify, goBack, user }) => {
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<{ id: string; name: string } | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
    phone: '',
    address: '',
    email: '',
    contactName: ''
  });

  const fetchSuppliers = async () => {
    try {
      const data = await db.listSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      onNotify({ type: 'error', message: 'Erro ao carregar fornecedores: ' + err.message });
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;

    if (name === 'cnpj') {
      value = value.replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 18);
    } else if (name === 'phone') {
      value = value.replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d)(\d{4})$/, '$1-$2')
        .substring(0, 15);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      companyName: supplier.companyName,
      cnpj: supplier.cnpj,
      phone: supplier.phone,
      address: supplier.address,
      email: supplier.email,
      contactName: supplier.contactName
    });
    setMode('edit');
  };

  const handleDeleteClick = (id: string, name: string) => {
    setSupplierToDelete({ id, name });
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await db.deleteSupplier(supplierToDelete.id);
      onNotify({ type: 'success', message: 'Fornecedor excluído com sucesso!' });
      fetchSuppliers();
    } catch (err: any) {
      onNotify({ type: 'error', message: err.message });
    } finally {
      setSupplierToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName || !formData.cnpj || !formData.address || !formData.email) {
      onNotify({ type: 'error', message: 'Por favor, preencha todos os campos obrigatórios.' });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'edit' && selectedSupplier) {
        await db.updateSupplier(selectedSupplier.id, formData);
        onNotify({ type: 'success', message: 'Fornecedor atualizado com sucesso!' });
      } else {
        await db.createSupplier(formData);
        onNotify({ type: 'success', message: 'Fornecedor cadastrado com sucesso!' });
      }

      setFormData({ companyName: '', cnpj: '', phone: '', address: '', email: '', contactName: '' });
      setSelectedSupplier(null);
      setMode('list');
      fetchSuppliers();
    } catch (err: any) {
      onNotify({ type: 'error', message: err.message || 'Erro ao salvar fornecedor.' });
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="h-full flex flex-col overflow-hidden animate-fade-in">
        <div className="flex-none flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight">
            {mode === 'create' ? 'Novo Fornecedor' : 'Editar Fornecedor'}
          </h1>
          <button
            onClick={() => { setMode('list'); setSelectedSupplier(null); }}
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#e8eef3] dark:bg-gray-700 text-[#111418] dark:text-white text-sm font-bold hover:bg-[#dbe0e6]"
          >
            <span className="material-symbols-outlined mr-2 text-base">arrow_back</span>
            <span className="truncate">Voltar</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="bg-white dark:bg-[#111418] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-700 max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {/* Campos reutilizados do código original */}
              <div className="md:col-span-2">
                <label className="flex flex-col w-full">
                  <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Nome da Empresa *</p>
                  <input
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-11 px-3 text-sm"
                    placeholder="Digite o nome da empresa"
                  />
                </label>
              </div>

              <div>
                <label className="flex flex-col w-full">
                  <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">CNPJ *</p>
                  <input
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    required
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-11 px-3 text-sm"
                    placeholder="00.000.000/0000-00"
                  />
                </label>
              </div>

              <div>
                <label className="flex flex-col w-full">
                  <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Telefone *</p>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-11 px-3 text-sm"
                    placeholder="(00) 00000-0000"
                  />
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="flex flex-col w-full">
                  <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Endereço *</p>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-11 px-3 text-sm"
                    placeholder="Rua, Número, Bairro, Cidade - Estado"
                  />
                </label>
              </div>

              <div>
                <label className="flex flex-col w-full">
                  <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">E-mail *</p>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-11 px-3 text-sm"
                    placeholder="contato@empresa.com"
                  />
                </label>
              </div>

              <div>
                <label className="flex flex-col w-full">
                  <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Contato Principal *</p>
                  <input
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    required
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-11 px-3 text-sm"
                    placeholder="Nome do responsável"
                  />
                </label>
              </div>

              <div className="md:col-span-2 flex justify-end mt-4 pt-4 border-t border-[#dbe0e6] dark:border-gray-700">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 h-12 px-8 bg-[#137fec] text-white text-base font-bold leading-normal rounded-lg hover:bg-[#137fec]/90 transition-colors duration-300 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : (mode === 'create' ? 'Cadastrar' : 'Salvar Alterações')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in">
      <div className="flex-none">
        {/* Barra de Ferramentas */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-[#111418] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
            Fornecedores
          </h1>
          <button
            onClick={() => {
              setFormData({ companyName: '', cnpj: '', phone: '', address: '', email: '', contactName: '' });
              setMode('create');
            }}
            className="bg-[#137fec] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-[#137fec]/90 transition-colors"
          >
            <span className="material-symbols-outlined">add</span> Novo Fornecedor
          </button>
        </div>
      </div>

      {/* Visualização em Lista */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="bg-white dark:bg-[#111418] rounded-xl border border-[#dbe0e6] dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#f6f7f8] dark:bg-gray-800 text-xs text-[#637588] dark:text-gray-400 uppercase border-b border-[#dbe0e6] dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 font-bold">Empresa</th>
                  <th className="px-6 py-4 font-bold">CNPJ</th>
                  <th className="px-6 py-4 font-bold">Contato</th>
                  <th className="px-6 py-4 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-700">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 px-6">
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-5xl text-[#dbe0e6]">group_off</span>
                        <p className="text-[#637588] font-medium">Nenhum fornecedor cadastrado</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  suppliers.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#111418] dark:text-white">{s.companyName}</span>
                          <span className="text-xs text-[#637588]">{s.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#111418] dark:text-gray-300 font-mono text-xs">{s.cnpj}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[#111418] dark:text-gray-300 font-medium">{s.contactName}</span>
                          <span className="text-xs text-[#637588]">{s.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(s)}
                            className="p-2 text-[#137fec] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          {user.role === 'ADMIN' && (
                            <button
                              onClick={() => handleDeleteClick(s.id, s.companyName)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={!!supplierToDelete}
        itemName={supplierToDelete?.name || ''}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};