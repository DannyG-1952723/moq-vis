import { InvalidEventError } from "@/errors/InvalidEventError";
import { equalArrays, equalNestedArrays, ProtocolEventData, RawInfo } from "./Events";

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

    corresponds(other: ProtocolEventData): boolean {
        if (other instanceof MoqEventData) {
            return this.payload.corresponds(other.payload);
        }
        
        return false;
    }

    // TODO: Update function when other MoQ events are added that might have different data
    getSummary(other: ProtocolEventData) {
        return this.payload;
    }
}

interface MoqEvent {
    corresponds(other: MoqEvent): boolean;
}

export class Stream implements MoqEvent {
    stream_type: StreamType;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("stream_type" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.stream_type = json["stream_type"];
    }

    corresponds(other: MoqEvent): boolean {
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

    corresponds(other: MoqEvent): boolean {
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

    corresponds(other: MoqEvent): boolean {
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

    corresponds(other: MoqEvent): boolean {
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

    corresponds(other: MoqEvent): boolean {
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

    corresponds(other: MoqEvent): boolean {
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

    corresponds(other: MoqEvent): boolean {
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

    corresponds(other: MoqEvent): boolean {
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

    corresponds(other: MoqEvent): boolean {
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

    corresponds(other: MoqEvent): boolean {
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

    corresponds(other: MoqEvent): boolean {
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

    corresponds(other: MoqEvent): boolean {
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

    corresponds(other: MoqEvent): boolean {
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

    corresponds(other: MoqEvent): boolean {
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

    corresponds(other: MoqEvent): boolean {
        if (other instanceof Frame) {
            return this.payload.corresponds(other.payload);
        }

        return false;
    }
}
