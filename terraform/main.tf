provider "aws" {
  region = "ap-south-1"
}

############################
# Default VPC & Subnets
############################

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

############################
# Existing ECS Cluster
############################

data "aws_ecs_cluster" "existing" {
  cluster_name = "repomind-cluster"
}

############################
# ALB Security Group
############################

resource "aws_security_group" "alb_sg" {
  name   = "repomind-alb-sg-tf"
  vpc_id = data.aws_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
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

############################
# ECS Task Security Group ⭐ IMPORTANT
############################

resource "aws_security_group" "ecs_sg" {
  name   = "repomind-ecs-sg-tf"
  vpc_id = data.aws_vpc.default.id

  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]  # ONLY ALB allowed
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

############################
# Application Load Balancer
############################

resource "aws_lb" "alb" {
  name               = "repomind-alb-tf"
  load_balancer_type = "application"
  subnets            = data.aws_subnets.default.ids
  security_groups    = [aws_security_group.alb_sg.id]
}

############################
# Target Group (Fargate)
############################

resource "aws_lb_target_group" "tg" {
  name        = "repomind-tg-tf"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  health_check {
    path = "/docs"
  }
}

############################
# Listener
############################

resource "aws_lb_listener" "listener" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg.arn
  }
}

############################
# IAM Role for ECS Tasks
############################

resource "aws_iam_role" "ecs_task_execution" {
  name = "ecsTaskExecutionRole-repomind-tf"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_policy" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

############################
# Backend Image Variable
############################

variable "ecr_image" {
  default = "293693563455.dkr.ecr.ap-south-1.amazonaws.com/repomind-backend:latest"
}

############################
# Task Definition
############################

resource "aws_ecs_task_definition" "task" {
  family                   = "repomind-task-tf"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name  = "repomind-backend"
      image = var.ecr_image

      portMappings = [
        {
          containerPort = 8000
        }
      ]

      essential = true
    }
  ])
}

############################
# ECS Service ⭐ FIXED
############################

resource "aws_ecs_service" "service" {
  name            = "repomind-service-tf"
  cluster         = data.aws_ecs_cluster.existing.id
  task_definition = aws_ecs_task_definition.task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    assign_public_ip = true
    security_groups  = [aws_security_group.ecs_sg.id]   # ⭐ FIX
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.tg.arn
    container_name   = "repomind-backend"
    container_port   = 8000
  }

  depends_on = [aws_lb_listener.listener]
}

############################
# Output
############################

output "backend_url" {
  value = aws_lb.alb.dns_name
}