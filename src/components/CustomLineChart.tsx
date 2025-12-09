import React from 'react';

export const CustomLineChart: React.FC = () => {
    // Simulated data points for a smooth curve
    const data = [30, 45, 35, 60, 55, 85, 90];
    const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
    const max = Math.max(...data);
    const points = data.map((val, i) => `${i * 100},${100 - (val / max) * 80}`).join(' ');

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Movimentação de Estoque</h3>
                    <p className="text-sm text-gray-500">Entradas e saídas nos últimos 7 dias</p>
                </div>
                <button className="text-[#137fec] text-sm font-bold hover:underline">Ver Detalhes</button>
            </div>

            <div className="relative h-64 w-full">
                <svg viewBox="0 0 600 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    {/* Grid Lines */}
                    {[0, 25, 50, 75, 100].map((y) => (
                        <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="currentColor" className="text-gray-100 dark:text-gray-700" strokeWidth="1" />
                    ))}

                    {/* Area Gradient */}
                    <defs>
                        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#137fec" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#137fec" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={`M0,100 ${points.replace(/,/g, ' ')} L600,100 Z`} fill="url(#gradient)" />

                    {/* Line */}
                    <polyline
                        fill="none"
                        stroke="#137fec"
                        strokeWidth="3"
                        points={points}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-md"
                    />

                    {/* Dots */}
                    {data.map((val, i) => (
                        <circle
                            key={i}
                            cx={i * 100}
                            cy={100 - (val / max) * 80}
                            r="4"
                            className="fill-white stroke-[#137fec] stroke-2"
                        />
                    ))}
                </svg>

                {/* X-Axis Labels */}
                <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium">
                    {labels.map((l, i) => <span key={i}>{l}</span>)}
                </div>
            </div>
        </div>
    );
};
