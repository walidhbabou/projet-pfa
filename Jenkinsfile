pipeline {
    agent any
    
    options {
        timestamps()
        timeout(time: 45, unit: 'MINUTES')
    }
    
    environment {
        DOCKERHUB_USER = 'walidhbabou'
        DOCKERHUB_REPO_FRONTEND = 'chatbootfsts-frontend'
        DOCKERHUB_REPO_BACKEND = 'chatbootfsts-backend'
        DOCKERHUB_REPO_RASA = 'chatbootfsts-rasa'
        KUBE_NAMESPACE = 'chatbootfsts'
        SSH_SERVER = 'ubuntu@44.215.111.1'
    }
    
    stages {
        stage('Cleanup & Health Check') {
            steps {
                echo '===> Nettoyage et vérification'
                script {
                    sh """
                        # Nettoie Docker
                        docker system prune -f || true
                        
                        # Vérifie l'espace disque
                        df -h /
                        AVAILABLE=\$(df / | tail -1 | awk '{print \$4}' | sed 's/G//')
                        if [ "\$AVAILABLE" -lt 3 ]; then
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
        
        stage('Build & Push Images') {
            steps {
                echo '===> Build et Push des images Docker'
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-creds') {
                        
                        // Frontend (le plus léger)
                        echo "🚀 Building Frontend..."
                        def frontendImage = docker.build("${DOCKERHUB_USER}/${DOCKERHUB_REPO_FRONTEND}:latest", "./frontend")
                        frontendImage.push()
                        sh "docker rmi ${DOCKERHUB_USER}/${DOCKERHUB_REPO_FRONTEND}:latest || true"
                        
                        // Backend
                        echo "🚀 Building Backend..."
                        def backendImage = docker.build("${DOCKERHUB_USER}/${DOCKERHUB_REPO_BACKEND}:latest", "./backend")
                        backendImage.push()
                        sh "docker rmi ${DOCKERHUB_USER}/${DOCKERHUB_REPO_BACKEND}:latest || true"
                        
                        // RASA (en dernier car plus lourd)
                        echo "🚀 Building RASA..."
                        def rasaImage = docker.build("${DOCKERHUB_USER}/${DOCKERHUB_REPO_RASA}:latest", "./rasa_bot")
                        rasaImage.push()
                        sh "docker rmi ${DOCKERHUB_USER}/${DOCKERHUB_REPO_RASA}:latest || true"
                        
                        // Nettoyage final
                        sh "docker system prune -f || true"
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                echo '===> Déploiement sur Kubernetes'
                sshagent(['ssh-key-devops']) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ${SSH_SERVER} '
                        echo "🔄 Mise à jour des images..."
                        kubectl set image deployment/frontend frontend=${DOCKERHUB_USER}/${DOCKERHUB_REPO_FRONTEND}:latest -n ${KUBE_NAMESPACE}
                        kubectl set image deployment/backend backend=${DOCKERHUB_USER}/${DOCKERHUB_REPO_BACKEND}:latest -n ${KUBE_NAMESPACE}
                        kubectl set image deployment/rasa rasa=${DOCKERHUB_USER}/${DOCKERHUB_REPO_RASA}:latest -n ${KUBE_NAMESPACE}
                        
                        echo "🔄 Redémarrage des deployments..."
                        kubectl rollout restart deployment/frontend -n ${KUBE_NAMESPACE}
                        kubectl rollout restart deployment/backend -n ${KUBE_NAMESPACE}
                        kubectl rollout restart deployment/rasa -n ${KUBE_NAMESPACE}
                        
                        echo "⏳ Attente du déploiement..."
                        kubectl rollout status deployment/frontend -n ${KUBE_NAMESPACE} --timeout=300s
                        kubectl rollout status deployment/backend -n ${KUBE_NAMESPACE} --timeout=300s
                        kubectl rollout status deployment/rasa -n ${KUBE_NAMESPACE} --timeout=300s
                        
                        echo "✅ Vérification finale..."
                        kubectl get pods -n ${KUBE_NAMESPACE}
                        kubectl get svc -n ${KUBE_NAMESPACE}
                    '
                    """
                }
            }
        }
    }
    
    post {
        always {
            sh "docker system prune -f || true"
        }
        success {
            echo '✅ Déploiement réussi !'
        }
        failure {
            echo '❌ Échec du déploiement. Vérifiez les logs.'
        }
    }
}
