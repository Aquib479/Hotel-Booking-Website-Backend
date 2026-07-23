output "database_url" {
  value     = "postgresql://${module.database.username}:${module.database.password}@${module.database.endpoint}/${module.database.db_name}"
  sensitive = true
}

output "db_host" {
  value = module.database.endpoint
}

output "db_name" {
  value = module.database.db_name
}

output "db_username" {
  value = module.database.username
}

output "db_password" {
  value     = module.database.password
  sensitive = true
}

output "ec2_public_ip" {
  value = module.compute.public_ip
}

output "api_gateway_url" {
  value = module.apigateway.url
}

output "api_gateway_invoke_url" {
  value = module.apigateway.invoke_url
}

output "frontend_bucket" {
  value = module.frontend.bucket_name
}

output "frontend_url" {
  value = module.frontend.website_url
}

output "frontend_website_endpoint" {
  value = module.frontend.website_endpoint
}

output "media_bucket" {
  value = module.media.bucket_name
}

output "media_public_base_url" {
  value = module.media.public_base_url
}
