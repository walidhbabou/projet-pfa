pipeline {
    agent any
    
    options {
        timestamps()
        timeout(time: 90, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
    
    environment {
        DOCKERHUB_USER = 'walidhbabou'
        DOCKERHUB_REPO_FRONTEND = 'chatbootfsts-frontend'
        DOCKERHUB_REPO_BACKEND = 'chatbootfsts-backend'
        DOCKERHUB_REPO_RASA = 'chatbootfsts-rasa'
        KUBE_NAMESPACE = 'chatbootfsts'
        SSH_SERVER = 'ubuntu@44.215.111.1'
        DOCKER_BUILDKIT = '1'
    }
    
    stages {
        stage('Extreme Cleanup') {
            steps {
                echo '===> Nettoyage EXTREME'
                script {
                    sh """
                        # Stop et supprime TOUT Docker
                        docker stop \$(docker ps -aq) 2>/dev/null || true
                        docker rm \$(docker ps -aq) 2>/dev/null || true
                        docker rmi \$(docker images -q) 2>/dev/null || true
                        docker volume prune -f
                        docker network prune -f
                        docker system prune -a --volumes -f
                        
                        # Nettoie les caches système
                        rm -rf /tmp/* 2>/dev/null || true
                        sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true
                        
                        echo "=== RESSOURCES APRÈS NETTOYAGE ==="
                        free -h
                        df -h /
                        
                        # Vérification stricte
                        AVAILABLE=\$(df / | tail -1 | awk '{print \$4}' | sed 's/G//')
                        echo "Espace disponible: \${AVAILABLE}GB"
                        if [ "\$AVAILABLE" -lt 3 ]; then
                            echo "❌ CRITIQUE: Seulement \${AVAILABLE}GB libres!"
                            echo "🚨 AUGMENTEZ LE VOLUME EBS À 20GB MINIMUM!"
                            exit 1
                        fi
                        echo "✅ Espace OK pour continuer: \${AVAILABLE}GB"
                    """
                }
            }
        }
        
        stage('Checkout') {
            steps {
                echo '===> Récupération du code'
                checkout scmGit(
                    branches: [[name: '*/main']],
                    extensions: [],
                    userRemoteConfigs: [[credentialsId: 'github-token', url: 'https://github.com/walidhbabou/projet-pfa.git']]
                )
            }
        }
        
        stage('Build Frontend Only') {
            steps {
                echo '===> Build Frontend UNIQUEMENT'
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-creds') {
                        echo "🚀 Building Frontend..."
                        sh """
                            docker build --cache-from=${DOCKERHUB_USER}/${DOCKERHUB_REPO_FRONTEND}:latest \
                            --memory=400m --memory-swap=800m \
                            --build-arg NODE_OPTIONS='--max_old_space_size=512' \
                            -t ${DOCKERHUB_USER}/${DOCKERHUB_REPO_FRONTEND}:latest ./frontend
                        """
                        sh "docker push ${DOCKERHUB_USER}/${DOCKERHUB_REPO_FRONTEND}:latest"
                        sh "docker rmi ${DOCKERHUB_USER}/${DOCKERHUB_REPO_FRONTEND}:latest"
                        sh "docker system prune -f"
                    }
                }
            }
        }
        
        stage('Build Backend Only') {
            steps {
                echo '===> Build Backend UNIQUEMENT'
                script {
                    sh "sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true"
                    sleep 30
                    
                    docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-creds') {
                        echo "🚀 Building Backend..."
                        sh """
                            docker build --cache-from=${DOCKERHUB_USER}/${DOCKERHUB_REPO_BACKEND}:latest \
                            --memory=400m --memory-swap=800m \
                            -t ${DOCKERHUB_USER}/${DOCKERHUB_REPO_BACKEND}:latest ./backend
                        """
                        sh "docker push ${DOCKERHUB_USER}/${DOCKERHUB_REPO_BACKEND}:latest"
                        sh "docker rmi ${DOCKERHUB_USER}/${DOCKERHUB_REPO_BACKEND}:latest"
                        sh "docker system prune -f"
                    }
                }
            }
        }
        
        stage('Build RASA Only') {
            steps {
                echo '===> Build RASA UNIQUEMENT (Critique)'
                script {
                    // Nettoyage maximal avant RASA
                    sh """
                        docker system prune -a --volumes -f
                        rm -rf /tmp/* 2>/dev/null || true
                        sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true
                        
                        echo "=== RESSOURCES AVANT RASA ==="
                        free -h
                        df -h /
                        
                        AVAILABLE=\$(df / | tail -1 | awk '{print \$4}' | sed 's/G//')
                        if [ "\$AVAILABLE" -lt 2 ]; then
                            echo "❌ Pas assez d'espace pour RASA: \${AVAILABLE}GB"
                            echo "🚨 VOUS DEVEZ AUGMENTER LE VOLUME!"
                            exit 1
                        fi
                    """
                    
                    sleep 60  // Pause longue
                    
                    docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-creds') {
                        echo "🚀 Building RASA avec optimisations MAXIMALES..."
                        try {
                            sh """
                                docker build --memory=500m --memory-swap=1500m --shm-size=64m \
                                --ulimit nofile=1024:1024 \
                                -t ${DOCKERHUB_USER}/${DOCKERHUB_REPO_RASA}:latest ./rasa_bot
                            """
                            sh "docker push ${DOCKERHUB_USER}/${DOCKERHUB_REPO_RASA}:latest"
                            sh "docker rmi ${DOCKERHUB_USER}/${DOCKERHUB_REPO_RASA}:latest"
                        } catch (Exception e) {
                            echo "❌ RASA build failed: ${e.getMessage()}"
                            echo "🚨 SOLUTION: Augmentez le volume EBS à 20GB!"
                            throw e
                        } finally {
                            sh "docker system prune -a --volumes -f || true"
                        }
                    }
                }
            }
        }
        
        stage('Check Disk Space') {
            steps {
                script {
                    def availableSpace = sh(script: "df / | tail -1 | awk '{print \$4}'", returnStdout: true).trim()
                    if (availableSpace.toInteger() < 3000000) { // Moins de 3 Go disponibles
                        error "❌ Pas assez d'espace disque disponible (${availableSpace} KB). Augmentez la taille du disque."
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                echo '===> Déploiement sur Kubernetes'
                script {
                    sshagent(['ssh-key-devops']) {
                        sh """
                        ssh -o StrictHostKeyChecking=no ${SSH_SERVER} '
                            kubectl create namespace ${KUBE_NAMESPACE} || true
                            
                            if kubectl get deployment frontend -n ${KUBE_NAMESPACE} >/dev/null 2>&1; then
                                kubectl set image deployment/frontend frontend=${DOCKERHUB_USER}/${DOCKERHUB_REPO_FRONTEND}:latest -n ${KUBE_NAMESPACE}
                                kubectl set image deployment/backend backend=${DOCKERHUB_USER}/${DOCKERHUB_REPO_BACKEND}:latest -n ${KUBE_NAMESPACE}
                                kubectl set image deployment/rasa rasa=${DOCKERHUB_USER}/${DOCKERHUB_REPO_RASA}:latest -n ${KUBE_NAMESPACE}
                                
                                kubectl rollout restart deployment/frontend -n ${KUBE_NAMESPACE}
                                kubectl rollout restart deployment/backend -n ${KUBE_NAMESPACE}
                                kubectl rollout restart deployment/rasa -n ${KUBE_NAMESPACE}
                            else
                                echo "⚠️ Deployments non trouvés - Namespace prêt"
                            fi
                            
                            kubectl get pods -n ${KUBE_NAMESPACE} || true
                        '
                        """
                    }
                }
            }
        }
    }
    
    post {
        always {
            sh "docker system prune -a -f || true"
        }
        failure {
            echo '🚨 ÉCHEC - AUGMENTEZ LE VOLUME EBS À 20GB!'
            sh """
                echo "=== DIAGNOSTIC FINAL ==="
                df -h / || true
                free -h || true
                echo "🔧 SOLUTION: aws ec2 modify-volume --volume-id vol-xxxxx --size 20"
            """
        }
        success {
            echo '✅ Build réussi malgré les contraintes d\'espace!'
        }
    }
}
