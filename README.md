# 🌊 FLOODxplain

> **Explainable AI for flood detection, impact assessment, infrastructure monitoring, recovery planning, and field reporting.**

FLOODxplain is a full-stack disaster-response application that combines a deep-learning flood classifier with explainable AI, interactive maps, infrastructure information, recovery planning tools, and crowdsourced field reports.

The system is designed to help users understand **whether an uploaded aerial image shows flooding, why the model made that prediction, what infrastructure may be affected, where recovery activities can be planned, and how field reports can be collected and verified**.

---

## 📌 Project Overview

Floods can affect large areas quickly, making it difficult for response teams to inspect every location manually. FLOODxplain provides a centralized interface for analyzing aerial or satellite imagery and turning the analysis into practical decision-support information.

The application uses:

- **ResNet-50** for binary flood/non-flood image classification.
- **Transfer learning** from ImageNet-pretrained weights.
- **GradCAM and GradCAM++** to explain which image regions influenced the prediction.
- **Interactive Leaflet maps** for infrastructure, damage, recovery, and reporting views.
- **OpenStreetMap data** for permanent-water masking and map context.
- **FastAPI** for the backend API.
- **HTML, CSS, and JavaScript** for the frontend interface.
- **JSON files** for lightweight persistence of the latest analysis and submitted reports.

The project focuses on the **Godavari Basin and Andhra Pradesh region**, while many components can be adapted for other locations.

---

## ✨ Main Features

### 1. Damage Assessment

Upload a single aerial, satellite, or drone image to receive:

- Flooded or non-flooded classification.
- Confidence score.
- Flood probability.
- Safe probability.
- Risk severity.
- GradCAM heatmap.
- GradCAM++ heatmap.
- Estimated flood-impact metrics.
- Interactive map visualization.
- PDF report export.
- GeoJSON export.

The page also supports **batch processing**, allowing multiple images to be uploaded and analyzed in one request. Batch results can be displayed on a map and exported as CSV or GeoJSON.

### 2. Infrastructure Impact

The infrastructure module displays mapped facilities and their reported condition, including:

- Hospitals.
- Bridges.
- Roads.

Users can:

- Search for locations using geocoding.
- Move around an interactive satellite map.
- Toggle hospital, bridge, and road layers.
- View facility status such as safe, partial, or damaged.
- See distances from the current map center.
- Connect the latest AI damage result to the infrastructure map.

### 3. Recovery Planning

The recovery module supports post-flood planning through:

- High-, medium-, and low-risk zones.
- Estimated recovery timelines.
- Safe-zone markers.
- Rescue staging areas.
- Elevation and capacity information for safe zones.
- Interactive map layers.
- Connected damage-analysis context.

This module helps users move from **detection** to **response planning**.

### 4. Crowdsourced Reporting

The reporting module allows users to submit field observations containing:

- Location name.
- Severity level.
- Description of the situation.
- Optional reporter name.
- Responsible team or organization.
- Latitude and longitude selected on a map.

Reports are checked using a lightweight rule-based verification process. The verification score considers factors such as:

- Location quality.
- Whether coordinates are within India.
- Description length.
- Flood-related keywords.
- Consistency between the selected severity and description.
- Suspicious or test wording.
- Duplicate reports.

Reports are then shown in a table and on a map as verified or unverified.

---

## 🧠 Machine Learning and Explainability

### Model

The model pipeline is based on a **ResNet-50 convolutional neural network** using ImageNet-pretrained weights and transfer learning.

The classifier has two output classes:

- `Flood Images`
- `Non Flood Images`

### Training configuration

The current model notebook summary documents the following setup:

| Parameter | Value |
|---|---|
| Architecture | ResNet-50 |
| Learning approach | ImageNet-pretrained transfer learning |
| Number of classes | 2 |
| Train/validation split | 80/20 |
| Batch size | 32 |
| Optimizer | Adam |
| Learning rate | 0.0001 |
| Loss | CrossEntropyLoss |
| Epochs | 3 |
| Input size | 224 × 224 |
| Dataset | Kaggle Flood Classification Dataset |
| XAI methods | GradCAM and GradCAM++ |
| Target layer | `model.layer4[-1]` |

### Why explainability is useful

A classification score alone does not show why a model predicted flooding. GradCAM and GradCAM++ generate heatmaps that highlight regions that influenced the prediction. This makes the result easier to inspect and helps users identify whether the model is focusing on water, submerged land, roads, buildings, vegetation, or other visual patterns.

The heatmaps should be treated as **visual explanations**, not as a guaranteed flood boundary or a substitute for professional surveying.

More information about the notebook and model outputs is available in [`MODEL_NOTEBOOK_SUMMARY.md`](MODEL_NOTEBOOK_SUMMARY.md).

---

## 🔄 System Workflow

```text
1. User uploads an aerial or satellite image
             ↓
2. FastAPI receives the image
             ↓
3. ResNet-50 predicts flood or non-flood
             ↓
4. GradCAM and GradCAM++ generate explanations
             ↓
5. The frontend displays confidence and risk information
             ↓
6. Impact metrics and map layers provide decision support
             ↓
7. Users can inspect infrastructure, plan recovery, or submit reports
             ↓
8. Results can be exported as PDF, GeoJSON, or CSV
```

The damage result is saved in two places:

- Browser `localStorage`, for navigation between frontend modules.
- `latest_damage.json`, through the `/latest_damage` backend endpoint.

This allows the Infrastructure, Recovery, and Reporting pages to use the most recent damage-analysis result.

---

## 🗂️ Repository Structure

```text
FLOODxplain-fullstack/
├── main.py                      # FastAPI application and backend endpoints
├── requirements.txt             # Python dependencies
├── Procfile                     # Deployment command for platforms such as Heroku
├── latest_damage.json           # Latest saved damage-analysis result
├── reports.json                 # Persisted field reports
├── MODEL_NOTEBOOK_SUMMARY.md    # Summary of the model training notebook
├── model/                       # Model inference package expected by main.py
│   └── predictor.py             # Image prediction and XAI inference logic
└── static/
    ├── index.html               # Home page and project overview
    ├── damage.html              # Damage assessment and batch analysis
    ├── infrastructure.html      # Infrastructure map and facility status
    ├── recovery.html             # Recovery planning and safe zones
    ├── reporting.html            # Crowdsourced reporting interface
    ├── app.js                    # Shared frontend utilities and API helpers
    └── style.css                 # Shared application styling
```

> The model files are distributed separately because trained weights can be large. Download or configure them before using the prediction endpoint.

---

## 🛠️ Technology Stack

### Backend

- Python
- FastAPI
- Uvicorn
- Python multipart uploads
- JSON-based local persistence

### Machine learning

- PyTorch
- Torchvision
- Pillow
- NumPy
- OpenCV
- GradCAM/GradCAM++ inference through the model package

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- Leaflet.js
- Esri satellite tiles
- Carto dark labels
- OpenStreetMap Nominatim geocoding
- OpenStreetMap Overpass API for permanent-water data

### Deployment

The included `Procfile` starts the application with:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## 🚀 Getting Started

### Prerequisites

Install the following before running the project:

- Python 3.10 or newer is recommended.
- Git.
- A trained model package and model weights.
- Internet access for map tiles, geocoding, and OpenStreetMap water-layer requests.

### 1. Clone the repository

```bash
git clone https://github.com/AlapatiPhani/FLOODxplain-fullstack.git
cd FLOODxplain-fullstack
```

### 2. Create a virtual environment

#### Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

#### macOS or Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Add the model files

The backend imports the prediction function using:

```python
from model.predictor import predict as p
```

Therefore, the repository must contain a working `model` package with a `predictor.py` module and the required trained weights.

The model files are available from the project’s shared model folder:

**Model download folder:**

<https://drive.google.com/drive/folders/1kl594vmjowHRGzTNYVL7ywYr_ufbW-4U?usp=drive_link>

After downloading, place the model package and weights in the location expected by `model/predictor.py`.

A typical layout may look like this:

```text
model/
├── __init__.py
├── predictor.py
└── floodxplain_model.pth
```

The exact filenames and paths should match the implementation of `model/predictor.py`.

### 5. Start the development server

```bash
uvicorn main:app --reload
```

Or run the Python entry point directly:

```bash
python main.py
```

The application will normally be available at:

```text
http://127.0.0.1:8000
```

Open the API documentation at:

```text
http://127.0.0.1:8000/docs
```

### 6. Use the application

1. Open the home page.
2. Go to **Damage Assessment**.
3. Upload a JPG, PNG, or WEBP aerial image.
4. Review the classification, probabilities, metrics, and heatmaps.
5. Open Infrastructure or Recovery to view the connected result.
6. Open Reporting to submit and inspect field reports.

---

## 🔌 Backend API Reference

### `GET /`

Returns the main frontend page.

### `POST /predict`

Analyzes one image.

**Request:** multipart form upload with the field name `file`.

Example using `curl`:

```bash
curl -X POST "http://127.0.0.1:8000/predict" \\
  -F "file=@path/to/aerial-image.jpg"
```

The response is produced by the model predictor and is expected to contain values such as:

```json
{
  "label": "Flooded",
  "severity": "HIGH",
  "confidence": 96.9,
  "flood_prob": 96.9,
  "safe_prob": 3.1,
  "gradcam": "<base64 PNG>",
  "gradcampp": "<base64 PNG>"
}
```

### `POST /predict_batch`

Analyzes multiple images in one request.

**Request:** multipart form upload with one or more files using the field name `files`.

```bash
curl -X POST "http://127.0.0.1:8000/predict_batch" \\
  -F "files=@image-1.jpg" \\
  -F "files=@image-2.jpg"
```

Each result includes the filename, result index, classification information, and a map coordinate used by the batch visualization.

### `POST /latest_damage`

Saves the latest damage-analysis result as JSON.

### `GET /latest_damage`

Returns the latest saved damage-analysis result.

### `GET /infrastructure`

Returns infrastructure summary statistics and facility markers for hospitals, bridges, and roads.

### `GET /recovery`

Returns recovery statistics and configured risk-zone data.

### `POST /submit_report`

Accepts a JSON field report, evaluates it using the verification rules, saves it to `reports.json`, and returns the verification result.

Example request:

```json
{
  "location": "Rajahmundry",
  "severity": "High",
  "description": "People are stranded near the flooded bridge and rescue support is required.",
  "name": "Anonymous",
  "assigned_to": "Control Room",
  "lat": 17.0000,
  "lng": 81.7900
}
```

### `GET /get_reports`

Returns the most recent saved reports. The frontend displays up to ten reports.

---

## 📤 Export Options

The frontend provides several export formats:

- **PDF report:** human-readable damage-analysis briefing with model output, metrics, and XAI heatmaps.
- **GeoJSON:** point-based geographic representation of an analysis result.
- **Batch GeoJSON:** geographic collection of batch predictions.
- **Batch CSV:** tabular summary of batch filenames, classifications, probabilities, severity, and coordinates.

These exports are useful for sharing analysis results with response teams or loading them into GIS software.

---

## ⚠️ Important Limitations

This project is a research and decision-support prototype. It should not be used as the only source for emergency decisions.

Important limitations include:

- Model predictions depend on image quality, location, season, lighting, and similarity to the training data.
- The classifier performs binary image classification; it is not a complete flood-depth or damage-segmentation system.
- Impact metrics shown in the frontend are estimated and should be validated with authoritative data.
- Some infrastructure, recovery, safe-zone, and rescue data are configured demonstration data in `main.py` or frontend files.
- The report verification system is rule-based and does not independently confirm that a report is true.
- Coordinates assigned to batch results are demonstration locations generated by the backend.
- Maps and geocoding require external network services and may be unavailable or rate-limited.
- Permanent-water masking depends on OpenStreetMap/Overpass availability and data quality.
- JSON persistence is suitable for a prototype but is not a replacement for a production database.
- Uploaded images and reports should be handled according to applicable privacy and security requirements.

Always confirm important results with satellite products, field teams, government sources, and emergency-management authorities.

---

## 🧪 Development Notes

### Reset local application data

To clear the latest saved analysis, replace the contents of `latest_damage.json` with an empty JSON object:

```json
{}
```

To clear saved reports, replace the contents of `reports.json` with:

```json
[]
```

Also clear the browser key `fxp_latest_damage` from local storage if an old result continues to appear in the frontend.

### Adding a new frontend module

1. Create a new HTML file under `static/`.
2. Include `style.css`, Leaflet if mapping is required, and `app.js`.
3. Add a navigation link to the existing pages.
4. Add a backend endpoint in `main.py` if the module needs server data.
5. Keep shared API calls and map helpers in `static/app.js` where possible.

### Production improvements to consider

- Add authentication and authorization.
- Replace JSON files with PostgreSQL or another managed database.
- Store uploaded files in object storage.
- Add request validation using Pydantic models.
- Add automated tests for the API and verification logic.
- Add structured logging and monitoring.
- Pin dependency versions in `requirements.txt`.
- Add model versioning and evaluation metrics.
- Add rate limiting and upload-size limits.
- Use a production ASGI process manager.
- Add proper data licensing and attribution documentation.

---

## 👥 Project Team

The frontend identifies this as a VIT-AP University project developed by:

- **Satyam Ponnada** — Lead
- **Phani Alapati** — Deep Learning
- **Mihir Datta** — Explainable AI

---

## 📚 Supporting Documentation

- [Model notebook summary](MODEL_NOTEBOOK_SUMMARY.md)
- [FastAPI backend](main.py)
- [Python dependencies](requirements.txt)
- [Deployment process file](Procfile)
- [Model download folder](https://drive.google.com/drive/folders/1kl594vmjowHRGzTNYVL7ywYr_ufbW-4U?usp=drive_link)

---

## 📄 License

No license file is currently included in this repository. Until a license is added, the project should be treated as **all rights reserved**. Add an appropriate license before redistributing or using the code in another project.

---

## 🙌 Contributing

Contributions and improvements are welcome. A typical contribution workflow is:

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Update the documentation when behavior changes.
5. Open a pull request with a clear description.

For bug reports, include the operating system, Python version, setup steps, error message, and a minimal reproduction where possible.
