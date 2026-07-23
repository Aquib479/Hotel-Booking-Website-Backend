resource "aws_security_group" "rds" {
  name        = "${var.name_prefix}-rds"
  description = "Allow Postgres from EC2 and dev CIDRs"
  vpc_id      = var.vpc_id

  tags = {
    Name        = "${var.name_prefix}-rds"
    Environment = var.env
  }
}

resource "aws_security_group_rule" "rds_from_ec2" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = var.ec2_security_group_id
  security_group_id        = aws_security_group.rds.id
}

resource "aws_security_group_rule" "rds_from_dev" {
  count             = length(var.allowed_db_cidrs) > 0 ? 1 : 0
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = var.allowed_db_cidrs
  security_group_id = aws_security_group.rds.id
}

resource "aws_security_group_rule" "rds_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.rds.id
}
