variable "aws_region" {
  description = "AWS region to deploy resources"
  default     = "ap-south-1"
}

variable "aws_account_id" {
  description = "Your AWS account ID (used for scoped resource naming)"
}

variable "ecr_repository_uri" {
  description = "ECR repo URI for Node backend image (e.g. 390402557884.dkr.ecr.ap-south-1.amazonaws.com/projectdna)"
}

variable "db_password" {
  description = "Master password for the RDS PostgreSQL instance"
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secret key used to sign JWT tokens"
  sensitive   = true
}

variable "github_token" {
  description = "GitHub personal access token for repository access"
  sensitive   = true
}

variable "openrouter_api_key" {
  description = "OpenRouter API key for AI service (LLM calls)"
  sensitive   = true
}
