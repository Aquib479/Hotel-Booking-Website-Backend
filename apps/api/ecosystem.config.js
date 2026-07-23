module.exports = {
  apps: [
    {
      name: 'resthalfv2-api',
      script: './dist/main.js',
      cwd: '/home/ec2-user/RestHalfV2/apps/api',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/home/ec2-user/logs/api-error.log',
      out_file: '/home/ec2-user/logs/api-out.log',
      time: true,
    },
  ],
};
