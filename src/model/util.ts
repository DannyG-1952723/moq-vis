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
