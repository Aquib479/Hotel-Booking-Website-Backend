variable "name_prefix" {
  type = string
}

variable "env" {
  type = string
}

variable "origin_base_url" {
  type        = string
  description = "Base URL of the NestJS API origin, e.g. http://ec2-xx.compute.amazonaws.com:3001"
}
