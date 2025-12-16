# Vercel Deployment Guide

## Configuration

The project is configured to deploy the `client` folder to Vercel. The `vercel.json` file in the root directory specifies:
- **Root Directory**: `client` (where the Next.js app is located)
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

## Deployment Steps

1. **Connect your repository to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your Git repository

2. **Configure Project Settings**
   - Vercel should automatically detect the `vercel.json` configuration
   - If not, manually set:
     - **Root Directory**: `client`
     - **Framework Preset**: Next.js
     - **Build Command**: `npm run build`
     - **Output Directory**: `.next`

3. **Set Environment Variables**
   In Vercel project settings, add the following environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-api.com/api/v1
   ```
   Replace `https://your-backend-api.com/api/v1` with your actual backend API URL.

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your Next.js application

## Troubleshooting

### Build Fails
- Check that all dependencies are listed in `package.json`
- Ensure Node.js version is 18+ (specified in `package.json` engines)
- Check build logs in Vercel dashboard for specific errors

### Environment Variables
- Make sure `NEXT_PUBLIC_API_URL` is set in Vercel project settings
- Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser

### Root Directory Issues
- If deployment fails, verify the `rootDirectory` in `vercel.json` is set to `client`
- Alternatively, set it manually in Vercel project settings

## Notes

- The `client` folder contains the Next.js application
- The `backend` folder is excluded from the Vercel deployment (see `.vercelignore`)
- All API calls use the `NEXT_PUBLIC_API_URL` environment variable

