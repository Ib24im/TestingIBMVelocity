# Jenkins Setup for IBM Velocity Integration

This document explains how to set up Jenkins to work with your GitHub repository and integrate with IBM Velocity.

## Prerequisites

1. Jenkins server with the following plugins installed:
   - Pipeline plugin
   - GitHub plugin
   - NodeJS plugin
   - Python plugin
   - HTML Publisher plugin
   - Cobertura plugin
   - JUnit plugin
   - HTTP Request plugin

2. IBM Velocity instance configured and accessible

## Jenkins Configuration Steps

### 1. Install Required Jenkins Plugins

Go to Jenkins Dashboard > Manage Jenkins > Manage Plugins and install:

```
- Pipeline
- GitHub Integration Plugin
- NodeJS Plugin
- Python Plugin
- HTML Publisher Plugin
- Cobertura Plugin
- JUnit Plugin
- HTTP Request Plugin
- Credentials Plugin
```

### 2. Configure Global Tools

**Configure NodeJS:**
1. Go to Manage Jenkins > Global Tool Configuration
2. Under NodeJS, click "Add NodeJS"
3. Name: `NodeJS-18`
4. Version: `18.x.x`
5. Save

**Configure Python:**
1. Under Python, click "Add Python"
2. Name: `Python-3.9`
3. Version: `3.9.x`
4. Save

### 3. Set up Credentials

**GitHub Credentials:**
1. Go to Manage Jenkins > Manage Credentials
2. Click on "System" > "Global credentials"
3. Click "Add Credentials"
4. Kind: Username with password or SSH Username with private key
5. ID: `github-credentials`
6. Add your GitHub username/password or SSH key

**IBM Velocity Token:**
1. Add new credentials
2. Kind: Secret text
3. Secret: Your IBM Velocity API token
4. ID: `velocity-token`

### 4. Create Pipeline Job

1. Click "New Item" in Jenkins
2. Enter name: `todo-app-pipeline`
3. Select "Pipeline"
4. Click OK

### 5. Configure Pipeline Job

**General Tab:**
- Check "GitHub project"
- Project url: `https://github.com/yourusername/TestingIBMVelocity`

**Build Triggers:**
- Check "GitHub hook trigger for GITScm polling"
- Check "Poll SCM" (leave schedule empty for webhook-only)

**Pipeline Tab:**
- Definition: Pipeline script from SCM
- SCM: Git
- Repository URL: `https://github.com/yourusername/TestingIBMVelocity.git`
- Credentials: Select your GitHub credentials
- Branch Specifier: `*/main` (or `*/master`)
- Script Path: `Jenkinsfile`

### 6. Configure Environment Variables

In your Jenkins job or system configuration, add:

```
VELOCITY_URL=https://your-velocity-instance.com
```

### 7. Set up GitHub Webhook

1. Go to your GitHub repository
2. Settings > Webhooks
3. Click "Add webhook"
4. Payload URL: `http://your-jenkins-server/github-webhook/`
5. Content type: `application/json`
6. Select "Just the push event"
7. Check "Active"
8. Add webhook

## IBM Velocity Integration

The Jenkinsfile includes automatic integration with IBM Velocity through the `sendVelocityEvent` function. It sends:

- Build started/completed events
- Deployment events (staging/production)
- Test results
- Build status notifications

### Event Types Sent to Velocity:

1. **build_started** - When pipeline begins
2. **build_completed** - When pipeline finishes (success/failure)
3. **deployment_started** - When deployment begins
4. **deployment_completed** - When deployment finishes
5. **notification** - Status notifications

## Pipeline Stages

The Jenkinsfile includes these stages:

1. **Checkout** - Get code from GitHub
2. **Setup Environment** - Install dependencies (parallel: backend/frontend)
3. **Lint & Code Quality** - Run linting tools (parallel)
4. **Test** - Run unit tests with coverage (parallel)
5. **Security Scan** - Security vulnerability scanning (parallel)
6. **Build** - Build applications (parallel)
7. **Integration Tests** - End-to-end testing
8. **Deploy to Staging** - Deploy to staging (main branch only)
9. **Deploy to Production** - Deploy to production (tags only, with approval)

## Customization

### Environment Variables

You can customize these in the Jenkinsfile:

```groovy
environment {
    NODEJS_VERSION = '18'
    PYTHON_VERSION = '3.9'
    BACKEND_DIR = 'backend'
    FRONTEND_DIR = 'frontend'
    VELOCITY_URL = "${env.VELOCITY_URL}"
    VELOCITY_TOKEN = credentials('velocity-token')
    APP_NAME = 'todo-app'
}
```

### Deployment Commands

Update the deployment stages with your specific deployment commands:

```groovy
stage('Deploy to Staging') {
    steps {
        script {
            sh '''
                echo "Deploying to staging environment..."
                # Add your deployment commands here
                # Examples:
                # kubectl apply -f k8s/staging/
                # docker-compose -f docker-compose.staging.yml up -d
                # ansible-playbook deploy-staging.yml
            '''
        }
    }
}
```

### Notification Configuration

You can add additional notification methods in the `post` section:

```groovy
post {
    success {
        // Add Slack, email, or other notifications
        slackSend channel: '#deployments', 
                  message: "✅ Build ${env.BUILD_NUMBER} succeeded!"
    }
    failure {
        // Add failure notifications
        emailext to: 'team@company.com',
                 subject: "❌ Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                 body: "Build failed. Check Jenkins for details."
    }
}
```

## Troubleshooting

### Common Issues:

1. **Node/Python not found**: Make sure global tools are configured correctly
2. **Permission denied**: Check Jenkins user permissions for workspace
3. **GitHub webhook not triggering**: Verify webhook URL and Jenkins GitHub plugin configuration
4. **IBM Velocity events not sending**: Check VELOCITY_URL and velocity-token credentials

### Debug Tips:

1. Check Jenkins console output for detailed error messages
2. Verify environment variables are set correctly
3. Test API connections manually using curl
4. Check Jenkins logs: `/var/log/jenkins/jenkins.log`

## Security Considerations

1. Use Jenkins credentials store for sensitive data
2. Limit Jenkins permissions to minimum required
3. Use HTTPS for all external communications
4. Regularly update Jenkins and plugins
5. Implement proper network security (VPN, firewall rules)

## Next Steps

1. Commit the Jenkinsfile to your repository
2. Configure Jenkins as described above
3. Test the pipeline with a small change
4. Monitor builds in Jenkins and events in IBM Velocity
5. Customize deployment stages for your environment
