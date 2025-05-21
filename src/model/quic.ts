import { InvalidEventError } from "@/errors/InvalidEventError";
import { equalArrays, ProtocolEventData } from "./Events";

export class QuicEventData implements ProtocolEventData {
    payload: QuicEvent;

    // TODO: Implement the rest of the QUIC events
    constructor(eventName: string, json: any, fileName: string) {
        if (eventName.startsWith("stream_state_updated")) {
            this.payload = new StreamStateUpdated(eventName,  json, fileName);
        }
        else if (eventName.startsWith("connection_started")) {
            this.payload = new ConnectionStarted(eventName, json, fileName);
        }
        else {
            throw new InvalidEventError(eventName, json, fileName);
        }
    }

    corresponds(other: ProtocolEventData): boolean {
        if (other instanceof QuicEventData) {
            return this.payload.corresponds(other.payload);
        }

        return false;
    }
}

interface QuicEvent {
    corresponds(other: QuicEvent): boolean;
}

export class ServerListening implements QuicEvent {
    ip_v4?: IpAddress;
    port_v4?: number;
    ip_v6?: IpAddress;
    port_v6?: number;
    retry_required?: boolean;

    constructor(eventName: string, json: any, fileName: string) {
        if ("ip_v4" in json) {
            this.ip_v4 = json["ip_v4"];
        }

        if ("port_v4" in json) {
            this.port_v4 = json["port_v4"];
        }

        if ("ip_v6" in json) {
            this.ip_v6 = json["ip_v6"];
        }

        if ("port_v6" in json) {
            this.port_v6 = json["port_v6"];
        }

        if ("retry_required" in json) {
            this.retry_required = json["retry_required"] === "true";
        }
    }

    // TODO: Implement
    corresponds(other: QuicEvent): boolean {
        throw new Error("Method not implemented.");
    }
}

type IpAddress = string;

export class ConnectionStarted implements QuicEvent {
    local: PathEndpointInfo;
    remote: PathEndpointInfo;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("local" in json) || !("remote" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.local = new PathEndpointInfo("connection_started", json["local"], fileName);
        this.remote = new PathEndpointInfo("connection_started", json["remote"], fileName);
    }

    // There should only be one connection_started event on both sides within the same connection
    // Comparing the local and remote info won't work since this information isn't complete (can't get the local port and can't get the local address of the client in Quinn)
    corresponds(other: QuicEvent): boolean {
        if (other instanceof ConnectionStarted) {
            return true;
            // return this.local.equals(other.remote) && this.remote.equals(other.local);
        }

        return false;
    }
}

class PathEndpointInfo {
    ip_v4?: IpAddress;
    port_v4?: number;
    ip_v6?: IpAddress;
    port_v6?: number;
    connection_ids: ConnectionId[];

    constructor(eventName: string, json: any, fileName: string) {
        if (!("connection_ids" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.connection_ids = json["connection_ids"];

        if ("ip_v4" in json) {
            this.ip_v4 = json["ip_v4"];
        }

        if ("port_v4" in json) {
            this.port_v4 = json["port_v4"];
        }

        if ("ip_v6" in json) {
            this.ip_v6 = json["ip_v6"];
        }

        if ("port_v6" in json) {
            this.port_v6 = json["port_v6"];
        }
    }

    equals(other: PathEndpointInfo): boolean {
        return this.ip_v4 === other.ip_v4 && this.port_v4 === other.port_v4 && this.ip_v6 === other.ip_v6 && this.port_v6 === other.port_v6 && equalArrays(this.connection_ids, other.connection_ids);
    }
}

type ConnectionId = string;

export class StreamStateUpdated implements QuicEvent {
    stream_id: number;
    stream_type?: StreamType;
    old?: StreamState;
    new: StreamState;
    stream_side?: StreamSide;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("stream_id" in json) || !("new" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.stream_id = json["stream_id"];
        this.new = json["new"];

        if ("stream_type" in json) {
            this.stream_type = json["stream_type"];
        }

        if ("old" in json) {
            this.old = json["old"];
        }

        if ("stream_side" in json) {
            this.stream_side = json["stream_side"];
        }
    }

    corresponds(other: QuicEvent): boolean {
        if (other instanceof StreamStateUpdated) {
            return this.stream_id === other.stream_id && this.stream_type === other.stream_type && this.old === other.old && this.new === other.new && this.stream_side !== other.stream_side;
        }

        return false;
    }
}

type StreamType = "unidirectional" | "bidirectional";

// TODO: Maybe change (split into BaseStreamState and GranularStreamState like in qlog-rs)
type StreamState = "idle" | "open" | "closed" | "half_closed_local" | "half_closed_remote" | "ready" | "send" | "data_sent" | "reset_sent" | "reset_received" | "receive" | "size_known" | "data_read" | "reset_read" | "data_received" | "destroyed";

type StreamSide = "sending" | "receiving";
