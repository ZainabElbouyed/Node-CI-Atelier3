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
                
                // Afficher les fichiers pour vérification
                bat 'dir'
                bat 'type package.json'
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
                failure { 
                    echo '❌ Échec installation'
                    bat 'dir'
                }
            }
        }
        
        stage('Test with Allow Failure') {
            steps {
                echo '🧪 Exécution des tests...'
                echo "NODE_ENV: ${env.NODE_ENV}"
                echo "PORT: ${env.PORT}"
                
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    bat 'npm test'
                }
            }
            post {
                always {
                    junit testResults: 'test-results.xml', 
                           allowEmptyResults: true
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
                echo '📊 Génération du rapport de tests...'
                bat 'npm test -- --reporter mocha-junit-reporter --reporter-options mochaFile=junit.xml || echo "Rapport non généré"'
            }
            post {
                always {
                    junit testResults: 'junit.xml', 
                           allowEmptyResults: true
                    
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
                    Write-Host "Arrêt de l'ancienne application..."
                    pm2 stop demo 2>$null
                    pm2 delete demo 2>$null
                    
                    # Installation de PM2 si nécessaire
                    Write-Host "Vérification PM2..."
                    try { npm install -g pm2 } catch { Write-Host "PM2 déjà installé" }
                    
                    # Installation des dépendances de production
                    Write-Host "Installation des dépendances..."
                    npm install --production
                    
                    # Démarrage avec PM2
                    Write-Host "Démarrage de l'application..."
                    pm2 start server.js --name demo --env production
                    pm2 save
                    
                    # Attente du démarrage
                    Start-Sleep -Seconds 5
                    
                    # Vérification
                    try {
                        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
                        Write-Host "✅ Application démarrée sur le port 3000"
                        Write-Host "✅ Status: $($response.StatusCode)"
                    } catch {
                        Write-Host "⚠️ Application non encore accessible"
                        Write-Host "Logs PM2:"
                        pm2 logs demo --lines 10 --nostream
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
                    echo 'Vérifiez que le serveur est accessible'
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
                        
                        $urls = @(
                            "http://localhost:3000/",
                            "http://localhost:3000/health"
                        )
                        
                        foreach ($url in $urls) {
                            try {
                                $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
                                Write-Host "✅ $url - Status: $($response.StatusCode)"
                                if ($url -eq "http://localhost:3000/") {
                                    Write-Host "   Réponse: $($response.Content)"
                                }
                            } catch {
                                Write-Host "⚠️ $url - Non accessible (test optionnel)"
                            }
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
            
            // Ajout d'un try/catch pour éviter l'erreur PM2
            powershell '''
                try {
                    pm2 list
                } catch {
                    Write-Host "PM2 non disponible"
                }
            '''
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
