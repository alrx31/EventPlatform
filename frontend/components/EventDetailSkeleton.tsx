export default function EventDetailSkeleton() {
    return (
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 pt-6 xl:px-0" aria-hidden="true">
            <div className="skeleton h-8 w-40" />
            <div className="skeleton h-[200px] rounded-[20px] md:h-[320px]" />
            <div className="flex flex-col gap-8 lg:flex-row">
                <div className="flex flex-1 flex-col gap-4">
                    <div className="skeleton h-6 w-28 rounded-full" />
                    <div className="skeleton h-10 w-2/3" />
                    <div className="skeleton h-24" />
                    <div className="skeleton h-32" />
                </div>
                <div className="skeleton h-80 lg:w-[400px]" />
            </div>
        </div>
    );
}
