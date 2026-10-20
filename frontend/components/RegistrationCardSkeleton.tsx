export default function RegistrationCardSkeleton() {
    return (
        <div className="card flex items-center gap-4 p-4" aria-hidden="true">
            <div className="skeleton h-16 w-16 rounded-[10px]" />
            <div className="flex flex-1 flex-col gap-2">
                <div className="skeleton h-5 w-1/3" />
                <div className="skeleton h-4 w-2/3" />
            </div>
            <div className="skeleton h-10 w-36 rounded-[10px]" />
        </div>
    );
}
