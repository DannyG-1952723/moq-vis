import { LogFileEvent } from "./Events";
import { MoqEventData, Stream } from "./moq";
import { ConnectionEvent } from "./Network";

export const WIDTH: number = 1280;
export const HEIGHT: number = 720;

export const BLOCK_SIZE: number = 30;

export const NORMAL_ARROW_CLASS_NAME = "stroke-gray-600";
export const HOVER_ARROW_CLASS_NAME = "stroke-gray-800";
export const NORMAL_ARROW_MARKER = "url(#arrow)";
export const HOVER_ARROW_MARKER = "url(#hover-arrow)";

export const TICK_MARK_LENGTH = 6;

export class Colors {
    normal: string;
    hover: string;
    transparentNormal: string;
    transparentHover: string;

    constructor(normal: string, hover: string, opacity: string) {
        this.normal = normal;
        this.hover = hover;
        this.transparentNormal = normal + opacity;
        this.transparentHover = hover + opacity;
    }
}

// Got darker versions of colors using https://mdigi.tools/darken-color/
const SESSION_COLORS = new Colors("#003f5c", "#002f45", "40");
const ANNOUNCE_COLORS = new Colors("#444e86", "#333a64", "40");
const SUBSCRIBE_COLORS = new Colors("#955196", "#703d70", "40");
const INFO_COLORS = new Colors("#ff6e54", "#fe2700", "40");
const FETCH_COLORS = new Colors("#dd5182", "#bd255a", "40");
const GROUP_COLORS = new Colors("#ffa600", "#bf7d00", "40");
export const OTHER_COLORS = new Colors("#2fc479", "#269d61", "40");

export function getColors(event: LogFileEvent): Colors {
    const name = event.name;

    if (event.data instanceof MoqEventData && event.data.payload instanceof Stream) {
        return getColorsByName(event.data.payload.stream_type);
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
        const iconOffset = 8 * (this.arrowStartX < this.arrowEndX ? 1 : -5.5);
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

export function groupBy<T, K extends PropertyKey>(
    array: T[],
    getKey: (item: T) => K
): Record<K, T[]> {
    return array.reduce((result, item) => {
        const key = getKey(item);
        (result[key] ||= []).push(item);
        return result;
    }, {} as Record<K, T[]>);
}

export function makeTimestampIter(events: ConnectionEvent[] | undefined): Iterator<[number, number]> {
    if (events === undefined) {
        events = [];
    }

    let nextIndex = 0;
    
    const timestampIter: Iterator<[number, number]> = {
        next(): IteratorResult<[number, number]> {
            if (nextIndex < events.length) {
                const result: IteratorResult<[number, number]> = { value: [events[nextIndex].event.time, nextIndex], done: false };
                nextIndex++;

                return result;
            }

            return { value: [NaN, NaN], done: true };
        }
    };

    return timestampIter;
}

export function getMinTimestampIndex(timestamps: number[], prevIndices: number[]): number {
    let min = Infinity;
    let minIndex = -1;

    for (let i = 0; i < timestamps.length; i++) {
        if (timestamps[i] < min) {
            min = timestamps[i];
            minIndex = i;
        }
        else if (timestamps[i] === min && prevIndices.includes(minIndex)) {
            minIndex = i;
        }
    }

    return minIndex;
}
