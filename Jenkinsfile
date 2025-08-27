pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                echo '📦 Checking out code...'
                // Jenkins automatically handles GitHub checkout for Multibranch Pipeline
                checkout scm
            }
        }
        
        stage('Build Backend') {
            steps {
                echo '🐍 Building Python backend...'
                dir('backend') {
                    sh '''
                        python3 -m venv venv
                        . venv/bin/activate
                        pip install -r requirements.txt
                        echo "Backend dependencies installed successfully!"
                    '''
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                echo '⚛️ Building React frontend...'
                dir('frontend') {
                    sh '''
                        npm install
                        npm run build
                        echo "Frontend build completed successfully!"
                    '''
                }
            }
        }
        
        stage('Test Backend') {
            steps {
                echo '🧪 Testing Python backend...'
                dir('backend') {
                    sh '''
                        . venv/bin/activate
                        # Run basic import test
                        python -c "import main; print('✅ Backend imports working')"
                        
                        # If you have actual tests, uncomment below:
                        # pip install pytest
                        # pytest --junitxml=test-results.xml
                    '''
                }
            }
            post {
                always {
                    // Publish test results if they exist
                    publishTestResults testResultsPattern: 'backend/test-results.xml', allowEmptyResults: true
                }
            }
        }
        
        stage('Test Frontend') {
            steps {
                echo '🧪 Testing React frontend...'
                dir('frontend') {
                    sh '''
                        # Check if build was successful
                        if [ -d "build" ]; then
                            echo "✅ Frontend build directory exists"
                        else
                            echo "❌ Frontend build failed"
                            exit 1
                        fi
                        
                        # If you want to run actual tests, uncomment below:
                        # npm test -- --coverage --watchAll=false --testResultsProcessor=jest-junit
                    '''
                }
            }
            post {
                always {
                    // Publish test results if they exist
                    publishTestResults testResultsPattern: 'frontend/junit.xml', allowEmptyResults: true
                }
            }
        }
        
        stage('Archive Artifacts') {
            steps {
                echo '📦 Archiving build artifacts...'
                // Archive frontend build
                archiveArtifacts artifacts: 'frontend/build/**/*', allowEmptyArchive: true
                
                // Archive backend files if needed
                archiveArtifacts artifacts: 'backend/**/*.py', allowEmptyArchive: true
            }
        }
    }
    
    post {
        success {
            echo '🎉 Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
        always {
            echo '🧹 Cleaning up workspace...'
            cleanWs()
        }
    }
}