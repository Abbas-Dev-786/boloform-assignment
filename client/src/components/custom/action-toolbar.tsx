import {
  Type,
  PenTool,
  Image,
  Calendar,
  Circle,
  Trash2,
  Save,
  FileSignature,
} from "lucide-react";
import { Button } from "../ui/button";
import { ButtonGroup } from "../ui/button-group";
import useGlobalStore from "../../store/global.store";
import type { FieldType } from "../../types/field-types";

const TOOLS: { type: FieldType; icon: React.ReactNode; label: string }[] = [
  { type: "text", icon: <Type size={18} />, label: "Text Box" },
  { type: "signature", icon: <PenTool size={18} />, label: "Signature" },
  { type: "image", icon: <Image size={18} />, label: "Image" },
  { type: "date", icon: <Calendar size={18} />, label: "Date" },
  { type: "radio", icon: <Circle size={18} />, label: "Radio" },
];

interface ActionToolbarProps {
  onSave?: () => void;
  onSign?: () => void;
}

const ActionToolbar = ({ onSave, onSign }: ActionToolbarProps) => {
  const {
    currentTool,
    setCurrentTool,
    clearAllFields,
    getAllFields,
    isSigningMode,
    setSigningMode,
  } = useGlobalStore();

  const fields = getAllFields();
  const hasFields = fields.length > 0;

  const handleToolClick = (tool: FieldType) => {
    if (currentTool === tool) {
      setCurrentTool(null); // Toggle off
    } else {
      setCurrentTool(tool);
    }
  };

  const handleSave = () => {
    const allFields = getAllFields();
    console.log("Saving fields:", allFields);
    onSave?.();
  };

  const handleSign = () => {
    setSigningMode(!isSigningMode);
    onSign?.();
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap items-center gap-4">
      {/* Field Tools */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500 font-medium">Add Field</span>
        <ButtonGroup>
          {TOOLS.map(({ type, icon, label }) => (
            <Button
              key={type}
              variant={currentTool === type ? "default" : "outline"}
              onClick={() => handleToolClick(type)}
              title={label}
              className="gap-2"
              disabled={isSigningMode}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </ButtonGroup>
      </div>

      {/* Separator */}
      <div className="h-10 w-px bg-gray-200 hidden md:block" />

      {/* Actions */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500 font-medium">Actions</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => clearAllFields()}
            disabled={!hasFields || isSigningMode}
            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 size={18} />
            <span className="hidden sm:inline">Clear All</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleSave}
            disabled={!hasFields}
            className="gap-2"
          >
            <Save size={18} />
            <span className="hidden sm:inline">Save</span>
          </Button>

          <Button
            variant={isSigningMode ? "default" : "outline"}
            onClick={handleSign}
            disabled={!hasFields}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <FileSignature size={18} />
            <span className="hidden sm:inline">
              {isSigningMode ? "Exit Signing" : "Sign Document"}
            </span>
          </Button>
        </div>
      </div>

      {/* Status indicator */}
      {currentTool && (
        <div className="ml-auto px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          Click on PDF to place {currentTool} field
        </div>
      )}
    </div>
  );
};

export default ActionToolbar;