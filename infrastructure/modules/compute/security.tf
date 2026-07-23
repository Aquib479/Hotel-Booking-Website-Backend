resource "aws_security_group" "ec2" {
  name        = "${var.name_prefix}-ec2"
  description = "Allow SSH from dev, API from API Gateway HTTP proxy"
  vpc_id      = var.vpc_id

  tags = {
    Name        = "${var.name_prefix}-ec2"
    Environment = var.env
  }
}

resource "aws_security_group_rule" "ec2_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = var.allowed_ssh_cidrs
  security_group_id = aws_security_group.ec2.id
}

# HTTP API public proxy originates from dynamic AWS IPs; tighten later with VPC Link.
resource "aws_security_group_rule" "ec2_api_from_internet" {
  type              = "ingress"
  from_port         = 3001
  to_port           = 3001
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ec2.id
}

resource "aws_security_group_rule" "ec2_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ec2.id
}
