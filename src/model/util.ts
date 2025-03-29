import { LogFileEvent } from "./LogFile";

export const BLOCK_SIZE: number = 30;

export function getShortName(eventName: string): string {
    return eventName.substring(eventName.lastIndexOf(":") + 1);
}

export function getShortNameWithoutAction(eventName: string): string {
    const noNamespace = getShortName(eventName);

    const index = Math.max(noNamespace.indexOf("_created"), noNamespace.indexOf("_parsed"));

    if (index > -1) {
        return noNamespace.substring(0, index);
    }

    return noNamespace;
}

export class Colors {
    normal: string;
    hover: string;

    constructor(normal: string, hover: string) {
        this.normal = normal;
        this.hover = hover;
    }
}

const SESSION_COLORS = new Colors("#003f5c", "#002f45");
const ANNOUNCE_COLORS = new Colors("#444e86", "#333a64");
const SUBSCRIBE_COLORS = new Colors("#955196", "#703d70");
const INFO_COLORS = new Colors("#ff6e54", "#fe2700");
const FETCH_COLORS = new Colors("#dd5182", "#bd255a");
const GROUP_COLORS = new Colors("#ffa600", "#bf7d00");
const OTHER_COLORS = new Colors("black", "black");

export function getColors(event: LogFileEvent): Colors {
    const name = event.name;

    if (name.includes("stream")) {
        return getColorsByName(event.data["stream_type"]);
    }
    else {
        return getColorsByName(name);
    }
}

function getColorsByName(name: string): Colors {
    if (name.includes("session")) {
        return SESSION_COLORS;
    }
    if (name.includes("announce")) {
        return ANNOUNCE_COLORS;
    }
    if (name.includes("subscription") || name.includes("subscribe")) {
        return SUBSCRIBE_COLORS;
    }
    if (name.includes("info")) {
        return INFO_COLORS;
    }
    if (name.includes("fetch")) {
        return FETCH_COLORS;
    }
    if (name.includes("group") || name.includes("frame")) {
        return GROUP_COLORS;
    }
    else {
        return OTHER_COLORS;
    }
}

export class ArrowProperties {
    lineStartX: number;
    lineEndX: number;
    arrowStartX: number;
    arrowStartY: number;
    arrowEndX: number;
    arrowEndY: number;
    m: number;
    q: number;
    lineOffset: number;
    arrowOffset: number;

    constructor(x1: number, y1: number, x2: number, y2: number, lineOffset: number = 8, arrowOffset: number = 15) {
        this.lineOffset = lineOffset;
        this.arrowOffset = arrowOffset;

        this.lineStartX = x1 < x2 ? x1 + BLOCK_SIZE : x1;
        this.lineEndX = x1 < x2 ? x2 : x2 + BLOCK_SIZE;
        
        // y = m * x + q
        this.m = (y2 - y1) / (this.lineEndX - this.lineStartX);
        this.q = y1 - this.m * this.lineStartX;
        
        this.arrowStartX = this.lineStartX < this.lineEndX ? this.lineStartX + lineOffset : this.lineStartX - lineOffset;
        this.arrowEndX = this.lineStartX < this.lineEndX ? this.lineEndX - arrowOffset : this.lineEndX + arrowOffset;
    
        this.arrowStartY = this.m * this.arrowStartX + this.q;
        this.arrowEndY = this.m * this.arrowEndX + this.q;
    }

    setLengthByPercentage(lengtPercentage: number, isCreatedEvent: boolean) {
        const [x, y] = this.getCoordsByPercentage(lengtPercentage, isCreatedEvent);

        if (isCreatedEvent) {
            this.arrowEndX = x;
            this.arrowEndY = y;
        }
        else {
            this.arrowStartX = x;
            this.arrowStartY = y;
        }
    }

    getMiddleCoords(): [number, number] {
        return [(this.arrowStartX + this.arrowEndX) / 2, (this.arrowStartY + this.arrowEndY) / 2];
    }

    getCoordsByPercentage(lengthPercentage: number, isCreatedEvent: boolean): [number, number] {
        const xLength = this.arrowEndX - this.arrowStartX;
        let x = 0;

        if (isCreatedEvent) {
            x = this.arrowStartX + lengthPercentage * xLength;
        }
        else {
            x = this.arrowEndX - lengthPercentage * xLength;
        }

        const y = this.m * x + this.q;

        return [x, y];
    }

    getIconCoords(isCreatedEvent: boolean): [number, number] {
        const iconOffset = 8 * (this.arrowStartX < this.arrowEndX ? 1 : -1)
        let x = 0;

        if (isCreatedEvent) {
            x = this.arrowEndX + iconOffset;
        }
        else {
            x = this.arrowStartX - iconOffset;
        }

        const y = this.m * x + this.q;

        return [x, y]
    }
}

export function radiansToDegrees(radians: number) {
    return radians * (180 / Math.PI);
}
