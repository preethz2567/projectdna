terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ── Use default VPC (same as memory-gallery) ────────────────────────────
data "aws_vpc" "default" { default = true }
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# ── Security group: ECS tasks ────────────────────────────────────────────
resource "aws_security_group" "ecs_sg" {
  name        = "projectdna-ecs-sg"
  description = "Allow inbound on 3000 and 5001 for app + AI service"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 5001
    to_port     = 5001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ── Reference existing RDS (memory-gallery) instead of creating a new one ─
# This saves ~$15/mo by reusing the existing db.t3.micro instance.
# The "projectdna" database must be created manually inside this instance:
#   psql -h <endpoint> -U postgres -c "CREATE DATABASE projectdna;"
data "aws_db_instance" "existing" {
  db_instance_identifier = "memory-gallery-db"
}

# Allow ECS tasks to reach the existing RDS on port 5432
# This adds an ingress rule to the memory-gallery RDS security group
resource "aws_security_group_rule" "ecs_to_rds" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs_sg.id
  security_group_id        = tolist(data.aws_db_instance.existing.vpc_security_groups)[0]
}

# ── S3 bucket for FAISS indexes ──────────────────────────────────────────
resource "aws_s3_bucket" "faiss" {
  bucket = "projectdna-faiss-${var.aws_account_id}"
}

resource "aws_s3_bucket_public_access_block" "faiss" {
  bucket                  = aws_s3_bucket.faiss.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── IAM role for ECS task execution ─────────────────────────────────────
resource "aws_iam_role" "ecs_execution_role" {
  name = "projectdna-ecs-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ── IAM role for ECS task (app permissions) ──────────────────────────────
resource "aws_iam_role" "ecs_task_role" {
  name = "projectdna-ecs-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "ecs_task_policy" {
  name = "projectdna-task-policy"
  role = aws_iam_role.ecs_task_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # S3 access for FAISS index files — scoped to this bucket only
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
        Resource = [
          aws_s3_bucket.faiss.arn,
          "${aws_s3_bucket.faiss.arn}/*"
        ]
      },
      {
        # CloudWatch logs — for debugging production issues
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/ecs/projectdna/*"
      },
      {
        # SSM Parameter Store — read secrets at runtime
        Effect   = "Allow"
        Action   = ["ssm:GetParameter", "ssm:GetParameters"]
        Resource = "arn:aws:ssm:${var.aws_region}:${var.aws_account_id}:parameter/projectdna/*"
      }
    ]
  })
}

# ── CloudWatch log group ─────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "projectdna" {
  name              = "/ecs/projectdna"
  retention_in_days = 7
}

# ── ECS Cluster ──────────────────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "projectdna-cluster"
}

# ── ECS Task Definition ──────────────────────────────────────────────────
# NOTE: Two containers — Node backend + Flask AI service in same task
# They communicate via localhost (same task = same network namespace)
resource "aws_ecs_task_definition" "app" {
  family                   = "projectdna"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"  # 0.5 vCPU — enough for prototype
  memory                   = "1024" # 1GB
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "node-backend"
      image = "${var.ecr_repository_uri}:latest"
      portMappings = [{ containerPort = 3000, protocol = "tcp" }]
      environment = [
        { name = "NODE_ENV",        value = "production" },
        { name = "PORT",            value = "3000" },
        { name = "DB_HOST",         value = data.aws_db_instance.existing.address },
        { name = "DB_PORT",         value = "5432" },
        { name = "DB_NAME",         value = "projectdna" },
        { name = "DB_USER",         value = "postgres" },
        { name = "AI_SERVICE_URL",  value = "http://localhost:5001" },
        { name = "CLIENT_URL",      value = "http://localhost:3000" },
        { name = "FAISS_S3_BUCKET", value = aws_s3_bucket.faiss.bucket },
        { name = "AWS_REGION",      value = var.aws_region },
      ]
      secrets = [
        { name = "DB_PASSWORD",  valueFrom = aws_ssm_parameter.db_password.arn },
        { name = "JWT_SECRET",   valueFrom = aws_ssm_parameter.jwt_secret.arn },
        { name = "GITHUB_TOKEN", valueFrom = aws_ssm_parameter.github_token.arn },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/projectdna"
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "node"
        }
      }
      essential = true
    },
    {
      name  = "ai-service"
      image = "${var.ecr_repository_uri}-ai:latest"
      portMappings = [{ containerPort = 5001, protocol = "tcp" }]
      environment = [
        { name = "PORT",             value = "5001" },
        { name = "FAISS_INDEX_PATH", value = "/tmp/faiss" },
        { name = "AWS_REGION",       value = var.aws_region },
        { name = "FAISS_S3_BUCKET",  value = aws_s3_bucket.faiss.bucket },
      ]
      secrets = [
        { name = "OPENROUTER_API_KEY", valueFrom = aws_ssm_parameter.openrouter_key.arn },
        { name = "DB_PASSWORD",        valueFrom = aws_ssm_parameter.db_password.arn },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/projectdna"
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ai"
        }
      }
      essential = true
    }
  ])
}

# ── ECS Service ──────────────────────────────────────────────────────────
resource "aws_ecs_service" "app" {
  name            = "projectdna-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  # Allow CodePipeline/CodeDeploy to update this service
  # lifecycle { ignore_changes = [task_definition] }
  # Uncomment the above after first deploy — prevents Terraform from
  # overwriting CodePipeline's task definition updates
}

# ── SSM Parameters (secrets — never in terraform.tfvars) ─────────────────
# These are created by Terraform but values come from variables
resource "aws_ssm_parameter" "db_password" {
  name  = "/projectdna/db_password"
  type  = "SecureString"
  value = var.db_password
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/projectdna/jwt_secret"
  type  = "SecureString"
  value = var.jwt_secret
}

resource "aws_ssm_parameter" "github_token" {
  name  = "/projectdna/github_token"
  type  = "SecureString"
  value = var.github_token
}

resource "aws_ssm_parameter" "openrouter_key" {
  name  = "/projectdna/openrouter_api_key"
  type  = "SecureString"
  value = var.openrouter_api_key
}
