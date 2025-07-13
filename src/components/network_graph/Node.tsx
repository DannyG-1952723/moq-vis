import Server from "../icons/Server";

const ICON_SIZE: number = 64;
const POSITION: number = -ICON_SIZE / 2

interface NodeProps {
    fileName: string;
    x: number;
    y: number;
}

export default function Node({ fileName, x, y }: NodeProps) {
    return (
        <g key={fileName} id={fileName} className="node" transform={`translate(${x}, ${y})`} width="auto" height="auto">
            <Server x={POSITION} y={POSITION} width={ICON_SIZE} height={ICON_SIZE} />
            <text y={ICON_SIZE / 2 + 10} textAnchor="middle">{fileName}</text>
        </g>
    );
}
