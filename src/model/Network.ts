import * as d3 from "d3";
import { LogFile, MoqRole } from "./LogFile";
import { LogFileEvent } from "./Events";
import { StreamStateUpdated } from "./quic";
import { MoqEventData } from "./moq";
import { getMinTimestampIndex, groupBy, HEIGHT, makeTimestampIter, WIDTH } from "./util";

const NODE_SPACE_HORIZONTAL = 200;
const NODE_SPACE_VERTICAL = 150;

function getEventsFromFiles(events: ConnectionEvent[], logFile: LogFile): ConnectionEvent[] {
    return events.concat(logFile.events.map(event => new ConnectionEvent(event, 0, 0, logFile.name)));
}

export class Network {
    nodes: LogFile[];
    connections: Connection[];

    constructor(logFiles: LogFile[]) {
        this.nodes = logFiles;

        const allEvents = d3.reduce(logFiles, (events: ConnectionEvent[], logFile: LogFile) => getEventsFromFiles(events, logFile), []).sort((event1, event2) => event1.event.time - event2.event.time);

        for (let i = 0; i < allEvents.length; ++i) {
            allEvents[i].orderNum = i;
        }

        const groupedEvents = groupBy(allEvents, event => event.fileName);
        const connectionNodes = this.createConnectionNodes(logFiles, groupedEvents);
        
        this.connections = this.createConnections(connectionNodes);
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

    getGraphData(): [NodeDatum[], EdgeDatum[]] {
        let startNodes: LogFile[] = [];

        const nodes: NodeDatum[] = [];
        const edges: EdgeDatum[] = [];

        const pubs = this.nodes.filter(node => node.details.trace.common_fields?.main_role === "publisher");
        const subs = this.nodes.filter(node => node.details.trace.common_fields?.main_role === "subscriber");
        const pubsubs = this.nodes.filter(node => node.details.trace.common_fields?.main_role === "pubsub");
        const relays = this.nodes.filter(node => node.details.trace.common_fields?.main_role === "relay");

        if (pubs.length > 0) {
            startNodes = pubs;
        }
        else if (subs.length > 0) {
            startNodes = subs;
        }
        else if (pubsubs.length > 0) {
            startNodes = pubsubs;
        }
        else {
            startNodes = relays;
        }

        const depth = this.calculateGraphDepth(startNodes);
        let currentDepth = -1;

        const handledNodes: string[] = [];

        while (startNodes.length > 0) {
            currentDepth++;

            let nextNodes: LogFile[] = [];

            for (let i = 0; i < startNodes.length; ++i) {
                const node = startNodes[i];

                const connections = this.connections.filter(conn => conn.startingConn.fileName === node.name || conn.acceptingConn.fileName === node.name);
                const connectedNodes = [...new Set(connections.map(conn => conn.startingConn.fileName === node.name ? conn.acceptingConn.fileName : conn.startingConn.fileName))];
                const unhandledConnectedNodes = connectedNodes.filter(node => !handledNodes.includes(node));
    
                nextNodes.push(...this.nodes.filter(node => unhandledConnectedNodes.includes(node.name)));

                const role = node.details.trace.common_fields?.main_role;

                nodes.push({name: node.name, x: this.calculatePosition(currentDepth, depth, WIDTH, NODE_SPACE_HORIZONTAL), y: this.calculatePosition(i, startNodes.length, HEIGHT, NODE_SPACE_VERTICAL), mainRole: role!});
                edges.push(...unhandledConnectedNodes.map(targetNode => { return {source: node.name, target: targetNode}; }));
    
                handledNodes.push(node.name);
            }

            // Remove duplicates (QUIC and MoQ are seen as different connections because of different IDs)
            nextNodes = [...new Set(nextNodes)];
            startNodes = nextNodes;
        }

        const unconnectedNodes = this.nodes.filter(node => !handledNodes.includes(node.name));

        for (let i = 0; i < unconnectedNodes.length; ++i) {
            const role = unconnectedNodes[i].details.trace.common_fields?.main_role;

            nodes.push({name: unconnectedNodes[i].name, x: this.calculatePosition(depth, depth, WIDTH, NODE_SPACE_HORIZONTAL), y: this.calculatePosition(i, unconnectedNodes.length, HEIGHT, NODE_SPACE_VERTICAL), mainRole: role!});
        }

        return [nodes, edges];
    }

    calculateGraphDepth(startNodes: LogFile[]): number {
        let depth = 0;
        const handledNodes: string[] = [];

        while (startNodes.length > 0) {
            depth++;

            let nextNodes: LogFile[] = [];

            for (let i = 0; i < startNodes.length; ++i) {
                const node = startNodes[i];

                const connections = this.connections.filter(conn => conn.startingConn.fileName === node.name || conn.acceptingConn.fileName === node.name);
                const connectedNodes = [...new Set(connections.map(conn => conn.startingConn.fileName === node.name ? conn.acceptingConn.fileName : conn.startingConn.fileName))];
    
                nextNodes.push(...this.nodes.filter((node) => connectedNodes.includes(node.name) && !handledNodes.includes(node.name)));
    
                handledNodes.push(node.name);
            }

            // Remove duplicates
            nextNodes = [...new Set(nextNodes)];
            startNodes = nextNodes;
        }

        return depth;
    }

    calculatePosition(index: number, numNodes: number, dimensionLength: number, nodeSpace: number): number {
        const startPos = numNodes % 2 === 0 ?
            dimensionLength / 2 - nodeSpace / 2 - (numNodes / 2 - 1) * nodeSpace :
            dimensionLength / 2 - ((numNodes - 1) / 2) * nodeSpace;

        return startPos + index * nodeSpace;
    }
}

export interface NodeDatum {
    name: string;
    x: number;
    y: number;
    mainRole: MoqRole;
}

export interface EdgeDatum {
    source: string;
    target: string;
}

export interface LinkDatum {
    source: NodeDatum;
    target: NodeDatum;
}

function getEventsFromConnections(events: ConnectionEvent[], connection: Connection, showQuic: boolean, showMoq: boolean): ConnectionEvent[] {
    const msgEvents = d3.reduce(connection.messageEvents, (events: ConnectionEvent[], msgEvent: MessageEvent) => events.concat(msgEvent.createdEvent, msgEvent.parsedEvent), []);
    const halfMsgEvents = connection.halfMessageEvents.map(halfMsgEvent => halfMsgEvent.event);

    let list = [...connection.startingConn.connEvents, ...connection.acceptingConn.connEvents, ...msgEvents, ...halfMsgEvents];

    if (!showQuic) {
        list = list.filter(event => !event.event.name.startsWith("quic"));
    }
    if (!showMoq) {
        list = list.filter(event => !event.event.name.startsWith("moq"));
    }

    return events.concat(list);
}

export class NetworkSelection {
    nodes: string[];
    connections: Connection[];
    maxEventNums: number;
    startTime: number;
    containsQuicEvents: boolean;

    constructor(connections: Connection[], showQuicEvents: boolean, showMoqEvents: boolean) {
        this.connections = connections;

        // Removes duplicates
        this.nodes = [...new Set(d3.reduce(connections, (nodes: string[], connection: Connection) => nodes.concat(connection.startingConn.fileName, connection.acceptingConn.fileName), []))];

        const allEvents = d3.reduce(connections, (events: ConnectionEvent[], connection: Connection) => getEventsFromConnections(events, connection, showQuicEvents, showMoqEvents), []).sort((event1, event2) => event1.orderNum - event2.orderNum);

        if (allEvents.length > 0) {
            this.startTime = allEvents[0].event.time;
        }
        else {
            this.startTime = 0;
        }

        const groupedEvents = groupBy(allEvents, event => event.fileName);
        this.maxEventNums = this.calculateEventNums(groupedEvents);

        this.containsQuicEvents = showQuicEvents ? this.containsQuicEvent(allEvents) : false;
    }

    calculateEventNums(groupedEvents: Record<string, ConnectionEvent[]>): number {
        const timestampIters = this.nodes.map(fileName => makeTimestampIter(groupedEvents[fileName]));

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

            const fileName = this.nodes[minIndex];
            const timestampIndex = timestampIndices[minIndex];

            groupedEvents[fileName][timestampIndex].eventNum = eventNum;

            timestamps[minIndex] = timestampIters[minIndex].next();
            timestampIndices = timestamps.map(timestamp => timestamp.value[1]);
            timestampValues = timestamps.map(timestamp => timestamp.value[0]);

            done = timestamps.every(value => value.done);
        }

        const maxEventNums = this.nodes.map(fileName => {
            if (groupedEvents[fileName] === undefined) {
                return 0;
            }

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
    messageEvents!: MessageEvent[];
    halfMessageEvents!: HalfMessageEvent[];

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

        this.createEvents();
        this.calculateBlockNestings();
    }

    createEvents() {
        this.messageEvents = [];
        this.halfMessageEvents = [];

        const eventsToDelete = [];

        // Copies the array
        const startingConnEvents = [...this.startingConn.connEvents];
        const acceptingConnEvents = [...this.acceptingConn.connEvents];

        for (let i = 0; i < this.startingConn.connEvents.length; i++) {
            const event = this.startingConn.connEvents[i];

            if (event.isMessageEvent()) {
                const index = this.findCorrespondingEvent(event, acceptingConnEvents);

                if (index === -1) {
                    this.halfMessageEvents.push(new HalfMessageEvent(event));
                }
                else {
                    this.messageEvents.push(new MessageEvent(event, acceptingConnEvents[index]));
                    acceptingConnEvents.splice(index, 1);
                }

                eventsToDelete.push(i);
            }
        }

        // There shouldn't be any complete message events left
        let i = 0;
        while (i < acceptingConnEvents.length) {
            // Other half is missing
            if (acceptingConnEvents[i].isMessageEvent()) {
                this.halfMessageEvents.push(new HalfMessageEvent(acceptingConnEvents[i]));
                acceptingConnEvents.splice(i, 1);
            }
            // Regular event
            else {
                i += 1;
            }
        }

        for (let i = eventsToDelete.length - 1; i >= 0; i--) {
            startingConnEvents.splice(eventsToDelete[i], 1);
        }

        // Remaining events are regular events
        this.startingConn.connEvents = startingConnEvents;
        this.acceptingConn.connEvents = acceptingConnEvents;
    }

    findCorrespondingEvent(event: ConnectionEvent, events: ConnectionEvent[]): number {
        for (let i = 0; i < events.length; i++) {
            if (event.isCorrespondingEvent(events[i])) {
                return i;
            }
        }

        return -1;
    }

    calculateBlockNestings() {
        const availableNestings = [true];

        const createdSorted = this.messageEvents.toSorted((a, b) => a.createdEvent.event.time - b.createdEvent.event.time);
        const parsedSorted = this.messageEvents.toSorted((a, b) => a.parsedEvent.event.time - b.parsedEvent.event.time);

        let i = 0;
        let j = 0;

        // Logical AND works here since the created events will be exhausted first, which means nestings won't have to be made available anymore
        while (i < this.messageEvents.length && j < this.messageEvents.length) {
            const createdEvent = createdSorted[i];
            const parsedEvent = parsedSorted[j];

            const created = createdEvent.createdEvent;
            const parsed = parsedEvent.parsedEvent;
            
            // Only needs to be done with MoQ events
            if (created.event.name.startsWith("quic")) {
                i += 1;
                continue;
            }
            if (created.event.name.startsWith("quic")) {
                j += 1;
                continue;
            }

            // Created event happens first
            if (created.orderNum < parsed.orderNum) {
                const firstAvailable = availableNestings.findIndex(value => value);

                // No nestings available, create a new one
                if (firstAvailable === -1) {
                    availableNestings.push(false);
                    createdEvent.nesting = availableNestings.length - 1;
                }
                else {
                    availableNestings[firstAvailable] = false;
                    createdEvent.nesting = firstAvailable;
                }

                i += 1;
            }
            // Parsed event happens first
            else {
                // Created event has already happened, so nesting has a value
                availableNestings[parsedEvent.nesting!] = true;
                j += 1;
            }
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
    // Order of the event within all events (used for sorting when timestamps are the same)
    orderNum: number;
    // Number of the event in the sequence diagram (used to determine the position in the visualization)
    eventNum: number;
    fileName: string;

    constructor(event: LogFileEvent, orderNum: number, eventNum: number, fileName: string) {
        this.event = event;
        this.orderNum = orderNum;
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

export class MessageEvent {
    createdEvent: ConnectionEvent;
    parsedEvent: ConnectionEvent;
    nesting?: number;

    constructor(event1: ConnectionEvent, event2: ConnectionEvent) {
        if (event1.isCreatedEvent()) {
            this.createdEvent = event1;
            this.parsedEvent = event2;
        }
        else {
            this.createdEvent = event2;
            this.parsedEvent = event1;
        }
    }
}

export class HalfMessageEvent {
    event: ConnectionEvent;
    isCreatedEvent: boolean;

    constructor(event: ConnectionEvent) {
        this.event = event;
        this.isCreatedEvent = event.isCreatedEvent();
    }
}
