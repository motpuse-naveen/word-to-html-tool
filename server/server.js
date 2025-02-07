const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const multer = require("multer");
const { exec } = require("child_process");

const app = express();
const upload = multer({ dest: "sofficefiles/" });

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/sofficefiles", express.static(path.join(__dirname, "sofficefiles"))); // Serve files

// 🟢 1️⃣ HTML to PDF using Puppeteer
app.post("/export-pdf", async (req, res) => {
  const { html } = req.body;
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(`
      <style>
        img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
      </style>
      ${html}
    `, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true, margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" }, scale: 0.8 });
    await browser.close();
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="output.pdf"');
    res.end(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).send("Error generating PDF");
  }
});

// 🔵 2️⃣ Word to HTML using LibreOffice (soffice)
app.post("/convert-word-to-html-libreoffice", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  
  const wordFilePath = req.file.path;
  const command = `soffice --headless --convert-to html:HTML --outdir sofficefiles "${wordFilePath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("LibreOffice error:", stderr);
      return res.status(500).send("Error converting Word to HTML");
    }
    
    const convertedFileName = path.basename(wordFilePath, path.extname(wordFilePath)) + ".html";
    const convertedFilePath = path.join(__dirname, "sofficefiles", convertedFileName);
    
    fs.readFile(convertedFilePath, "utf8", (err, htmlContent) => {
      if (err) return res.status(500).send("Error reading converted HTML file");
      res.json({ html: htmlContent, html_file: `http://localhost:5000/sofficefiles/${convertedFileName}` });
      fs.unlink(wordFilePath, () => {});
    });
  });
});

// 🔵 3️⃣ Word to PDF using LibreOffice (soffice)
app.post("/convert-word-to-pdf", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  
  const wordFilePath = req.file.path;
  const command = `soffice --headless --convert-to pdf --outdir word-to-pdf "${wordFilePath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("LibreOffice error:", stderr);
      return res.status(500).send("Error converting Word to PDF");
    }
    
    const convertedFileName = path.basename(wordFilePath, path.extname(wordFilePath)) + ".pdf";
    const convertedFilePath = path.join(__dirname, "word-to-pdf", convertedFileName);
    
    res.download(convertedFilePath, convertedFileName, (err) => {
      if (!err) fs.unlink(convertedFilePath, () => {});
      fs.unlink(wordFilePath, () => {});
    });
  });
});

app.listen(5000, () => console.log("Server running on port 5000"));
