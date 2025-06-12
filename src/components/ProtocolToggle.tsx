import ToggleButton from "./ToggleButton";

interface ProtocolToggleProps {
    showQuic: boolean;
    showMoq: boolean
    handleQuicToggle: (value: boolean) => void;
    handleMoqToggle: (value: boolean) => void;
}

export default function ProtocolToggle({ showQuic, showMoq, handleQuicToggle, handleMoqToggle }: ProtocolToggleProps) {
    return (
        <>
            <ToggleButton onChange={() => handleQuicToggle(!showQuic)} checked={showQuic} />
            <ToggleButton onChange={() => handleMoqToggle(!showMoq)} checked={showMoq} />
        </>
    );
}
