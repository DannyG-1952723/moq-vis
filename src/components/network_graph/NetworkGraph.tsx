"use client";

import * as d3 from "d3";
import Note from "../Note";
import { LogFile } from "@/model/LogFile";
import { Network } from "@/model/Network";
import { HEIGHT, WIDTH } from "@/model/util";
import { useEffect } from "react";
import Node from "./Node";

interface NetworkGraphProps {
    files: LogFile[];
    activeFiles: LogFile[];
    network: Network;
}

export default function NetworkGraph({ files, activeFiles, network }: NetworkGraphProps) {
    useEffect(() => {
        const graph = d3.select<SVGSVGElement, unknown>("#network_graph");

        // Clear the graph
        graph.selectAll("*").remove();

        const g = graph.append<SVGGElement>("g").attr("cursor", "grab");

        const links: LinkDatum[] = data.links.map(l => ({
            source: data.nodes[l.source],
            target: data.nodes[l.target]
        }));

        const link = g.selectAll<SVGLineElement, LinkDatum>("line")
            .data(links)
            .join("line")
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y)
            .attr("stroke", "black");

        const dragBehavior = d3.drag<SVGCircleElement, NodeDatum>()
            .on("start", function (_) {
                d3.select(this).raise();
                g.attr("cursor", "grabbing");
            })
            .on("drag", function (event, d) {
                d.x += event.dx;
                d.y += event.dy;

                const node = d3.select<SVGCircleElement, NodeDatum>(this);
                node.attr("cx", d.x).attr("cy", d.y);

                link
                    .attr("x1", l => l.source.x)
                    .attr("y1", l => l.source.y)
                    .attr("x2", l => l.target.x)
                    .attr("y2", l => l.target.y);
            })
            .on("end", function () {
                g.attr("cursor", "grab");
            });

        g.selectAll<SVGCircleElement, NodeDatum>("circle")
            .data(data.nodes)
            .join("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 15)
            .attr("fill", "blue")
            .call(dragBehavior);

        const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
            .extent([[0, 0], [WIDTH, HEIGHT]])
            .scaleExtent([0.1, 10])
            .on("zoom", function (event) {
                g.attr("transform", event.transform);
            });

        graph.call(zoomBehavior);
    }, [network]);

    interface NodeDatum {
        name: string;
        x: number;
        y: number;
    }

    interface LinkDatum {
        source: NodeDatum;
        target: NodeDatum;
    }

    const data = {
        nodes: [
            { name: "A", x: 100, y: 100 },
            { name: "B", x: 140, y: 300 },
            { name: "C", x: 300, y: 300 },
            { name: "D", x: 300, y: 180 }
        ],
        links: [
            { source: 0, target: 1 },
            { source: 1, target: 2 },
            { source: 2, target: 3 }
        ]
    };

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
        <svg id="network_graph" width={WIDTH} height={HEIGHT} className="bg-white border border-gray-200 rounded-lg shadow-inner dark:bg-gray-700 dark:border-gray-700"></svg>
    );

    return (
        <>
            {title}
            {diagram}
        </>
    );
}
