# Root terragrunt configuration - shared across all environments
locals {
  # Global configuration shared across all services and environments
  organization = "platform" # Replace with your organization name in kebab-case

  # Global tags applied to all resources
  global_tags = {
    Team       = "platform"
    Terraform  = "true"
  }
}

# Configure Terragrunt to automatically store tfstate files in an S3 bucket
remote_state {
  backend = "s3"
  config = {
    bucket = "terraform-azure-devops-pipeline-bucket"
    key    = "${local.organization}/${path_relative_to_include()}/terraform.tfstate"
    region = "us-east-1" # Use a consistent region for state storage
  }
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
}

# Configure the AWS provider
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents = <<EOF
provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}
EOF
}

catalog {
  urls = [
    "https://github.com/mobials/platform-deployment.git"
  ]
}
