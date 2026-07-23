# RestHalfV2 Infrastructure

Terraform configuration for provisioning the RestHalfV2 backend on AWS.

## Architecture

```
Browser
  │ HTTP (S3 website)
  ▼
S3 static site (Vite React SPA)
  │ HTTPS API calls
  ▼
API Gateway (HTTP API)
  │ HTTP :3001
  ▼
EC2 (NestJS + PM2) + Elastic IP
  │ :5432
  ▼
RDS Postgres 15 (pg_cron)
```

## Resources Created

| Resource | Purpose |
|---|---|
| RDS Postgres 15 (`db.t4g.micro`) | Primary database with pg_cron enabled |
| EC2 (`t4g.small`, ARM64) | NestJS API server with PM2 |
| Elastic IP | Static IP for the EC2 instance |
| API Gateway (HTTP API) | HTTPS front door, throttling, CORS |
| S3 website bucket (`*-web`) | Frontend SPA (no CloudFront) |
| S3 media bucket (`*-media`) | Public hotel images |
| Security groups | Network isolation between layers |
| IAM role | CloudWatch logging + S3 media Put/Delete for EC2 |

## Prerequisites

- AWS CLI configured with credentials (`aws configure`)
- Terraform >= 1.10.0 installed
- An SSH key pair (ed25519 or RSA)

## One-Time Bootstrap

Create the S3 bucket for Terraform state **before** running `terraform init`:

```bash
aws s3api create-bucket \
  --bucket resthalfv2-tfstate-apse1 \
  --region ap-southeast-1 \
  --create-bucket-configuration LocationConstraint=ap-southeast-1

aws s3api put-bucket-versioning \
  --bucket resthalfv2-tfstate-apse1 \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket resthalfv2-tfstate-apse1 \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
  }'
```

## Provisioning

```bash
cd infrastructure

# Create your tfvars from the example
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars:
#   - Set ssh_public_key to your actual public key
#   - Set allowed_ssh_cidrs to your IP
#   - Set allowed_db_cidrs to your IP (for psql migrations)

terraform init
terraform plan
terraform apply
```

## Database schema

**Tables and columns** come only from TypeORM entities (`apps/api/src/**/*.entity.ts`) with `TYPEORM_SYNCHRONIZE=true` (default). Start the API against an empty database and tables are created/updated automatically.

**Postgres-only extras** (extensions, booking overlap exclude, indexes, pg_cron) run on boot via `DbBootstrapService` — they do not redefine tables.

After apply, set these on the API host (from `terraform output`):

```bash
S3_MEDIA_BUCKET=$(terraform output -raw media_bucket)
S3_MEDIA_REGION=ap-southeast-1
S3_PUBLIC_BASE_URL=$(terraform output -raw media_public_base_url)
```

Upload a hotel image (admin seed):

```bash
curl -X POST "http://localhost:3001/admin/hotels/{hotelId}/images?cover=true" \
  -F "file=@./hotel.jpg"
```

## Deploying the API

```bash
export EC2_IP=$(terraform output -raw ec2_public_ip)

ssh ec2-user@$EC2_IP << 'DEPLOY'
  git clone https://github.com/YOUR_USER/RestHalfV2.git
  cd RestHalfV2/apps/api
  npm ci
  npm run build
  # Create .env with production DATABASE_URL, JWT_SECRET, MIDTRANS keys, etc.
  pm2 start ecosystem.config.js
  pm2 save
DEPLOY
```

## Updating the API

```bash
ssh ec2-user@$EC2_IP << 'DEPLOY'
  cd RestHalfV2
  git pull
  cd apps/api
  npm ci
  npm run build
  pm2 reload resthalfv2-api
DEPLOY
```

## Accessing the API

After deployment, the API is available at:

```bash
terraform output api_gateway_url
# https://xxxxxxxx.execute-api.ap-southeast-1.amazonaws.com
```

## Deploying the frontend (S3 website)

Bucket is created by Terraform (`${name_prefix}-web`). Website is **HTTP only** (no CloudFront).

```powershell
cd ..\..\Hotel-Booking-Website-Frontend

# Point the SPA at your API Gateway
# Create .env.production with:
#   VITE_API_BASE_URL=https://oxwb0croja.execute-api.ap-southeast-1.amazonaws.com

pnpm install
pnpm build

$bucket = terraform -chdir=..\RestHalfV2\infrastructure output -raw frontend_bucket
aws s3 sync dist/ "s3://$bucket/" --delete

terraform -chdir=..\RestHalfV2\infrastructure output frontend_url
# http://resthalfv2-prod-web.s3-website-ap-southeast-1.amazonaws.com
```

SPA deep links use the bucket error document (`index.html`).

## Cost Estimate (ap-southeast-1, dev)

| Resource | Monthly |
|---|---|
| RDS db.t4g.micro + 20 GB gp3 | ~$16 |
| EC2 t4g.small (on-demand) | ~$12 |
| Elastic IP (attached) | $0 |
| API Gateway HTTP (~1M req) | ~$1 |
| S3 website (frontend) | ~$0–1 |
| S3 state bucket | ~$0.10 |
| **Total** | **~$30/mo** |

## Destroying

```bash
terraform destroy
```

Remember to also delete the S3 state bucket if fully decommissioning.
