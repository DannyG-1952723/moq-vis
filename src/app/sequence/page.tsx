"use client";

import FileList from "@/components/files/FileList";

export default function Page() {
    return (
        <div className="font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col row-start-0 sm:items-start w-full">   
                <FileList />
            </main>
        </div>
    );
}
