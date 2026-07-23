output "api_id" {
  value = aws_apigatewayv2_api.this.id
}

output "api_endpoint" {
  value = aws_apigatewayv2_api.this.api_endpoint
}

output "url" {
  value = aws_apigatewayv2_api.this.api_endpoint
}

output "invoke_url" {
  value = aws_apigatewayv2_stage.default.invoke_url
}
