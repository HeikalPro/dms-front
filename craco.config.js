module.exports = {
  devServer: {
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: "all",
    client: {
      webSocketURL: {
        hostname: "localhost",
        port: 8000,
        protocol: "ws",
      },
    },
  },
};
