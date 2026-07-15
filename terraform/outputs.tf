output "rds_endpoint" {
  description = "The hostname of the RDS PostgreSQL instance"
  value       = aws_db_instance.postgres.address
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "faiss_bucket_name" {
  description = "Name of the S3 bucket used for FAISS index storage"
  value       = aws_s3_bucket.faiss.bucket
}

output "task_definition_arn" {
  description = "ARN of the latest ECS task definition revision"
  value       = aws_ecs_task_definition.app.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the IAM role attached to ECS tasks (app permissions)"
  value       = aws_iam_role.ecs_task_role.arn
}

output "ecs_execution_role_arn" {
  description = "ARN of the IAM role used by ECS to pull images and write logs"
  value       = aws_iam_role.ecs_execution_role.arn
}
