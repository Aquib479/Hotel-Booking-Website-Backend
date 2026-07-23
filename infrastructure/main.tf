data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

module "media" {
  source = "./modules/media"

  name_prefix = var.name_prefix
  env         = var.env
}

module "compute" {
  source = "./modules/compute"

  name_prefix       = var.name_prefix
  env               = var.env
  instance_type     = var.ec2_instance_type
  ssh_public_key    = var.ssh_public_key
  allowed_ssh_cidrs = var.allowed_ssh_cidrs
  vpc_id            = data.aws_vpc.default.id
  subnet_id         = data.aws_subnets.default.ids[0]
  media_bucket_arn  = module.media.bucket_arn
}

module "database" {
  source = "./modules/database"

  name_prefix           = var.name_prefix
  env                   = var.env
  db_name               = var.db_name
  instance_class        = var.db_instance_class
  ec2_security_group_id = module.compute.security_group_id
  allowed_db_cidrs      = var.allowed_db_cidrs
  publicly_accessible   = var.rds_publicly_accessible
  vpc_id                = data.aws_vpc.default.id
  subnet_ids            = data.aws_subnets.default.ids
}

module "apigateway" {
  source = "./modules/apigateway"

  name_prefix     = var.name_prefix
  env             = var.env
  origin_base_url = "http://${module.compute.public_dns}:3001"
}

module "frontend" {
  source = "./modules/frontend"

  name_prefix = var.name_prefix
  env         = var.env
}
