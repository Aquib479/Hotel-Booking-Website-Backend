variable "name_prefix" {
  type = string
}

variable "env" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "t4g.small"
}

variable "ssh_public_key" {
  type = string
}

variable "allowed_ssh_cidrs" {
  type = list(string)
}

variable "vpc_id" {
  type = string
}

variable "subnet_id" {
  type        = string
  description = "Subnet to launch the EC2 instance in"
}

variable "media_bucket_arn" {
  type        = string
  description = "ARN of the S3 media bucket for hotel image uploads"
}
