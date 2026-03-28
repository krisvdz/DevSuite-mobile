module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated deve ser o ÚLTIMO plugin
      'react-native-reanimated/plugin',
    ],
  }
}
