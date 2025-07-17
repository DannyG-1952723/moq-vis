import * as d3 from "d3";
import { useEffect, useRef } from "react";
import Server from "../icons/Server";
import { MoqRole } from "@/model/LogFile";
import Computer from "../icons/Computer";
import Laptop from "../icons/Laptop";
import Desktop from "../icons/Desktop";

const ICON_SIZE: number = 40;
const POSITION: number = -ICON_SIZE / 2;

const COLOR_CLASS: string = "fill-gray-700";

interface NodeProps {
    fileName: string;
    x: number;
    y: number;
    mainRole: MoqRole;
    onDrag: (dx: number, dy: number) => void;
}

export default function Node({ fileName, x, y, mainRole, onDrag }: NodeProps) {
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

    let icon = <Server x={POSITION} y={POSITION} width={ICON_SIZE} height={ICON_SIZE} className={COLOR_CLASS} />;

    if (mainRole === "publisher") {
        icon = <Computer x={POSITION} y={POSITION} width={ICON_SIZE} height={ICON_SIZE} className={COLOR_CLASS} />;
    }
    else if (mainRole === "subscriber") {
        icon = <Desktop x={POSITION} y={POSITION} width={ICON_SIZE} height={ICON_SIZE} className={COLOR_CLASS} />;
    }
    else if (mainRole === "pubsub") {
        icon = <Laptop x={POSITION} y={POSITION} width={ICON_SIZE} height={ICON_SIZE} className={COLOR_CLASS} />;
    }

    return (
        <g ref={ref} id={fileName} className="node" transform={`translate(${x}, ${y})`} width="auto" height="auto">
            {icon}
            <text y={ICON_SIZE / 2 + 15} textAnchor="middle" className={COLOR_CLASS}>{fileName}</text>
        </g>
    );
}
