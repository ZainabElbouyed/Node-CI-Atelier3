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
                    echo === CRÉATION DES DOSSIERS ===
                    if not exist logs mkdir logs
                    if not exist reports mkdir reports
                    echo === DOSSIERS CRÉÉS ===
                '''
                
                bat 'node --version'
                bat 'npm --version'
                
                echo '✅ Before script terminé'
            }
        }
        
        stage('Initial Template Creation') {
            steps {
                echo '📋 Pipeline Jenkins - Équivalent .gitlab-ci.yml'
                echo "Projet: ${env.JOB_NAME}"
                echo "Date: " + new Date()
            }
        }
        
        stage('Checkout from GitHub') {
            steps {
                echo '📦 Récupération depuis GitHub...'
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
            post {
                success { echo '✅ Dépendances installées' }
            }
        }
        
        stage('Test with Allow Failure') {
            steps {
                echo '🧪 Exécution des tests...'
                echo "NODE_ENV: ${env.NODE_ENV}"
                echo "PORT: ${env.PORT}"
                
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    // Exécuter les tests avec génération du rapport JUnit
                    bat 'npx mocha --exit tests/* --reporter mocha-junit-reporter --reporter-options mochaFile=junit.xml || npx mocha --exit tests/*'
                }
            }
            post {
                always {
                    // Publication du rapport JUnit
                    junit testResults: 'junit.xml', 
                           allowEmptyResults: true
                }
                unstable {
                    echo '⚠️ Tests optionnels échoués - pipeline continue (allow_failure)'
                }
            }
        }
        
        stage('JUnit Reports') {
            steps {
                echo '📊 Publication des rapports de tests...'
            }
            post {
                always {
                    // S'assurer que le dossier reports existe
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
        }
        
        stage('Deploy') {
            steps {
                echo '🚀 Déploiement sur le serveur web...'
                unstash 'node-app'
                
                powershell '''
                    Write-Host "=== DÉPLOIEMENT ==="
                    
                    # Arrêt de l'ancienne application
                    try { pm2 stop demo 2>$null } catch { }
                    try { pm2 delete demo 2>$null } catch { }
                    
                    # Installation des dépendances de production
                    Write-Host "Installation des dépendances..."
                    npm install --production
                    
                    # Démarrage avec PM2
                    Write-Host "Démarrage de l'application..."
                    pm2 start server.js --name demo
                    pm2 save
                    
                    Start-Sleep -Seconds 5
                    
                    try {
                        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
                        Write-Host "✅ Application démarrée sur le port 3000"
                        Write-Host "✅ Status: $($response.StatusCode)"
                    } catch {
                        Write-Host "⚠️ Application non encore accessible"
                    }
                '''
            }
            post {
                success {
                    echo '🎉 Déploiement réussi'
                    echo '🌐 Application: http://localhost:3000'
                }
                failure {
                    echo '❌ Échec du déploiement'
                }
            }
        }
        
        stage('Smoke Test - Allow Failure') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    echo '🧪 Smoke test (allow_failure activé)...'
                    powershell '''
                        Write-Host "=== SMOKE TEST ==="
                        Start-Sleep -Seconds 3
                        
                        try {
                            $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
                            Write-Host "✅ Application accessible: $($response.StatusCode)"
                        } catch {
                            Write-Host "⚠️ Application non accessible (test optionnel)"
                        }
                    '''
                }
            }
            post {
                unstable {
                    echo '⚠️ Smoke test échoué - pipeline continue (allow_failure)'
                }
            }
        }
    }
    
    // ===== AFTER SCRIPT GLOBAL =====
    post {
        always {
            echo '========================================='
            echo '🏁 AFTER SCRIPT - NETTOYAGE'
            echo '========================================='
            echo "Statut: ${currentBuild.result}"
            echo "Build #: ${env.BUILD_NUMBER}"
            
            archiveArtifacts artifacts: 'logs/**/*.log', 
                           allowEmptyArchive: true
            
            // Version sans erreur pour PM2
            bat 'echo "Pipeline terminé"'
        }
        
        success {
            echo ''
            echo '╔══════════════════════════════════════════════════════════════╗'
            echo '║     🎉🎉🎉 PIPELINE NODE.JS RÉUSSI ! 🎉🎉🎉                    ║'
            echo '╠══════════════════════════════════════════════════════════════╣'
            echo '║   ✅ Initial Template Creation                               ║'
            echo '║   ✅ Checkout depuis GitHub                                  ║'
            echo '║   ✅ Install Dependencies                                    ║'
            echo '║   ✅ Test (allow_failure)                                    ║'
            echo '║   ✅ JUnit Reports                                           ║'
            echo '║   ✅ DEPLOY                                                  ║'
            echo '║   ✅ Smoke Test                                              ║'
            echo '║   ✅ Before/After Scripts                                    ║'
            echo '║                                                              ║'
            echo '║   🌐 Application: http://localhost:3000                      ║'
            echo '║   📦 Projet: Node-CI-Atelier3                                ║'
            echo '╚══════════════════════════════════════════════════════════════╝'
        }
        
        failure {
            echo ''
            echo '╔════════════════════════════════════════╗'
            echo '║     💥 PIPELINE ÉCHOUÉ 💥              ║'
            echo '╠════════════════════════════════════════╣'
            echo "║ Échec au stage: ${env.STAGE_NAME}      ║"
            echo '╚════════════════════════════════════════╝'
        }
    }
}
