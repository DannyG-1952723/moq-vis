import { InvalidEventError } from "@/errors/InvalidEventError";
import { equalArrays, equalNestedArrays, ProtocolEventData, RawInfo } from "./Events";

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
        else if (eventName.startsWith("packet_sent")) {
            this.payload = new PacketSent(eventName, json, fileName);
        }
        else if (eventName.startsWith("packet_received")) {
            this.payload = new PacketReceived(eventName, json, fileName);
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

    // Assumes 'this' is createdData
    getSummary(parsedData: ProtocolEventData) {
        if (parsedData instanceof QuicEventData) {
            return this.payload.getSummary(parsedData.payload);
        }

        // Should not be reached
        return null;
    }
}

interface QuicEvent {
    corresponds(other: QuicEvent): boolean;
    getSummary(parsedEvent: QuicEvent): any;
}

export class ServerListening implements QuicEvent {
    ip_v4?: IpAddress;
    port_v4?: number;
    ip_v6?: IpAddress;
    port_v6?: number;
    retry_required?: boolean;

    constructor(json: any) {
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

    // TODO: Implement
    getSummary(parsedEvent: QuicEvent) {
        return this;
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

        this.local = new PathEndpointInfo(eventName, json["local"], fileName);
        this.remote = new PathEndpointInfo(eventName, json["remote"], fileName);
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
    
    getSummary(parsedEvent: QuicEvent) {
        if (parsedEvent instanceof ConnectionStarted) {
            return {
                // Remote has more info than local, so combine the remotes of both
                peer_1: parsedEvent.remote,
                peer_2: this.remote
            }
        }
        
        // Should not be reached
        return null;
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

    getSummary(parsedEvent: QuicEvent) {
        if (parsedEvent instanceof StreamStateUpdated) {
            return {
                stream_id: this.stream_id,
                stream_type: this.stream_type,
                old: this.old,
                new: this.new
            }
        }
        
        // Should not be reached
        return null;
    }
}

type StreamType = "unidirectional" | "bidirectional";

// TODO: Maybe change (split into BaseStreamState and GranularStreamState like in qlog-rs)
type StreamState = "idle" | "open" | "closed" | "half_closed_local" | "half_closed_remote" | "ready" | "send" | "data_sent" | "reset_sent" | "reset_received" | "receive" | "size_known" | "data_read" | "reset_read" | "data_received" | "destroyed";

type StreamSide = "sending" | "receiving";

type PacketSentTrigger = "retransmit_reordered" | "retransmit_timeout" | "pto_probe" | "retransmit_crypto" | "cc_bandwidth_probe";

export class PacketSent implements QuicEvent {
    header: PacketHeader;
    frames?: QuicFrame[];
    stateless_reset_token?: StatelessResetToken;
    supported_versions?: QuicVersion[];
    raw?: RawInfo;
    datagram_id?: number;
    is_mtu_probe_packet?: boolean;
    trigger?: PacketSentTrigger;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("header" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.header = new PacketHeader("packet_sent", json["header"], fileName);

        if ("frames" in json) {
            this.frames = [];

            const frames = json["frames"];

            for (let i = 0; i < frames.length; i++) {
                this.frames.push(jsonToFrame(eventName, frames[i], fileName));
            }
        }

        if ("stateless_reset_token" in json) {
            this.stateless_reset_token = json["stateless_reset_token"];
        }

        if ("supported_versions" in json) {
            this.supported_versions = json["supported_versions"];
        }

        if ("raw" in json) {
            this.raw = json["raw"];
        }

        if ("datagram_id" in json) {
            this.datagram_id = json["datagram_id"];
        }

        if ("is_mtu_probe_packet" in json) {
            this.is_mtu_probe_packet = json["is_mtu_probe_packet"];
        }

        if ("trigger" in json) {
            this.trigger = json["trigger"];
        }
    }

    corresponds(other: QuicEvent): boolean {
        if (other instanceof PacketReceived) {
            const samePacket = this.header.packet_type === other.header.packet_type && this.header.packet_number === other.header.packet_number;

            if (samePacket) {
                const sameHeader = this.header.equals(other.header);
                const sameFrames = this.sameFrames(other.frames);
                const sameStatelessResetToken = this.stateless_reset_token === other.stateless_reset_token;
                const sameSupportedVersions = this.supported_versions === other.supported_versions;
                const sameDatagramId = this.datagram_id === other.datagram_id;

                let sameData = false;

                if (this.raw === undefined) {
                    sameData = sameHeader && sameFrames && sameStatelessResetToken && sameSupportedVersions && other.raw === undefined && sameDatagramId;
                }
                else {
                    sameData = sameHeader && sameFrames && sameStatelessResetToken && sameSupportedVersions && this.raw.equals(other.raw) && sameDatagramId;
                }

                if (!sameData) {
                    console.error(`Packet type and number are the same, but data is different for packet ${this.header.packet_type}:${this.header.packet_number}`);
                }

                return sameData;
            }
            else {
                return false;
            }
        }

        return false;
    }
    
    getSummary(parsedEvent: QuicEvent) {
        if (parsedEvent instanceof PacketReceived) {
            return {
                header: this.header,
                frames: this.frames,
                stateless_reset_token: this.stateless_reset_token,
                supported_versions: this.supported_versions,
                raw: this.raw,
                datagram_id: this.datagram_id,
                is_mtu_probe_packet: this.is_mtu_probe_packet,
                packet_sent_trigger: this.trigger,
                packet_received_trigger: parsedEvent.trigger
            }
        }
        
        // Should not be reached
        return null;
    }

    sameFrames(other: QuicFrame[] | undefined): boolean {
        if (this.frames === undefined && other === undefined) {
            return true;
        }
        else if ((this.frames !== undefined && other === undefined) || (this.frames === undefined && other !== undefined)) {
            return false;
        }

        if (this.frames!.length !== other!.length) {
            return false;
        }

        for (let i = 0; i < this.frames!.length; i++) {
            if (!this.frames![i].equals(other![i])) {
                return false;
            }
        }

        return true;
    }
}

type PacketReceivedTrigger = "keys_available";

export class PacketReceived implements QuicEvent {
    header: PacketHeader;
    frames?: QuicFrame[];
    stateless_reset_token?: StatelessResetToken;
    supported_versions?: QuicVersion[];
    raw?: RawInfo;
    datagram_id?: number;
    trigger?: PacketReceivedTrigger;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("header" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.header = new PacketHeader("packet_received", json["header"], fileName);

        if ("frames" in json) {
            this.frames = [];

            const frames = json["frames"];

            for (let i = 0; i < frames.length; i++) {
                this.frames.push(jsonToFrame(eventName, frames[i], fileName));
            }
        }

        if ("stateless_reset_token" in json) {
            this.stateless_reset_token = json["stateless_reset_token"];
        }

        if ("supported_versions" in json) {
            this.supported_versions = json["supported_versions"];
        }

        if ("raw" in json) {
            this.raw = json["raw"];
        }

        if ("datagram_id" in json) {
            this.datagram_id = json["datagram_id"];
        }

        if ("trigger" in json) {
            this.trigger = json["trigger"];
        }
    }

    corresponds(other: QuicEvent): boolean {
        if (other instanceof PacketSent) {
            const samePacket = this.header.packet_type === other.header.packet_type && this.header.packet_number === other.header.packet_number;

            if (samePacket) {
                const sameHeader = this.header.equals(other.header);
                const sameFrames = this.sameFrames(other.frames);
                const sameStatelessResetToken = this.stateless_reset_token === other.stateless_reset_token;
                const sameSupportedVersions = this.supported_versions === other.supported_versions;
                const sameDatagramId = this.datagram_id === other.datagram_id;

                let sameData = false;

                if (this.raw === undefined) {
                    sameData = sameHeader && sameFrames && sameStatelessResetToken && sameSupportedVersions && other.raw === undefined && sameDatagramId;
                }
                else {
                    sameData = sameHeader && sameFrames && sameStatelessResetToken && sameSupportedVersions && this.raw.equals(other.raw) && sameDatagramId;
                }

                if (!sameData) {
                    console.error(`Packet type and number are the same, but data is different for packet ${this.header.packet_type}:${this.header.packet_number}`);
                }

                return sameData;
            }
            else {
                return false;
            }
        }

        return false;
    }
    
    getSummary(parsedEvent: QuicEvent) {
        if (parsedEvent instanceof PacketSent) {
            return parsedEvent.getSummary(this);
        }
        
        // Should not be reached
        return null;
    }

    sameFrames(other: QuicFrame[] | undefined): boolean {
        if (this.frames === undefined && other === undefined) {
            return true;
        }
        else if ((this.frames !== undefined && other === undefined) || (this.frames === undefined && other !== undefined)) {
            return false;
        }

        if (this.frames!.length !== other!.length) {
            return false;
        }

        for (let i = 0; i < this.frames!.length; i++) {
            if (!this.frames![i].equals(other![i])) {
                return false;
            }
        }

        return true;
    }
}

class PacketHeader {
    quic_bit: boolean;
    packet_type: PacketType;
    packet_type_bytes?: number;
    packet_number?: number;
    flags?: number;
    token?: Token;
    length?: number;
    version?: QuicVersion;
    scil?: number;
    dcil?: number;
    scid?: ConnectionId;
    dcid?: ConnectionId;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("quic_bit" in json) || !("packet_type" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.quic_bit = json["quic_bit"];
        this.packet_type = json["packet_type"];

        if ("packet_type_bytes" in json) {
            this.packet_type_bytes = json["packet_type_bytes"];
        }

        if ("packet_number" in json) {
            this.packet_number = json["packet_number"];
        }

        if ("flags" in json) {
            this.flags = json["flags"];
        }

        if ("token" in json) {
            this.token = new Token(json["token"]);
        }

        if ("length" in json) {
            this.length = json["length"];
        }

        if ("version" in json) {
            this.version = json["version"];
        }

        if ("scil" in json) {
            this.scil = json["scil"];
        }

        if ("dcil" in json) {
            this.dcil = json["dcil"];
        }

        if ("scid" in json) {
            this.scid = json["scid"];
        }

        if ("dcid" in json) {
            this.dcid = json["dcid"];
        }
    }

    equals(other: PacketHeader): boolean {
        const sameQuicBit = this.quic_bit === other.quic_bit;
        const samePacketType = this.packet_type === other.packet_type;
        const samePacketTypeBytes = this.packet_type_bytes === other.packet_type_bytes;
        const samePacketNumber = this.packet_number === other.packet_number;
        const sameFlags = this.flags === other.flags;
        const sameLength = this.length === other.length;
        const sameVersion = this.version === other.version;
        const sameScil = this.scil === other.scil;
        const sameDcil = this.dcil === other.dcil;
        const sameScid = this.scid === other.scid;
        const sameDcid = this.dcid === other.dcid;

        if (this.token === undefined) {
            return sameQuicBit && samePacketType && samePacketTypeBytes && samePacketNumber && sameFlags && other.token === undefined && sameLength && sameVersion && sameScil && sameDcil && sameScid && sameDcid;
        }

        return sameQuicBit && samePacketType && samePacketTypeBytes && samePacketNumber && sameFlags && this.token.equals(other.token) && sameLength && sameVersion && sameScil && sameDcil && sameScid && sameDcid;
    }
}

type PacketType = "initial" | "handshake" | "0RTT" | "1RTT" | "retry" | "version_negotiation" | "stateless_reset" | "unknown";

type QuicVersion = string;

class Token {
    type?: TokenType;
    details: any;
    raw?: RawInfo;

    constructor(json: any) {
        if ("type" in json) {
            this.type = json["type"];
        }

        if ("details" in json) {
            this.details = json["details"];
        }

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: Token | undefined): boolean {
        if (other === undefined) {
            return false;
        }

        const sameType = this.type === other.type;
        const sameDetails = this.details === other.details;

        if (this.raw === undefined) {
            return sameType && sameDetails && other.raw === undefined;
        }

        return sameType && sameDetails && this.raw.equals(other.raw);
    }
}

type TokenType = "retry" | "resumption"

type StatelessResetToken = string;

interface QuicFrame {
    equals(other: QuicFrame): boolean;
}

type FrameType = "padding" | "ping" | "ack" | "reset_stream" | "stop_sending" | "crypto" | "new_token" | "stream" | "max_data" | "max_stream_data" | "max_streams" | "data_blocked" | "stream_data_blocked" | "streams_blocked" | "new_connection_id" | "retire_connection_id" | "path_challenge" | "path_response" | "connection_close" | "handshake_done" | "unknown" | "datagram";

class PaddingFrame implements QuicFrame {
    frame_type: FrameType;
    raw?: RawInfo;

    constructor(json: any) {
        this.frame_type = "padding";

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof PaddingFrame) {
            if (this.raw === undefined) {
                return other.raw === undefined;
            }

            return this.raw.equals(other.raw);
        }

        return false;
    }
}

class PingFrame implements QuicFrame {
    frame_type: FrameType;
    raw?: RawInfo;

    constructor(json: any) {
        this.frame_type = "ping";

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof PingFrame) {
            if (this.raw === undefined) {
                return other.raw === undefined;
            }

            return this.raw.equals(other.raw);
        }

        return false;
    }
}

type AckRange = number[];

class AckFrame implements QuicFrame {
    frame_type: FrameType;
    ack_delay?: number;
    acked_ranges?: AckRange[];
    ect1?: number;
    ect0?: number;
    ce?: number;
    raw?: RawInfo;

    constructor(json: any) {
        this.frame_type = "ack";

        if ("ack_delay" in json) {
            this.ack_delay = json["ack_delay"];
        }

        // TODO: Check if this works
        if ("acked_ranges" in json) {
            this.acked_ranges = json["acked_ranges"];
        }

        if ("ect1" in json) {
            this.ect1 = json["ect1"];
        }

        if ("ect0" in json) {
            this.ect0 = json["ect0"];
        }

        if ("ce" in json) {
            this.ce = json["ce"];
        }

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof AckFrame) {
            const sameAckDelay = this.ack_delay === other.ack_delay;
            const sameEct1 = this.ect1 === other.ect1;
            const sameEct0 = this.ect0 === other.ect0;
            const sameCe = this.ce === other.ce;

            let sameAckedRanges = false;

            if (this.acked_ranges === undefined && other.acked_ranges === undefined) {
                sameAckedRanges = true;
            }
            else if ((this.acked_ranges === undefined && other.acked_ranges !== undefined) || (this.acked_ranges !== undefined && other.acked_ranges === undefined)) {
                sameAckedRanges = false;
            }
            else {
                this.acked_ranges!.sort((a, b) => a[0] - b[0]);
                other.acked_ranges!.sort((a, b) => a[0] - b[0]);
                sameAckedRanges = equalNestedArrays(this.acked_ranges!, other.acked_ranges!);
            }

            if (this.raw === undefined) {
                return sameAckDelay && sameAckedRanges && sameEct1 && sameEct0 && sameCe && other.raw === undefined;
            }

            return sameAckDelay && sameAckedRanges && sameEct1 && sameEct0 && sameCe && this.raw.equals(other.raw);
        }

        return false;
    }
}

type ApplicationError = "unknown";

class ResetStreamFrame implements QuicFrame {
    frame_type: FrameType;
    stream_id: number;
    error_code: ApplicationError;
    error_code_bytes?: number;
    final_size: number;
    raw?: RawInfo;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("stream_id" in json) || !("error_code" in json) || !("final_size" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.frame_type = "reset_stream";
        this.stream_id = json["stream_id"];
        this.error_code = json["error_code"];
        this.final_size = json["final_size"];

        if ("error_code_bytes" in json) {
            this.error_code_bytes = json["error_code_bytes"];
        }

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof ResetStreamFrame) {
            const sameStreamId = this.stream_id === other.stream_id;
            const sameErrorCode = this.error_code === other.error_code;
            const sameErrorCodeBytes = this.error_code_bytes === other.error_code_bytes;
            const sameFinalSize = this.final_size === other.final_size;

            if (this.raw === undefined) {
                return sameStreamId && sameErrorCode && sameErrorCodeBytes && sameFinalSize && other.raw === undefined;
            }

            return sameStreamId && sameErrorCode && sameErrorCodeBytes && sameFinalSize && this.raw.equals(other.raw);
        }

        return false;
    }
}

class StopSendingFrame implements QuicFrame {
    frame_type: FrameType;
    stream_id: number;
    error_code: ApplicationError;
    error_code_bytes?: number;
    raw?: RawInfo;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("stream_id" in json) || !("error_code" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.frame_type = "stop_sending";
        this.stream_id = json["stream_id"];
        this.error_code = json["error_code"];

        if ("error_code_bytes" in json) {
            this.error_code_bytes = json["error_code_bytes"];
        }

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof StopSendingFrame) {
            const sameStreamId = this.stream_id === other.stream_id;
            const sameErrorCode = this.error_code === other.error_code;
            const sameErrorCodeBytes = this.error_code_bytes === other.error_code_bytes;

            if (this.raw === undefined) {
                return sameStreamId && sameErrorCode && sameErrorCodeBytes && other.raw === undefined;
            }

            return sameStreamId && sameErrorCode && sameErrorCodeBytes && this.raw.equals(other.raw);
        }

        return false;
    }
}

class CryptoFrame implements QuicFrame {
    frame_type: FrameType;
    offset: number;
    length: number;
    raw?: RawInfo;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("offset" in json) || !("length" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.frame_type = "crypto";
        this.offset = json["offset"];
        this.length = json["length"];

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof CryptoFrame) {
            const sameOffset = this.offset === other.offset;
            const sameLength = this.length === other.length;

            if (this.raw === undefined) {
                return sameOffset && sameLength && other.raw === undefined;
            }

            return sameOffset && sameLength && this.raw.equals(other.raw);
        }

        return false;
    }
}

class NewTokenFrame implements QuicFrame {
    frame_type: FrameType;
    token: Token;
    raw?: RawInfo;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("token" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.frame_type = "new_token";
        this.token = new Token(json["token"]);

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof NewTokenFrame) {
            let sameToken = false

            if (this.token === undefined) {
                sameToken = other.token === undefined;
            }
            else {
                sameToken = this.token.equals(other.token);
            }

            if (this.raw === undefined) {
                return sameToken && other.raw === undefined;
            }

            return sameToken && this.raw.equals(other.raw);
        }

        return false;
    }
}

class StreamFrame implements QuicFrame {
    frame_type: FrameType;
    stream_id: number;
    offset: number;
    length: number;
    fin: boolean;
    raw?: RawInfo;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("stream_id" in json) || !("offset" in json) || !("length" in json) || !("fin" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.frame_type = "stream";
        this.stream_id = json["stream_id"];
        this.offset = json["offset"];
        this.length = json["length"];
        this.fin = json["fin"];

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof StreamFrame) {
            const sameStreamId = this.stream_id === other.stream_id;
            const sameOffset = this.offset === other.offset;
            const sameLength = this.length === other.length;
            const sameFin = this.fin === other.fin;

            if (this.raw === undefined) {
                return sameStreamId && sameOffset && sameLength && sameFin && other.raw === undefined;
            }

            return sameStreamId && sameOffset && sameLength && sameFin && this.raw.equals(other.raw);
        }

        return false;
    }
}

class MaxDataFrame implements QuicFrame {
    frame_type: FrameType;
    maximum: number;
    raw?: RawInfo;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("maximum" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.frame_type = "max_data";
        this.maximum = json["maximum"];

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof MaxDataFrame) {
            const sameMaximum = this.maximum === other.maximum;

            if (this.raw === undefined) {
                return sameMaximum && other.raw === undefined;
            }

            return sameMaximum && this.raw.equals(other.raw);
        }

        return false;
    }
}

class MaxStreamDataFrame implements QuicFrame {
    frame_type: FrameType;
    stream_id: number;
    maximum: number;
    raw?: RawInfo;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("stream_id" in json) || !("maximum" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.frame_type = "max_stream_data";
        this.stream_id = json["stream_id"];
        this.maximum = json["maximum"];

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof MaxStreamDataFrame) {
            const sameStreamId = this.stream_id === other.stream_id;
            const sameMaximum = this.maximum === other.maximum;

            if (this.raw === undefined) {
                return sameStreamId && sameMaximum && other.raw === undefined;
            }

            return sameStreamId && sameMaximum && this.raw.equals(other.raw);
        }

        return false;
    }
}

class MaxStreamsFrame implements QuicFrame {
    frame_type: FrameType;
    stream_type: StreamType;
    maximum: number;
    raw?: RawInfo;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("stream_type" in json) || !("maximum" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.frame_type = "max_streams";
        this.stream_type = json["stream_type"];
        this.maximum = json["maximum"];

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof MaxStreamsFrame) {
            const sameStreamType = this.stream_type === other.stream_type;
            const sameMaximum = this.maximum === other.maximum;

            if (this.raw === undefined) {
                return sameStreamType && sameMaximum && other.raw === undefined;
            }

            return sameStreamType && sameMaximum && this.raw.equals(other.raw);
        }

        return false;
    }
}

class DataBlockedFrame implements QuicFrame {
    frame_type: FrameType;
    limit: number;
    raw?: RawInfo;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("limit" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.frame_type = "data_blocked";
        this.limit = json["limit"];

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof DataBlockedFrame) {
            const sameLimit = this.limit === other.limit;

            if (this.raw === undefined) {
                return sameLimit && other.raw === undefined;
            }

            return sameLimit && this.raw.equals(other.raw);
        }

        return false;
    }
}

class StreamDataBlockedFrame implements QuicFrame {
    frame_type: FrameType;
    stream_id: number;
    limit: number;
    raw?: RawInfo;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("stream_id" in json) || !("limit" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.frame_type = "stream_data_blocked";
        this.stream_id = json["stream_id"];
        this.limit = json["limit"];

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof StreamDataBlockedFrame) {
            const sameStreamId = this.stream_id === other.stream_id;
            const sameLimit = this.limit === other.limit;

            if (this.raw === undefined) {
                return sameStreamId && sameLimit && other.raw === undefined;
            }

            return sameStreamId && sameLimit && this.raw.equals(other.raw);
        }

        return false;
    }
}

class StreamsBlockedFrame implements QuicFrame {
    frame_type: FrameType;
    stream_type: StreamType;
    limit: number;
    raw?: RawInfo;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("stream_type" in json) || !("limit" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.frame_type = "streams_blocked";
        this.stream_type = json["stream_type"];
        this.limit = json["limit"];

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof StreamsBlockedFrame) {
            const sameStreamType = this.stream_type === other.stream_type;
            const sameLimit = this.limit === other.limit;

            if (this.raw === undefined) {
                return sameStreamType && sameLimit && other.raw === undefined;
            }

            return sameStreamType && sameLimit && this.raw.equals(other.raw);
        }

        return false;
    }
}

class NewConnectionIdFrame implements QuicFrame {
    frame_type: FrameType;
    sequence_number: number;
    retire_prior_to: number;
    connection_id_length?: number;
    connection_id: ConnectionId;
    stateless_reset_token?: StatelessResetToken;
    raw?: RawInfo;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("sequence_number" in json) || !("retire_prior_to" in json) || !("connection_id" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.frame_type = "new_connection_id";
        this.sequence_number = json["sequence_number"];
        this.retire_prior_to = json["retire_prior_to"];
        this.connection_id = json["connection_id"];

        if ("connection_id_length" in json) {
            this.connection_id_length = json["connection_id_length"];
        }

        if ("stateless_reset_token" in json) {
            this.stateless_reset_token = json["stateless_reset_token"];
        }

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof NewConnectionIdFrame) {
            const sameSequenceNumber = this.sequence_number === other.sequence_number;
            const sameRetirePriorTo = this.retire_prior_to === other.retire_prior_to;
            const sameConnectionIdLength = this.connection_id_length === other.connection_id_length;
            const sameConnectionId = this.connection_id === other.connection_id;
            const sameStatelessResetToken = this.stateless_reset_token === other.stateless_reset_token;

            if (this.raw === undefined) {
                return sameSequenceNumber && sameRetirePriorTo && sameConnectionIdLength && sameConnectionId && sameStatelessResetToken && other.raw === undefined;
            }

            return sameSequenceNumber && sameRetirePriorTo && sameConnectionIdLength && sameConnectionId && sameStatelessResetToken && this.raw.equals(other.raw);
        }

        return false;
    }
}

class RetireConnectionIdFrame implements QuicFrame {
    frame_type: FrameType;
    sequence_number: number;
    raw?: RawInfo;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("sequence_number" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.frame_type = "retire_connection_id";
        this.sequence_number = json["sequence_number"];

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof RetireConnectionIdFrame) {
            const sameSequenceNumber = this.sequence_number === other.sequence_number;

            if (this.raw === undefined) {
                return sameSequenceNumber && other.raw === undefined;
            }

            return sameSequenceNumber && this.raw.equals(other.raw);
        }

        return false;
    }
}

class PathChallengeFrame implements QuicFrame {
    frame_type: FrameType;
    data?: string;
    raw?: RawInfo;

    constructor(json: any) {
        this.frame_type = "path_challenge";

        if ("data" in json) {
            this.data = json["data"];
        }

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof PathChallengeFrame) {
            const sameData = this.data === other.data;

            if (this.raw === undefined) {
                return sameData && other.raw === undefined;
            }

            return sameData && this.raw.equals(other.raw);
        }

        return false;
    }
}

class PathResponseFrame implements QuicFrame {
    frame_type: FrameType;
    data?: string;
    raw?: RawInfo;

    constructor(json: any) {
        this.frame_type = "path_response";

        if ("data" in json) {
            this.data = json["data"];
        }

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof PathResponseFrame) {
            const sameData = this.data === other.data;

            if (this.raw === undefined) {
                return sameData && other.raw === undefined;
            }

            return sameData && this.raw.equals(other.raw);
        }

        return false;
    }
}

type ErrorSpace = "transport" | "application";

type TriggerFrameType = number | string;

type QuicError = TransportError | CryptoError | ApplicationError;

type TransportError = "no_error" | "internal_error" | "connection_refused" | "flow_control_error" | "stream_limit_error" | "stream_state_error" | "final_size_error" | "frame_encoding_error" | "transport_parameter_error" | "connection_id_limit_error" | "protocol_violation" | "invalid_token" | "application_error" | "crypto_buffer_exceeded" | "key_update_error" | "aead_limit_reached" | "no_viable_path" | "unknown";

type CryptoError = string;

class ConnectionCloseFrame implements QuicFrame {
    frame_type: FrameType;
    error_space?: ErrorSpace;
    error_code?: QuicError;
    error_code_bytes?: number;
    reason?: string;
    reason_bytes?: string;
    trigger_frame_type?: TriggerFrameType;
    raw?: RawInfo;

    constructor(json: any) {
        this.frame_type = "connection_close";
        
        if ("error_space" in json) {
            this.error_space = json["error_space"];
        }

        if ("error_code" in json) {
            this.error_code = json["error_code"];
        }

        if ("error_code_bytes" in json) {
            this.error_code_bytes = json["error_code_bytes"];
        }

        if ("reason" in json) {
            this.reason = json["reason"];
        }

        if ("reason_bytes" in json) {
            this.reason_bytes = json["reason_bytes"];
        }

        if ("trigger_frame_type" in json) {
            this.trigger_frame_type = json["trigger_frame_type"];
        }

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof ConnectionCloseFrame) {
            const sameErrorSpace = this.error_space === other.error_space;
            const sameErrorCode = this.error_code === other.error_code;
            const sameErrorCodeBytes = this.error_code_bytes === other.error_code_bytes;
            const sameReason = this.reason === other.reason;
            const sameReasonBytes = this.reason_bytes === other.reason_bytes;
            const sameTriggerFrameType = this.trigger_frame_type === other.trigger_frame_type;

            if (this.raw === undefined) {
                return sameErrorSpace && sameErrorCode && sameErrorCodeBytes && sameReason && sameReasonBytes && sameTriggerFrameType && other.raw === undefined;
            }

            return sameErrorSpace && sameErrorCode && sameErrorCodeBytes && sameReason && sameReasonBytes && sameTriggerFrameType && this.raw.equals(other.raw);
        }

        return false;
    }
}

class HandshakeDoneFrame implements QuicFrame {
    frame_type: FrameType;
    raw?: RawInfo;

    constructor(json: any) {
        this.frame_type = "handshake_done";

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof HandshakeDoneFrame) {
            if (this.raw === undefined) {
                return other.raw === undefined;
            }

            return this.raw.equals(other.raw);
        }

        return false;
    }
}

class UnknownFrame implements QuicFrame {
    frame_type: FrameType;
    frame_type_bytes: number;
    raw?: RawInfo;

    constructor(eventName: string, json: any, fileName: string) {
        if (!("frame_type_bytes" in json)) {
            throw new InvalidEventError(eventName, json, fileName);
        }

        this.frame_type = "unknown";
        this.frame_type_bytes = json["frame_type_bytes"];

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof UnknownFrame) {
            const sameFrameTypeBytes = this.frame_type_bytes === other.frame_type_bytes;

            if (this.raw === undefined) {
                return sameFrameTypeBytes && other.raw === undefined;
            }

            return sameFrameTypeBytes && this.raw.equals(other.raw);
        }

        return false;
    }
}

class DatagramFrame implements QuicFrame {
    frame_type: FrameType;
    length?: number;
    raw?: RawInfo;

    constructor(json: any) {
        this.frame_type = "datagram";

        if ("length" in json) {
            this.length = json["length"];
        }

        if ("raw" in json) {
            this.raw = new RawInfo(json["raw"]);
        }
    }

    equals(other: QuicFrame): boolean {
        if (other instanceof DatagramFrame) {
            const sameLength = this.length === other.length;

            if (this.raw === undefined) {
                return sameLength && other.raw === undefined;
            }

            return sameLength && this.raw.equals(other.raw);
        }

        return false;
    }
}

function jsonToFrame(eventName: string, json: any, fileName: string): QuicFrame {
    if (!("frame_type" in json)) {
        throw new InvalidEventError(eventName, json, fileName);
    }

    const frame_type = json["frame_type"];

    if (frame_type === "padding") {
        return new PaddingFrame(json);
    }
    else if (frame_type === "ping") {
        return new PingFrame(json);
    }
    else if (frame_type === "ack") {
        return new AckFrame(json);
    }
    else if (frame_type === "reset_stream") {
        return new ResetStreamFrame(eventName, json, fileName);
    }
    else if (frame_type === "stop_sending") {
        return new StopSendingFrame(eventName, json, fileName);
    }
    else if (frame_type === "crypto") {
        return new CryptoFrame(eventName, json, fileName);
    }
    else if (frame_type === "new_token") {
        return new NewTokenFrame(eventName, json, fileName);
    }
    else if (frame_type === "stream") {
        return new StreamFrame(eventName, json, fileName);
    }
    else if (frame_type === "max_data") {
        return new MaxDataFrame(eventName, json, fileName);
    }
    else if (frame_type === "max_stream_data") {
        return new MaxStreamDataFrame(eventName, json, fileName);
    }
    else if (frame_type === "max_streams") {
        return new MaxStreamsFrame(eventName, json, fileName);
    }
    else if (frame_type === "data_blocked") {
        return new DataBlockedFrame(eventName, json, fileName);
    }
    else if (frame_type === "stream_data_blocked") {
        return new StreamDataBlockedFrame(eventName, json, fileName);
    }
    else if (frame_type === "streams_blocked") {
        return new StreamsBlockedFrame(eventName, json, fileName);
    }
    else if (frame_type === "new_connection_id") {
        return new NewConnectionIdFrame(eventName, json, fileName);
    }
    else if (frame_type === "retire_connection_id") {
        return new RetireConnectionIdFrame(eventName, json, fileName);
    }
    else if (frame_type === "path_challenge") {
        return new PathChallengeFrame(json);
    }
    else if (frame_type === "path_response") {
        return new PathResponseFrame(json);
    }
    else if (frame_type === "connection_close") {
        return new ConnectionCloseFrame(json);
    }
    else if (frame_type === "handshake_done") {
        return new HandshakeDoneFrame(json);
    }
    else if (frame_type === "unknown") {
        return new UnknownFrame(eventName, json, fileName);
    }
    else if (frame_type === "datagram") {
        return new DatagramFrame(json);
    }
    else {
        throw new InvalidEventError(eventName, json, fileName);
    }
}
