# CI/CD Setup for Child Breathing App

This document outlines the comprehensive CI/CD pipeline implemented for the Child Breathing App using GitHub Actions.

## Overview

The CI/CD pipeline consists of several workflows that handle different aspects of the development lifecycle:

1. **Main CI Pipeline** (`ci.yml`) - Core testing and quality checks
2. **Mobile Builds** (`android.yml`, `ios.yml`) - Platform-specific builds
3. **Code Quality** (`code-quality.yml`) - Advanced quality checks
4. **Dependencies & Security** (`dependencies.yml`) - Security scanning and updates
5. **Pull Request Checks** (`pr-checks.yml`) - PR validation
6. **Release Automation** (`release.yml`) - Automated releases

## Workflows

### 1. Main CI Pipeline (`ci.yml`)

**Triggers:** Push to `main`/`develop`, Pull Requests
**Jobs:**
- **Test**: Runs on Node.js 18 & 20
  - Linting with ESLint
  - TypeScript type checking
  - Jest tests with coverage
  - Coverage upload to Codecov
- **Security**: Security audits and dependency scanning
- **Code Quality**: SonarCloud analysis

### 2. Android Build (`android.yml`)

**Triggers:** Push to `main`, Tags, Pull Requests
**Features:**
- Gradle caching for faster builds
- Debug and Release APK builds
- Automated Google Play Store uploads (on tags)
- Artifact storage

### 3. iOS Build (`ios.yml`)

**Triggers:** Push to `main`, Tags, Pull Requests
**Features:**
- CocoaPods caching
- Xcode workspace builds
- TestFlight uploads (on tags)
- IPA artifact storage

### 4. Code Quality (`code-quality.yml`)

**Triggers:** Push, Pull Requests
**Features:**
- Prettier formatting checks
- Auto-fix formatting on PRs
- Bundle size analysis
- Coverage reporting with PR comments
- Performance benchmarks

### 5. Dependencies & Security (`dependencies.yml`)

**Triggers:** Daily schedule, Push, Pull Requests
**Features:**
- Automated dependency updates
- npm audit security checks
- Snyk vulnerability scanning
- CodeQL static analysis
- SARIF results upload

### 6. PR Checks (`pr-checks.yml`)

**Triggers:** Pull Request events
**Features:**
- Semantic PR title validation
- Breaking change detection
- Bundle size comparisons
- Automatic labeling

### 7. Release Automation (`release.yml`)

**Triggers:** Version tags, Manual dispatch
**Features:**
- Automated changelog generation
- GitHub release creation
- Multi-platform builds
- Store uploads
- Slack notifications

## Required Secrets

To fully utilize the CI/CD pipeline, configure these GitHub secrets:

### General
- `GITHUB_TOKEN` - Automatically provided by GitHub
- `CODECOV_TOKEN` - For coverage reporting
- `SONAR_TOKEN` - For SonarCloud analysis
- `SNYK_TOKEN` - For security scanning

### Android
- `ANDROID_KEYSTORE_FILE` - Base64 encoded keystore
- `ANDROID_KEY_ALIAS` - Keystore alias
- `ANDROID_STORE_PASSWORD` - Keystore password
- `ANDROID_KEY_PASSWORD` - Key password
- `GOOGLE_PLAY_SERVICE_ACCOUNT` - Service account JSON

### iOS
- `MATCH_PASSWORD` - Fastlane match password
- `APPSTORE_ISSUER_ID` - App Store Connect issuer ID
- `APPSTORE_API_KEY_ID` - API key ID
- `APPSTORE_API_PRIVATE_KEY` - Private key

### Notifications
- `SLACK_WEBHOOK_URL` - For release notifications

## Setup Instructions

### 1. Enable GitHub Actions
Ensure GitHub Actions is enabled in your repository settings.

### 2. Configure Branch Protection
Set up branch protection rules for `main`:
- Require status checks to pass
- Require up-to-date branches
- Include administrators in restrictions

### 3. Set Up External Services

#### Codecov
1. Sign up at [codecov.io](https://codecov.io)
2. Connect your GitHub repository
3. Add `CODECOV_TOKEN` to secrets

#### SonarCloud
1. Sign up at [sonarcloud.io](https://sonarcloud.io)
2. Import your project
3. Update `sonar-project.properties` with your project details
4. Add `SONAR_TOKEN` to secrets

#### Snyk
1. Sign up at [snyk.io](https://snyk.io)
2. Get your API token
3. Add `SNYK_TOKEN` to secrets

### 4. Mobile App Stores

#### Google Play Store
1. Create a service account in Google Cloud Console
2. Grant Play Console access
3. Download service account JSON
4. Add as `GOOGLE_PLAY_SERVICE_ACCOUNT` secret

#### Apple App Store
1. Create App Store Connect API key
2. Note issuer ID and key ID
3. Add secrets for iOS deployment

### 5. Configure Notifications
Set up Slack webhook for release notifications.

## Usage

### Running Tests Locally
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

### Creating Releases
1. **Automatic**: Push a version tag (e.g., `v1.0.0`)
2. **Manual**: Use GitHub Actions workflow dispatch

### PR Best Practices
- Use semantic commit messages
- Include tests for new features
- Update documentation
- Ensure CI passes before requesting review

## Monitoring

### Build Status
Monitor build status in the Actions tab of your GitHub repository.

### Coverage Reports
View coverage reports at [codecov.io](https://codecov.io) after builds complete.

### Code Quality
Check code quality metrics at [sonarcloud.io](https://sonarcloud.io).

### Security
Review security findings in the Security tab of your repository.

## Troubleshooting

### Common Issues

#### Build Failures
1. Check the Actions logs for specific error messages
2. Verify all required secrets are configured
3. Ensure dependencies are up to date

#### Test Failures
1. Run tests locally to reproduce issues
2. Check for environment-specific problems
3. Verify mock configurations

#### Deployment Issues
1. Verify store credentials are valid
2. Check app signing configuration
3. Ensure proper permissions are set

### Getting Help
1. Check GitHub Actions documentation
2. Review workflow logs for detailed error information
3. Consult platform-specific documentation (Android/iOS)

## Maintenance

### Regular Tasks
- Review and update dependencies monthly
- Monitor security advisories
- Update workflow versions quarterly
- Review and optimize build times

### Performance Optimization
- Use caching effectively
- Parallelize independent jobs
- Optimize test suites for speed
- Monitor build resource usage