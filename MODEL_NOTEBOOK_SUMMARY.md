# FloodXplain Model Notebook Summary

Source notebook: `notebookceaf8d836e.ipynb`

This file summarizes the Kaggle notebook used for the FloodXplain deep learning and XAI model pipeline.

## Project Title

FloodXplain: post-flood impact analysis using Deep learning and XAI

## Dataset

- Dataset: Kaggle Flood Classification Dataset
- Dataset path used in notebook:
  `/kaggle/input/datasets/dhawalsrivastava2583/flood-classification-dataset/Dataset`
- Classes:
  - `Flood Images`
  - `Non Flood Images`

## Model

- Architecture: ResNet-50
- Training approach: ImageNet-pretrained transfer learning
- Final layer: replaced with a 2-class classifier
- Output task: binary flood/non-flood image classification

## Training Setup

- Train/validation split: 80/20
- Batch size: 32
- Optimizer: Adam
- Learning rate: 0.0001
- Loss function: CrossEntropyLoss
- Epochs: 3
- Input transform:
  - Resize to 224 x 224
  - Convert to tensor
  - Normalize using ImageNet mean and standard deviation

## XAI Methods

The notebook generates explainability heatmaps using:

- GradCAM
- GradCAM++

Target layer:

- `model.layer4[-1]`

These heatmaps are used to show which parts of the aerial image influenced the flood/non-flood prediction.

## Notebook Outputs

The notebook saves the following outputs in Kaggle working storage:

- `floodxplain_model.pth`
- `training_curves.png`
- `confusion_matrix.png`
- `gradcam_comparison.png`

## Application Usage

The deployed project uses the trained ResNet-50 model for flood image classification and returns:

- Predicted class
- Confidence score
- Flood probability
- Safe probability
- Risk severity
- GradCAM heatmap
- GradCAM++ heatmap

These outputs support the project modules for damage assessment, infrastructure impact, recovery planning, and field reporting.

## System Workflow

1. Input Image
   Satellite or drone imagery is uploaded for flood-scene analysis.

2. Deep Learning Prediction
   ResNet-50 classifies the image as flood or non-flood and returns class confidence.

3. XAI Explanation
   GradCAM and GradCAM++ generate heatmaps showing the regions that influenced the prediction.

4. Impact Metrics
   The prediction is connected to estimated flood area, buildings, roads, crops, and risk indicators.

5. Report and Decision Support
   The app displays maps, recovery information, citizen reports, and exportable field reports.
