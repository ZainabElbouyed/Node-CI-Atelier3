pipeline {
    agent any

    tools {
        nodejs 'NodeJS-18'
    }

    environment {
        NODE_ENV = 'production'
        PORT = '5000'
        CI = 'true'
    }

    stages {

        stage('Before Script - Préparation') {
            steps {
                echo '========================================='
                echo '🔧 BEFORE SCRIPT - INITIALISATION'
                echo '========================================='

                cleanWs()

                bat '''
                    if not exist logs mkdir logs
                    if not exist reports mkdir reports
                '''

                bat 'node --version'
                bat 'npm --version'
            }
        }

        stage('Initial Template Creation') {
            steps {
                echo '📋 Pipeline Jenkins - Équivalent .gitlab-ci.yml'
                echo "Projet: ${env.JOB_NAME}"
                echo "Date: ${new Date()}"
            }
        }

        stage('Checkout from GitHub') {
            steps {
                git url: 'https://github.com/ZainabElbouyed/Node-CI-Atelier3.git',
                    branch: 'master'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installation des dépendances...'
                bat 'npm install'
                stash name: 'node-app', includes: '**/*'
            }
        }

        stage('Test with Allow Failure') {
            steps {
                echo '🧪 Exécution des tests...'

                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    bat '''
                        if not exist test-results mkdir test-results

                        npx mocha "tests/**/*.js" --exit ^
                        --reporter mocha-junit-reporter ^
                        --reporter-options mochaFile=test-results/junit.xml
                    '''
                }
            }

            post {
                always {
                    junit testResults: 'test-results/*.xml',
                        allowEmptyResults: true
                }
            }
        }
        stage('JUnit Reports') {
            steps {
                bat 'if not exist reports mkdir reports'

                publishHTML([
                    reportDir: 'reports',
                    reportFiles: 'index.html',
                    reportName: 'Rapport de Tests Mocha',
                    allowMissing: true,
                    alwaysLinkToLastBuild: true,
                    keepAll: false
                ])
            }
        }

        stage('Deploy') {
            steps {
                echo '🚀 Déploiement sur le serveur web...'
                unstash 'node-app'

                bat 'npm install --omit=dev'

                bat '''
                    echo === DEPLOY ===
                    
                    echo Arrêt du processus existant...
                    for /f "tokens=2" %%i in (\'tasklist /fi "IMAGENAME eq node.exe" /fo csv ^| findstr "node.exe"\') do (
                        taskkill /F /PID %%~i 2>nul
                    )
                    
                    if not exist logs mkdir logs
                    
                    echo Démarrage de l'application...
                    start /B node server.js > logs/app.log 2>&1
                    
                    echo Attente du démarrage...
                    timeout /t 5 > nul
                    
                    echo Vérification...
                    node -e "require('http').get('http://localhost:5000/health', (r) => {console.log('Status:', r.statusCode); process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => {console.log('Error'); process.exit(1)})"
                '''
            }
        }

        stage('Smoke Test - Allow Failure') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    echo '🧪 Smoke test (allow_failure activé)...'
                    bat '''
                        echo === SMOKE TEST ===
                        timeout /t 3 > nul
                        node -e "require('http').get('http://localhost:5000/health', (r) => {console.log('✅ Status:', r.statusCode); process.exit(0)}).on('error', (e) => {console.log('⚠️ Erreur:', e.message); process.exit(0)})"
                    '''
                }
            }
        }
    }

    post {
        always {
            echo '========================================='
            echo '🏁 AFTER SCRIPT - NETTOYAGE'
            echo '========================================='
            echo "Statut: ${currentBuild.result}"
            echo "Build #: ${env.BUILD_NUMBER}"

            archiveArtifacts artifacts: 'logs/**/*.log',
                             allowEmptyArchive: true
        }

        success {
            echo ''
            echo '╔════════════════════════════════════════════════════╗'
            echo '║     🎉 PIPELINE NODE.JS RÉUSSI ! 🎉                ║'
            echo '╠════════════════════════════════════════════════════╣'
            echo '║   ✅ Before Script                                 ║'
            echo '║   ✅ Initial Template Creation                     ║'
            echo '║   ✅ Checkout GitHub                               ║'
            echo '║   ✅ Install Dependencies                          ║'
            echo '║   ✅ Test (allow_failure)                          ║'
            echo '║   ✅ Deploy                                        ║'
            echo '║   ✅ Smoke Test                                    ║'
            echo '║   ✅ After Script                                  ║'
            echo '║                                                      ║'
            echo '║   🌐 Application: http://localhost:5000            ║'
            echo '╚════════════════════════════════════════════════════╝'
        }

        failure {
            echo '💥 PIPELINE ÉCHOUÉ'
        }
    }
}