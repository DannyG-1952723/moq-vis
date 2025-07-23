import { Connection, Network } from "@/model/Network";
import Chart from "./Chart";
import Note from "../Note";
import { ReactNode, useState } from "react";
import ProtocolToggle from "./ProtocolToggle";

interface ChartsProps {
    network: Network;
}

export default function Charts({ network }: ChartsProps) {
    const [showQuicData, setShowQuicData] = useState(true);
    const [showMoqData, setShowMoqData] = useState(true);

    const title = <h3 className="block mt-5 mb-2 text-md font-medium text-gray-900 dark:text-white">Latency charts</h3>;

    if (network.connections.length === 0) {
        return (
            <>
                {title}
                <Note>There are no connections</Note>
            </>
        );
    }

    const charts: ReactNode[] = [];

    const connections = getConnectionPairs(network);
    connections.forEach((connection, key) => charts.push(<Chart key={key} showQuicData={showQuicData} showMoqData={showMoqData} quicConnection={connection.quicConnection} moqConnection={connection.moqConnection} />));

    return (
        <>
            {title}
            <ProtocolToggle show={charts.length > 0} showQuic={showQuicData} showMoq={showMoqData} handleQuicToggle={onQuicToggle} handleMoqToggle={onMoqToggle} />
            <div className="flex flex-wrap">
                {charts}
            </div>
        </>
    );

    function onQuicToggle(showQuic: boolean) {
        setShowQuicData(showQuic);
    }

    function onMoqToggle(showMoq: boolean) {
        setShowMoqData(showMoq);
    }
}

interface ConnectionPair {
    quicConnection?: Connection;
    moqConnection?: Connection;
}

function getConnectionPairs(network: Network): Map<string, ConnectionPair> {
    const connections = new Map<string, ConnectionPair>();

    for (const connection of network.connections) {
        const fileName1 = connection.startingConn.fileName;
        const fileName2 = connection.acceptingConn.fileName;

        const key = fileName1.localeCompare(fileName2) < 0 ? `${fileName1}_${fileName2}` : `${fileName2}_${fileName1}`;
        
        const currentConnection = connections.get(key)

        if (connection.connectionType === "quic") {
            if (currentConnection === undefined) {
                connections.set(key, { quicConnection: connection });
            }
            else {
                connections.set(key, { quicConnection: connection, moqConnection: currentConnection.moqConnection });
            }
        }
        else {
            if (currentConnection === undefined) {
                connections.set(key, { moqConnection: connection });
            }
            else {
                connections.set(key, { quicConnection: currentConnection.quicConnection, moqConnection: connection });
            }
        }
    }

    return connections;
}
