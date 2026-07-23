variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "env" {
  type    = string
  default = "dev"
}

variable "name_prefix" {
  type    = string
  default = "resthalfv2-dev"
}

variable "db_name" {
  type    = string
  default = "resthalf"
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "ec2_instance_type" {
  type    = string
  default = "t4g.small"
}

variable "ssh_public_key" {
  type        = string
  description = "SSH public key material (e.g. ssh-ed25519 AAAA... you@laptop)"
}

variable "allowed_ssh_cidrs" {
  type        = list(string)
  description = "CIDRs allowed to SSH into the EC2 instance"
}

variable "allowed_db_cidrs" {
  type        = list(string)
  default     = []
  description = "CIDRs allowed to connect directly to RDS (for local psql migrations)"
}

variable "rds_publicly_accessible" {
  type    = bool
  default = true
}
