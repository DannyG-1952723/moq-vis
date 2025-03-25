import { useFiles } from "@/contexts/FilesContext";
import * as d3 from "d3";
import Note from "../Note";
import { Network } from "@/model/Network";
import Connection from "./Connection";
import Axis from "./Axis";

export default function SequenceDiagram() {
    const files = useFiles();
    const activeFiles = files.filter((file) => file.active);

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

    const network = new Network(activeFiles);
    console.log(network);
    
    const margin = {top: 50, right: 250, bottom: 50, left: 75}
    const axisMargin = 25;
    const eventBlockSize = 30;

    const width = 1280;
    const height = (network.numEvents - 1) * 50 + eventBlockSize + margin.top + margin.bottom + 2 * axisMargin;

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scalePoint().domain(activeFiles.map(file => file.name)).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0, network.numEvents - 1]).range([axisMargin + eventBlockSize / 2, innerHeight - axisMargin - eventBlockSize / 2]);

    const diagram = (
        <svg width={width} height={height} className="bg-white border border-gray-200 rounded-lg shadow-inner dark:bg-gray-700 dark:border-gray-700">
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse" className="fill-gray-600">
                    <path d="M 0 0 L 10 5 L 0 10 z" />
                </marker>
            </defs>
            <g transform={`translate(${margin.left}, ${margin.top})`}>
                {network.nodes.map(node => <Axis xPos={xScale(node)! + eventBlockSize / 2} yPos={0} height={innerHeight} fileName={node} />)}
                {network.connections.map(conn => <Connection key={conn.startingConn.connId} conn={conn} xScale={xScale} yScale={yScale} height={innerHeight} eventBlockSize={eventBlockSize} />)}
            </g>
        </svg>
    );

    return (
        <>
            {title}
            {diagram}
        </>
    );
}
