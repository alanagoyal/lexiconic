# Untranslatable words website

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/alanagoyals-projects/v0-untranslatable-words-website)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/F6Bxwfap95r)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/alanagoyals-projects/v0-untranslatable-words-website](https://vercel.com/alanagoyals-projects/v0-untranslatable-words-website)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/F6Bxwfap95r](https://v0.app/chat/projects/F6Bxwfap95r)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Data + Embeddings workflow

- Base dataset: `public/data/words.json` (source of truth, no embeddings)
- Precomputed dataset: `public/data/words-with-embeddings.json` (used by the app)

### Generate embeddings

- Run `npm run generate:embeddings` to produce
  `public/data/words-with-embeddings.json` using OpenAI
  `text-embedding-3-small`.
- Requires `OPENAI_API_KEY` in the environment.

### CI automation

- A GitHub Action at `.github/workflows/generate-embeddings.yml` runs on pushes
  that modify `public/data/words.json`, regenerates embeddings, and commits the
  updated `public/data/words-with-embeddings.json` back to the branch.
- Set repository secret `OPENAI_API_KEY` for the workflow.
