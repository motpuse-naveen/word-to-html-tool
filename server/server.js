const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const multer = require("multer");
const { exec } = require("child_process");

const app = express();
const upload = multer({ dest: "uploads/" }); // Temporary storage for Word files

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 🟢 1️⃣ HTML to PDF using Puppeteer
app.post("/export-pdf", async (req, res) => {
  const { html } = req.body;

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const injectedHtml = `
      <style>
        img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0 auto;
        }
      </style>
      ${html}
    `;

    await page.setContent(injectedHtml, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
      scale: 0.8,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="output.pdf"');
    res.end(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).send("Error generating PDF");
  }
});

// 🔵 2️⃣ Word to PDF using LibreOffice (soffice)
app.post("/convert-word-to-pdf", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const wordFilePath = req.file.path;
  const outputPdfPath = path.join(__dirname, "uploads", `${Date.now()}.pdf`);

  const command = `soffice --headless --convert-to pdf --outdir uploads "${wordFilePath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("LibreOffice error:", stderr);
      return res.status(500).send("Error converting Word to PDF");
    }

    // Find the converted PDF file (LibreOffice adds ".pdf" automatically)
    const convertedFileName = path.basename(wordFilePath, path.extname(wordFilePath)) + ".pdf";
    const convertedFilePath = path.join(__dirname, "uploads", convertedFileName);

    if (fs.existsSync(convertedFilePath)) {
      res.download(convertedFilePath, "converted.pdf", () => {
        // Cleanup temp files
        fs.unlinkSync(wordFilePath);
        fs.unlinkSync(convertedFilePath);
      });
    } else {
      res.status(500).send("PDF file not found after conversion");
    }
  });
});



app.listen(5000, () => console.log("Server running on port 5000"));
