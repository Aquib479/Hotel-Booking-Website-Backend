resource "random_password" "master" {
  length  = 32
  special = false
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.name_prefix}-subnets"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.name_prefix}-subnets"
    Environment = var.env
  }
}

resource "aws_db_instance" "this" {
  identifier              = "${var.name_prefix}-pg"
  engine                  = "postgres"
  engine_version          = "15.18"
  instance_class          = var.instance_class
  allocated_storage       = 20
  storage_type            = "gp3"
  storage_encrypted       = true
  db_name                 = var.db_name
  username                = "resthalf_admin"
  password                = random_password.master.result
  parameter_group_name    = aws_db_parameter_group.this.name
  db_subnet_group_name    = aws_db_subnet_group.this.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  publicly_accessible     = var.publicly_accessible
  backup_retention_period = 7
  skip_final_snapshot     = var.env == "dev"
  apply_immediately       = var.env == "dev"

  tags = {
    Name        = "${var.name_prefix}-pg"
    Environment = var.env
  }
}
