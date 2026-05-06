module.exports = {
  apps: [
    {
      name: 'dahab',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
        FIREBASE_PROJECT_ID: 'deheb-5ac6b',
        GEMINI_MODEL: 'gemini-2.5-flash',
      },
    },
  ],
};
