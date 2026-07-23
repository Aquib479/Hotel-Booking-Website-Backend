import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Applies Postgres-only extras that TypeORM entities cannot express.
 * Tables/columns come solely from entities + synchronize — do not CREATE TABLE here.
 */
@Injectable()
export class DbBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(DbBootstrapService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.ensureExtensions();
    await this.ensureBookingConstraints();
    await this.ensureCronJobs();
  }

  private async ensureExtensions() {
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);
  }

  private async ensureBookingConstraints() {
    await this.dataSource.query(`
      DO $$
      BEGIN
        ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
          EXCLUDE USING GIST (
            room_id WITH =,
            period WITH &&
          ) WHERE (status IN ('HOLD', 'PENDING_PAYMENT', 'CONFIRMED'));
      EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN undefined_table THEN NULL;
      END $$;
    `);

    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_one_hold_per_guest
        ON bookings (guest_id) WHERE status = 'HOLD'
    `);
    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_hold_expiry
        ON bookings (hold_expires_at) WHERE status = 'HOLD'
    `);
    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_payment_expiry
        ON bookings (payment_expires_at) WHERE status = 'PENDING_PAYMENT'
    `);
    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_confirmed_period
        ON bookings USING GIST (period) WHERE status = 'CONFIRMED'
    `);
    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_guest
        ON bookings (guest_id, created_at DESC)
    `);
    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_period
        ON bookings USING GIST (room_id, period)
    `);
  }

  private async ensureCronJobs() {
    try {
      await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS pg_cron`);
      await this.dataSource.query(`
        SELECT cron.unschedule(jobid)
        FROM cron.job
        WHERE jobname IN ('expire-holds', 'expire-pending-payments', 'complete-finished')
      `);
      await this.dataSource.query(`
        SELECT cron.schedule('expire-holds', '* * * * *', $cron$
          UPDATE bookings SET status='CANCELLED', cancelled_at=NOW()
          WHERE status='HOLD' AND hold_expires_at < NOW()
        $cron$)
      `);
      await this.dataSource.query(`
        SELECT cron.schedule('expire-pending-payments', '* * * * *', $cron$
          UPDATE bookings SET status='CANCELLED', cancelled_at=NOW()
          WHERE status='PENDING_PAYMENT' AND payment_expires_at < NOW()
        $cron$)
      `);
      await this.dataSource.query(`
        SELECT cron.schedule('complete-finished', '*/5 * * * *', $cron$
          UPDATE bookings SET status='COMPLETED'
          WHERE status='CONFIRMED' AND upper(period) < NOW()
        $cron$)
      `);
    } catch (err) {
      this.logger.warn(
        `pg_cron unavailable; hold/payment expiry jobs not scheduled (${(err as Error).message})`,
      );
    }
  }
}
