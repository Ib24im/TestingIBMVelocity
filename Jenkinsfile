pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                echo '📦 Checking out code...'
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
        
        stage('Test') {
            steps {
                echo '🧪 Running tests (if available)...'
                script {
                    // Backend tests (optional)
                    dir('backend') {
                        sh '''
                            . venv/bin/activate
                            if pip list | grep -q pytest; then
                                echo "Running pytest..."
                                pytest --junitxml=pytest-results.xml || true
                            else
                                echo "pytest not installed, skipping backend tests"
                            fi
                        '''
                    }
                    
                    // Frontend tests (optional)
                    dir('frontend') {
                        sh '''
                            if npm list jest-junit > /dev/null 2>&1; then
                                echo "Running Jest tests..."
                                npm test -- --coverage --watchAll=false --testResultsProcessor=jest-junit || true
                            else
                                echo "jest-junit not installed, skipping frontend tests"
                            fi
                        '''
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Collect test results
            junit allowEmptyResults: true, testResultsPattern: '**/junit*.xml, **/pytest*.xml, **/jest-junit*.xml'
            
            // Archive artifacts
            archiveArtifacts artifacts: 'frontend/build/**', allowEmptyArchive: true
            archiveArtifacts artifacts: 'backend/dist/**', allowEmptyArchive: true
            
            echo '🧹 Cleaning up...'
        }
        
        success {
            echo '🎉 Pipeline completed successfully!'
        }
        
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}