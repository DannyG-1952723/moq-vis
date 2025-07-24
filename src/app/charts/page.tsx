"use client";

import Charts from "@/components/chart/Charts";
import FileList from "@/components/files/FileList";
import NetworkGraph from "@/components/network_graph/NetworkGraph";
import { useFiles } from "@/contexts/FilesContext";
import { Network } from "@/model/Network";

export default function Page() {
    const files = useFiles();
    const activeFiles = files.filter((file) => file.active);

    // TODO: Maybe create a context with multiple actions for network so it doesn't need to be recalculated a lot
    const network = new Network(activeFiles);

    return (
        <div className="font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col row-start-0 sm:items-start w-full">
                <FileList />
                <NetworkGraph files={files} activeFiles={activeFiles} network={network} />
                <Charts numNetworkConnections={network.connections.length} />
            </main>
        </div>
    );
}
