interface TabItem {
    key: string;
    label: string;
    count?: number;
}

interface TabsProps {
    items: TabItem[];
    active: string;
    onChange: (key: string) => void;
}

export default function Tabs({ items, active, onChange }: TabsProps) {
    return (
        <div role="tablist" className="flex gap-6 overflow-x-auto border-b border-line [scrollbar-width:none]">
            {items.map(item => {
                const isActive = item.key === active;
                return (
                    <button
                        key={item.key}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(item.key)}
                        className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm transition-colors ${isActive ? 'border-brand-600 font-semibold text-brand-600' : 'border-transparent font-medium text-muted hover:text-ink'}`}
                    >
                        {item.label}
                        {item.count !== undefined && (
                            <span className={`rounded-full px-1.5 text-xs font-medium leading-5 ${isActive ? 'bg-brand-50 text-brand-700' : 'bg-neutral-bg text-subtle'}`}>{item.count}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
