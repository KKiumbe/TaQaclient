module.exports = {
  expo: {
    name: process.env.APP_NAME || 'TaQa Mali',
    slug: 'client',
    icon: './icon.png',
    version: '1.0.0',
    orientation: 'portrait',
    splash: {
      image: './icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.kiumbe.taqamali', // Add bundle identifier for iOS
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.kiumbe.taqamali', // Your package name
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    extra: {
      BASEURL: process.env.EXPO_PUBLIC_API_URL || 'https://212.47.74.158:5000/api',
      eas: {
        projectId: 'b1383cc6-df12-4e8c-a9bb-31dacce4a1ef', // Add this line
      },
    },
    plugins: [
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    scheme: 'taqamali',  // Add your preferred deep linking scheme
  },
};
