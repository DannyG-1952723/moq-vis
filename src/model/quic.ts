import { InvalidEventError } from "@/errors/InvalidEventError";
import { ProtocolEventData } from "./Events";

export class QuicEventData implements ProtocolEventData {
    payload: QuicEvent;

    // TODO: Implement the rest of the QUIC events
    constructor(eventName: string, json: any, fileName: string) {
        if (eventName.startsWith("stream_state_updated")) {
            this.payload = new StreamStateUpdated(eventName,  json, fileName);
        }
        // else if (eventName.startsWith("")) {
        //     this.payload = new 
        // }
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
