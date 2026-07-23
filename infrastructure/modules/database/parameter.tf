resource "aws_db_parameter_group" "this" {
  name        = "${var.name_prefix}-pg15"
  family      = "postgres15"
  description = "Postgres 15 with pg_cron preloaded"

  parameter {
    name         = "shared_preload_libraries"
    value        = "pg_cron"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "cron.database_name"
    value        = var.db_name
    apply_method = "pending-reboot"
  }

  tags = {
    Name        = "${var.name_prefix}-pg15"
    Environment = var.env
  }
}
