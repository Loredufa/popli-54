const { withExpo } = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await withExpo(env, argv);

  config.devServer = config.devServer || {};
  const proxyPath = process.env.EXPO_PUBLIC_WEB_PROXY_PATH || '/proxy-api';
  const target = process.env.EXPO_PUBLIC_API_BASE_URL || (process.env.API_BASE_URL ?? 'https://poplicuentos-api.vercel.app');

  config.devServer.proxy = {
    ...(config.devServer.proxy || {}),
    [proxyPath]: {
      target,
      changeOrigin: true,
      secure: true,
      logLevel: 'warn',
      pathRewrite: { [`^${proxyPath}`]: '' },
    },
  };

  return config;
};
