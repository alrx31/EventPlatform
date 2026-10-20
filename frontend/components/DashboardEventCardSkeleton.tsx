export default function DashboardEventCardSkeleton() {
    return (
        <div className="card flex items-center gap-4 p-4" aria-hidden="true">
            <div className="skeleton h-20 w-[120px] rounded-[10px]" />
            <div className="flex flex-1 flex-col gap-2">
                <div className="skeleton h-5 w-24 rounded-full" />
                <div className="skeleton h-5 w-1/2" />
                <div className="skeleton h-4 w-1/3" />
            </div>
            <div className="skeleton h-10 w-32 rounded-[10px]" />
        </div>
    );
}
