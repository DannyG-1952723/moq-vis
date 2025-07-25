"use client";

import * as d3 from "d3";
import Note from "../Note";
import { LogFile } from "@/model/LogFile";
import { EdgeDatum, Network, NodeDatum } from "@/model/Network";
import { HEIGHT, WIDTH } from "@/model/util";
import { useEffect, useRef, useState } from "react";
import Node from "./Node";
import Edge from "./Edge";
import { ActionType, ConnectionAction, useConnectionsDispatch } from "@/contexts/ConnectionsContext";

const LINE_OFFSET: number = 40;

interface NetworkGraphProps {
    files: LogFile[];
    activeFiles: LogFile[];
    network: Network;
}

export default function NetworkGraph({ files, activeFiles, network }: NetworkGraphProps) {
    const ref = useRef<SVGSVGElement>(null);

    // TODO: Improve (when nodes change, the edges change too, which means two rerenders are triggered when only one is needed)
    const [graphNodes, setGraphNodes] = useState<NodeDatum[]>([]);
    const [graphEdges, setGraphEdges] = useState<EdgeDatum[]>([]);

    const dispatch = useConnectionsDispatch();

    useEffect(() => {
        dispatch!(new ConnectionAction(ActionType.Clear, []));

        const [nodes, edges] = network.getGraphData();

        setGraphNodes(nodes);
        setGraphEdges(edges);
    }, [network]);

    useEffect(() => {
        const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.25, 8])
            .on("zoom", event => {
                d3.select(ref.current)
                    .select("g.zoom")
                    .attr("transform", event.transform);
            });

        d3.select(ref.current!).call(zoomBehavior);
    });
    
    const nodes = graphNodes.map(node => <Node key={node.name} fileName={node.name} x={node.x} y={node.y} mainRole={node.mainRole} onDrag={(dx, dy) => handleNodeDrag(node.name, dx, dy)} />);

    const edges = graphEdges.map(edge => {
        const source = graphNodes.find(node => node.name === edge.source)!;
        const target = graphNodes.find(node => node.name === edge.target)!;

        const [x1, y1, x2, y2] = calculateLineEnds(source.x, source.y, target.x, target.y);

        return <Edge
            key={`${source.name}_${target.name}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            connections={network.connections.filter(conn =>
                (conn.startingConn.fileName === source.name && conn.acceptingConn.fileName === target.name) ||
                (conn.startingConn.fileName === target.name && conn.acceptingConn.fileName === source.name)
            )}
            network={network}
        />;
    });

    const title = <h3 className="block mt-5 mb-2 text-md font-medium text-gray-900 dark:text-white">Network graph</h3>;

    if (files.length === 0 || activeFiles.length === 0) {
        return (
            <>
                {title}
                {files.length === 0 && <Note>There are no imported files</Note>}
                {files.length !== 0 && activeFiles.length === 0 && <Note>There are no active files</Note>}
            </>
        );
    }

    const diagram = (
        <svg ref={ref} id="network_graph" width={WIDTH} height={HEIGHT} className="bg-white border border-gray-200 rounded-lg shadow-inner dark:bg-gray-700 dark:border-gray-700">
            <g className="zoom">
                {edges}
                {nodes}
            </g>
        </svg>
    );

    return (
        <>
            {title}
            {diagram}
        </>
    );

    function handleNodeDrag(name: string, dx: number, dy: number) {
        setGraphNodes(prev => 
            prev.map(n => n.name === name ? { ...n, x: n.x + dx, y: n.y + dy } : n)
        )
    }
}

function calculateLineEnds(x1: number, y1: number, x2: number, y2: number): [number, number, number, number] {
    if (x1 === x2) {
        const newY1 = (y1 < y2) ? y1 + LINE_OFFSET : y1 - LINE_OFFSET;
        const newY2 = (y1 < y2) ? y2 - LINE_OFFSET : y2 + LINE_OFFSET;
        return [x1, newY1, x2, newY2];
    }

    // y = m * x + q
    const m = (y2 - y1) / (x2 - x1);
    const q = y1 - m * x1;

    // https://math.stackexchange.com/q/175896
    const xOffset = LINE_OFFSET / Math.sqrt(1 + m * m);

    const newX1 = x1 < x2 ? x1 + xOffset : x1 - xOffset;
    const newX2 = x1 < x2 ? x2 - xOffset : x2 + xOffset;
    const newY1 = m * newX1 + q;
    const newY2 = m * newX2 + q;

    return [newX1, newY1, newX2, newY2];
}
