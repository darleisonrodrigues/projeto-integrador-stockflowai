import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Product, Supplier, Notification, User } from '../types';

interface ProductPageProps {
    onNotify: (n: Notification) => void;
    goBack: () => void;
    filter?: 'all' | 'lowStock' | 'expiring';
    user: User;
}
// ... (ProductDetails stays same) ...
// Sub-componente para Detalhes do Produto e Associação
const ProductDetails: React.FC<{
    product: Product;
    onBack: () => void;
    onNotify: (n: Notification) => void;
    onUpdate: () => void;
    user: User;
}> = ({ product, onBack, onNotify, onUpdate, user }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'suppliers'>('details');
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [loading, setLoading] = useState(false);

    // Estado do Formulário de Edição
    const [formData, setFormData] = useState({
        name: product.name,
        barcode: product.barcode,
        description: product.description,
        quantity: product.quantity,
        category: product.category,
        expiryDate: product.expiryDate || ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    useEffect(() => {
        db.listSuppliers().then(setSuppliers);
        // Reiniciar formulário quando o produto mudar
        setFormData({
            name: product.name,
            barcode: product.barcode,
            description: product.description,
            quantity: product.quantity,
            category: product.category,
            expiryDate: product.expiryDate || ''
        });
        setImageFile(null);
    }, [product]);

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('barcode', formData.barcode);
            data.append('description', formData.description);
            data.append('quantity', formData.quantity.toString());
            data.append('category', formData.category);
            if (formData.expiryDate) data.append('expiryDate', formData.expiryDate);
            if (imageFile) data.append('image', imageFile);

            await db.updateProduct(product.id, data);
            onNotify({ type: 'success', message: 'Produto atualizado com sucesso!' });
            onUpdate();
        } catch (err: any) {
            onNotify({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const associatedSuppliers = suppliers.filter(s => product.supplierIds.includes(s.id));

    const handleAssociate = async () => {
        if (!selectedSupplierId) return;
        setLoading(true);
        try {
            await db.associateSupplier(product.id, selectedSupplierId);
            onNotify({ type: 'success', message: 'Fornecedor associado com sucesso ao produto!' });
            onUpdate();
        } catch (err: any) {
            onNotify({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDisassociate = async (supplierId: string) => {
        try {
            await db.disassociateSupplier(product.id, supplierId);
            onNotify({ type: 'success', message: 'Fornecedor desassociado com sucesso!' });
            onUpdate();
        } catch (err: any) {
            onNotify({ type: 'error', message: err.message });
        }
    };

    return (
        <div className="flex flex-col w-full max-w-6xl mx-auto animate-fade-in h-full overflow-hidden">
            {/* Título e Abas da Página */}
            <div className="flex-none flex flex-col gap-6 mb-6">
                <div className="flex items-center justify-between gap-4">
                    <h1 className="text-[#111418] dark:text-white text-3xl md:text-4xl font-black tracking-tight">Gerenciar Produto</h1>
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#e8eef3] dark:bg-gray-700/50 text-[#111418] dark:text-white text-sm font-bold transition-colors hover:bg-[#dbe0e6]"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        <span className="truncate">Voltar</span>
                    </button>
                </div>

                <div className="flex gap-4 border-b border-[#dbe0e6] dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`pb-3 px-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'details' ? 'border-[#137fec] text-[#137fec]' : 'border-transparent text-[#637588] hover:text-[#111418] dark:text-gray-400 dark:hover:text-white'}`}
                    >
                        Dados do Produto
                    </button>
                    <button
                        onClick={() => setActiveTab('suppliers')}
                        className={`pb-3 px-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'suppliers' ? 'border-[#137fec] text-[#137fec]' : 'border-transparent text-[#637588] hover:text-[#111418] dark:text-gray-400 dark:hover:text-white'}`}
                    >
                        Fornecedores
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                {activeTab === 'details' ? (
                    <div className="bg-white dark:bg-[#111418] p-6 rounded-xl border border-[#dbe0e6] dark:border-gray-700 max-w-4xl mx-auto">
                        <form onSubmit={handleUpdateProduct} className="flex flex-col gap-6">
                            <div className="flex gap-6 flex-col md:flex-row">
                                <div className="flex-1 space-y-5">
                                    <label className="flex flex-col w-full">
                                        <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Nome do Produto</p>
                                        <input
                                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-11 px-3 text-sm"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </label>
                                    <label className="flex flex-col w-full">
                                        <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Código de Barras</p>
                                        <input
                                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-11 px-3 text-sm"
                                            value={formData.barcode}
                                            onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                            required
                                        />
                                    </label>
                                    <label className="flex flex-col w-full">
                                        <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Categoria</p>
                                        <select
                                            className="form-select flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 h-11 px-3 text-sm"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="Papelaria">Papelaria</option>
                                            <option value="Eletrônicos">Eletrônicos</option>
                                            <option value="Móveis">Móveis</option>
                                            <option value="Limpeza">Limpeza</option>
                                            <option value="Outros">Outros</option>
                                        </select>
                                    </label>
                                </div>
                                <div className="flex-1 space-y-5">
                                    <div className="flex flex-col w-full">
                                        <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Imagem</p>
                                        <div
                                            className="w-full h-40 bg-[#f6f7f8] dark:bg-gray-800 rounded-lg border-2 border-dashed border-[#dbe0e6] dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:bg-[#e8eef3] transition-colors relative overflow-hidden"
                                        >
                                            {imageFile ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                                    <p className="text-sm font-bold text-[#137fec]">{imageFile.name}</p>
                                                </div>
                                            ) : product.imageUrl ? (
                                                <img src={product.imageUrl} className="w-full h-full object-cover" alt="Current" />
                                            ) : (
                                                <span className="material-symbols-outlined text-[#9ca3af] text-4xl">cloud_upload</span>
                                            )}
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={e => e.target.files && setImageFile(e.target.files[0])}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="flex flex-col w-full">
                                            <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Quantidade</p>
                                            <input
                                                type="number"
                                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-11 px-3 text-sm"
                                                value={formData.quantity}
                                                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                            />
                                        </label>
                                        <label className="flex flex-col w-full">
                                            <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Validade</p>
                                            <input
                                                type="date"
                                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-11 px-3 text-sm"
                                                value={formData.expiryDate}
                                                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <label className="flex flex-col w-full">
                                <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Descrição</p>
                                <textarea
                                    className="form-textarea flex w-full min-w-0 resize-y overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-32 p-3 text-sm"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </label>
                            <div className="flex justify-end pt-4 border-t border-[#dbe0e6] dark:border-gray-700">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-[#137fec] text-white text-base font-bold hover:bg-[#137fec]/90 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Coluna Esquerda: Resumo do Produto */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-[#111418] p-6 rounded-xl border border-[#dbe0e6] dark:border-gray-700">
                                <div className="flex flex-col gap-6">
                                    <div
                                        className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg bg-[#f0f2f5] dark:bg-gray-800"
                                        style={{ backgroundImage: product.imageUrl ? `url('${product.imageUrl}')` : 'none' }}
                                    >
                                        {!product.imageUrl && (
                                            <div className="flex items-center justify-center h-full text-[#9ca3af]">
                                                <span className="material-symbols-outlined text-4xl">image_not_supported</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <p className="text-xs font-semibold text-[#637588] dark:text-gray-400 mb-1">Nome do Produto</p>
                                            <p className="text-base text-[#111418] dark:text-gray-200 font-medium">{product.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-[#637588] dark:text-gray-400 mb-1">Código de Barras</p>
                                            <p className="text-base text-[#111418] dark:text-gray-200 font-medium">{product.barcode}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Coluna Direita: Gerenciamento de Fornecedores */}
                        <div className="lg:col-span-3">
                            <div className="flex flex-col gap-8">
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[#111418] dark:text-white text-lg font-bold leading-tight">Selecionar Fornecedor</h3>
                                    <div className="bg-white dark:bg-[#111418] p-6 rounded-xl border border-[#dbe0e6] dark:border-gray-700 flex flex-col md:flex-row items-end gap-4">
                                        <label className="flex flex-col w-full flex-1">
                                            <p className="text-sm font-medium text-[#111418] dark:text-gray-300 pb-2">Fornecedor</p>
                                            <select
                                                className="form-select flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 h-12 px-3 text-base"
                                                value={selectedSupplierId}
                                                onChange={(e) => setSelectedSupplierId(e.target.value)}
                                            >
                                                <option value="" disabled>Busque ou selecione um fornecedor</option>
                                                {suppliers.map(s => (
                                                    <option key={s.id} value={s.id}>{s.companyName} ({s.cnpj})</option>
                                                ))}
                                            </select>
                                        </label>
                                        <button
                                            onClick={handleAssociate}
                                            disabled={loading || !selectedSupplierId}
                                            className="flex w-full md:w-auto min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-12 px-6 bg-[#137fec] text-white text-sm font-bold leading-normal transition-colors hover:bg-[#137fec]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="material-symbols-outlined text-lg">add</span>
                                            <span>Associar</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[#111418] dark:text-white text-lg font-bold leading-tight">Fornecedores Associados</h3>
                                    <div className="bg-white dark:bg-[#111418] rounded-xl border border-[#dbe0e6] dark:border-gray-700 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-[#f6f7f8] dark:bg-gray-800 text-xs text-[#637588] dark:text-gray-400 uppercase">
                                                    <tr>
                                                        <th className="px-6 py-3 font-semibold">Nome</th>
                                                        <th className="px-6 py-3 font-semibold">CNPJ</th>
                                                        <th className="px-6 py-3 text-right font-semibold">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {associatedSuppliers.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3} className="text-center py-12 px-6">
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <span className="material-symbols-outlined text-5xl text-[#dbe0e6]">link_off</span>
                                                                    <p className="text-[#637588] font-medium">Nenhum fornecedor associado</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        associatedSuppliers.map(s => (
                                                            <tr key={s.id} className="border-b border-[#dbe0e6] dark:border-gray-700 last:border-0">
                                                                <td className="px-6 py-4 font-medium text-[#111418] dark:text-white whitespace-nowrap">{s.companyName}</td>
                                                                <td className="px-6 py-4 text-[#637588] dark:text-gray-300">{s.cnpj}</td>
                                                                <td className="px-6 py-4 flex justify-end">
                                                                    {user.role === 'ADMIN' && (
                                                                        <button
                                                                            onClick={() => handleDisassociate(s.id)}
                                                                            className="flex items-center justify-center h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                                                        >
                                                                            <span className="material-symbols-outlined text-xl">delete</span>
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

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
                    <h3 className="text-xl font-bold text-[#111418] dark:text-white">Excluir Produto?</h3>
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

export const ProductPage: React.FC<ProductPageProps> = ({ onNotify, goBack, filter = 'all', user }) => {
    const [mode, setMode] = useState<'list' | 'create' | 'details'>('list');
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        description: '',
        quantity: 100,
        category: 'Papelaria',
        expiryDate: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    const fetchProducts = async () => {
        const data = await db.listProducts();
        setProducts(data);
        if (selectedProduct) {
            const updated = data.find(p => p.id === selectedProduct.id);
            if (updated) setSelectedProduct(updated);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const [customCategory, setCustomCategory] = useState('');

    // Fix: Ensure default categories exist even if product list is empty
    const defaultCategories = ['Papelaria', 'Eletrônicos', 'Móveis', 'Limpeza', 'Smartphones', 'Áudio', 'Periféricos', 'Outros'];
    const existingCategories = Array.from(new Set(products.map(p => p.category)));
    const categories = ['Todos', ...Array.from(new Set([...defaultCategories, ...existingCategories]))];

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.name || !formData.description) {
                throw new Error('Preencha os campos obrigatórios');
            }

            let finalCategory = formData.category;
            if (finalCategory === 'new') {
                if (!customCategory.trim()) {
                    throw new Error('Digite o nome da nova categoria');
                }
                finalCategory = customCategory.trim();
            }

            const data = new FormData();
            data.append('name', formData.name);
            data.append('barcode', formData.barcode);
            data.append('description', formData.description);
            data.append('quantity', formData.quantity.toString());
            data.append('category', finalCategory);
            if (formData.expiryDate) data.append('expiryDate', formData.expiryDate);
            if (imageFile) data.append('image', imageFile);

            await db.createProduct(data as any);

            onNotify({ type: 'success', message: 'Produto cadastrado com sucesso!' });
            setFormData({ name: '', barcode: '', description: '', quantity: 100, category: 'Papelaria', expiryDate: '' });
            setCustomCategory('');
            setImageFile(null);
            setMode('list');
            fetchProducts();
        } catch (err: any) {
            onNotify({ type: 'error', message: err.message });
        }
    };

    const handleSelectProduct = (p: Product) => {
        setSelectedProduct(p);
        setMode('details');
    };

    const handleDelete = (id: string, name: string) => {
        setProductToDelete({ id, name });
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        try {
            await db.deleteProduct(productToDelete.id);
            onNotify({ type: 'success', message: 'Produto excluído com sucesso!' });
            fetchProducts();
        } catch (err: any) {
            onNotify({ type: 'error', message: err.message });
        } finally {
            setProductToDelete(null);
        }
    };

    if (mode === 'details' && selectedProduct) {
        return (
            <ProductDetails
                product={selectedProduct}
                onBack={() => setMode('list')}
                onNotify={onNotify}
                onUpdate={fetchProducts}
                user={user}
            />
        );
    }

    const inputClass = "form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-14 placeholder:text-[#617589] p-[15px] text-base font-normal leading-normal transition-colors duration-200";
    const labelClass = "text-[#111418] dark:text-gray-300 text-base font-medium leading-normal pb-2";

    if (mode === 'create') {
        return (
            <div className="animate-fade-in h-full flex flex-col overflow-hidden">
                <div className="flex-none flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h1 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight">Cadastro de Produto</h1>
                    <button
                        onClick={() => setMode('list')}
                        className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#e8eef3] dark:bg-gray-700 text-[#111418] dark:text-white text-sm font-bold hover:bg-[#dbe0e6]"
                    >
                        <span className="material-symbols-outlined mr-2 text-base">arrow_back</span>
                        <span className="truncate">Voltar</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 p-1">
                    <div className="bg-white dark:bg-[#111418] rounded-xl border border-[#dbe0e6] dark:border-gray-700 p-6 h-full flex flex-col">
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-6 content-between flex-1">

                            <div className="md:col-span-2 space-y-5">
                                <label className="flex flex-col w-full">
                                    <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Nome do Produto *</p>
                                    <input
                                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-11 placeholder:text-[#617589] px-3 text-sm font-normal leading-normal transition-colors duration-200"
                                        placeholder="Ex: Caneta Esferográfica Azul"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </label>

                                <label className="flex flex-col w-full">
                                    <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Código de Barras</p>
                                    <input
                                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-11 placeholder:text-[#617589] px-3 text-sm font-normal leading-normal transition-colors duration-200"
                                        placeholder="Apenas números"
                                        value={formData.barcode}
                                        onChange={e => setFormData({ ...formData, barcode: e.target.value.replace(/\D/g, '') })}
                                    />
                                </label>

                                <label className="flex flex-col w-full">
                                    <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Descrição *</p>
                                    <textarea
                                        className="form-textarea flex w-full min-w-0 resize-y overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] !h-[220px] placeholder:text-[#617589] p-3 text-sm font-normal leading-normal"
                                        placeholder="Digite a descrição detalhada do produto"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    ></textarea>
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <label className="flex flex-col w-full">
                                        <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Quantidade *</p>
                                        <input
                                            type="number"
                                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-11 placeholder:text-[#617589] px-3 text-sm font-normal leading-normal transition-colors duration-200"
                                            placeholder="0"
                                            value={formData.quantity}
                                            onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                        />
                                    </label>

                                    <label className="flex flex-col w-full">
                                        <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Categoria *</p>
                                        <select
                                            className="form-select flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 h-11 px-3 text-sm"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {categories.filter(c => c !== 'Todos').map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                            <option value="new">+ Nova Categoria...</option>
                                        </select>
                                        {formData.category === 'new' && (
                                            <input
                                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-11 placeholder:text-[#617589] px-3 text-sm font-normal leading-normal transition-colors duration-200 mt-2"
                                                placeholder="Digite o nome da nova categoria"
                                                onChange={e => {
                                                    setCustomCategory(e.target.value);
                                                }}
                                                value={customCategory}
                                                autoFocus
                                            />
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="md:col-span-1 space-y-5">
                                <div className="flex flex-col w-full">
                                    <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Imagem do Produto</p>
                                    <div className="flex justify-center items-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-[#dbe0e6] dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-[#f6f7f8] dark:bg-gray-800 hover:bg-[#e8eef3] transition-colors" htmlFor="dropzone-file">
                                            <div className="flex flex-col items-center justify-center pt-4 pb-5">
                                                <span className="material-symbols-outlined text-[#9ca3af] text-4xl">cloud_upload</span>
                                                <p className="mb-1 text-xs text-[#637588]"><span className="font-semibold">Clique para enviar</span></p>
                                                <p className="text-[10px] text-[#637588]">PNG, JPG ou GIF</p>
                                                {imageFile && <p className="text-xs text-[#137fec] font-bold mt-1 truncate max-w-[150px]">{imageFile.name}</p>}
                                            </div>
                                            <input
                                                id="dropzone-file"
                                                type="file"
                                                className="hidden"
                                                onChange={e => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setImageFile(e.target.files[0]);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <label className="flex flex-col w-full">
                                    <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Data de Validade</p>
                                    <input
                                        type="date"
                                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#137fec] h-11 placeholder:text-[#617589] px-3 text-sm font-normal leading-normal transition-colors duration-200"
                                        value={formData.expiryDate}
                                        onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                    />
                                </label>
                            </div>

                            <div className="md:col-span-3 flex justify-end pt-4">
                                <button
                                    type="submit"
                                    className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-[#137fec] text-white text-base font-bold leading-normal tracking-wide hover:bg-[#137fec]/90 transition-colors"
                                >
                                    <span className="truncate">Cadastrar</span>
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        );
    }





    const getFilteredProducts = () => {
        let filtered = products;

        // Primeiro aplica o filtro de propriedade
        if (filter === 'lowStock') {
            filtered = filtered.filter(p => p.quantity < 10);
        } else if (filter === 'expiring') {
            const now = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(now.getDate() + 30);

            filtered = filtered.filter(p => {
                if (!p.expiryDate) return false;
                const expDate = new Date(p.expiryDate);
                return expDate >= now && expDate <= thirtyDaysFromNow;
            });
        }

        // Depois aplica o filtro de categoria
        if (selectedCategory !== 'Todos') {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }

        return filtered;
    };

    const displayedProducts = getFilteredProducts();

    return (

        <div className="animate-fade-in flex flex-col h-full overflow-hidden">
            <div className="flex-none">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-black text-[#111418] dark:text-white tracking-tight">
                        {filter === 'lowStock' ? 'Estoque Baixo' : filter === 'expiring' ? 'Produtos a Vencer' : 'Produtos'}
                    </h1>
                    <button onClick={() => setMode('create')} className="bg-[#137fec] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-[#137fec]/90 transition-colors">
                        <span className="material-symbols-outlined">add</span> Novo Produto
                    </button>
                </div>

                {/* Abas de Categoria */}
                <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat
                                ? 'bg-[#137fec] text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pb-2">
                <div className="grid grid-cols-1 gap-4">
                    {displayedProducts.length === 0 ? (
                        <div className="p-12 text-center text-[#637588] bg-white dark:bg-[#111418] rounded-xl border border-dashed border-[#dbe0e6]">
                            <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                            <p>Nenhum produto encontrado.</p>
                        </div>
                    ) : (
                        displayedProducts.map(p => (
                            <div key={p.id} className="bg-white dark:bg-[#111418] p-4 rounded-xl border border-[#dbe0e6] dark:border-gray-700 flex justify-between items-center shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="flex items-center gap-4">
                                    {p.imageUrl ? (
                                        <img src={p.imageUrl} alt={p.name} className="w-16 h-16 object-cover rounded-lg bg-[#f0f2f5]" />
                                    ) : (
                                        <div className="w-16 h-16 bg-[#f0f2f5] dark:bg-gray-800 rounded-lg flex items-center justify-center text-[#9ca3af]">
                                            <span className="material-symbols-outlined">image</span>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-lg text-[#111418] dark:text-white">{p.name}</h3>
                                        <p className="text-sm text-[#637588]">Barcode: {p.barcode} | Qtd: {p.quantity}</p>
                                        <span className="inline-block mt-2 text-xs bg-[#f0f2f5] dark:bg-gray-800 px-2 py-1 rounded text-[#111418] dark:text-gray-300 font-medium">{p.category}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleSelectProduct(p)} className="text-[#137fec] font-bold hover:underline text-sm px-3 py-2">
                                        Gerenciar Produto
                                    </button>
                                    {user.role === 'ADMIN' && (
                                        <button
                                            onClick={() => handleDelete(p.id, p.name)}
                                            className="flex items-center justify-center h-10 w-10 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                            title="Excluir Produto"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>


            <DeleteConfirmationModal
                isOpen={!!productToDelete}
                itemName={productToDelete?.name || ''}
                onClose={() => setProductToDelete(null)}
                onConfirm={confirmDelete}
            />
        </div >
    );
};