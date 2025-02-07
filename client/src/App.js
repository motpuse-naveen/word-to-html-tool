import { useState } from "react";
import { useDropzone } from "react-dropzone";

export default function WordToHtml() {
  const [html, setHtml] = useState("");
  const [htmlFileUrl, setHtmlFileUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [useLibreOffice, setUseLibreOffice] = useState(false);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    setSelectedFile(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError(null);
      setFileUploaded(false);

      const endpoint = useLibreOffice
        ? "http://localhost:5000/convert-word-to-html-libreoffice"
        : "http://localhost:8000/upload";

      const response = await fetch(endpoint, { method: "POST", body: formData });
      if (!response.ok) throw new Error("Failed to convert Word to HTML");

      const data = await response.json();
      setHtmlFileUrl(data.html_file || "");
      setHtml(data.html || "");
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

      <div>
        <label>
          Use LibreOffice for HTML conversion
          <input
            type="checkbox"
            checked={useLibreOffice}
            onChange={() => setUseLibreOffice(!useLibreOffice)}
          />
        </label>
      </div>

      {html && (
        <div>
          {htmlFileUrl ? (
            <iframe src={htmlFileUrl} title="Converted HTML" width="800px" height="500px"></iframe>
          ) : (
            <>
              <div id="html-from-word" dangerouslySetInnerHTML={{ __html: html }} className="border p-4" />
              <button
                onClick={exportToPDF}
                className="bg-blue-500 text-white p-2 mt-2"
                disabled={loading || !fileUploaded}
              >
                Convert HTML to PDF
              </button>
            </>
          )}
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
        <a
          href={pdfUrl}
          download="output.pdf"
          className="mt-2 inline-block bg-green-500 text-white p-2"
          onClick={() => URL.revokeObjectURL(pdfUrl)}
        >
          Download PDF
        </a>
      )}
    </div>
  );
}
