from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
import mammoth

# Initialize FastAPI app
app = FastAPI()

# CORS Middleware (Modify to restrict specific origins if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all domains (Adjust in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB Limit

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Read file content
        content = await file.read()
        
        # Check file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File is too large (Max 10MB)")

        # Convert Word to HTML using Mammoth
        content_file = BytesIO(content)
        html_output = mammoth.convert_to_html(content_file).value

        if not html_output.strip():
            raise HTTPException(status_code=400, detail="No readable content in the file")

        # CSS Styling
        styled_html = f"""
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 20px;
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
