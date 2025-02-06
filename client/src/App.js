import { useState } from "react";
import { useDropzone } from "react-dropzone";

export default function WordToHtml() {
  const [html, setHtml] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    setSelectedFile(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError(null);
      setFileUploaded(false);

      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to convert Word to HTML");

      const data = await response.json();
      setHtml(data.html);
      setFileUploaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("http://localhost:5000/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });

      if (!response.ok) throw new Error("Failed to export PDF");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const convertWordToPdf = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("http://localhost:5000/convert-word-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to convert Word to PDF");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div>
      <div {...getRootProps()} className="border p-4">
        <input {...getInputProps()} />
        <p>Drag & drop a Word document here, or click to select one</p>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {html && (
        <div>
          <div id="html-from-word" dangerouslySetInnerHTML={{ __html: html }} className="border p-4" />
          
          <button
            onClick={exportToPDF}
            className="bg-blue-500 text-white p-2 mt-2"
            disabled={loading || !fileUploaded}
          >
            Convert HTML to PDF
          </button>
        </div>
      )}

      {selectedFile && (
        <button
          onClick={convertWordToPdf}
          className="bg-purple-500 text-white p-2 mt-2"
          disabled={loading}
        >
          Convert Word to PDF
        </button>
      )}

      {pdfUrl && (
        <a href={pdfUrl} download="output.pdf" className="mt-2 inline-block bg-green-500 text-white p-2">
          Download PDF
        </a>
      )}
    </div>
  );
}
