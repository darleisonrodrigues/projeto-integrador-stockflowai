import React, { useState, useRef, useEffect } from 'react';

interface Action {
    label: string;
    icon: string;
    onClick: () => void;
    danger?: boolean;
}

interface ActionMenuProps {
    actions: Action[];
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ actions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                title="Mais opções"
            >
                <span className="material-symbols-outlined text-xl">more_vert</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1a1d21] rounded-xl shadow-lg border border-[#dbe0e6] dark:border-gray-700 z-10 overflow-hidden animate-fade-in origin-top-right">
                    <div className="py-1">
                        {actions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    action.onClick();
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-medium transition-colors
                                    ${action.danger
                                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
                                        : 'text-[#111418] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-lg">{action.icon}</span>
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
