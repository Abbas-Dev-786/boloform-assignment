import { useRef } from "react";
import * as fabric from "fabric";
import useGlobalStore from "../../store/global.store";
import { Button } from "../ui/button";
import { ButtonGroup } from "../ui/button-group";

const ActionToolbar = () => {
  const { fabricCanvas } = useGlobalStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addTextBox = () => {
    if (!fabricCanvas) return;
    const text = new fabric.IText("Type here", {
      left: 100,
      top: 100,
      fontSize: 20,
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
  };

  const addSignature = () => {
    if (!fabricCanvas) return;
    const signature = new fabric.IText("Sign Here", {
      left: 100,
      top: 200,
      fontFamily: "cursive",
      fill: "blue",
    });
    fabricCanvas.add(signature);
    fabricCanvas.setActiveObject(signature);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!fabricCanvas || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (f) => {
      const data = f.target?.result as string;
      const img = await fabric.Image.fromURL(data);
      img.set({
        left: 100,
        top: 100,
        scaleX: 0.5,
        scaleY: 0.5,
      });
      fabricCanvas.add(img);
      fabricCanvas.setActiveObject(img);
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = "";
  };

  const addDate = () => {
    if (!fabricCanvas) return;
    const date = new Date().toLocaleDateString();
    const dateText = new fabric.IText(date, {
      left: 100,
      top: 100,
      fontSize: 20,
    });
    fabricCanvas.add(dateText);
    fabricCanvas.setActiveObject(dateText);
  };

  const addRadio = () => {
    if (!fabricCanvas) return;
    const circle = new fabric.Circle({
      radius: 10,
      fill: 'transparent',
      stroke: 'black',
      strokeWidth: 2,
      left: 100,
      top: 100
    });
    fabricCanvas.add(circle);
    fabricCanvas.setActiveObject(circle);
  }


  return (
    <div className="bg-white p-4 flex flex-col gap-4 rounded-lg shadow mb-10">
      <ButtonGroup>
        <Button variant="outline" onClick={addTextBox}>Text Box</Button>
        <Button variant="outline" onClick={addSignature}>Signature</Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Image</Button>
        <Button variant="outline" onClick={addDate}>Date</Button>
        <Button variant="outline" onClick={addRadio}>Radio</Button>
      </ButtonGroup>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />
    </div>
  );
};

export default ActionToolbar;
