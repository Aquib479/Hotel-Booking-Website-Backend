variable "name_prefix" {
  type = string
}

variable "env" {
  type = string
}

variable "db_name" {
  type = string
}

variable "instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "ec2_security_group_id" {
  type        = string
  description = "SG of the EC2 instance — allowed to reach port 5432"
}

variable "allowed_db_cidrs" {
  type    = list(string)
  default = []
}

variable "publicly_accessible" {
  type    = bool
  default = true
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}
