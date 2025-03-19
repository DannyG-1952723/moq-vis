import { useFiles } from "@/contexts/FilesContext";
import * as d3 from "d3";
import Note from "../Note";
import Event from "./Event";
import { FileEvent, LogFile, LogFileEvent } from "@/model/LogFile";
import Axis from "./Axis";
import { Network } from "@/model/Network";

function eventsToFileEvents(eventList: LogFileEvent[], fileName: string): FileEvent[] {
    return eventList.map(event => new FileEvent(fileName, event));
}

function getEventsFromFiles(events: FileEvent[], logFile: LogFile): FileEvent[] {
    return events.concat(eventsToFileEvents(logFile.events, logFile.name));
}

export default function SequenceDiagram() {
    const files = useFiles();
    const activeFiles = files.filter((file) => file.active);
    const allEvents = d3.reduce(activeFiles, getEventsFromFiles, []).sort((event1, event2) => event2.logFileEvent.time - event1.logFileEvent.time);

    const title = <h3 className="block mt-5 mb-2 text-md font-medium text-gray-900 dark:text-white">Sequence diagram</h3>;

    if (files.length === 0 || activeFiles.length === 0) {
        return (
            <>
                {title}
                {files.length === 0 && <Note>There are no imported files</Note>}
                {files.length !== 0 && activeFiles.length === 0 && <Note>There are no active files</Note>}
            </>
        );
    }

    const network = new Network(activeFiles);
    console.log(network);
    
    const margin = {top: 50, right: 250, bottom: 50, left: 75}
    const axisMargin = 25;
    const eventBlockSize = 30;

    const width = 1280;
    const height = (allEvents.length - 1) * 50 + eventBlockSize + margin.top + margin.bottom + 2 * axisMargin;

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scalePoint().domain(activeFiles.map(file => file.name)).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0, allEvents.length - 1]).range([innerHeight - axisMargin - eventBlockSize / 2, axisMargin + eventBlockSize / 2]);

    const diagram = (
        <svg width={width} height={height} className="bg-white border border-gray-200 rounded-lg shadow-inner dark:bg-gray-700 dark:border-gray-700">
            <g transform={`translate(${margin.left}, ${margin.top})`}>
                {activeFiles.map(file => <Axis key={file.name} xPos={xScale(file.name)! + eventBlockSize / 2} yPos={0} height={innerHeight} fileName={file.name} />)}
                {allEvents.map((event, index) => <Event event={event} eventNum={index} blockSize={eventBlockSize} xScale={xScale} yScale={yScale} />)}
            </g>
        </svg>
    );

    return (
        <>
            {title}
            {diagram}
        </>
    );
}
