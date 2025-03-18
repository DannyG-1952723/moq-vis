"use client";

import FileList from "@/components/files/FileList";
import SequenceDiagram from "@/components/sequence_diagram/SequenceDiagram";

export default function Page() {
    return (
        <div className="font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col row-start-0 sm:items-start w-full">   
                <FileList />
                <SequenceDiagram />
            </main>
        </div>
    );
}
