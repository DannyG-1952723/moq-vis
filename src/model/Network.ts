import * as d3 from "d3";
import { LogFile } from "./LogFile";
import { LogFileEvent } from "./Events";
import { StreamStateUpdated } from "./quic";
import { MoqEventData } from "./moq";
import { getMinTimestampIndex, groupBy, makeTimestampIter } from "./util";

function eventsToConnectionEvents(eventList: LogFileEvent[], fileName: string, showQuicEvents: boolean, showMoqEvents: boolean): ConnectionEvent[] {
    let list = eventList;
    
    if (!showQuicEvents) {
        list = list.filter(event => !event.name.startsWith("quic"));
    }
    if (!showMoqEvents) {
        list = list.filter(event => !event.name.startsWith("moq"));
    }

    return list.map(event => new ConnectionEvent(event, 0, fileName));
}

function getEventsFromFiles(events: ConnectionEvent[], logFile: LogFile, showQuic: boolean, showMoq: boolean): ConnectionEvent[] {
    return events.concat(eventsToConnectionEvents(logFile.events, logFile.name, showQuic, showMoq));
}

export class Network {
    nodes: string[];
    connections: Connection[];
    maxEventNums: number;
    startTime: number;
    containsQuicEvents: boolean;

    constructor(logFiles: LogFile[], showQuicEvents: boolean, showMoqEvents: boolean) {
        const allEvents = d3.reduce(logFiles, (events: ConnectionEvent[], logFile: LogFile) => getEventsFromFiles(events, logFile, showQuicEvents, showMoqEvents), []).sort((event1, event2) => event1.event.time - event2.event.time);

        if (allEvents.length > 0) {
            this.startTime = allEvents[0].event.time;
        }
        else {
            this.startTime = 0;
        }

        const fileNames = logFiles.map(file => file.name);
        const groupedEvents = groupBy(allEvents, event => event.fileName);
        const usedFileNames = fileNames.filter(fileName => groupedEvents[fileName] != null);
        
        this.maxEventNums = this.calculateEventNums(groupedEvents, usedFileNames);

        const connectionNodes = this.createConnectionNodes(logFiles, groupedEvents);
        
        this.nodes = logFiles.map(logFile => logFile.name);
        this.connections = this.createConnections(connectionNodes);

        this.containsQuicEvents = showQuicEvents ? this.containsQuicEvent(allEvents) : false;
    }

    createConnectionNodes(logFiles: LogFile[], groupedEvents: Partial<Record<string, ConnectionEvent[]>>): Record<string, ConnectionNode> {
        const connectionNodes: Record<string, ConnectionNode> = {};

        logFiles.forEach(file => {
            const events = groupedEvents[file.name];

            if (!events) {
                return;
            }

            events.forEach(event => {
                if (!event.event.group_id) {
                    return;
                }

                const key = `${file.name}_${event.event.group_id}`;

                if (key in connectionNodes) {
                    connectionNodes[key].addEvent(event);
                }
                else {
                    connectionNodes[key] = new ConnectionNode(file.name, event.event.group_id, [event]);
                }
            });
        });

        return connectionNodes;
    }

    createConnections(connectionNodes: Record<string, ConnectionNode>): Connection[] {
        const connections: Connection[] = [];
        const connectionNodeList = Object.entries(connectionNodes);

        for (let i = 0; i < connectionNodeList.length; i++) {
            const key1 = connectionNodeList[i][0];
            const connNode1 = connectionNodeList[i][1];

            const connId1 = key1.substring(key1.lastIndexOf("_") + 1);

            for (let j = i + 1; j < connectionNodeList.length; j++) {
                const key2 = connectionNodeList[j][0];
                const connNode2 = connectionNodeList[j][1];

                const connId2 = key2.substring(key2.lastIndexOf("_") + 1);

                if (connId1 === connId2) {
                    connections.push(new Connection(connNode1, connNode2));
                }
            }
        }

        return connections;
    }

    calculateEventNums(groupedEvents: Record<string, ConnectionEvent[]>, fileNames: string[]): number {
        const timestampIters = fileNames.map(fileName => makeTimestampIter(groupedEvents[fileName]));

        const timestamps = timestampIters.map(iter => iter.next());
        let timestampIndices = timestamps.map(timestamp => timestamp.value[1]);
        let timestampValues = timestamps.map(timestamp => timestamp.value[0]);

        let done = timestamps.every(value => value.done);

        let eventNum = -1;
        let eventNumIndices: number[] = [];

        let prevMin = Infinity;

        while (!done) {
            const minIndex = getMinTimestampIndex(timestampValues, eventNumIndices);
            const min = timestampValues[minIndex];

            if (min !== prevMin || eventNumIndices.includes(minIndex)) {
                eventNum++;
                eventNumIndices = [];
            }

            eventNumIndices.push(minIndex);

            prevMin = min;

            const fileName = fileNames[minIndex];
            const timestampIndex = timestampIndices[minIndex];

            groupedEvents[fileName][timestampIndex].eventNum = eventNum;

            timestamps[minIndex] = timestampIters[minIndex].next();
            timestampIndices = timestamps.map(timestamp => timestamp.value[1]);
            timestampValues = timestamps.map(timestamp => timestamp.value[0]);

            done = timestamps.every(value => value.done);
        }

        const maxEventNums = fileNames.map(fileName => {
            const length = groupedEvents[fileName].length;
            return groupedEvents[fileName][length - 1].eventNum;
        });

        const maxEventNum = d3.max(maxEventNums);

        return (maxEventNum === undefined) ? 0 : maxEventNum + 1;
    }

    containsQuicEvent(allEvents: ConnectionEvent[]): boolean {
        for (const event of allEvents) {
            if (event.event.name.startsWith("quic")) {
                return true;
            }
        }

        return false;
    }
}

export class Connection {
    startingConn: ConnectionNode;
    acceptingConn: ConnectionNode;

    constructor(connNode1: ConnectionNode, connNode2: ConnectionNode) {
        // Both nodes have at least 1 event
        if (connNode1.connEvents[0].event.time < connNode2.connEvents[0].event.time) {
            this.startingConn = connNode1;
            this.acceptingConn = connNode2;
        }
        else {
            this.startingConn = connNode2;
            this.acceptingConn = connNode1;
        }
    }
}

class ConnectionNode {
    fileName: string
    connId: string
    connEvents: ConnectionEvent[];

    constructor(fileName: string, connId: string, connEvents: ConnectionEvent[] = []) {
        this.fileName = fileName;
        this.connId = connId;
        this.connEvents = connEvents;
    }

    addEvent(event: ConnectionEvent) {
        this.connEvents.push(event);
    }
}

export class ConnectionEvent {
    event: LogFileEvent;
    eventNum: number;
    fileName: string;

    constructor(event: LogFileEvent, eventNum: number, fileName: string) {
        this.event = event;
        this.eventNum = eventNum;
        this.fileName = fileName;
    }

    isMessageEvent(): boolean {
        if (this.event.name.startsWith("moq")) {
            return this.isMoqMessageEvent();
        }
        else if (this.event.name.startsWith("quic")) {
            return this.isQuicMessageEvent();
        }
        // This else should never be reached
        else {
            throw Error("Unreachable");
        }
    }

    isMoqMessageEvent(): boolean {
        if (this.event.name.endsWith("created") || this.event.name.endsWith("parsed")) {
            return true;
        }

        return (this.event.name.endsWith("session_started") || this.event.name.endsWith("subscription_started"));
    }

    // TODO: Implement
    isQuicMessageEvent(): boolean {
        // if (this.event.name.endsWith("connection_started")) {
        //     return false;
        // }

        return true;
    }

    isCorrespondingEvent(other: ConnectionEvent): boolean {
        if (this.event.name.startsWith("moq")) {
            return this.isCorrespondingMoqEvent(other);
        }
        else if (this.event.name.startsWith("quic")) {
            return this.isCorrespondingQuicEvent(other);
        }
        // This else should never be reached
        else {
            throw Error("Unreachable");
        }
    }

    isCorrespondingMoqEvent(other: ConnectionEvent): boolean {
        const validCombo1 = this.event.name.endsWith("created") && other.event.name.endsWith("parsed");
        const validCombo2 = this.event.name.endsWith("parsed") && other.event.name.endsWith("created");

        if (!(validCombo1 || validCombo2)) {
            return false;
        }

        const shortName1 = this.event.getShortNameWithoutAction();
        const shortName2 = other.event.getShortNameWithoutAction();

        if (shortName1 === shortName2) {
            return this.event.hasCorrespondingData(other.event);
        }

        return false;
    }

    isCorrespondingQuicEvent(other: ConnectionEvent): boolean {
        return this.event.hasCorrespondingData(other.event);
    }

    isCreatedEvent(): boolean {
        if (this.event.name.startsWith("moq")) {
            return this.isMoqCreatedEvent();
        }
        else if (this.event.name.startsWith("quic")) {
            return this.isQuicCreatedEvent();
        }
        // This else should never be reached
        else {
            throw Error("Unreachable");
        }
    }

    isMoqCreatedEvent(): boolean {
        return this.event.name.endsWith("created");
    }

    isQuicCreatedEvent(): boolean {
        const data = this.event.data as MoqEventData;
        
        if (this.event.name.endsWith("stream_state_updated")) {
            return (data.payload as StreamStateUpdated).stream_side === "sending";
        }
        if (this.event.name.endsWith("packet_sent")) {
            return true;
        }
        if (this.event.name.endsWith("packet_received")) {
            return false;
        }
        // TODO: Implement for other events
        else {
            return true;
        }
    }
}
