import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "../components/ui/shadcn-io/dropzone";
import useGlobalStore from "../store/global.store";
import PdfLayout from "../layouts/pdf-layout";

const Home = () => {
  const { file, fileUrl, setFile, setFileUrl } = useGlobalStore();

  const handleDrop = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    setFile(file);
    setFileUrl(url);
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
      {!fileUrl ? (
        <div className="size-120">
          <h1 className="text-center mb-2 font-semibold text-2xl">
            Upload your pdf file here
          </h1>
          <Dropzone
            accept={{ "application/pdf": [] }}
            maxFiles={1}
            maxSize={1024 * 1024 * 100}
            minSize={1024}
            onDrop={handleDrop}
            onError={console.error}
            src={file ? [file] : undefined}
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
        </div>
      ) : (
        <PdfLayout />
      )}
    </div>
  );
};

export default Home;
