include "root" {
  path = find_in_parent_folders("root.hcl")
  expose = true
}

terraform {
  source = "tfr:///terraform-aws-modules/ecr/aws?version=2.1.1"
}

locals {
  # Load configurations from includes
  root_config = include.root.locals
  
  # Load region configuration from YAML
  region_yaml = yamldecode(file(find_in_parent_folders("region.yaml")))
  repository_kms_key_arn = local.region_yaml.repository_kms_key_arn

  # Load service configuration from YAML
  service_yaml = yamldecode(file(find_in_parent_folders("service.yaml")))
  service_name = local.service_yaml.service_name
  service_tags = local.service_yaml.service_tags
  
  # Load application configuration from YAML
  application_yaml = yamldecode(file(find_in_parent_folders("application.yaml")))
  application_tags = local.application_yaml.application_tags
  repository_name = local.application_yaml.repository_name
}

inputs = {
  create_lifecycle_policy = false
  attach_repository_policy = false
  repository_name = local.repository_name
  repository_encryption_type = "KMS"
  repository_kms_key = local.repository_kms_key_arn
  repository_image_tag_mutability = "MUTABLE"
  repository_image_scan_on_push = true
  timeouts = {
    delete = "20m"
  }
  tags = merge(
    local.root_config.global_tags,
    local.service_tags,
    local.application_tags
  )
}
