import { useState } from "react";
import { useDropzone } from "react-dropzone";

export default function WordToHtml() {
  const [html, setHtml] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileUploaded, setFileUploaded] = useState(false); // Track if the file was uploaded

  const onDrop = async (acceptedFiles) => {
    const formData = new FormData();
    formData.append("file", acceptedFiles[0]);

    try {
      setLoading(true);
      setError(null); // Reset any previous errors
      setFileUploaded(false); // Reset fileUploaded flag

      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to convert Word to HTML");
      }

      const data = await response.json();
      setHtml(data.html);
      setFileUploaded(true); // Mark file upload as successful
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setLoading(true);
      setError(null); // Reset any previous errors

      const response = await fetch("http://localhost:5000/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });

      if (!response.ok) {
        throw new Error("Failed to export PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url); // Store the PDF URL to download
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
          <div
            id="html-from-word"
            dangerouslySetInnerHTML={{ __html: html }}
            className="border p-4"
          />
          <button
            onClick={exportToPDF}
            className="bg-blue-500 text-white p-2 mt-2"
            disabled={loading || !fileUploaded}
          >
            Export to PDF
          </button>
        </div>
      )}

      {pdfUrl && (
        <a href={pdfUrl} download="output.pdf" className="mt-2 inline-block bg-green-500 text-white p-2">
          Download PDF
        </a>
      )}
    </div>
  );
}
