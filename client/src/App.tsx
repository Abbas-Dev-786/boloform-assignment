import { Route, Routes } from "react-router";
import { pdfjs } from "react-pdf";

import Home from "./pages/Home.tsx";
import Documents from "./pages/Documents.tsx";
import AuditTrail from "./pages/AuditTrail.tsx";
import SignerView from "./pages/SignerView.tsx";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const App = () => {
  return (
    <Routes>
      <Route path="/" index element={<Home />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/audit/:documentId" element={<AuditTrail />} />
      <Route path="/sign/:documentId" element={<SignerView />} />
    </Routes>
  );
};

export default App;
