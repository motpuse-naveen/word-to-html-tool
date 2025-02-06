from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
import mammoth

# Initialize the FastAPI app
app = FastAPI()

# Add CORS middleware to allow requests from your React app (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow requests from React app
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

MAX_FILE_SIZE = 10 * 1024 * 1024  # Limit to 10 MB

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if len(await file.read()) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File is too large")
    await file.seek(0)
    
    try:
        content = await file.read()
        content_file = BytesIO(content)
        
        # Convert Word to HTML using Mammoth
        html_output = mammoth.convert_to_html(content_file).value
        
        # Add a basic CSS style to improve rendering in HTML and PDF
        styled_html = f"""
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
            }}
            img {{
                max-width: 100%;
                height: auto;
                display: block;
                margin: 0 auto;
            }}
            h1, h2, h3 {{
                color: #333;
            }}
            p {{
                margin-bottom: 10px;
            }}
        </style>
        {html_output}
        """
        
        return {"html": styled_html}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

