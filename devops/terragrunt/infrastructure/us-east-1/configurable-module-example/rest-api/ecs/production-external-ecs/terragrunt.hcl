terraform {
  source = "git@github.com:mobials/platform-infrastructure.git//devops/terraform/modules/standard_platform_webservice?ref=v2.11.1"
}

include "root" {
  path = find_in_parent_folders("root.hcl")
  expose = true
}

locals {
  # Load configurations from includes
  root_config = include.root.locals
  
  # Load service configuration from YAML
  service_yaml = yamldecode(file(find_in_parent_folders("service.yaml")))
  service_tags = local.service_yaml.service_tags
  
  application_yaml = yamldecode(file(find_in_parent_folders("application.yaml")))
  application_name = local.application_yaml.application_name
  repository_name = local.application_yaml.repository_name
  application_port = local.application_yaml.application_port
  execution_role_arn = local.application_yaml.execution_role_arn
  ecs_iam_role = local.application_yaml.ecs_iam_role
  application_tags = local.application_yaml.application_tags
  
  # ECS service name
  ecs_service_name = "${local.service_yaml.service_name}-${local.application_yaml.application_name}"
  
  # Infrastructure details
  cluster_name = "production-external-ecs"
  cluster_arn = "arn:aws:ecs:us-east-1:456969868172:cluster/production-external-ecs"
  vpc_id = "vpc-f3d28696"
  
  # Load balancer details
  lb_arn = "arn:aws:elasticloadbalancing:us-east-1:456969868172:loadbalancer/app/production-ecs-external-alb/20836285717609cc"
  lb_name = "production-ecs-external-alb"
  
  # Target group configuration
  target_group_name = substr("prod-${local.ecs_service_name}", 0, 32)
  
  # Service hostname
  host_value = "${local.service_yaml.service_name}.autoverify.services"
  
  # Environment variables as key/value pairs
  environment_variables = {
    # Add environment variables here as needed - leave empty if there are none; e.g.:
    # DATABASE_URL        = "postgresql://localhost:5432/mydb"
    APP_PORT              = "80"
    LOG_LEVEL             = "log"
    LOG_PATH              = "/var/log/configurable-module-example-rest-api"
    AUTH0_DOMAIN          = "production-0k8m6aqc.us.auth0.com"
    AUTH0_AUDIENCE        = "platform-services"
    AUTH0_ENABLED         = "true"
    FILEBEAT_CLOUD_ID     = "logging-alerting-metrics:dXMtZWFzdC0xLmF3cy5mb3VuZC5pbyQ3YjcwNzEwNzgxMTE0NDc5YWJkNDg4MDExZTdmY2Q4YSQzNzIzZDI1NGJlMTU0Nzk5OGU5NmViMzA5Y2EyNjEwMA=="
    BUGSNAG_API_KEY       = ""
    BUGSNAG_RELEASE_STAGE = "production-external-ecs"
  }
  
  # Secrets as key/value pairs (valueFrom ARNs)
  secrets = {
    # Add secrets here as needed - leave empty if there are none; e.g.:
    # DB_PASSWORD = "arn:aws:secretsmanager:us-east-1:456969868172:secret:db-password-abc123"
    FILEBEAT_CLOUD_AUTH = "arn:aws:ssm:us-east-1:456969868172:parameter/global/elasticloud/filebeat_auth"
  }
}

inputs = {
  # Load balancer configuration
  lb_arn = local.lb_arn
  lb_name = local.lb_name
  
  # ECS cluster configuration
  cluster_name = local.cluster_name
  service_name = local.ecs_service_name
  
  # IAM roles
  execution_role_arn = local.execution_role_arn
  ecs_iam_role = local.ecs_iam_role
  
  # Network configuration
  vpc_id = local.vpc_id
  target_group_name = local.target_group_name
  
  # Host configuration
  host_value = local.host_value
  host_header_conditions = [
    local.host_value
  ]
  
  # Container template
  template = jsonencode([
    {
      "name": local.ecs_service_name,
      "image": "456969868172.dkr.ecr.us-east-1.amazonaws.com/${local.repository_name}:${local.cluster_name}",
      "cpu": 0,
      "memory": 256,
      "memoryReservation": 256,
      "portMappings": [
        {
          "containerPort": 80,
          "hostPort": 0,
          "protocol": "tcp"
        }
      ],
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "ls"
        ],
        "interval": 60,
        "timeout": 30,
        "retries": 3,
        "startPeriod": 30
      },
      "essential": true,
      "environment": [
        for key, value in local.environment_variables : {
          "name"  = key
          "value" = value
        }
      ],
      "secrets": [
        for key, valueFrom in local.secrets : {
          "name"      = key
          "valueFrom" = valueFrom
        }
      ]
    }
  ])
  
  # Common tags
  common_tags = merge(
    local.root_config.global_tags,
    local.service_tags,
    local.application_tags
  )
}
