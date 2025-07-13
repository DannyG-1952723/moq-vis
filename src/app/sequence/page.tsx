"use client";

import FileList from "@/components/files/FileList";
import NetworkGraph from "@/components/network_graph/NetworkGraph";
import ProtocolToggle from "@/components/ProtocolToggle";
import SequenceDiagram from "@/components/sequence_diagram/SequenceDiagram";
import { ConnectionProvider } from "@/contexts/ConnectionsContext";
import { useFiles } from "@/contexts/FilesContext";
import { Network } from "@/model/Network";
import { useState } from "react";

export default function Page() {
    const [showQuicEvents, setShowQuicEvents] = useState(true);
    const [showMoqEvents, setShowMoqEvents] = useState(true);

    const files = useFiles();
    const activeFiles = files.filter((file) => file.active);

    // TODO: Maybe create a context with multiple actions for network so it doesn't need to be recalculated a lot
    const network = new Network(activeFiles, showQuicEvents, showMoqEvents);

    return (
        <ConnectionProvider>
            <div className="font-[family-name:var(--font-geist-sans)]">
                <main className="flex flex-col row-start-0 sm:items-start w-full">   
                    <FileList />
                    <ProtocolToggle show={activeFiles.length > 0} showQuic={showQuicEvents} showMoq={showMoqEvents} handleQuicToggle={onQuicToggle} handleMoqToggle={onMoqToggle} />
                    <NetworkGraph files={files} activeFiles={activeFiles} network={network} />
                    <SequenceDiagram files={files} activeFiles={activeFiles} network={network} />
                </main>
            </div>
        </ConnectionProvider>
    );

    function onQuicToggle(showQuic: boolean) {
        setShowQuicEvents(showQuic);
    }

    function onMoqToggle(showMoq: boolean) {
        setShowMoqEvents(showMoq);
    }
}
