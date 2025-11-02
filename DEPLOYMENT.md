# WeatherGuard - Deployment Instructions

Complete step-by-step guide to deploy your WeatherGuard application to GitHub and GitHub Pages.

---

## Part 1: Push to GitHub Repository

### Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and log in to your account

2. Click the **"+"** icon in the top-right corner and select **"New repository"**

3. Fill in the repository details:
   - **Repository name:** `emergencyalerts-ux-redesign`
   - **Description:** "Emergency-first weather application with government design system - UX/UI redesign project"
   - **Visibility:** Public (required for free GitHub Pages)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

4. Click **"Create repository"**

### Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these in your terminal:

```bash
# Navigate to your project directory
cd "/Users/paulalawton/Desktop/2 WEATHERUX:UI"

# Add the remote repository (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/emergencyalerts-ux-redesign.git

# Verify the remote was added
git remote -v
```

### Step 3: Push Your Code to GitHub

```bash
# Push your code to GitHub
git push -u origin main
```

**If prompted for credentials:**
- Username: Your GitHub username
- Password: Use a Personal Access Token (not your GitHub password)

**To create a Personal Access Token:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "WeatherGuard Project")
4. Select scope: Check "repo" (full control of private repositories)
5. Click "Generate token"
6. Copy the token and use it as your password

### Step 4: Verify Upload

1. Go to `https://github.com/YOUR-USERNAME/emergencyalerts-ux-redesign`
2. You should see all your files:
   - index.html
   - styles.css
   - app.js
   - README.md
   - .gitignore

---

## Part 2: Deploy to GitHub Pages

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub:
   `https://github.com/YOUR-USERNAME/emergencyalerts-ux-redesign`

2. Click on **"Settings"** (top navigation bar)

3. Scroll down the left sidebar and click **"Pages"** (under "Code and automation")

4. Under **"Source"**, select:
   - **Branch:** `main`
   - **Folder:** `/ (root)`

5. Click **"Save"**

6. Wait 1-2 minutes for deployment

### Step 2: Get Your Live URL

After GitHub Pages is enabled, you'll see a message at the top:

```
Your site is live at https://YOUR-USERNAME.github.io/emergencyalerts-ux-redesign/
```

**Your live demo URL will be:**
```
https://YOUR-USERNAME.github.io/emergencyalerts-ux-redesign/
```

### Step 3: Verify Deployment

1. Click on the live URL or copy-paste it into your browser

2. You should see the WeatherGuard application running

3. Test functionality:
   - Click "Detect Location" (you may need to allow location access)
   - Or enter a city/ZIP code (e.g., "San Francisco, CA" or "10001")
   - View weather alerts, current conditions, and forecasts

---

## Part 3: Update README with Live Links

### Update the README

1. Open your local `README.md` file

2. Find this section near the top:
   ```markdown
   ## Live Demo

   **Repository URL:** `https://github.com/[your-username]/emergencyalerts-ux-redesign`
   **Live Demo URL:** `https://[your-username].github.io/emergencyalerts-ux-redesign/`
   ```

3. Replace `[your-username]` with your actual GitHub username:
   ```markdown
   ## Live Demo

   **Repository URL:** `https://github.com/yourusername/emergencyalerts-ux-redesign`
   **Live Demo URL:** `https://yourusername.github.io/emergencyalerts-ux-redesign/`
   ```

4. Save the file

### Commit and Push the Update

```bash
# Stage the updated README
git add README.md

# Commit the change
git commit -m "Update README with live demo links"

# Push to GitHub
git push origin main
```

---

## Part 4: Share with Your Professor

### Information to Provide

**Repository URL (for code review):**
```
https://github.com/YOUR-USERNAME/emergencyalerts-ux-redesign
```

**Live Demo URL (for testing):**
```
https://YOUR-USERNAME.github.io/emergencyalerts-ux-redesign/
```

### Example Email Template

```
Subject: WeatherGuard UX Redesign Project Submission

Dear Professor [Name],

I have completed the WeatherGuard emergency weather system redesign project.

Project Repository:
https://github.com/YOUR-USERNAME/emergencyalerts-ux-redesign

Live Demo:
https://YOUR-USERNAME.github.io/emergencyalerts-ux-redesign/

This project demonstrates:
- Emergency-first UX design principles
- Government design system implementation
- Real-time API integration with NOAA/NWS
- Responsive mobile-first development
- Accessibility best practices

The README includes detailed documentation of UX decisions and design improvements.

Please let me know if you have any questions or need additional information.

Best regards,
[Your Name]
```

---

## Troubleshooting

### Issue: GitHub Pages Not Working

**Solution:**
1. Go to Settings → Pages
2. Ensure Source is set to "main" branch and "/ (root)" folder
3. Wait 2-3 minutes after making changes
4. Check the Actions tab for deployment status
5. Clear your browser cache and try again

### Issue: 404 Error on GitHub Pages

**Solution:**
1. Ensure `index.html` is in the root directory (not in a subfolder)
2. File name must be exactly `index.html` (lowercase)
3. Check repository visibility is set to "Public"

### Issue: Weather Data Not Loading

**Solution:**
1. Check browser console for errors (F12)
2. Ensure you have internet connection
3. NOAA API may be temporarily down - try again later
4. Check if browser blocks geolocation (https required for geolocation)

### Issue: Location Detection Not Working

**Solution:**
1. GitHub Pages uses HTTPS, which is required for geolocation
2. Click "Allow" when browser asks for location permission
3. If blocked, use manual location search instead

---

## Making Updates After Deployment

Whenever you make changes to your project:

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "Description of changes"

# Push to GitHub
git push origin main
```

GitHub Pages will automatically rebuild and deploy your changes within 1-2 minutes.

---

## Project File Checklist

Ensure all these files are in your repository:

- [x] index.html - Main application page
- [x] styles.css - Complete styling
- [x] app.js - JavaScript functionality
- [x] README.md - Project documentation
- [x] .gitignore - Git ignore file
- [x] DEPLOYMENT.md - This deployment guide

---

## Additional Resources

**GitHub Documentation:**
- [GitHub Pages Guide](https://docs.github.com/en/pages)
- [Creating a Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

**Weather API:**
- [NOAA Weather API Documentation](https://www.weather.gov/documentation/services-web-api)

**Design Resources:**
- [U.S. Web Design System](https://designsystem.digital.gov/)

---

## Quick Reference Commands

```bash
# Check git status
git status

# View commit history
git log --oneline

# Check remote repository
git remote -v

# Pull latest changes from GitHub
git pull origin main

# View current branch
git branch

# Create and push a new branch
git checkout -b feature-name
git push -u origin feature-name
```

---

## Success Checklist

- [ ] GitHub repository created: `emergencyalerts-ux-redesign`
- [ ] Code pushed to GitHub successfully
- [ ] GitHub Pages enabled and deployed
- [ ] Live demo URL is working
- [ ] All features are functional on live site
- [ ] README updated with live links
- [ ] Links shared with professor

---

**Congratulations!** Your WeatherGuard application is now live and ready to share.

For any issues or questions, refer to the troubleshooting section or check GitHub documentation.

---

*Last Updated: November 2024*
