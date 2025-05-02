provider "aws" {
  region = "us-east-1"  # ou ta région préférée
  # Les credentials seront configurées via AWS CLI
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }    git remote -v
  }
}
