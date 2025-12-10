import { Button } from "../ui/button";
import { ButtonGroup } from "../ui/button-group";

const ActionToolbar = () => {
  return (
    <div className="bg-white p-4 flex flex-col gap-4 rounded-lg shadow mb-10">
      <ButtonGroup>
        <Button variant="outline">Text Box</Button>
        <Button variant="outline">Signature</Button>
        <Button variant="outline">Image</Button>
        <Button variant="outline">Date</Button>
        <Button variant="outline">Radio</Button>
      </ButtonGroup>
    </div>
  );
};

export default ActionToolbar;