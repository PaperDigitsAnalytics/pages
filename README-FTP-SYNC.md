# FTP Sync Setup Guide

This guide explains how to set up FTP synchronization to deploy your static website files to your web server.

## Quick Start

1. **Create FTP configuration file:**
   ```bash
   cp ftp-config.example.json ftp-config.json
   ```

2. **Edit `ftp-config.json` with your FTP credentials:**
   ```json
   {
     "host": "your-ftp-server.com",
     "user": "your-username",
     "password": "your-password",
     "secure": false,
     "port": 21,
     "remotePath": "/public_html",
     "localPath": "static-export"
   }
   ```

3. **Export and sync:**
   ```bash
   npm run deploy
   ```

## Available Commands

- `npm run export` - Generate static files to `static-export/` folder
- `npm run sync` - Sync `static-export/` folder to FTP server
- `npm run deploy` - Export and sync in one command
- `npm run sync:verbose` - Sync with detailed FTP logging

## Configuration Options

- **host**: Your FTP server hostname or IP address
- **user**: FTP username
- **password**: FTP password
- **secure**: Use FTPS (true) or regular FTP (false)
- **port**: FTP port (usually 21 for FTP, 990 for FTPS)
- **remotePath**: Remote directory path on the server (e.g., `/public_html` or `/www`)
- **localPath**: Local directory to sync (default: `static-export`)

## Local Development

To view your website locally:

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Open in browser:**
   - CMS: http://localhost:3001/cms.html
   - Blog overview: http://localhost:3001/index.html

## Workflow

1. Make changes to your blog posts via the CMS (http://localhost:3001/cms.html)
2. Export static files: `npm run export`
3. Preview locally by opening `static-export/index.html` in your browser
4. Sync to server: `npm run sync`
5. Or do both at once: `npm run deploy`

## Security Note

The `ftp-config.json` file is excluded from git (via `.gitignore`) to protect your credentials. Never commit this file to version control.



