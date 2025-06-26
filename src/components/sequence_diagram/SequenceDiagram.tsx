import * as d3 from "d3";
import Note from "../Note";
import { Network } from "@/model/Network";
import Connection from "./Connection";
import Axis from "./Axis";
import { BLOCK_SIZE } from "@/model/util";
import { LogFile } from "@/model/LogFile";
import { useEffect, useState } from "react";

interface SequenceDiagramProps {
    files: LogFile[];
    activeFiles: LogFile[];
    network: Network;
}

export default function SequenceDiagram({ files, activeFiles, network }: SequenceDiagramProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    useEffect(() => {
        const messageEvents = d3.selectAll<SVGGElement, number>(".message_event");
        const quicEvents = d3.selectAll<SVGGElement, unknown>(".quic").nodes();
        const moqEvents = d3.selectAll<SVGGElement, unknown>(".moq").nodes();

        let nonHoveredMoqEvents: SVGGElement[] = [];
        let hoveredMoqEvent: SVGGElement[] = [];

        if (hoveredId === null) {
            nonHoveredMoqEvents = moqEvents;
        }
        else {
            nonHoveredMoqEvents = moqEvents.filter(event => event.id !== hoveredId);
            hoveredMoqEvent = [moqEvents.find(event => event.id === hoveredId)!];
        }

        // TODO: Sort the nonHoveredMoqEvents on their IDs, events that were hovered are always at the end of the nonHoveredMoqEvents, this can block other events from being accessible
        const order = [
            ...nonHoveredMoqEvents.map(event => parseInt(event.id)),
            ...hoveredMoqEvent.map(event => parseInt(event.id)),
            ...quicEvents.map(event => parseInt(event.id))
        ];

        // Uses map since IDs aren't always sequential (in case of non MessageEvents)
        let orderMap: Map<string, number> = new Map();

        for (let i = 0; i < order.length; i++) {
            const value = order[i];
            orderMap.set(`${value}`, i);
        }

        messageEvents.each(function() {
            const id = this.id;
            const sortIndex = orderMap.get(id);
            d3.select(this).datum(sortIndex);
        });

        messageEvents.sort((a, b) => a - b);
    }, [hoveredId]);

    const title = <h3 className="block mt-5 mb-2 text-md font-medium text-gray-900 dark:text-white">Sequence diagram</h3>;

    if (files.length === 0 || activeFiles.length === 0) {
        return (
            <>
                {title}
                {files.length === 0 && <Note>There are no imported files</Note>}
                {files.length !== 0 && activeFiles.length === 0 && <Note>There are no active files</Note>}
            </>
        );
    }
    
    const margin = {top: 50, right: 145, bottom: 50, left: 115}
    const axisMargin = 25;

    const width = 1280;
    const height = (network.maxEventNums - 1) * 50 + BLOCK_SIZE + margin.top + margin.bottom + 2 * axisMargin;

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scalePoint().domain(activeFiles.map(file => file.name)).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0, network.maxEventNums - 1]).range([axisMargin + BLOCK_SIZE / 2, innerHeight - axisMargin - BLOCK_SIZE / 2]);

    let startingId = 0;
    const connections = [];

    for (const conn of network.connections) {
        connections.push(<Connection key={conn.startingConn.connId} conn={conn} xScale={xScale} yScale={yScale} startTime={network.startTime} containsQuicEvents={network.containsQuicEvents} startingId={startingId} handleHover={handleHover} />);

        startingId += conn.acceptingConn.connEvents.length;
    }

    // TODO: Display events that aren't part of any connections (for when the other part of the connection isn't imported)
    const diagram = (
        <svg width={width} height={height} className="bg-white border border-gray-200 rounded-lg shadow-inner dark:bg-gray-700 dark:border-gray-700">
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse" className="fill-gray-600">
                    <path d="M 0 0 L 10 5 L 0 10 z" />
                </marker>
                <marker id="hover-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse" className="fill-gray-800">
                    <path d="M 0 0 L 10 5 L 0 10 z" />
                </marker>
            </defs>
            <g transform={`translate(${margin.left}, ${margin.top})`}>
                {network.nodes.map(node => <Axis key={node} xPos={xScale(node)! + BLOCK_SIZE / 2} yPos={0} height={innerHeight} fileName={node} />)}
                <g id="message_container">
                    {connections}
                </g>
            </g>
        </svg>
    );

    return (
        <>
            {title}
            {diagram}
        </>
    );

    function handleHover(id: string | null) {
        setHoveredId(id);
    }
}
