export default function EventCardSkeleton() {
    return (
        <div className="card overflow-hidden" aria-hidden="true">
            <div className="skeleton h-[180px] rounded-none" />
            <div className="flex flex-col gap-3 p-5">
                <div className="skeleton h-5 w-24 rounded-full" />
                <div className="skeleton h-6 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-4 w-1/3" />
            </div>
        </div>
    );
}
