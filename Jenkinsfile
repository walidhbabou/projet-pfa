pipeline {
    agent any

    environment {
        DOCKERHUB_USER = 'walidhbabou'
        DOCKERHUB_REPO_FRONTEND = 'chatbootfsts-frontend'
        DOCKERHUB_REPO_BACKEND = 'chatbootfsts-backend'
        DOCKERHUB_REPO_RASA = 'chatbootfsts-rasa'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scmGit(
                    branches: [[name: '*/main']],
                    extensions: [],
                    userRemoteConfigs: [[credentialsId: 'github-token', url: 'https://github.com/walidhbabou/projet-pfa.git']]
                )
            }
        }

        stage('Build & Push Docker Images') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credentials') {
                        sh 'docker build -t $DOCKERHUB_USER/$DOCKERHUB_REPO_FRONTEND ./frontend'
                        sh 'docker push $DOCKERHUB_USER/$DOCKERHUB_REPO_FRONTEND'

                        sh 'docker build -t $DOCKERHUB_USER/$DOCKERHUB_REPO_BACKEND ./backend'
                        sh 'docker push $DOCKERHUB_USER/$DOCKERHUB_REPO_BACKEND'

                        sh 'docker build -t $DOCKERHUB_USER/$DOCKERHUB_REPO_RASA ./rasa'
                        sh 'docker push $DOCKERHUB_USER/$DOCKERHUB_REPO_RASA'
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sshagent(['ssh-key-devops']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ubuntu@107.21.73.241 << EOF
                      kubectl set image deployment/frontend-deployment frontend=$DOCKERHUB_USER/$DOCKERHUB_REPO_FRONTEND:latest
                      kubectl set image deployment/backend-deployment backend=$DOCKERHUB_USER/$DOCKERHUB_REPO_BACKEND:latest
                      kubectl set image deployment/rasa-deployment rasa=$DOCKERHUB_USER/$DOCKERHUB_REPO_RASA:latest
                    EOF
                    '''
                }
            }
        }
    }

    post {
        failure {
            echo 'Le pipeline a échoué.'
        }
        success {
            echo 'Déploiement réussi !'
        }
    }
}
