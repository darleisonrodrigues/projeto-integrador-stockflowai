import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Product, Sale, Notification, Client } from '../types';

interface SalesPageProps {
    onNotify: (n: Notification) => void;
    goBack: () => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({ onNotify, goBack }) => {
    const [mode, setMode] = useState<'list' | 'create'>('list');
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);

    // Create Form State
    const [saleItems, setSaleItems] = useState<{ productId: string; quantity: number; unitPrice: number; maxQuantity: number }[]>([]);
    const [notes, setNotes] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');

    useEffect(() => {
        fetchSales();
        db.listProducts().then(setProducts);
        db.listClients().then(setClients);
    }, []);

    const fetchSales = async () => {
        try {
            const data = await db.listSales();
            setSales(data);
        } catch (err: any) {
            console.error(err);
        }
    };

    const handleAddItem = () => {
        setSaleItems([...saleItems, { productId: '', quantity: 1, unitPrice: 0, maxQuantity: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...saleItems];
        newItems.splice(index, 1);
        setSaleItems(newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...saleItems];
        const item = newItems[index];

        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            if (product) {
                // Determine unit price strategy. For now, we don't have a 'sellPrice' in Product, 
                // so we might default to 0 or leave it manual. Let's assume manual entry or 0 for now.
                // We'll also store maxQuantity to validate stock.
                item.productId = value;
                item.maxQuantity = product.quantity;
                item.unitPrice = 0; // Or some default price if we had it
            }
        } else if (field === 'quantity') {
            // Validate against stock
            const qty = parseInt(value) || 0;
            if (qty > item.maxQuantity) {
                onNotify({ type: 'error', message: `Quantidade indisponível. Estoque atual: ${item.maxQuantity}` });
                item.quantity = item.maxQuantity;
            } else {
                item.quantity = qty;
            }
        } else {
            (item as any)[field] = value;
        }

        setSaleItems(newItems);
    };

    const calculateTotal = () => {
        return saleItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    };

    const handleSubmitSale = async (status: 'QUOTE' | 'COMPLETED' = 'COMPLETED') => {
        if (saleItems.length === 0) return onNotify({ type: 'error', message: 'Adicione pelo menos um item.' });
        if (saleItems.some(i => !i.productId || i.quantity <= 0)) return onNotify({ type: 'error', message: 'Verifique os itens da venda.' });

        setLoading(true);
        try {
            const saleData = {
                items: saleItems.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
                totalAmount: calculateTotal(),
                notes,
                clientId: selectedClientId || null,
                status
            };

            await db.createSale(saleData);
            onNotify({ type: 'success', message: status === 'QUOTE' ? 'Orçamento salvo!' : 'Venda realizada com sucesso!' });

            setMode('list');
            fetchSales();
            resetForm();
            // Refresh products to get updated stock
            db.listProducts().then(setProducts);
        } catch (err: any) {
            onNotify({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSaleItems([]);
        setNotes('');
        setSelectedClientId('');
    };

    const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Produto Removido';

    if (mode === 'create') {
        return (
            <div className="animate-fade-in h-full flex flex-col overflow-hidden">
                <div className="flex-none flex items-center justify-between gap-4 mb-6">
                    <h1 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight">Nova Venda (Saída)</h1>
                    <button
                        onClick={() => { setMode('list'); resetForm(); }}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 bg-[#e8eef3] dark:bg-gray-700 hover:bg-[#dbe0e6] dark:hover:bg-gray-600 transition-colors text-sm font-bold text-[#111418] dark:text-white"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Voltar
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-[#111418] rounded-xl border border-[#dbe0e6] dark:border-gray-700 p-6">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Header: Client & Title */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-[#111418] dark:text-white">Cliente (Opcional)</label>
                                <select
                                    className="form-select flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 h-12 px-4 text-base focus:border-[#137fec] outline-none transition-all"
                                    value={selectedClientId}
                                    onChange={e => setSelectedClientId(e.target.value)}
                                >
                                    <option value="">Venda Balcão / Sem Cliente</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm font-bold text-[#111418] dark:text-white border-b border-[#dbe0e6] dark:border-gray-700 pb-2">
                                <span className="flex-1">Produto</span>
                                <span className="w-24 text-center">Qtd</span>
                                <span className="w-32 text-center">Preço Unit. (R$)</span>
                                <span className="w-32 text-right">Subtotal</span>
                                <span className="w-10"></span>
                            </div>

                            {saleItems.map((item, index) => (
                                <div key={index} className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in">
                                    <select
                                        className="flex-1 w-full h-10 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm focus:border-[#137fec] outline-none"
                                        value={item.productId}
                                        onChange={e => updateItem(index, 'productId', e.target.value)}
                                    >
                                        <option value="">Selecione o produto...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                                                {p.name} (Estoque: {p.quantity})
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Qtd"
                                        className="w-full sm:w-24 h-10 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm text-center focus:border-[#137fec] outline-none"
                                        value={item.quantity}
                                        onChange={e => updateItem(index, 'quantity', e.target.value)}
                                        min="1"
                                        max={item.maxQuantity}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Preço"
                                        className="w-full sm:w-32 h-10 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm text-center focus:border-[#137fec] outline-none"
                                        value={item.unitPrice}
                                        onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    />
                                    <div className="w-full sm:w-32 text-right font-medium text-[#111418] dark:text-white">
                                        R$ {(item.quantity * item.unitPrice).toFixed(2)}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(index)}
                                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-xl">delete</span>
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={handleAddItem}
                                className="flex items-center gap-2 text-[#137fec] font-bold text-sm hover:bg-[#137fec]/10 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center"
                            >
                                <span className="material-symbols-outlined text-lg">add_circle</span>
                                Adicionar Item
                            </button>
                        </div>

                        <label className="flex flex-col w-full">
                            <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal pb-1">Observações</p>
                            <textarea
                                className="form-textarea flex w-full h-24 rounded-lg text-[#111418] dark:text-white border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 p-3 text-sm"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Opcional"
                            />
                        </label>


                        {/* Footer */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-t border-[#dbe0e6] dark:border-gray-700">
                            <div className="text-xl font-black text-[#111418] dark:text-white">
                                Total: <span className="text-[#137fec]">R$ {calculateTotal().toFixed(2)}</span>
                            </div>
                            <div className="flex gap-4 w-full sm:w-auto">
                                <button
                                    onClick={() => handleSubmitSale('QUOTE')}
                                    disabled={loading}
                                    className="flex-1 sm:flex-none px-6 py-3 bg-white dark:bg-transparent border border-[#dbe0e6] dark:border-gray-600 text-[#111418] dark:text-white font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    Salvar Orçamento
                                </button>
                                <button
                                    onClick={() => handleSubmitSale('COMPLETED')}
                                    disabled={loading}
                                    className="flex-1 sm:flex-none px-8 py-3 bg-[#137fec] text-white font-bold rounded-xl hover:bg-[#137fec]/90 transition-colors disabled:opacity-50 shadow-lg shadow-[#137fec]/20"
                                >
                                    {loading ? 'Processando...' : 'Finalizar Venda'}
                                </button>
                            </div>
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
                    <h1 className="text-3xl font-black text-[#111418] dark:text-white tracking-tight">Gestão de Vendas</h1>
                    <p className="text-[#637588] dark:text-gray-400 text-sm mt-1">Registre saídas de estoque e vendas.</p>
                </div>
                <button
                    onClick={() => setMode('create')}
                    className="flex items-center gap-2 bg-[#137fec] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-[#137fec]/90 transition-colors shadow-sm"
                >
                    <span className="material-symbols-outlined text-xl">add</span>
                    Nova Venda
                </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pb-2">
                <div className="grid grid-cols-1 gap-4">
                    {sales.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#111418] rounded-xl border border-dashed border-[#dbe0e6] dark:border-gray-700 h-[300px]">
                            <div className="w-16 h-16 bg-[#e8eef3] dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-[#9ca3af]">shopping_cart_off</span>
                            </div>
                            <h3 className="text-lg font-bold text-[#111418] dark:text-white">Nenhuma venda registrada</h3>
                            <p className="text-[#637588] dark:text-gray-400 text-sm mt-1">Registre sua primeira venda (saída) para começar.</p>
                        </div>
                    ) : (
                        sales.map(sale => (
                            <div key={sale.id} className="bg-white dark:bg-[#111418] p-5 rounded-xl border border-[#dbe0e6] dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 group">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide
                                                ${sale.status === 'QUOTE'
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}>
                                                {sale.status === 'QUOTE' ? 'Orçamento' : 'Concluído'}
                                            </span>
                                            <span className="text-xs text-[#637588] dark:text-gray-500 font-medium">
                                                {new Date(sale.date).toLocaleString('pt-BR')}
                                            </span>
                                            {sale.clientName && (
                                                <span className="flex items-center gap-1 text-xs font-bold text-[#111418] dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                                    <span className="material-symbols-outlined text-sm">person</span>
                                                    {sale.clientName}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {sale.items?.map((item, idx) => (
                                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-[#f6f7f8] dark:bg-gray-800 text-xs font-medium text-[#637588] dark:text-gray-300 border border-[#dbe0e6] dark:border-gray-700">
                                                    {item.quantity}x {item.productName || getProductName(item.productId)}
                                                </span>
                                            ))}
                                        </div>
                                        {sale.notes && (
                                            <p className="text-sm text-[#637588] dark:text-gray-400 mt-2 italic">"{sale.notes}"</p>
                                        )}
                                    </div>

                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 border-t md:border-t-0 md:border-l border-[#dbe0e6] dark:border-gray-700 pt-3 md:pt-0 md:pl-6 min-w-[140px]">
                                        <div className="text-right mt-auto mb-2">
                                            <p className="text-xs text-[#637588] dark:text-gray-400 uppercase font-bold">Total</p>
                                            <p className="text-xl font-black text-[#111418] dark:text-white">R$ {sale.totalAmount.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
