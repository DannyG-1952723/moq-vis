"use client";

import * as d3 from "d3";
import Note from "../Note";
import { LogFile } from "@/model/LogFile";
import { LinkDatum, Network, NodeDatum } from "@/model/Network";
import { HEIGHT, WIDTH } from "@/model/util";
import { useEffect } from "react";
import Node from "./Node";
import Edge from "./Edge";

const LINE_OFFSET: number = 40;

interface NetworkGraphProps {
    files: LogFile[];
    activeFiles: LogFile[];
    network: Network;
}

export default function NetworkGraph({ files, activeFiles, network }: NetworkGraphProps) {
    useEffect(() => {
        const graph = d3.select<SVGSVGElement, unknown>("#network_graph");

        const dragLayer = graph.select<SVGGElement>(".drag");
        const zoomLayer = graph.select<SVGGElement>(".zoom");

        const links: LinkDatum[] = graphEdges.map(edge => ({
            source: graphNodes.find(node => node.name === edge.source)!,
            target: graphNodes.find(node => node.name === edge.target)!
        }));

        const link = graph.selectAll<SVGLineElement, LinkDatum>(".edge").data(links);

        const dragBehavior = d3.drag<SVGGElement, NodeDatum>()
            .on("start", function (_) {
                d3.select(this).raise();
                dragLayer.attr("cursor", "grabbing");
            })
            .on("drag", function (event, d) {
                d.x += event.dx;
                d.y += event.dy;

                const node = d3.select<SVGGElement, NodeDatum>(this);
                node.attr("transform", `translate(${d.x}, ${d.y})`);

                link.each(function (l) {
                    const [x1, y1, x2, y2] = calculateLineEnds(l.source.x, l.source.y, l.target.x, l.target.y);

                    d3.select(this)
                        .attr("x1", x1)
                        .attr("y1", y1)
                        .attr("x2", x2)
                        .attr("y2", y2);
                });
            })
            .on("end", function () {
                dragLayer.attr("cursor", "grab");
            });

        dragLayer.selectAll<SVGGElement, NodeDatum>(".node")
            .data(graphNodes)
            .call(dragBehavior);

        const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
            .extent([[0, 0], [WIDTH, HEIGHT]])
            .scaleExtent([0.1, 10])
            .on("zoom", function (event) {
                zoomLayer.attr("transform", event.transform);
            });

        graph.call(zoomBehavior);
    }, [network]);

    const [graphNodes, graphEdges] = network.getGraphData();
    
    const nodes = graphNodes.map(node => <Node key={node.name} fileName={node.name} x={node.x} y={node.y} />);

    const links: LinkDatum[] = graphEdges.map(edge => ({
        source: graphNodes.find(node => node.name === edge.source)!,
        target: graphNodes.find(node => node.name === edge.target)!
    }));

    const edges = links.map(link => {
        const [x1, y1, x2, y2] = calculateLineEnds(link.source.x, link.source.y, link.target.x, link.target.y);
        return <Edge
            key={`${link.source.name}_${link.target.name}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            connections={network.connections.filter(conn =>
                (conn.startingConn.fileName === link.source.name && conn.acceptingConn.fileName === link.target.name) ||
                (conn.startingConn.fileName === link.target.name && conn.acceptingConn.fileName === link.source.name)
            )}
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
        <svg id="network_graph" width={WIDTH} height={HEIGHT} className="bg-white border border-gray-200 rounded-lg shadow-inner dark:bg-gray-700 dark:border-gray-700">
            <g className="zoom">
                {edges}
                <g className="drag" cursor="grab">
                    {nodes}
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
