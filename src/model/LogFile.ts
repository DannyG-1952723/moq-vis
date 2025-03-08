// TODO: Fix error handling

import { DateTime } from "luxon";

import { InvalidFileError } from "@/errors/InvalidFileError";

export class LogFile {
    name: string;
    details!: LogFileDetails;
    events: LogFileEvent[];

    constructor(file: File) {
        this.name = file.name;
        this.events = [];

        try {
            this.readFile(file);
        }
        catch(err) {
            throw err;
        }
    }

    readFile(file: File) {
        const reader = new FileReader();
            
        reader.onload = () => {
            if (!reader.result || typeof reader.result !== "string") {
                return;
            }

            const logs = reader.result.split("");

            if (logs.length < 2) {
                throw new InvalidFileError(file.name);
            }
            
            try {
                // The first element is an empty string, so skip it
                this.details = new LogFileDetails(JSON.parse(logs[1]), file.name);

                for (let i = 2; i < logs.length; i++) {
                    this.events.push(new LogFileEvent(JSON.parse(logs[i]), file.name));
                }
            }
            catch(err) {
                throw new InvalidFileError(file.name);
            }
        }

        reader.readAsText(file);
    }
}

class LogFileDetails {
    fileSchema: string;
    serializationFormat: string;
    title: string | undefined;
    description: string | undefined;
    eventSchemas: string[];
    trace: LogFileTrace;

    // JSON.parse() returns any
    constructor(json: any, fileName: string) {
        if (!("file_schema" in json) || !("serialization_format" in json)) {
            throw new InvalidFileError(fileName);
        }

        this.fileSchema = json["file_schema"];
        this.serializationFormat = json["serialization_format"];
        this.title = json["title"];
        this.description = json["description"];
        this.eventSchemas = json["event_schemas"];
        this.trace = new LogFileTrace(json["trace"], fileName);
    }
}

class LogFileTrace {
    title: string | undefined;
    description: string | undefined;
    commonFields: CommonFields | undefined;
    VantagePoint: VantagePoint | undefined;

    constructor(json: any, fileName: string) {
        this.title = json["title"];
        this.description = json["description"];

        if ("common_fields" in json) {
            this.commonFields = new CommonFields(json["common_fields"], fileName);
        }

        if ("vantage_point" in json) {
            this.VantagePoint = new VantagePoint(json["vantage_point"], fileName);
        }
    }
}

class CommonFields {
    path: string | undefined;
    timeFormat: TimeFormat | undefined;
    referenceTime: ReferenceTime | undefined;
    protocolTypes: string[] | undefined;
    groupId: string | undefined;
    // TODO: Maybe replace 'any'
    customFields: any;

    constructor(json: any, fileName: string) {
        this.path = json["path"];
        this.protocolTypes = json["protocol_types"];
        this.groupId = json["group_id"];
        this.customFields = json["custom_fields"];

        if ("time_format" in json && typeof json["time_format"] === "string") {
            this.timeFormat = stringToTimeFormat(json["time_format"], fileName);
        }

        if ("reference_time" in json) {
            this.referenceTime = new ReferenceTime(json["reference_time"], fileName);
        }
    }
}

enum TimeFormat {
    RelativeToEpoch = "relative_to_epoch",
    RelativeToPreviousEvent = "relative_to_previous_event"
}

function stringToTimeFormat(string: string, fileName: string): TimeFormat {
    switch(string) {
        case TimeFormat.RelativeToEpoch.valueOf(): {
            return TimeFormat.RelativeToEpoch;
        }
        case TimeFormat.RelativeToPreviousEvent.valueOf(): {
            return TimeFormat.RelativeToPreviousEvent;
        }
        default:
            throw new InvalidFileError(fileName);
    }
}

class ReferenceTime {
    clockType: ClockType;
    epoch: Epoch;
    // TODO: Figure out the exact type
    wallClockTime: DateTime | undefined;

    constructor(json: any, fileName: string) {
        if (!("clock_type" in json) || !("epoch" in json)) {
            throw new InvalidFileError(fileName);
        }

        this.clockType = new ClockType(json["clock_type"]);
        this.epoch = new Epoch(json["epoch"]);
        // TODO: Add error handling
        this.wallClockTime = DateTime.fromISO(json["wall_clock_time"]);
    }
}

class ClockType {
    type: "system" | "monotonic" | string;

    constructor(type: string) {
        this.type = type;
    }
}

class Epoch {
    epoch: DateTime | "unknown";

    constructor(epoch: string) {
        if (epoch === "unknown") {
            this.epoch = epoch;
        }
        // TODO: Add error handling
        else {
            this.epoch = DateTime.fromISO(epoch);
        }
    }
}

class VantagePoint {
    name: string | undefined;
    type: VantagePointType;
    flow: VantagePointType | undefined;

    constructor(json: any, fileName: string) {
        if (!("type" in json)) {
            throw new InvalidFileError(fileName);
        }

        this.name = json["name"];
        this.type = stringToVantagePointType(json["type"], fileName);

        if ("flow" in json && typeof json["flow"] === "string") {
            this.flow = stringToVantagePointType(json["flow"], fileName);
        }
    }
}

enum VantagePointType {
    Client = "client",
    Server = "server",
    Network = "network",
    Unknown = "unknown"
}

function stringToVantagePointType(string: string, fileName: string): VantagePointType {
    switch(string) {
        case VantagePointType.Client.valueOf(): {
            return VantagePointType.Client;
        }
        case VantagePointType.Server.valueOf(): {
            return VantagePointType.Server;
        }
        case VantagePointType.Network.valueOf(): {
            return VantagePointType.Network;
        }
        case VantagePointType.Unknown.valueOf(): {
            return VantagePointType.Unknown;
        }
        default:
            throw new InvalidFileError(fileName);
    }
}

class LogFileEvent {
    // TODO: Maybe change due to how numbers in JS work
    time: number;
    name: string;
    // TODO: Maybe change
    data: any;
    path: string | undefined;
    timeFormat: TimeFormat | undefined;
    protocolTypes: string[] | undefined;
    groupId: string | undefined;
    systemInfo: SystemInformation | undefined;
    // TODO: Maybe replace 'any'
    customFields: any;

    constructor(json: any, fileName: string) {
        if (!("time" in json) || !("name" in json)) {
            throw new InvalidFileError(fileName);
        }

        // TODO: Add error handling
        this.time = parseInt(json["time"]);
        this.name = json["name"];
        this.data = json["data"];
        this.path = json["path"];
        this.protocolTypes = json["protocol_types"];
        this.groupId = json["group_id"];
        this.customFields = json["custom_fields"];

        if ("time_format" in json && typeof json["time_format"] === "string") {
            this.timeFormat = stringToTimeFormat(json["time_format"], fileName);
        }

        if ("system_information" in json) {
            this.systemInfo = new SystemInformation(json["system_information"], fileName);
        }

    }
}

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
