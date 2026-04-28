pipeline {
    agent any

    tools {
        nodejs 'NodeJS-18'
    }

    environment {
        NODE_ENV = 'production'
        PORT = '3000'
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
                        npx mocha --exit tests/* --reporter mocha-junit-reporter --reporter-options mochaFile=junit.xml || npx mocha --exit tests/*
                    '''
                }
            }

            post {
                always {
                    junit testResults: 'junit.xml',
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

                    pm2 stop demo || exit /b 0
                    pm2 delete demo || exit /b 0

                    pm2 start server.js --name demo
                    pm2 save

                    timeout /t 5 > nul

                    curl http://localhost:3000
                '''
            }
        }

        stage('Smoke Test - Allow Failure') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    bat '''
                        timeout /t 3 > nul
                        curl http://localhost:3000/health
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
            echo '🎉 PIPELINE NODE.JS RÉUSSI !'
        }

        failure {
            echo '💥 PIPELINE ÉCHOUÉ'
        }
    }
}