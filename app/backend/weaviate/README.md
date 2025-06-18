# Weaviate Vector Database Repository

This directory hosts scripts and configurations for setting up and interacting with a Weaviate vector database. Weaviate is a cloud-native, modular, real-time vector search engine that is used to store document represntations as embeddings, along with all other (meta)data pulled from research-paper databases.

## Overview

The directory consists of various Python scripts and a Docker Compose file to manage the Weaviate instance:

- `connect_weaviate.py`: Script to connect to the Weaviate instance. Run it before use weaviate.
- `import_docu2weaviate.py`: Imports documents into Weaviate.
- `import_npy.py`: Script for importing numpy arrays into Weaviate.
- `read_csv.py`: Processes CSV files, for data import.
- `docker-compose.yml`: Docker configuration for Weaviate setup.

## Setup and Connection

1. **Starting Weaviate:**
   Use Docker Compose to start the Weaviate service. Note that starting the service on the LRZ server requires a different docker-compose file, as the volume location differs.

   To start the sercvice locally use:
   ```bash
   docker compose up -d
   ```

   To start the sercvice on the LRZ server, use:
   ```bash
   docker-compose -f docker-compose-lrz.yml up
   ```

2. **use importDatasetToWeaviate:**
you can call the function from the root folder(app) with
"python3 -m backend.weaviate.importDatasetToWeaviate"

if you use pyenv for multiple python versions
Run the commands below in your terminal before running pyenv install <VERSION> / pyenv global 3.11 / python --version

eval "$(command pyenv init -)"
eval "$(command pyenv init --path)"