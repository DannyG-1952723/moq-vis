import { TICK_MARK_LENGTH } from "@/model/util";
import { useEffect, useRef } from "react";

interface TickLeftProps {
    value: number;
    position: number;
}

export default function TickLeft({ value, position }: TickLeftProps) {
    const textRef = useRef<SVGTextElement>(null);

    // Center text vertically
    useEffect(() => {
        if (!textRef.current) {
            return;
        }

        const boundingBox = textRef.current.getBBox();
        textRef.current.setAttribute("y", `${boundingBox.height / 4}px`);
    }, []);

    return (
        <g transform={`translate(0, ${position})`}>
            <line x1={-TICK_MARK_LENGTH / 2} x2={TICK_MARK_LENGTH / 2} stroke="black" />
            <text ref={textRef} className="font-mono text-[14px]" textAnchor="end" x={-5}>{value}</text>
        </g>
    );
}
