import * as d3 from "d3";
import { ConnectionType } from "@/model/Network";
import { RefObject, useEffect, useRef, useState } from "react";
import { useTextBackground } from "@/hooks/useTextBackground";

interface MarkProps {
    x: number;
    y: number;
    latency: number;
    timestamp: number;
    connectionType: ConnectionType;
    popupContainerRef: RefObject<SVGGElement | null>;
}

const QUIC_CLASS_NAME = "fill-green-700";
const MOQ_CLASS_NAME = "fill-blue-700";

const BACKGROUND_CLASS_NAME = "fill-white stroke-white";

const NORMAL_POPUP_CLASS_NAME = "hidden";
const HOVER_POPUP_CLASS_NAME = "block";

const NORMAL_RADIUS = 3;
const HOVER_RADIUS = 5;

const ANIMATION_DURATION = 100;

const TRIANGLE_OFFSET = 10;
const TRIANGLE_SIDE_LENGTH = 30;

const TRIANGLE_LEFT_X = -TRIANGLE_SIDE_LENGTH / 2 -5;
const TRIANGLE_TOP_Y = -(TRIANGLE_SIDE_LENGTH + TRIANGLE_OFFSET);
const TRIANGLE_RIGHT_X = TRIANGLE_SIDE_LENGTH / 2 + 5;
const TRIANGLE_BOTTOM_X = 0;
const TRIANGLE_BOTTOM_Y = -TRIANGLE_OFFSET;

const TEXT_OFFSET = -42;

export default function Mark({ x, y, latency, timestamp, connectionType, popupContainerRef }: MarkProps) {
    const [popupClassName, setPopupClassName] = useState(NORMAL_POPUP_CLASS_NAME);

    const circleRef = useRef<SVGCircleElement>(null);
    const popupRef = useRef<SVGGElement>(null);

    const [textRef, textBgRef] = useTextBackground([popupClassName]);

    useEffect(() => {
        if (!circleRef || !popupRef || !popupContainerRef) {
            return;
        }

        const circle = d3.select(circleRef.current);

        d3.select(circleRef.current)
            .on("mouseover", function(_) {
                circle
                    .transition()
                    .duration(ANIMATION_DURATION)
                    .attr("r", HOVER_RADIUS);
                
                setPopupClassName(HOVER_POPUP_CLASS_NAME);
                popupContainerRef.current!.appendChild(popupRef.current!);
            })
            .on("mouseout", function(_) {
                circle
                    .transition()
                    .duration(ANIMATION_DURATION)
                    .attr("r", NORMAL_RADIUS);

                setPopupClassName(NORMAL_POPUP_CLASS_NAME);
                popupContainerRef.current!.removeChild(popupRef.current!);
            });
    }, []);

    const className = connectionType === "quic" ? QUIC_CLASS_NAME : MOQ_CLASS_NAME;

    return (
        <>
            <circle ref={circleRef} className={className} cx={x} cy={y} r={NORMAL_RADIUS} />
            <g ref={popupRef} className={`popup ${popupClassName} drop-shadow-sm`} transform={`translate(${x}, ${y})`}>
                <polygon className={BACKGROUND_CLASS_NAME} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" points={`${TRIANGLE_LEFT_X},${TRIANGLE_TOP_Y} ${TRIANGLE_RIGHT_X},${TRIANGLE_TOP_Y} ${TRIANGLE_BOTTOM_X},${TRIANGLE_BOTTOM_Y}`} />
                <rect className={BACKGROUND_CLASS_NAME} ref={textBgRef} y={TEXT_OFFSET} rx={5} />
                <text ref={textRef} y={TEXT_OFFSET} textAnchor="middle" fontSize="0.75em">
                    <tspan x={0}>{`Time: ${timestamp / 1000} s`}</tspan>
                    <tspan x={0} dy="1.2em">{`Latency: ${latency} ms`}</tspan>
                </text>
            </g>
        </>
    );
}
