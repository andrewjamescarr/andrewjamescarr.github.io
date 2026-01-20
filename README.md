
***

# 📘 **README.md — User Manual & Documentation**

*for `andrewjamescarr.github.io`*

# Andrew James Carr — Personal Website

This repository contains the full source code and build pipeline for **<https://andrewjamescarr.github.io>**, a personal website built using **Jekyll**, styled using a **GitHub Pages remote theme**, and deployed using **GitHub Actions** on every GitHub Release.

***

## 📑 **Table of Contents**

1.  \#overview
2.  \#features
3.  \#technology-stack
4.  \#repository-structure
5.  \#local-development
6.  \#deployment-workflow
7.  \#how-releases-trigger-deployments
8.  \#version-page
9.  \#requirements
10. \#troubleshooting

***

# 🧭 Overview

This repository hosts the source code for my personal website:

👉 **<https://andrewjamescarr.github.io>**

The site is built using **Jekyll**, a static site generator widely used with GitHub Pages.  
All content is written in Markdown and HTML, and Jekyll transforms these into a static website.

The site is deployed using **GitHub Actions**, with deployments triggered **only when a GitHub Release is published**.

***

# ⭐ Features

### ✔ Jekyll-powered static site

Uses layouts, includes, Markdown rendering, and Liquid templates.

### ✔ Remote theme

The site uses a GitHub-hosted theme:

    remote_theme: pages-themes/modernist@v0.2.0

### ✔ GitHub Actions deployment

A fully automated CI/CD pipeline builds the site and deploys it to GitHub Pages.

### ✔ Release-based publishing

Only creating a Release on GitHub triggers a live deployment.

### ✔ Version page

A Jekyll page (`version.md`) displays version information and is automatically built and published.

***

# 🛠️ Technology Stack

| Component                 | Technology                              |
| ------------------------- | --------------------------------------- |
| **Static site generator** | Jekyll 4.x                              |
| **Theme**                 | `pages-themes/modernist` (remote theme) |
| **CI/CD**                 | GitHub Actions                          |
| **Hosting**               | GitHub Pages                            |
| **Language**              | Markdown, HTML, Liquid                  |
| **Dependency management** | Bundler (Gemfile)                       |

***

# 📁 Repository Structure

    .
    ├── _config.yml                 # Main Jekyll configuration
    ├── _layouts/                   # HTML layout templates
    ├── _includes/                  # Reusable HTML fragments
    ├── assets/                     # CSS / images
    ├── index.md                    # Homepage (Markdown)
    ├── version.md                  # Version page (Markdown)
    ├── Gemfile                     # Jekyll dependencies
    ├── CNAME                       # (Optional) custom domain
    └── .github/
        └── workflows/
            └── pages.yml          # GitHub Actions deployment pipeline

***

# 💻 Local Development

Choose either Docker (no system Ruby needed) or native Ruby.

### Option A: Quick start with Docker (recommended)

```bash
docker run --rm -v "$PWD":/srv/jekyll -w /srv/jekyll -e BUNDLE_PATH=vendor/bundle -p 4000:4000 jekyll/jekyll:4 bundle exec jekyll serve --livereload --host 0.0.0.0
```

Then open 👉 <http://localhost:4000> (LiveReload on port 35729).

### Option B: Native Ruby

1) Install Ruby 3.1+ (rbenv or system Ruby)

2) Install Bundler

```bash
gem install bundler
```

3) Install dependencies

```bash
bundle install
```

4) Run the Jekyll development server

```bash
bundle exec jekyll serve
```

5) Open 👉 <http://localhost:4000>

Any changes made to Markdown, layouts, or assets will auto‑reload.

***

# 🚀 Deployment Workflow

The site uses an Actions workflow:

    .github/workflows/pages.yml

This workflow:

1.  Checks out the repository

2.  Installs Ruby + Bundler

3.  Installs Jekyll + GitHub Pages plugins

4.  Builds the site using:

        bundle exec jekyll build -d _site

5.  Uploads the built site as an artifact

6.  Deploys the artifact to GitHub Pages environments

7.  Updates the live website

This ensures a clean, reproducible build every time.

***

# 🏁 How Releases Trigger Deployments

The workflow is triggered by:

```yaml
on:
  release:
    types: [published]
```

This means:

✔ Pushing commits does **not** deploy the website  
✔ Publishing a release **does** deploy the website

### Why this is useful:

*   Allows controlled, versioned deployments
*   Supports semantic versioning (e.g., `4.0.6`)
*   Enables rollback to previous releases
*   Keeps the live site stable

***

# 🔢 Version Page

The file `version.md` includes front matter:

```yaml
---
layout: default
title: Version
permalink: /version/
---
```

This generates the page:

👉 <https://andrewjamescarr.github.io/version/>

It can include any content, such as:

*   Current release version
*   Changelog
*   Deployment metadata
*   Notes for visitors

If desired, we can extend this to automatically inject the GitHub Release version into the page — just ask.

***

# 📦 Requirements

### To build locally:

*   Ruby 3.1+
*   Bundler
*   GitHub Pages gems (installed via Gemfile)
*   Jekyll 4.x
*   Internet access (to load the remote theme)

### To deploy:

*   Permission to create Releases in this repository
*   GitHub Actions must be enabled
*   GitHub Pages environment configured with:
    *   *Source: GitHub Actions*
    *   No restrictive branch protections blocking deployments

***

# 🩺 Troubleshooting


```

***

# 🙌 Contributions

This is a personal project, but suggestions or improvements are always welcome through Issues or Pull Requests.

***



