output "bucket_name" {
  value = aws_s3_bucket.this.id
}

output "bucket_arn" {
  value = aws_s3_bucket.this.arn
}

output "website_endpoint" {
  value = aws_s3_bucket_website_configuration.this.website_endpoint
}

output "website_url" {
  value = "http://${aws_s3_bucket_website_configuration.this.website_endpoint}"
}

output "regional_domain_name" {
  value = aws_s3_bucket.this.bucket_regional_domain_name
}
