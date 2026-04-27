
module.exports = {
  apps: [
    {
      name: "mtcaisseweb",
      script: "dist/mtcaisseweb/server/server.mjs",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 4200
      }
    }
  ]
};