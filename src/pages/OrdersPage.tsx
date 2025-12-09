import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Supplier, Product, Order, Notification } from '../types';

interface OrdersPageProps {
    onNotify: (n: Notification) => void;
    goBack: () => void;
}

const ReceiveConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#111418] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#dbe0e6] dark:border-gray-700 transform transition-all scale-100">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined text-3xl text-[#137fec]">inventory_2</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#111418] dark:text-white">Confirmar Recebimento?</h3>
                    <p className="text-[#637588] dark:text-gray-400">
                        Isso irá processar o pedido e <span className="font-bold text-[#111418] dark:text-white">atualizar o estoque</span> automaticamente.
                        <br />
                        Deseja continuar?
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
                        className="flex-1 px-6 py-4 text-sm font-bold text-[#137fec] hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors border-l border-[#dbe0e6] dark:border-gray-700"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeleteConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isCompleted?: boolean;
}> = ({ isOpen, onClose, onConfirm, isCompleted }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#111418] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#dbe0e6] dark:border-gray-700 transform transition-all scale-100">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-500">delete</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#111418] dark:text-white">Excluir Pedido?</h3>
                    <p className="text-[#637588] dark:text-gray-400">
                        Você tem certeza que deseja excluir este pedido?
                        <br />
                        {isCompleted ? (
                            <span className="text-orange-600 font-bold block mt-2">
                                Atenção: O estoque adicionado por este pedido será revertido.
                            </span>
                        ) : (
                            "Essa ação não pode ser desfeita."
                        )}
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

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNotify, goBack }) => {
    const [mode, setMode] = useState<'list' | 'create'>('list');
    const [orders, setOrders] = useState<Order[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [orderToReceive, setOrderToReceive] = useState<string | null>(null);
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

    // Estado do Formulário de Criação/Edição
    const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);

    useEffect(() => {
        fetchOrders();
        db.listSuppliers().then(setSuppliers);
        db.listProducts().then(setProducts);
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await db.listOrders();
            setOrders(data);
        } catch (err: any) {
            console.error(err);
        }
    };

    const handleAddItem = () => {
        setOrderItems([...orderItems, { productId: '', quantity: 1, unitPrice: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...orderItems];
        newItems.splice(index, 1);
        setOrderItems(newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...orderItems];
        (newItems[index] as any)[field] = value;
        setOrderItems(newItems);
    };

    const calculateTotal = () => {
        return orderItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    };

    const handleSubmitOrder = async () => {
        if (!selectedSupplierId) return onNotify({ type: 'error', message: 'Selecione um fornecedor.' });
        if (orderItems.length === 0) return onNotify({ type: 'error', message: 'Adicione pelo menos um item.' });
        if (orderItems.some(i => !i.productId || i.quantity <= 0)) return onNotify({ type: 'error', message: 'Verifique os itens do pedido.' });

        setLoading(true);
        try {
            const orderData = {
                supplierId: selectedSupplierId,
                items: orderItems,
                totalAmount: calculateTotal()
            };

            if (editingOrderId) {
                await db.updateOrder(editingOrderId, orderData);
                onNotify({ type: 'success', message: 'Pedido atualizado com sucesso!' });
            } else {
                await db.createOrder(orderData);
                onNotify({ type: 'success', message: 'Pedido criado com sucesso!' });
            }

            setMode('list');
            fetchOrders();
            resetForm();
        } catch (err: any) {
            onNotify({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedSupplierId('');
        setOrderItems([]);
        setEditingOrderId(null);
    };

    const handleReceiveClick = (orderId: string) => {
        setOrderToReceive(orderId);
    };

    const handleEditClick = (order: Order) => {
        setEditingOrderId(order.id);
        setSelectedSupplierId(order.supplierId);
        // Mapear itens para corresponder à estrutura do formulário
        setOrderItems(order.items?.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice
        })) || []);
        setMode('create');
    };

    const handleDeleteClick = (orderId: string) => {
        setOrderToDelete(orderId);
    };

    const confirmDelete = async () => {
        if (!orderToDelete) return;
        try {
            await db.deleteOrder(orderToDelete);
            onNotify({ type: 'success', message: 'Pedido excluído com sucesso!' });
            fetchOrders();
        } catch (err: any) {
            onNotify({ type: 'error', message: err.message });
        } finally {
            setOrderToDelete(null);
        }
    };

    const confirmReceive = async () => {
        if (!orderToReceive) return;
        try {
            await db.receiveOrder(orderToReceive);
            onNotify({ type: 'success', message: 'Pedido recebido! Estoque atualizado.' });
            fetchOrders();
        } catch (err: any) {
            onNotify({ type: 'error', message: err.message });
        } finally {
            setOrderToReceive(null);
        }
    };

    const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Produto Removido';

    if (mode === 'create') {
        return (
            <div className="animate-fade-in h-full flex flex-col overflow-hidden">
                <div className="flex-none flex items-center justify-between gap-4 mb-6">
                    <h1 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight">
                        {editingOrderId ? 'Editar Pedido' : 'Novo Pedido de Compra'}
                    </h1>
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
                        {/* Seleção de Fornecedor */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#111418] dark:text-white">Fornecedor</label>
                            <select
                                className="form-select flex w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 h-12 px-4 text-base focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 outline-none transition-all"
                                value={selectedSupplierId}
                                onChange={e => setSelectedSupplierId(e.target.value)}
                            >
                                <option value="">Selecione um fornecedor...</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.companyName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Seção de Itens */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm font-bold text-[#111418] dark:text-white border-b border-[#dbe0e6] dark:border-gray-700 pb-2">
                                <span className="flex-1">Produto</span>
                                <span className="w-24 text-center">Qtd</span>
                                <span className="w-32 text-center">Preço Unit. (R$)</span>
                                <span className="w-32 text-right">Subtotal</span>
                                <span className="w-10"></span>
                            </div>

                            {orderItems.map((item, index) => (
                                <div key={index} className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in">
                                    <select
                                        className="flex-1 w-full h-10 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm focus:border-[#137fec] outline-none"
                                        value={item.productId}
                                        onChange={e => updateItem(index, 'productId', e.target.value)}
                                    >
                                        <option value="">Selecione o produto...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Qtd"
                                        className="w-full sm:w-24 h-10 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm text-center focus:border-[#137fec] outline-none"
                                        value={item.quantity}
                                        onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
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

                        {/* Rodapé */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-t border-[#dbe0e6] dark:border-gray-700">
                            <div className="text-xl font-black text-[#111418] dark:text-white">
                                Total: <span className="text-[#137fec]">R$ {calculateTotal().toFixed(2)}</span>
                            </div>
                            <button
                                onClick={handleSubmitOrder}
                                disabled={loading}
                                className="w-full sm:w-auto px-8 py-3 bg-[#137fec] text-white font-bold rounded-xl hover:bg-[#137fec]/90 transition-colors disabled:opacity-50 shadow-lg shadow-[#137fec]/20"
                            >
                                {loading ? 'Processando...' : (editingOrderId ? 'Salvar Alterações' : 'Finalizar Pedido')}
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
                    <h1 className="text-3xl font-black text-[#111418] dark:text-white tracking-tight">Gestão de Pedidos</h1>
                    <p className="text-[#637588] dark:text-gray-400 text-sm mt-1">Gerencie suas compras e recebimentos.</p>
                </div>
                <button
                    onClick={() => setMode('create')}
                    className="flex items-center gap-2 bg-[#137fec] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-[#137fec]/90 transition-colors shadow-sm"
                >
                    <span className="material-symbols-outlined text-xl">add</span>
                    Novo Pedido
                </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pb-2">
                <div className="grid grid-cols-1 gap-4">
                    {orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#111418] rounded-xl border border-dashed border-[#dbe0e6] dark:border-gray-700 h-[300px]">
                            <div className="w-16 h-16 bg-[#e8eef3] dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-[#9ca3af]">assignment_add</span>
                            </div>
                            <h3 className="text-lg font-bold text-[#111418] dark:text-white">Nenhum pedido encontrado</h3>
                            <p className="text-[#637588] dark:text-gray-400 text-sm mt-1">Crie seu primeiro pedido de compra para começar.</p>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} className="bg-white dark:bg-[#111418] p-5 rounded-xl border border-[#dbe0e6] dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 group">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide
                                                ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                {order.status === 'COMPLETED' ? 'Recebido' : 'Pendente'}
                                            </span>
                                            <span className="text-xs text-[#637588] dark:text-gray-500 font-medium">
                                                {new Date(order.date).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-1 group-hover:text-[#137fec] transition-colors">
                                            {order.supplierName || 'Fornecedor Desconhecido'}
                                        </h3>
                                        {order.status === 'PENDING' && (
                                            <button
                                                onClick={() => handleDeleteClick(order.id)}
                                                className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 mt-1 mb-3 transition-colors uppercase tracking-wide"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                                Excluir
                                            </button>
                                        )}
                                        {order.status === 'COMPLETED' && (
                                            <button
                                                className="text-gray-400 text-xs font-bold flex items-center gap-1 mt-1 mb-3 cursor-not-allowed uppercase tracking-wide"
                                                disabled
                                            >
                                            </button>
                                        )}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {order.items?.map((item, idx) => (
                                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-[#f6f7f8] dark:bg-gray-800 text-xs font-medium text-[#637588] dark:text-gray-300 border border-[#dbe0e6] dark:border-gray-700">
                                                    {item.quantity}x {item.productName || getProductName(item.productId)}
                                                </span>
                                            ))}
                                            {(order.items?.length || 0) > 3 && (
                                                <span className="text-xs text-[#637588] self-center">+ outros...</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 border-t md:border-t-0 md:border-l border-[#dbe0e6] dark:border-gray-700 pt-3 md:pt-0 md:pl-6 min-w-[140px]">
                                        <div className="text-right mt-auto mb-2">
                                            <p className="text-xs text-[#637588] dark:text-gray-400 uppercase font-bold">Total</p>
                                            <p className="text-xl font-black text-[#111418] dark:text-white">R$ {order.totalAmount.toFixed(2)}</p>
                                        </div>

                                        {order.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleReceiveClick(order.id)}
                                                    className="px-4 py-2 bg-[#137fec] text-white text-sm font-bold rounded-lg hover:bg-[#137fec]/90 transition-all flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-lg">check_circle</span>
                                                    Receber
                                                </button>
                                            </div>
                                        )}
                                        {order.status === 'COMPLETED' && (
                                            <div className="flex items-center gap-1 text-green-600 dark:text-green-500 text-sm font-bold">
                                                <span className="material-symbols-outlined text-lg">verified</span>
                                                Recebido
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <ReceiveConfirmationModal
                isOpen={!!orderToReceive}
                onClose={() => setOrderToReceive(null)}
                onConfirm={confirmReceive}
            />

            <DeleteConfirmationModal
                isOpen={!!orderToDelete}
                onClose={() => setOrderToDelete(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
};
