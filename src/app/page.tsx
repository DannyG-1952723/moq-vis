import FileImport from "@/components/FileImport";

export default function Page() {
    return (
        <div className="grid grid-rows-[20px_1fr_20px] min-h-screen p-8 pb-20 gap-16 sm:px-20 sm:py-10 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col gap-8 row-start-0 sm:items-start w-full">
                <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">Visualize MoQ logs</h1>
                <FileImport />
            </main>
        </div>
    );
}
