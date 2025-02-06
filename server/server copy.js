const fs = require("fs");
const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.post("/export-pdf", async (req, res) => {
  const { html } = req.body;

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Injecting CSS for better layout and responsive images
    const injectedHtml = `
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
        }
        img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0 auto;
        }
        h1, h2, h3 {
          color: #333;
          margin-top: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        td, th {
          padding: 10px;
          border: 1px solid #ddd;
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
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).send("Error generating PDF");
  }
});


app.listen(5000, () => console.log("Server running on port 5000"));
