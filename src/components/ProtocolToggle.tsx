import ToggleButton from "./ToggleButton";

interface ProtocolToggleProps {
    show: boolean;
    showQuic: boolean;
    showMoq: boolean
    handleQuicToggle: (value: boolean) => void;
    handleMoqToggle: (value: boolean) => void;
}

export default function ProtocolToggle({ show, showQuic, showMoq, handleQuicToggle, handleMoqToggle }: ProtocolToggleProps) {
    if (!show) {
        return <></>;
    }

    return (
        <div className="mt-2 mb-3 flex flex-col space-y-1.5">
            <ToggleButton label="Show QUIC events" onChange={() => handleQuicToggle(!showQuic)} checked={showQuic} />
            <ToggleButton label="Show Media over QUIC events" onChange={() => handleMoqToggle(!showMoq)} checked={showMoq} />
        </div>
    );
}
