#!/bin/bash
set -e

dnf update -y
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs git

npm install -g pm2

mkdir -p /home/ec2-user/logs
chown ec2-user:ec2-user /home/ec2-user/logs

sudo -u ec2-user bash -c 'pm2 startup systemd -u ec2-user --hp /home/ec2-user | tail -1 | bash'
