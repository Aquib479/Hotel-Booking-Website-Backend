# Backend Deployment Guide

NestJS 11 API running on **AWS EC2** with **PM2**, behind **API Gateway** (HTTPS).

## Architecture

```
Browser / Frontend
  │ https://api.resthalf.com
  ▼
API Gateway (HTTP API, HTTPS)
  │ HTTP proxy :3001
  ▼
EC2 (Amazon Linux 2023, ARM64)
  │ PM2 → node dist/main.js
  ▼
RDS Postgres 15 (pg_cron)

S3 media bucket (hotel images)
```

## AWS Resources

| Resource | Identifier | Region |
|---|---|---|
| EC2 instance | `resthalfv2-prod-api` (t4g.small, ARM64) | ap-southeast-1 |
| Elastic IP | Attached to EC2 | ap-southeast-1 |
| RDS Postgres 15 | `resthalfv2-prod-pg` (db.t4g.micro) | ap-southeast-1 |
| API Gateway (HTTP) | `oxwb0croja` (`resthalfv2-prod-http`) | ap-southeast-1 |
| S3 media bucket | `resthalfv2-prod-media` | ap-southeast-1 |
| ACM certificate (API) | `9e48b40a-9116-4742-bf12-603527fc0253` | ap-southeast-1 |
| Custom domain | `api.resthalf.com` | — |

## Prerequisites

- AWS CLI configured (`aws configure`)
- SSH access to EC2 (private key matching the Terraform `ssh_public_key`)
- Terraform >= 1.10.0 (for infrastructure changes)

## Environment Variables

Create `.env` at `~/RestHalfV2/apps/api/.env` on the EC2 instance:

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | Postgres connection string from `terraform output` |
| `JWT_SECRET` | Yes | — | Random secret for JWT signing |
| `PORT` | No | `3001` | API listen port |
| `S3_MEDIA_BUCKET` | For uploads | — | Media bucket name (e.g. `resthalfv2-prod-media`) |
| `S3_MEDIA_REGION` | No | `ap-southeast-1` | S3 region |
| `S3_PUBLIC_BASE_URL` | No | Derived | Public URL for media files |
| `MIDTRANS_SERVER_KEY` | For payments | `''` | Midtrans Snap server key |
| `MIDTRANS_IS_PRODUCTION` | No | `false` | Set `true` for live payments |
| `TYPEORM_SYNCHRONIZE` | No | `true` | Auto-sync schema (set `false` in prod if using migrations) |
| `ADMIN_SEED_ENABLED` | No | `false` | Set `true` to enable admin seed data |
| `HOLD_TTL_MINUTES` | No | `3` | Room hold duration |
| `PAYMENT_TTL_MINUTES` | No | `15` | Payment window duration |
| `MG_BEDBANK_BASE_URL` | For bedbank | UAT URL | MG Jarvis Bedbank base URL |
| `MG_AGENCY_CODE` | For bedbank | — | MG agency code (e.g. `AGID054215`) |
| `MG_USERNAME` | For bedbank | — | MG API username |
| `MG_PASSWORD` | For bedbank | — | MG API password |
| `BEDBANK_DEFAULT_SOURCE` | No | `mg` | Active bedbank supplier key (server-side; not exposed to clients) |

Example `.env`:

```bash
DATABASE_URL=postgresql://resthalf_admin:<password>@<rds-endpoint>:5432/resthalf
JWT_SECRET=your-random-secret-here
S3_MEDIA_BUCKET=resthalfv2-prod-media
S3_MEDIA_REGION=ap-southeast-1
MIDTRANS_SERVER_KEY=your-midtrans-key
MIDTRANS_IS_PRODUCTION=false
MG_BEDBANK_BASE_URL=https://uat-jarvis1-xmlsell.mgbedbank.com
MG_AGENCY_CODE=AGID054215
MG_USERNAME=RTIJUat1
MG_PASSWORD=your-mg-password
```

> **Note:** S3 credentials are NOT needed — the EC2 instance role provides `s3:PutObject` and `s3:DeleteObject` on the media bucket.

---

## Deploy via SSH (AWS CLI)

### First-time setup

```bash
# Get EC2 IP
EC2_IP=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=resthalfv2-prod-api" \
  --query "Reservations[0].Instances[0].PublicIpAddress" \
  --output text)

# Or from Terraform
cd infrastructure
EC2_IP=$(terraform output -raw ec2_public_ip)

# SSH in and set up
ssh ec2-user@$EC2_IP
```

On the EC2 instance:

```bash
git clone https://github.com/Aquib479/Hotel-Booking-Website-Backend.git RestHalfV2
cd RestHalfV2/apps/api
npm ci
npm run build

# Create .env with your production values (see table above)
nano .env

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

### Deploy updates

```bash
ssh ec2-user@$EC2_IP << 'DEPLOY'
  cd ~/RestHalfV2
  git pull
  cd apps/api
  npm ci
  npm run build
  pm2 reload resthalfv2-api
DEPLOY
```

### Quick one-liner (from local machine)

```bash
EC2_IP=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=resthalfv2-prod-api" \
  --query "Reservations[0].Instances[0].PublicIpAddress" \
  --output text) && \
ssh ec2-user@$EC2_IP 'cd ~/RestHalfV2 && git pull && cd apps/api && npm ci && npm run build && pm2 reload resthalfv2-api'
```

### Check status

```bash
# SSH into EC2
ssh ec2-user@$EC2_IP

# PM2 status
pm2 status
pm2 logs resthalfv2-api --lines 50

# Health check
curl http://localhost:3001
```

---

## Deploy via CI/CD (GitHub Actions)

Pushes to `main` auto-deploy via `.github/workflows/deploy.yml`.

### GitHub Secrets required

| Secret | Value |
|---|---|
| `EC2_HOST` | EC2 public IP or Elastic IP |
| `EC2_SSH_PRIVATE_KEY` | SSH private key (full PEM content) |

### What the workflow does

1. Checks out the repo
2. SSHs into EC2 via `appleboy/ssh-action@v1`
3. Shallow-clones the repo to a temp dir
4. Copies `src/`, `package.json`, `tsconfig*.json`, `nest-cli.json` to the app dir
5. Runs `npm install && npm run build`
6. Runs `pm2 restart resthalfv2-api`

### Setting up GitHub Secrets

1. Go to your repo on GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add `EC2_HOST` with your EC2 Elastic IP
4. Add `EC2_SSH_PRIVATE_KEY` with the full private key content

---

## Deploy via AWS Console (UI)

There is no console-based deploy for the backend since it runs on EC2. However, you can manage the infrastructure:

### View/restart EC2

1. Go to **AWS Console** → **EC2** → **Instances**
2. Find `resthalfv2-prod-api`
3. To restart: **Instance state** → **Reboot instance**
4. To connect: **Connect** → **EC2 Instance Connect** (or use SSH)

### View API Gateway

1. Go to **AWS Console** → **API Gateway** → **resthalfv2-prod-http**
2. View routes, stages, and throttling settings
3. Custom domain `api.resthalf.com` is under **Custom domain names**

### View RDS

1. Go to **AWS Console** → **RDS** → **Databases** → `resthalfv2-prod-pg`
2. View connection endpoint, monitoring, backups

### View logs

1. Go to **AWS Console** → **EC2** → Connect to instance
2. Run: `pm2 logs resthalfv2-api`
3. Or read log files at `/home/ec2-user/logs/`

---

## Infrastructure (Terraform)

All AWS resources are managed by Terraform in the `infrastructure/` directory.

### Provision from scratch

```bash
cd infrastructure
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your SSH key, CIDRs, etc.

terraform init
terraform plan
terraform apply
```

### Get resource details

```bash
terraform output                     # All outputs
terraform output ec2_public_ip       # EC2 IP
terraform output api_gateway_url     # API URL
terraform output database_url        # Postgres connection string (sensitive)
terraform output media_bucket        # S3 media bucket name
```

### Tear down

```bash
terraform destroy
```

---

## DNS Setup (GoDaddy)

The domain `resthalf.com` is managed in GoDaddy. Backend DNS record:

| Type | Name | Value |
|---|---|---|
| CNAME | `api` | `d-8o04y43o48.execute-api.ap-southeast-1.amazonaws.com` |

ACM validation CNAMEs should remain in place for automatic certificate renewal.

---

## PM2 Commands Reference

| Command | Description |
|---|---|
| `pm2 status` | View running processes |
| `pm2 logs resthalfv2-api` | Tail live logs |
| `pm2 logs resthalfv2-api --lines 100` | Last 100 log lines |
| `pm2 reload resthalfv2-api` | Zero-downtime reload |
| `pm2 restart resthalfv2-api` | Hard restart |
| `pm2 stop resthalfv2-api` | Stop the API |
| `pm2 delete resthalfv2-api` | Remove from PM2 |
| `pm2 monit` | Live monitoring dashboard |
| `pm2 save` | Save process list for auto-restart on reboot |

---

## Local Development

```bash
# Start local Postgres
docker compose up -d

cd apps/api
npm install

# Create .env with local DATABASE_URL
# DATABASE_URL=postgresql://resthalf:resthalf@localhost:5432/resthalf

npm run start:dev
# API at http://localhost:3001
# Swagger UI: http://localhost:3001/docs
# OpenAPI JSON: http://localhost:3001/docs-json
# OpenAPI YAML: http://localhost:3001/docs-yaml
# Static Bedbank spec: apps/api/src/bedbank/openapi.yaml
```

---

## Cost Estimate (ap-southeast-1)

| Resource | Monthly |
|---|---|
| RDS db.t4g.micro + 20 GB gp3 | ~$16 |
| EC2 t4g.small (on-demand) | ~$12 |
| Elastic IP (attached) | $0 |
| API Gateway HTTP (~1M req) | ~$1 |
| S3 media bucket | ~$0-1 |
| **Total** | **~$30/mo** |
