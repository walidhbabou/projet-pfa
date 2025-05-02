variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nom du projet"
  type        = string
  default     = "devops-project"
}

variable "environment" {
  description = "Environnement (dev, prod, etc.)"
  type        = string
  default     = "dev"
}
