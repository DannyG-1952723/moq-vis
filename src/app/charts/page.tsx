"use client";

import Chart from "@/components/chart/Chart";
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
                <h3 className="block mt-5 mb-2 text-md font-medium text-gray-900 dark:text-white">Latency charts</h3>
                <div className="flex flex-wrap">
                    {network.connections.map(connection => <Chart connection={connection} />)}
                </div>
            </main>
        </div>
    );
}
