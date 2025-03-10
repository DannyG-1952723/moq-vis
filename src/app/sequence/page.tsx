"use client";

import FileList from "@/components/FileList";

export default function Page() {
    return (
        <div className="grid grid-rows-[20px_1fr_20px] pb-20 gap-16 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col row-start-0 sm:items-start w-full">
                <FileList />
            </main>
        </div>
    );
}
