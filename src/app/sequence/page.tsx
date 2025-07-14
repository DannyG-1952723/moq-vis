"use client";

import FileList from "@/components/files/FileList";
import NetworkGraph from "@/components/network_graph/NetworkGraph";
import SequenceDiagram from "@/components/sequence_diagram/SequenceDiagram";
import { ConnectionProvider } from "@/contexts/ConnectionsContext";
import { useFiles } from "@/contexts/FilesContext";
import { Network } from "@/model/Network";

export default function Page() {
    const files = useFiles();
    const activeFiles = files.filter((file) => file.active);

    // TODO: Maybe create a context with multiple actions for network so it doesn't need to be recalculated a lot
    const network = new Network(activeFiles);

    return (
        <ConnectionProvider>
            <div className="font-[family-name:var(--font-geist-sans)]">
                <main className="flex flex-col row-start-0 sm:items-start w-full">   
                    <FileList />
                    <NetworkGraph files={files} activeFiles={activeFiles} network={network} />
                    <SequenceDiagram files={files} activeFiles={activeFiles} />
                </main>
            </div>
        </ConnectionProvider>
    );
}
