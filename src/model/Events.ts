// TODO: Fix error handling
// TODO: Fix serialization of some classes (like MoqEventData)

import { InvalidFileError } from "@/errors/InvalidFileError";
import { stringToTimeFormat, TimeFormat } from "./LogFile";
import { InvalidEventError } from "@/errors/InvalidEventError";

export class LogFileEvent {
    // TODO: Maybe change due to how numbers in JS work
    time: number;
    name: string;
    data: ProtocolEventData;
    path?: string;
    time_format?: TimeFormat;
    protocol_types?: string[];
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
        this.protocol_types = json["protocol_types"];
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
        if (this.name.startsWith("moq")) {
            return new MoqEventData(eventName, json, fileName)
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

interface ProtocolEventData {
    equals(other: ProtocolEventData): boolean;
}

export class MoqEventData implements ProtocolEventData {
    payload: MoqEvent;

    constructor(eventName: string, json: any, fileName: string) {
        if (eventName.startsWith("stream")) {
            this.payload = new Stream(eventName, json, fileName);
        }
        else if (eventName.startsWith("session_started")) {
            if (!("selected_version" in json)) {
                this.payload = new SessionClient(eventName, json, fileName);
            }
            else {
                this.payload = new SessionServer(eventName, json, fileName);
            }
        }
        else if (eventName.startsWith("session_update")) {
            this.payload = new SessionUpdate(eventName, json, fileName);
        }
        else if (eventName.startsWith("announce_please")) {
            this.payload = new AnnouncePlease(eventName, json, fileName);
        }
        else if (eventName.startsWith("announce")) {
            this.payload = new Announce(eventName, json, fileName);
        }
        else if (eventName.startsWith("subscription_started")) {
            this.payload = new Subscribe(eventName, json, fileName);
        }
        else if (eventName.startsWith("subscription_update")) {
            this.payload = new SubscribeUpdate(eventName, json, fileName);
        }
        else if (eventName.startsWith("subscription_gap")) {
            this.payload = new SubscribeGap(eventName, json, fileName);
        }
        else if (eventName.startsWith("info_please")) {
            this.payload = new InfoPlease(eventName, json, fileName);
        }
        else if (eventName.startsWith("info")) {
            this.payload = new Info(eventName, json, fileName);
        }
        else if (eventName.startsWith("fetch_update")) {
            this.payload = new FetchUpdate(eventName, json, fileName);
        }
        else if (eventName.startsWith("fetch")) {
            this.payload = new Fetch(eventName, json, fileName);
        }
        else if (eventName.startsWith("group")) {
            this.payload = new Group(eventName, json, fileName);
        }
        else if (eventName.startsWith("frame")) {
            this.payload = new Frame(eventName, json, fileName);
        }
        else {
            throw new InvalidEventError(eventName, json, fileName);
        }
    }

    equals(other: ProtocolEventData): boolean {
        if (other instanceof MoqEventData) {
            return this.payload.equals(other.payload);
        }
        
        return false;
    }
}

interface MoqEvent {
    equals(other: MoqEvent): boolean;
}

export class Stream implements MoqEvent {
    stream_type: StreamType;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("stream_type" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.stream_type = json["stream_type"];
    }

    equals(other: MoqEvent): boolean {
        if (other instanceof Stream) {
            return this.stream_type === other.stream_type;
        }

        return false;
    }
}
      
type StreamType = "session" | "announced" | "subscribe" | "fetch" | "info" | "group";

class SessionClient implements MoqEvent {
    supported_versions: number[];
    extension_ids: number[];
    tracing_id: number;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("supported_versions" in json) || !("extension_ids" in json) || !("tracing_id" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.supported_versions = json["supported_versions"];
        this.extension_ids = json["extension_ids"];
        this.tracing_id = json["tracing_id"];
    }

    equals(other: MoqEvent): boolean {
        if (other instanceof SessionClient) {
            return equalArrays(this.supported_versions, other.supported_versions) && equalArrays(this.extension_ids, other.extension_ids) && this.tracing_id === other.tracing_id;
        }

        return false;
    }
}

class SessionServer implements MoqEvent {
    selected_version: number;
    extension_ids: number[];

    constructor(eventName: string, json: any, fileName: string) {
        if (!("selected_version" in json) || !("extension_ids" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.selected_version = json["selected_version"];
        this.extension_ids = json["extension_ids"];
    }

    equals(other: MoqEvent): boolean {
        if (other instanceof SessionServer) {
            return this.selected_version === other.selected_version && equalArrays(this.extension_ids, other.extension_ids);
        }

        return false;
    }
}

class SessionUpdate implements MoqEvent {
    session_bitrate: number;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("session_bitrate" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.session_bitrate = json["session_bitrate"];
    }

    equals(other: MoqEvent): boolean {
        if (other instanceof SessionUpdate) {
            return this.session_bitrate === other.session_bitrate;
        }

        return false;
    }
}

class AnnouncePlease implements MoqEvent {
    track_prefix_parts: string[];

    constructor(eventName: string, json: any, fileName: string) {
        if (!("track_prefix_parts" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.track_prefix_parts = json["track_prefix_parts"];
    }

    equals(other: MoqEvent): boolean {
        if (other instanceof AnnouncePlease) {
            return equalArrays(this.track_prefix_parts, other.track_prefix_parts);
        }

        return false;
    }
}
  
class Announce implements MoqEvent {
    announce_status: AnnounceStatus;
    track_suffix_parts: string[][];

    constructor(eventName: string, json: any, fileName: string) {
        if (!("announce_status" in json) || !("track_suffix_parts" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.announce_status = json["announce_status"];
        this.track_suffix_parts = json["track_suffix_parts"];
    }

    equals(other: MoqEvent): boolean {
        if (other instanceof Announce) {
            return this.announce_status === other.announce_status && equalNestedArrays(this.track_suffix_parts, other.track_suffix_parts);
        }

        return false;
    }
}
  
type AnnounceStatus = "ended" | "active" | "live";

class Subscribe implements MoqEvent {
    subscribe_id: number;
    track_path_parts: string[];
    track_priority: number;
    group_order: number;
    group_min: number;
    group_max: number;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("subscribe_id" in json) || !("track_path_parts" in json) || !("track_priority" in json) || !("group_order" in json) || !("group_min" in json) || !("group_max" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.subscribe_id = json["subscribe_id"];
        this.track_path_parts = json["track_path_parts"];
        this.track_priority = json["track_priority"];
        this.group_order = json["group_order"];
        this.group_min = json["group_min"];
        this.group_max = json["group_max"];
    }

    equals(other: MoqEvent): boolean {
        if (other instanceof Subscribe) {
            return this.subscribe_id === other.subscribe_id && equalArrays(this.track_path_parts, other.track_path_parts) && this.track_priority === other.track_priority && this.group_order == other.group_order && this.group_min == other.group_min && this.group_max == other.group_max;
        }

        return false;
    }
}

class SubscribeUpdate implements MoqEvent {
    track_priority: number;
    group_order: number;
    group_min: number;
    group_max: number;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("track_priority" in json) || !("group_order" in json) || !("group_min" in json) || !("group_max" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.track_priority = json["track_priority"];
        this.group_order = json["group_order"];
        this.group_min = json["group_min"];
        this.group_max = json["group_max"];
    }

    equals(other: MoqEvent): boolean {
        if (other instanceof SubscribeUpdate) {
            return this.track_priority === other.track_priority && this.group_order == other.group_order && this.group_min == other.group_min && this.group_max == other.group_max;
        }

        return false;
    }
}

class SubscribeGap implements MoqEvent {
    group_start: number;
    group_count: number;
    group_error_code: number;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("group_start" in json) || !("group_count" in json) || !("group_error_code" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.group_start = json["group_start"];
        this.group_count = json["group_count"];
        this.group_error_code = json["group_error_code"];
    }

    equals(other: MoqEvent): boolean {
        if (other instanceof SubscribeGap) {
            return this.group_start === other.group_start && this.group_count == other.group_count && this.group_error_code == other.group_error_code;
        }

        return false;
    }
}

class Info implements MoqEvent {
    track_priority: number;
    group_latest: number;
    group_order: number;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("track_priority" in json) || !("group_latest" in json) || !("group_order" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.track_priority = json["track_priority"];
        this.group_latest = json["group_latest"];
        this.group_order = json["group_order"];
    }

    equals(other: MoqEvent): boolean {
        if (other instanceof Info) {
            return this.track_priority === other.track_priority && this.group_latest == other.group_latest && this.group_order == other.group_order;
        }

        return false;
    }
}

class InfoPlease implements MoqEvent {
    track_path_parts: string[];

    constructor(eventName: string, json: any, fileName: string) {
        if (!("track_path_parts" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.track_path_parts = json["track_path_parts"];
    }

    equals(other: MoqEvent): boolean {
        if (other instanceof InfoPlease) {
            return equalArrays(this.track_path_parts, other.track_path_parts);
        }

        return false;
    }
}

class Fetch implements MoqEvent {
    track_path_parts: string[];
    track_priority: number;
    group_sequence: number;
    frame_sequence: number;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("track_path_parts" in json) || !("track_priority" in json) || !("group_sequence" in json) || !("frame_sequence" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.track_path_parts = json["track_path_parts"];
        this.track_priority = json["track_priority"];
        this.group_sequence = json["group_sequence"];
        this.frame_sequence = json["frame_sequence"];
    }

    equals(other: MoqEvent): boolean {
        if (other instanceof Fetch) {
            return equalArrays(this.track_path_parts, other.track_path_parts) && this.track_priority === other.track_priority && this.group_sequence === other.group_sequence && this.frame_sequence === other.frame_sequence;
        }

        return false;
    }
}

class FetchUpdate implements MoqEvent {
    track_priority: number;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("track_priority" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.track_priority = json["track_priority"];
    }

    equals(other: MoqEvent): boolean {
        if (other instanceof FetchUpdate) {
            return this.track_priority === other.track_priority;
        }

        return false;
    }
}

class Group implements MoqEvent {
    subscribe_id: number;
    group_sequence: number;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("subscribe_id" in json) || !("group_sequence" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.subscribe_id = json["subscribe_id"];
        this.group_sequence = json["group_sequence"];
    }

    equals(other: MoqEvent): boolean {
        if (other instanceof Group) {
            return this.subscribe_id === other.subscribe_id && this.group_sequence === other.group_sequence;
        }

        return false;
    }
}

class Frame implements MoqEvent {
    payload: RawInfo;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("payload" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.payload = new RawInfo(json["payload"]);
    }

    equals(other: MoqEvent): boolean {
        if (other instanceof Frame) {
            return this.payload.equals(other.payload);
        }

        return false;
    }
}

class RawInfo {
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

function equalArrays(array1: string[] | number[], array2: string[] | number[]): boolean {
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

function equalNestedArrays(array1: string[][], array2: string[][]) {
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
