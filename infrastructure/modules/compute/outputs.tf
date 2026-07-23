output "public_ip" {
  value = aws_eip.this.public_ip
}

output "public_dns" {
  value = aws_eip.this.public_dns
}

output "security_group_id" {
  value = aws_security_group.ec2.id
}

output "instance_id" {
  value = aws_instance.this.id
}
