terraform {
  required_version = ">= 1.10.0"

  backend "s3" {
    bucket       = "resthalfv2-tfstate-apse1"
    key          = "dev/terraform.tfstate"
    region       = "ap-southeast-1"
    encrypt      = true
    use_lockfile = true
  }
}
