pipeline {
    agent any
    
    options {
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
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
        stage('Cleanup & Health Check') {
            steps {
                echo '===> Nettoyage et vérification'
                script {
                    sh """
                        # Nettoie Docker et mémoire
                        docker system prune -f || true
                        sync && echo 1 > /proc/sys/vm/drop_caches 2>/dev/null || true
                        
                        # Vérifie les ressources
                        echo "=== RESSOURCES DISPONIBLES ==="
                        free -h
                        df -h /
                        
                        # Check espace disque
                        AVAILABLE=\$(df / | tail -1 | awk '{print \$4}' | sed 's/G//')
                        if [ "\$AVAILABLE" -lt 2 ]; then
                            echo "❌ Espace disque insuffisant: \${AVAILABLE}GB"
                            exit 1
                        fi
                        echo "✅ Espace disque OK: \${AVAILABLE}GB"
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

        stage('Validate Files') {
            steps {
                echo '===> Validation des fichiers'
                script {
                    sh """
                        # Vérifier les fichiers critiques
                        echo "=== VALIDATION DES FICHIERS ==="
                        ls -la ./frontend/
                        test -f ./frontend/package.json || (echo "❌ package.json manquant" && exit 1)
                        test -f ./frontend/dockerfile || test -f ./frontend/Dockerfile || (echo "❌ Dockerfile manquant" && exit 1)
                        
                        echo "✅ Frontend files OK"
                        
                        ls -la ./backend/
                        test -f ./backend/requirements.txt || (echo "❌ requirements.txt manquant" && exit 1)
                        test -f ./backend/dockerfile || test -f ./backend/Dockerfile || (echo "❌ Dockerfile manquant" && exit 1)
                        
                        echo "✅ Backend files OK"
                        
                        ls -la ./rasa_bot/
                        test -f ./rasa_bot/requirements.txt || (echo "❌ requirements.txt manquant" && exit 1)
                        test -f ./rasa_bot/dockerfile || test -f ./rasa_bot/Dockerfile || (echo "❌ Dockerfile manquant" && exit 1)
                        
                        echo "✅ RASA files OK"
                    """
                }
            }
        }
        
        stage('Build & Push Images Optimisé') {
            steps {
                echo '===> Build et Push des images Docker (Optimisé)'
                script {
                    try {
                        docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-creds') {
                            
                            // Frontend avec optimisations
                            echo "🚀 Building Frontend avec optimisations..."
                            sh """
                                docker build --memory=300m --memory-swap=600m \
                                --build-arg NODE_OPTIONS='--max_old_space_size=512' \
                                -t ${DOCKERHUB_USER}/${DOCKERHUB_REPO_FRONTEND}:latest ./frontend
                            """
                            sh "docker push ${DOCKERHUB_USER}/${DOCKERHUB_REPO_FRONTEND}:latest"
                            sh "docker rmi ${DOCKERHUB_USER}/${DOCKERHUB_REPO_FRONTEND}:latest || true"
                            sh "docker system prune -f"
                            
                            // Pause et nettoyage mémoire
                            echo "⏳ Pause pour libérer la mémoire..."
                            sleep 15
                            sh "sync && echo 1 > /proc/sys/vm/drop_caches 2>/dev/null || true"
                            
                            // Backend
                            echo "🚀 Building Backend..."
                            sh """
                                docker build --memory=300m --memory-swap=700m \
                                -t ${DOCKERHUB_USER}/${DOCKERHUB_REPO_BACKEND}:latest ./backend
                            """
                            sh "docker push ${DOCKERHUB_USER}/${DOCKERHUB_REPO_BACKEND}:latest"
                            sh "docker rmi ${DOCKERHUB_USER}/${DOCKERHUB_REPO_BACKEND}:latest || true"
                            sh "docker system prune -f"
                            
                            // Pause avant RASA
                            echo "⏳ Pause avant RASA..."
                            sleep 20
                            sh "sync && echo 1 > /proc/sys/vm/drop_caches 2>/dev/null || true"
                            
                            // RASA avec optimisations maximales
                            echo "🚀 Building RASA avec optimisations maximales..."
                            sh """
                                docker build --memory=400m --memory-swap=1g --shm-size=128m \
                                -t ${DOCKERHUB_USER}/${DOCKERHUB_REPO_RASA}:latest ./rasa_bot
                            """
                            sh "docker push ${DOCKERHUB_USER}/${DOCKERHUB_REPO_RASA}:latest"
                            sh "docker rmi ${DOCKERHUB_USER}/${DOCKERHUB_REPO_RASA}:latest || true"
                            
                            // Nettoyage final
                            sh "docker system prune -a --volumes -f"
                        }
                    } catch (err) {
                        echo "❌ Erreur pendant le build : ${err}"
                        
                        // Debug en cas d'erreur
                        sh """
                            echo "=== DEBUG BUILD ERROR ==="
                            free -h
                            df -h
                            docker images
                            docker ps -a
                        """
                        
                        // Nettoie quand même
                        sh "docker system prune -a -f || true"
                        throw err
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
                            # Crée le namespace s'il n'existe pas
                            kubectl create namespace ${KUBE_NAMESPACE} || true
                            
                            # Vérification des deployments
                            if kubectl get deployment frontend -n ${KUBE_NAMESPACE} >/dev/null 2>&1; then
                                echo "🔄 Mise à jour des images existantes..."
                                kubectl set image deployment/frontend frontend=${DOCKERHUB_USER}/${DOCKERHUB_REPO_FRONTEND}:latest -n ${KUBE_NAMESPACE}
                                kubectl set image deployment/backend backend=${DOCKERHUB_USER}/${DOCKERHUB_REPO_BACKEND}:latest -n ${KUBE_NAMESPACE}
                                kubectl set image deployment/rasa rasa=${DOCKERHUB_USER}/${DOCKERHUB_REPO_RASA}:latest -n ${KUBE_NAMESPACE}
                                
                                kubectl rollout restart deployment/frontend -n ${KUBE_NAMESPACE}
                                kubectl rollout restart deployment/backend -n ${KUBE_NAMESPACE}
                                kubectl rollout restart deployment/rasa -n ${KUBE_NAMESPACE}
                                
                                kubectl rollout status deployment/frontend -n ${KUBE_NAMESPACE} --timeout=300s
                                kubectl rollout status deployment/backend -n ${KUBE_NAMESPACE} --timeout=300s
                                kubectl rollout status deployment/rasa -n ${KUBE_NAMESPACE} --timeout=300s
                            else
                                echo "⚠️ Deployments non trouvés. Créez d'abord vos manifests Kubernetes."
                                echo "📋 Namespace ${KUBE_NAMESPACE} créé et prêt."
                            fi
                            
                            echo "✅ Vérification finale..."
                            kubectl get pods -n ${KUBE_NAMESPACE} || echo "Aucun pod trouvé"
                            kubectl get svc -n ${KUBE_NAMESPACE} || echo "Aucun service trouvé"
                        '
                        """
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo "🔹 Nettoyage final"
            sh "docker system prune -f || true"
            sh "sync && echo 1 > /proc/sys/vm/drop_caches 2>/dev/null || true"
        }
        success {
            echo '✅ Déploiement réussi !'
        }
        failure {
            echo '❌ Échec du déploiement. Vérifiez les logs.'
            sh """
                echo "=== DEBUG INFO ==="
                free -h || true
                df -h || true
                docker images || true
                docker ps -a || true
            """
        }
    }
}
