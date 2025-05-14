pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'walidhbabou'
        FRONTEND_IMAGE = 'chatbootfsts-frontend'
        BACKEND_IMAGE = 'chatbootfsts-backend'
        RASA_IMAGE = 'chatbootfsts-rasa'
        AWS_REGION = 'us-east-1'
    }
    
    stages {
        stage('Vérification des Prérequis') {
            steps {
                script {
                    echo "🔍 Vérification des outils..."
                    
                    // Vérification de kubectl
                    try {
                        sh 'kubectl version --client'
                    } catch (Exception e) {
                        error "❌ kubectl n'est pas installé ou n'est pas accessible"
                    }
                    
                    // Vérification de Docker
                    try {
                        sh 'docker --version'
                    } catch (Exception e) {
                        error "❌ Docker n'est pas installé ou n'est pas accessible"
                    }
                    
                    // Vérification d'AWS CLI
                    try {
                        sh 'aws --version'
                    } catch (Exception e) {
                        error "❌ AWS CLI n'est pas installé ou n'est pas accessible"
                    }
                }
            }
        }
        
        stage('Vérification AWS & EKS') {
            steps {
                script {
                    withCredentials([[
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'aws-eks-creds',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    ]]) {
                        // Configuration de la région
                        sh 'aws configure set region ${AWS_REGION}'
                        
                        // Utilisation des credentials temporairement
                        withEnv([
                            "AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}",
                            "AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}"
                        ]) {
                            // Vérification de l'identité
                            sh 'aws sts get-caller-identity'
                            
                            // Vérification des clusters EKS
                            def clusters = sh(script: 'aws eks list-clusters --region ${AWS_REGION} --query "clusters" --output text', returnStdout: true).trim()
                            if (clusters == "None") {
                                error "❌ Aucun cluster EKS trouvé dans la région ${AWS_REGION}"
                            }
                            echo "✅ Clusters EKS trouvés : ${clusters}"
                        }
                    }
                }
            }
        }
        
        stage('Configuration Kubernetes') {
            steps {
                script {
                    echo "⚙️ Configuration Kubernetes..."
                    try {
                        // Récupération du premier cluster trouvé
                        def clusterName = sh(script: 'aws eks list-clusters --region ${AWS_REGION} --query "clusters[0]" --output text', returnStdout: true).trim()
                        
                        // Mise à jour du kubeconfig
                        sh "aws eks update-kubeconfig --name ${clusterName} --region ${AWS_REGION}"
                        
                        // Vérification de la connexion
                        sh 'kubectl cluster-info'
                        sh 'kubectl get nodes'
                        
                        // Sauvegarde du kubeconfig pour Jenkins
                        sh 'cp ~/.kube/config kubeconfig'
                        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                            sh 'cp kubeconfig $KUBECONFIG'
                        }
                    } catch (Exception e) {
                        error "❌ Erreur de configuration Kubernetes : ${e.message}"
                    }
                }
            }
        }
        
        stage('Checkout du Code') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/walidhbabou/projet-pfa.git',
                        credentialsId: 'github-credentials'
                    ]]
                ])
            }
        }
        
        stage('Build des Composants') {
            parallel {
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm install'
                            sh 'npm run build'
                        }
                    }
                }
                
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh 'pip install -r requirements.txt'
                        }
                    }
                }
                
                stage('Rasa') {
                    steps {
                        dir('rasa_bot') {
                            sh 'pip install -r requirements.txt'
                        }
                    }
                }
            }
        }
        
        stage('Build et Push Docker') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                        
                        // Build et push Frontend
                        docker.build("${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${BUILD_NUMBER}")
                        docker.withRegistry('', 'dockerhub-credentials') {
                            docker.image("${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${BUILD_NUMBER}").push()
                        }
                        
                        // Build et push Backend
                        docker.build("${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${BUILD_NUMBER}")
                        docker.withRegistry('', 'dockerhub-credentials') {
                            docker.image("${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${BUILD_NUMBER}").push()
                        }
                        
                        // Build et push Rasa
                        docker.build("${DOCKER_REGISTRY}/${RASA_IMAGE}:${BUILD_NUMBER}")
                        docker.withRegistry('', 'dockerhub-credentials') {
                            docker.image("${DOCKER_REGISTRY}/${RASA_IMAGE}:${BUILD_NUMBER}").push()
                        }
                    }
                }
            }
        }
        
        stage('Déploiement Kubernetes') {
            steps {
                script {
                    withKubeConfig([credentialsId: 'kubeconfig']) {
                        // Mise à jour des images dans deployment.yaml
                        sh """
                            sed -i 's|image: ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:.*|image: ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${BUILD_NUMBER}|g' deployment.yaml
                            sed -i 's|image: ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:.*|image: ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${BUILD_NUMBER}|g' deployment.yaml
                            sed -i 's|image: ${DOCKER_REGISTRY}/${RASA_IMAGE}:.*|image: ${DOCKER_REGISTRY}/${RASA_IMAGE}:${BUILD_NUMBER}|g' deployment.yaml
                        """
                        
                        // Application du déploiement
                        sh 'kubectl apply -f deployment.yaml'
                        
                        // Vérification du déploiement
                        sh 'kubectl rollout status deployment/frontend-deployment'
                        sh 'kubectl rollout status deployment/backend-deployment'
                        sh 'kubectl rollout status deployment/rasa-deployment'
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline terminé avec succès!'
        }
        failure {
            echo '❌ Pipeline échoué.'
            script {
                echo "🔍 Détails de l'erreur : ${currentBuild.description}"
                echo "📋 Vérifiez que :"
                echo "1. AWS CLI est correctement configuré"
                echo "2. Les credentials AWS sont valides"
                echo "3. Les credentials Docker Hub sont valides"
                echo "4. Les credentials GitHub sont valides"
                echo "5. Le cluster EKS est accessible"
                echo "6. Les permissions IAM sont correctes"
            }
        }
    }
} 