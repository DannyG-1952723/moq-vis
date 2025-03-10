// TODO: Fix error handling
// TODO: Fix serialization of some classes (like Epoch)
// These classes use snake_case instead of camelCase to serialize easily back into the original format

import { DateTime } from "luxon";

import { InvalidFileError } from "@/errors/InvalidFileError";

export class LogFile {
    name: string;
    active: boolean;
    details!: LogFileDetails;
    events: LogFileEvent[];

    constructor(file: File) {
        this.name = file.name;
        this.active = true;
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
    file_schema: string;
    serialization_format: string;
    title: string | undefined;
    description: string | undefined;
    event_schemas: string[];
    trace: LogFileTrace;

    // JSON.parse() returns any
    constructor(json: any, fileName: string) {
        if (!("file_schema" in json) || !("serialization_format" in json)) {
            throw new InvalidFileError(fileName);
        }

        this.file_schema = json["file_schema"];
        this.serialization_format = json["serialization_format"];
        this.title = json["title"];
        this.description = json["description"];
        this.event_schemas = json["event_schemas"];
        this.trace = new LogFileTrace(json["trace"], fileName);
    }
}

class LogFileTrace {
    title: string | undefined;
    description: string | undefined;
    common_fields: CommonFields | undefined;
    vantage_point: VantagePoint | undefined;

    constructor(json: any, fileName: string) {
        this.title = json["title"];
        this.description = json["description"];

        if ("common_fields" in json) {
            this.common_fields = new CommonFields(json["common_fields"], fileName);
        }

        if ("vantage_point" in json) {
            this.vantage_point = new VantagePoint(json["vantage_point"], fileName);
        }
    }
}

class CommonFields {
    path: string | undefined;
    time_format: TimeFormat | undefined;
    reference_time: ReferenceTime | undefined;
    protocol_types: string[] | undefined;
    group_id: string | undefined;
    // TODO: Maybe replace 'any'
    custom_fields: any;

    constructor(json: any, fileName: string) {
        this.path = json["path"];
        this.protocol_types = json["protocol_types"];
        this.group_id = json["group_id"];
        this.custom_fields = json["custom_fields"];

        if ("time_format" in json && typeof json["time_format"] === "string") {
            this.time_format = stringToTimeFormat(json["time_format"], fileName);
        }

        if ("reference_time" in json) {
            this.reference_time = new ReferenceTime(json["reference_time"], fileName);
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
    clock_type: ClockType;
    epoch: Epoch;
    // TODO: Figure out the exact type
    wall_clock_time: DateTime | undefined;

    constructor(json: any, fileName: string) {
        if (!("clock_type" in json) || !("epoch" in json)) {
            throw new InvalidFileError(fileName);
        }

        this.clock_type = new ClockType(json["clock_type"]);
        this.epoch = new Epoch(json["epoch"]);
        // TODO: Add error handling
        this.wall_clock_time = DateTime.fromISO(json["wall_clock_time"]);
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
    time_format: TimeFormat | undefined;
    protocol_types: string[] | undefined;
    group_id: string | undefined;
    system_information: SystemInformation | undefined;
    // TODO: Maybe replace 'any'
    custom_fields: any;

    constructor(json: any, fileName: string) {
        if (!("time" in json) || !("name" in json)) {
            throw new InvalidFileError(fileName);
        }

        // TODO: Add error handling
        this.time = parseInt(json["time"]);
        this.name = json["name"];
        this.data = json["data"];
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
