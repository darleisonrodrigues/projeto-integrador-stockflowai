import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { api } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
    setView: (view: any) => void;
}

const Icons = {
    Product: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-12v9" />
        </svg>
    ),
    Supplier: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
    ),
    LowStock: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
    ),
    Expiry: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
        </svg>
    )
};

const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    colorClass: string;
    onClick?: () => void;
}> = ({ title, value, icon, trend, trendUp, colorClass, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 group ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
        <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{value}</h3>
            </div>
            <div className={`p-3 transition-all text-${colorClass.replace('bg-', '')}`}>
                {icon}
            </div>
        </div>
        {trend && (
            <div className="flex items-center gap-1 mt-4 text-xs font-medium">
                <span className={trendUp ? 'text-green-500' : 'text-red-500'}>
                    {trendUp ? '↑' : '↓'} {trend}
                </span>
                <span className="text-gray-400">vs mês anterior</span>
            </div>
        )}
    </div>
);

export const DashboardPage: React.FC<DashboardProps> = ({ setView }) => {
    const [metrics, setMetrics] = useState({
        products: 0,
        suppliers: 0,
        lowStock: 0,
        expiring: 0
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const products = await db.listProducts();
                const suppliers = await db.listSuppliers();

                const lowStock = products.filter((p: any) => p.quantity < 10);

                const now = new Date();
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(now.getDate() + 30);

                const expiring = products.filter((p: any) => {
                    if (!p.expiryDate) return false;
                    const expDate = new Date(p.expiryDate);
                    return expDate >= now && expDate <= thirtyDaysFromNow;
                });

                setMetrics({
                    products: products.length,
                    suppliers: suppliers.length,
                    lowStock: lowStock.length,
                    expiring: expiring.length
                });

                // Fetch Analytics Data
                const analyticsData = await api.get(`/analytics?period=${period}`);

                // Format dates for display
                const formattedData = analyticsData.map((item: any) => {
                    const date = new Date(item.date);
                    // Adjust for timezone if needed, but for simplicity use UTC date parts or local
                    // 'pt-BR' locale will handle day names correctly
                    // Note: date string from backend is YYYY-MM-DD, so new Date() might be UTC. 
                    // We want to ensure consistent day display.
                    // Let's treat the date string as local midnight to avoid timezone shifts
                    const [y, m, d] = item.date.split('-').map(Number);
                    const localDate = new Date(y, m - 1, d);

                    const dayName = localDate.toLocaleDateString('pt-BR', { weekday: 'short' });
                    const dayNum = localDate.getDate();
                    const monthNum = localDate.getMonth() + 1;

                    return {
                        name: period === 'weekly' ? dayName : `${dayNum}/${monthNum}`,
                        Entrada: item.in,
                        Saída: item.out
                    };
                });

                setChartData(formattedData);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchData();
    }, [period]);

    return (
        <div className="flex flex-col gap-6 h-full pb-2 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Visão geral do desempenho do seu estoque.</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setPeriod('weekly')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md shadow-sm transition-all ${period === 'weekly' ? 'bg-[#137fec] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        Semanal
                    </button>
                    <button
                        onClick={() => setPeriod('monthly')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md shadow-sm transition-all ${period === 'monthly' ? 'bg-[#137fec] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        Mensal
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                <StatCard
                    title="Total de Produtos"
                    value={metrics.products}
                    icon={<Icons.Product />}
                    colorClass="bg-blue-500"
                    trend="12%"
                    trendUp={true}
                    onClick={() => setView('products')}
                />
                <StatCard
                    title="Fornecedores"
                    value={metrics.suppliers}
                    icon={<Icons.Supplier />}
                    colorClass="bg-emerald-500"
                    trend="4%"
                    trendUp={true}
                    onClick={() => setView('suppliers')}
                />
                <StatCard
                    title="Estoque Baixo"
                    value={metrics.lowStock}
                    icon={<Icons.LowStock />}
                    colorClass="bg-orange-500"
                    onClick={() => setView('products-low-stock')}
                />
                <StatCard
                    title="Prestes a Vencer"
                    value={metrics.expiring}
                    icon={<Icons.Expiry />}
                    colorClass="bg-red-500"
                    onClick={() => setView('products-expiring')}
                />
            </div>

            {/* Main Charts Area - Flex 1 to take remaining space */}
            <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex-1 min-h-0 flex flex-col">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 shrink-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Movimentação de Estoque ({period === 'weekly' ? 'Últimos 7 dias' : 'Últimos 30 dias'})</h3>
                    <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-1 rounded-full bg-[#137fec]"></div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Entrada</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-1 rounded-full bg-[#ef4444]"></div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Saída</span>
                        </div>
                    </div>
                </div>
                <div className="w-full flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#137fec" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#137fec" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="Entrada"
                                stroke="#137fec"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorIn)"
                                name="Entradas"
                            />
                            <Area
                                type="monotone"
                                dataKey="Saída"
                                stroke="#ef4444"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorOut)"
                                name="Saídas"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
