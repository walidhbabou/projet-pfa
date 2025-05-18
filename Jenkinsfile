pipeline {
    agent any

    options {
        timestamps() // Affiche les timestamps dans les logs
        timeout(time: 30, unit: 'MINUTES') // Ajout d'un timeout pour éviter les builds bloqués
    }

    environment {
        DOCKERHUB_USER = 'walidhbabou'
        DOCKERHUB_REPO_FRONTEND = 'chatbootfsts-frontend'
        DOCKERHUB_REPO_BACKEND = 'chatbootfsts-backend'
        DOCKERHUB_REPO_RASA = 'chatbootfsts-rasa'
        KUBE_NAMESPACE = 'chatbootfsts'
        SSH_SERVER = 'ubuntu@107.21.73.241'
    }

    stages {
        stage('Checkout') {
            steps {
                echo '===> Étape: Checkout'
                checkout scmGit(
                    branches: [[name: '*/main']],
                    extensions: [],
                    userRemoteConfigs: [[credentialsId: 'github-token', url: 'https://github.com/walidhbabou/projet-pfa.git']]
                )
            }
        }

        stage('Build & Push Docker Images') {
            steps {
                echo '===> Étape: Build & Push Docker Images'
                script {
                    try {
                        docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credentials') {
                            // Build et push frontend
                            def frontendImage = docker.build("${DOCKERHUB_USER}/${DOCKERHUB_REPO_FRONTEND}:latest", "./frontend")
                            frontendImage.push()
                            
                            // Build et push backend
                            def backendImage = docker.build("${DOCKERHUB_USER}/${DOCKERHUB_REPO_BACKEND}:latest", "./backend")
                            backendImage.push()
                            
                            // Build et push rasa
                            def rasaImage = docker.build("${DOCKERHUB_USER}/${DOCKERHUB_REPO_RASA}:latest", "./rasa_bot")
                            rasaImage.push()
                        }
                    } catch (err) {
                        echo "❌ Erreur pendant le build ou le push des images Docker : ${err}"
                        currentBuild.result = 'FAILURE'
                        error("Échec de l'étape Build & Push Docker Images")
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo '===> Étape: Deploy to Kubernetes'
                script {
                    try {
                        sshagent(['ssh-key-devops']) {
                            sh """
ssh -o StrictHostKeyChecking=no ${SSH_SERVER} '
  echo "Images avant mise à jour :"
  kubectl -n ${KUBE_NAMESPACE} get deployment frontend -o jsonpath="{.spec.template.spec.containers[0].image}"
  kubectl -n ${KUBE_NAMESPACE} get deployment backend -o jsonpath="{.spec.template.spec.containers[0].image}"
  kubectl -n ${KUBE_NAMESPACE} get deployment rasa -o jsonpath="{.spec.template.spec.containers[0].image}"
  
  echo "Mise à jour des images dans Kubernetes..."
  kubectl set image deployment/frontend frontend=${DOCKERHUB_USER}/${DOCKERHUB_REPO_FRONTEND}:latest -n ${KUBE_NAMESPACE} || exit 1
  kubectl set image deployment/backend backend=${DOCKERHUB_USER}/${DOCKERHUB_REPO_BACKEND}:latest -n ${KUBE_NAMESPACE} || exit 1
  kubectl set image deployment/rasa rasa=${DOCKERHUB_USER}/${DOCKERHUB_REPO_RASA}:latest -n ${KUBE_NAMESPACE} || exit 1

  echo "Redémarrage des déploiements..."
  kubectl rollout restart deployment/frontend -n ${KUBE_NAMESPACE}
  kubectl rollout restart deployment/backend -n ${KUBE_NAMESPACE}
  kubectl rollout restart deployment/rasa -n ${KUBE_NAMESPACE}

  echo "Status des rollouts :"
  kubectl rollout status deployment/frontend -n ${KUBE_NAMESPACE}
  kubectl rollout status deployment/backend -n ${KUBE_NAMESPACE}
  kubectl rollout status deployment/rasa -n ${KUBE_NAMESPACE}

  echo "Vérification des pods..."
  kubectl get pods -n ${KUBE_NAMESPACE} -w

  echo "✅ Déploiement Kubernetes terminé"
'
"""
                        }
                    } catch (err) {
                        echo "❌ Erreur lors du déploiement sur Kubernetes : ${err}"
                        currentBuild.result = 'FAILURE'
                        error("Échec de l'étape Deploy to Kubernetes")
                    }
                }
            }
        }
    }

    post {
        always {
            echo "🔹 Nettoyage après l'exécution du pipeline"
        }
        failure {
            echo '🚨 Le pipeline a échoué. Consultez les logs ci-dessus pour plus de détails.'
            // Ici vous pourriez ajouter une notification (email, Slack, etc.)
        }
        success {
            echo '✅ Déploiement réussi !'
            // Ici vous pourriez ajouter une notification de succès
        }
    }
}
