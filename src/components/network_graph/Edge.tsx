import { ActionType, ConnectionAction, useConnectionsDispatch } from "@/contexts/ConnectionsContext";
import { Connection } from "@/model/Network";
import { useState } from "react";

const STROKE_WIDTH = 5;

interface EdgeProps {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    connections: Connection[];
}

const NORMAL_EDGE_CLASS_NAME = "stroke-gray-600";
const HOVER_EDGE_CLASS_NAME = "stroke-gray-800";
const NORMAL_CLICKED_EDGE_CLASS_NAME = "stroke-blue-600";
const HOVER_CLICKED_EDGE_CLASS_NAME = "stroke-blue-800";

export default function Edge({ x1, y1, x2, y2, connections }: EdgeProps) {
    const [selected, setSelected] = useState(false);
    const [edgeClass, setEdgeClass] = useState(NORMAL_EDGE_CLASS_NAME);

    const dispatch = useConnectionsDispatch();

    return <line onClick={_ => handleClick(!selected)} className={`edge cursor-pointer ${edgeClass}`} onMouseEnter={_ => handleMouseEnter(selected)} onMouseLeave={_ => handleMouseLeave(selected)} x1={x1} y1={y1} x2={x2} y2={y2} stroke="black" strokeWidth={STROKE_WIDTH} strokeLinecap="round" />;

    function handleClick(selected: boolean) {
        setSelected(selected);

        if (selected) {
            dispatch!(new ConnectionAction(ActionType.Add, connections));
            setEdgeClass(HOVER_CLICKED_EDGE_CLASS_NAME);
        }
        else {
            dispatch!(new ConnectionAction(ActionType.Delete, connections));
            setEdgeClass(HOVER_EDGE_CLASS_NAME);
        }
    }

    function handleMouseEnter(selected: boolean) {
        const className = selected ? HOVER_CLICKED_EDGE_CLASS_NAME : HOVER_EDGE_CLASS_NAME;
        setEdgeClass(className);
    }

    function handleMouseLeave(selected: boolean) {
        const className = selected ? NORMAL_CLICKED_EDGE_CLASS_NAME : NORMAL_EDGE_CLASS_NAME;
        setEdgeClass(className);
    }
}
