'use client'

import { ReactNode, useEffect, useRef } from 'react';

interface ModalProps {
    onClose: () => void;
    label: string;
    children: ReactNode;
    width?: string;
    className?: string;
}

export default function Modal({ onClose, label, children, width = 'max-w-[480px]', className = '' }: ModalProps) {
    const closeRef = useRef(onClose);
    useEffect(() => { closeRef.current = onClose; });

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onKey);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label={label}
                onClick={(e) => e.stopPropagation()}
                className={`max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-[20px] bg-white shadow-modal ${width} ${className}`}
            >
                {children}
            </div>
        </div>
    );
}
