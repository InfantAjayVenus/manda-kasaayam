# GitHub Actions Setup for npm Publishing

## Prerequisites

1. **Update package.json repository URL**:
   Make sure the repository URL in your `package.json` points to your actual GitHub repository:
   ```json
   "repository": {
     "type": "git",
     "url": "https://github.com/YOUR_USERNAME/manda-kasaayam.git"
   }
   ```

2. **Create npm Access Token**:
   - Go to [npmjs.com](https://www.npmjs.com)
   - Navigate to Account → Access Tokens
   - Click "Generate New Token"
   - Select "Automation" type (for CI/CD)
   - Copy the generated token

3. **Add npm Token to GitHub Secrets**:
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm access token

## How It Works

### CI/CD Pipeline
- **On push to main**: Runs tests on Node.js 18, 20, and 22
- **On new release**: Runs tests, builds, and publishes to npm

### Publishing Process
1. Create a new release on GitHub
2. The workflow automatically:
   - Runs all tests
   - Builds the TypeScript project
   - Publishes to npm using the version from package.json

### Version Management
- Update the version in `package.json` before creating a release
- Use semantic versioning (1.0.0, 1.0.1, 1.1.0, 2.0.0, etc.)
- The workflow uses the version from package.json for npm publishing

## Testing the Workflow

1. Push to main branch to test CI:
   ```bash
   git add .
   git commit -m "Add GitHub Actions workflow"
   git push origin main
   ```

2. Check the Actions tab in GitHub to see the test results

3. When ready to publish:
   ```bash
   # Update version
   npm version patch  # or minor, major
   
   # Push the version change
   git push origin main --tags
   
   # Create a release on GitHub
   # Go to Releases → Create a new release
   # Choose the tag that was just created
   ```

## Workflow Features

- ✅ Multi-version Node.js testing (18, 20, 22)
- ✅ pnpm caching for faster builds
- ✅ Automated testing on every push
- ✅ Automated npm publishing on releases
- ✅ Proper binary executable handling
- ✅ Security with npm token secrets