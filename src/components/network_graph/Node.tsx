import * as d3 from "d3";
import { useEffect, useRef } from "react";
import Server from "../icons/Server";

const ICON_SIZE: number = 64;
const POSITION: number = -ICON_SIZE / 2

interface NodeProps {
    fileName: string;
    x: number;
    y: number;
    onDrag: (dx: number, dy: number) => void;
}

export default function Node({ fileName, x, y, onDrag }: NodeProps) {
    const ref = useRef<SVGGElement>(null);

    useEffect(() => {
        const node = d3.select(ref.current!);

        const dragBehavior = d3.drag<SVGGElement, unknown>()
            .on("start", function (_) {
                node.raise().attr("cursor", "grabbing");
            })
            .on("drag", (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
                onDrag(event.dx, event.dy);
            })
            .on("end", function () {
                node.attr("cursor", "grab");
            });

        node.call(dragBehavior);
        node.attr("cursor", "grab");

        return () => {
            // Clean up listeners
            node.on(".drag", null);
        };
    }, [onDrag]);

    return (
        <g ref={ref} id={fileName} className="node" transform={`translate(${x}, ${y})`} width="auto" height="auto">
            <Server x={POSITION} y={POSITION} width={ICON_SIZE} height={ICON_SIZE} />
            <text y={ICON_SIZE / 2 + 10} textAnchor="middle">{fileName}</text>
        </g>
    );
}
