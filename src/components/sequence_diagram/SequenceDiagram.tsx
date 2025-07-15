import * as d3 from "d3";
import { NetworkSelection } from "@/model/Network";
import Connection from "./Connection";
import Axis from "./Axis";
import { BLOCK_SIZE, WIDTH } from "@/model/util";
import { LogFile } from "@/model/LogFile";
import { useEffect, useState } from "react";
import Note from "../Note";
import { useConnections } from "@/contexts/ConnectionsContext";
import ProtocolToggle from "../ProtocolToggle";

interface SequenceDiagramProps {
    files: LogFile[];
    activeFiles: LogFile[];
}

export default function SequenceDiagram({ files, activeFiles }: SequenceDiagramProps) {
    const [showQuicEvents, setShowQuicEvents] = useState(true);
    const [showMoqEvents, setShowMoqEvents] = useState(true);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const selectedConnections = useConnections();

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

        const order = [
            // Needs to be sorted so they don't block other events
            ...nonHoveredMoqEvents.map(event => parseInt(event.id)).sort(),
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
    }, [selectedConnections, hoveredId]);

    if (files.length === 0 || activeFiles.length === 0) {
        return <></>;
    }

    const title = <h3 className="block mt-5 mb-2 text-md font-medium text-gray-900 dark:text-white">Sequence diagram</h3>;

    if (selectedConnections.length === 0) {
        return (
            <>
                {title}
                <Note>Click connections in the network graph to display in the sequence diagram</Note>
            </>
        );
    }
    
    const margin = {top: 50, right: 145, bottom: 50, left: 115}
    const axisMargin = 25;

    const network = new NetworkSelection(selectedConnections, showQuicEvents, showMoqEvents);

    const height = (network.maxEventNums - 1) * 50 + BLOCK_SIZE + margin.top + margin.bottom + 2 * axisMargin;

    const innerWidth = WIDTH - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scalePoint().domain(network.nodes).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0, network.maxEventNums - 1]).range([axisMargin + BLOCK_SIZE / 2, innerHeight - axisMargin - BLOCK_SIZE / 2]);

    let startingId = 0;
    const connections = [];

    for (const conn of selectedConnections) {
        connections.push(<Connection key={conn.startingConn.connId} conn={conn} xScale={xScale} yScale={yScale} startTime={network.startTime} showQuic={showQuicEvents} showMoq={showMoqEvents} containsQuicEvents={network.containsQuicEvents} startingId={startingId} handleHover={handleHover} />);

        startingId += conn.acceptingConn.connEvents.length;
    }

    // TODO: Display events that aren't part of any connections (for when the other part of the connection isn't imported)
    const diagram = (
        <svg width={WIDTH} height={height} className="bg-white border border-gray-200 rounded-lg shadow-inner dark:bg-gray-700 dark:border-gray-700">
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

    const protocolToggle = <ProtocolToggle show={activeFiles.length > 0} showQuic={showQuicEvents} showMoq={showMoqEvents} handleQuicToggle={onQuicToggle} handleMoqToggle={onMoqToggle} />

    return (
        <>
            {title}
            {protocolToggle}
            {diagram}
        </>
    );

    function onQuicToggle(showQuic: boolean) {
        setShowQuicEvents(showQuic);
    }

    function onMoqToggle(showMoq: boolean) {
        setShowMoqEvents(showMoq);
    }

    function handleHover(id: string | null) {
        setHoveredId(id);
    }
}
