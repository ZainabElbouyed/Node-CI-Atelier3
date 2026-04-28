pipeline {
    agent any
    
    // ===== TOOLS Node.js (APRÈS installation du plugin) =====
    tools {
        nodejs 'NodeJS-18'
    }
    
    // ===== VARIABLES D'ENVIRONNEMENT =====
    environment {
        NODE_ENV = 'production'
        PORT = '3000'
        CI = 'true'
    }
    
    stages {
        
        // ===== BEFORE SCRIPT =====
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
                
                bat '''
                    echo === VERSIONS ===
                    node --version
                    npm --version
                '''
                
                echo '📦 Installation des dépendances...'
                bat 'npm install'
                
                echo '✅ Before script terminé'
            }
        }
        
        // ===== STAGE 1: INITIAL TEMPLATE CREATION =====
        stage('Initial Template Creation') {
            steps {
                echo '📋 Pipeline Jenkins - Équivalent .gitlab-ci.yml'
                echo "Projet: ${env.JOB_NAME}"
                echo "Date: " + new Date()
            }
        }
        
        // ===== STAGE 2: CHECKOUT GITHUB =====
        stage('Checkout from GitHub') {
            steps {
                echo '📦 Récupération depuis GitHub...'
                git url: 'https://github.com/ZainabElbouyed/Node-CI-Atelier3.git',
                    branch: 'master'
            }
        }
        
        // ===== STAGE 3: BUILD =====
        stage('Build') {
            steps {
                echo '🔨 Build de l\'application...'
                bat 'npm run build || echo "Aucun script build"'
                stash name: 'node-app', includes: '**/*'
            }
            post {
                success { echo '✅ Build réussi' }
                failure { echo '❌ Build échoué' }
            }
        }
        
        // ===== STAGE 4: TEST (avec allow_failure) =====
        stage('Test with Variables') {
            steps {
                echo '🧪 Exécution des tests avec Mocha...'
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
                    echo '📊 Rapport de tests généré'
                }
                unstable {
                    echo '⚠️ Tests optionnels échoués - pipeline continue (allow_failure)'
                }
            }
        }
        
        // ===== STAGE 5: PACKAGE + CACHE =====
        stage('Package with Cache') {
            steps {
                echo '📦 Préparation pour déploiement...'
                bat 'npm prune --production'
                stash name: 'node-prod', includes: '**/*'
            }
            post {
                success {
                    archiveArtifacts artifacts: 'node_modules/**/*', 
                                   allowEmptyArchive: true
                    echo '✅ Package préparé'
                }
            }
        }
        
        // ===== STAGE 6: RAPPORT JUNIT =====
        stage('JUnit Reports') {
            steps {
                echo '📊 Génération du rapport de tests...'
                bat 'npm test -- --reporter mocha-junit-reporter --reporter-options mochaFile=junit.xml || echo "Rapport non généré"'
            }
            post {
                always {
                    junit testResults: 'junit.xml', 
                           allowEmptyResults: true
                    
                    // Syntaxe CORRECTE de publishHTML
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
        
        // ===== STAGE 7: DEPLOY =====
        stage('Deploy') {
            steps {
                echo '🚀 Déploiement sur le serveur web...'
                unstash 'node-prod'
                
                powershell '''
                    Write-Host "=== DÉPLOIEMENT ==="
                    
                    # Arrêt de l'ancienne application
                    Write-Host "Arrêt de l'ancienne application..."
                    pm2 stop demo 2>$null
                    pm2 delete demo 2>$null
                    
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
                }
            }
        }
        
        // ===== STAGE 8: ALLOW FAILURE - SMOKE TEST =====
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
                            } catch {
                                Write-Host "⚠️ $url - Non accessible (test optionnel)"
                            }
                        }
                    '''
                }
            }
            post {
                unstable {
                    echo '⚠️ Smoke test échoué - pipeline continue'
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
            
            powershell 'pm2 list'
        }
        
        success {
            echo ''
            echo '╔══════════════════════════════════════════════════════════════╗'
            echo '║     🎉🎉🎉 PIPELINE NODE.JS RÉUSSI ! 🎉🎉🎉                    ║'
            echo '╠══════════════════════════════════════════════════════════════╣'
            echo '║   ✅ Initial Template Creation                               ║'
            echo '║   ✅ Checkout depuis GitHub                                  ║'
            echo '║   ✅ Build                                                   ║'
            echo '║   ✅ Variables + Test (allow_failure)                        ║'
            echo '║   ✅ Package + Cache                                         ║'
            echo '║   ✅ JUnit Reports                                           ║'
            echo '║   ✅ DEPLOY                                                  ║'
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
