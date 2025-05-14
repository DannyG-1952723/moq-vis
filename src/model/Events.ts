// TODO: Fix error handling
// TODO: Fix serialization of some classes (like MoqEventData)

import { InvalidFileError } from "@/errors/InvalidFileError";
import { stringToTimeFormat, TimeFormat } from "./LogFile";
import { InvalidEventError } from "@/errors/InvalidEventError";
import { MoqEventData } from "./moq";
import { QuicEventData } from "./quic";

export class LogFileEvent {
    // TODO: Maybe change due to how numbers in JS work
    time: number;
    name: string;
    data: ProtocolEventData;
    path?: string;
    time_format?: TimeFormat;
    group_id?: string;
    system_information?: SystemInformation;
    // TODO: Maybe replace 'any'
    custom_fields?: any;

    constructor(json: any, fileName: string) {
        if (!("time" in json) || !("name" in json)) {
            throw new InvalidFileError(fileName);
        }

        // TODO: Add error handling
        this.time = parseInt(json["time"]);
        this.name = json["name"];
        this.data = this.parseProtocolEventData(this.getShortName(), json["data"], fileName);
        this.path = json["path"];
        this.group_id = json["group_id"];
        this.custom_fields = json["custom_fields"];

        if ("time_format" in json && typeof json["time_format"] === "string") {
            this.time_format = stringToTimeFormat(json["time_format"], fileName);
        }

        if ("system_information" in json) {
            this.system_information = new SystemInformation(json["system_information"], fileName);
        }
    }

    parseProtocolEventData(eventName: string, json: any, fileName: string): ProtocolEventData {
        // TODO: Add other protocols here
        if (this.name.startsWith("moq-transfork")) {
            return new MoqEventData(eventName, json, fileName);
        }
        else if (this.name.startsWith("quic")) {
            return new QuicEventData(eventName, json, fileName);
        }
        else {
            throw new InvalidEventError(eventName, json, fileName);
        }
    }

    dataEquals(other: LogFileEvent): boolean {
        return this.data.equals(other.data);
    }

    getShortName(): string {
        return this.name.substring(this.name.lastIndexOf(":") + 1);
    }
    
    getShortNameWithoutAction(): string {
        const noNamespace = this.getShortName();
    
        const index = Math.max(noNamespace.indexOf("_created"), noNamespace.indexOf("_parsed"));
    
        if (index > -1) {
            return noNamespace.substring(0, index);
        }
    
        return noNamespace;
    }
}

export interface ProtocolEventData {
    equals(other: ProtocolEventData): boolean;
}

export class RawInfo {
    length?: number;
    payload_length?: number;
    data?: HexString;

    constructor(json: any) {
        this.length = json["length"];
        this.payload_length = json["payload_length"];
        this.data = json["data"];
    }

    // Assumes fields are equal when one or both of them are missing
    equals(other: RawInfo): boolean {
        let lengthEquals = true;
        let payloadLengthEquals = true;
        let dataEquals = true;

        if (this.length && other.length) {
            lengthEquals = this.length === other.length;
        }

        if (this.payload_length && other.payload_length) {
            payloadLengthEquals = this.payload_length === other.payload_length;
        }

        if (this.data && other.data) {
            dataEquals = this.data === other.data;
        }

        return lengthEquals && payloadLengthEquals && dataEquals;
    }
}

type HexString = string;

class SystemInformation {
    processorId: number | undefined;
    processId: number | undefined;
    threadId: number | undefined;

    constructor(json: any, fileName: string) {
        // TODO: Add error handling
        this.processorId = parseInt(json["processor_id"]);
        this.processId = parseInt(json["process_id"]);
        this.threadId = parseInt(json["thread_id"]);
    }
}

export class MessageEvent {
    time_sent: number;
    time_received: number;
    name: string;
    // TODO: Maybe change
    data: any;
    group_id: string | undefined;

    constructor(createdEvent: LogFileEvent, parsedEvent: LogFileEvent) {
        this.time_sent = createdEvent.time;
        this.time_received = parsedEvent.time;

        this.name = `${createdEvent.name} / ${parsedEvent.name}`;

        // Both events should have the same data
        this.data = createdEvent.data;
        this.group_id = createdEvent.group_id;
    }
}

export function equalArrays(array1: string[] | number[], array2: string[] | number[]): boolean {
    if (array1.length !== array2.length) {
        return false;
    }
    
    for (let i = 0; i < array1.length; i++) {
        if (array1[i] !== array2[i]) {
            return false;
        }
    }
    
    return true;
}

export function equalNestedArrays(array1: string[][], array2: string[][]) {
    if (array1.length !== array2.length) {
        return false;
    }
    
    for (let i = 0; i < array1.length; i++) {
        if (!equalArrays(array1[i], array2[i])) {
            return false;
        }
    }
    
    return true;
}
