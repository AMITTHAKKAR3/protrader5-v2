# React Native Mobile App Development Guide for ProTrader5

This guide provides comprehensive instructions for building iOS and Android mobile applications for ProTrader5 using React Native.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Setup and Installation](#setup-and-installation)
3. [Project Structure](#project-structure)
4. [Core Features](#core-features)
5. [API Integration](#api-integration)
6. [State Management](#state-management)
7. [Navigation](#navigation)
8. [UI Components](#ui-components)
9. [Real-time Data](#real-time-data)
10. [Push Notifications](#push-notifications)
11. [Biometric Authentication](#biometric-authentication)
12. [Testing](#testing)
13. [Build and Deployment](#build-and-deployment)

---

## Project Overview

### Technology Stack

- **Framework:** React Native 0.73+
- **Language:** TypeScript
- **State Management:** Redux Toolkit
- **Navigation:** React Navigation 6
- **UI Library:** React Native Paper
- **Charts:** React Native Chart Kit
- **API Client:** Axios
- **WebSocket:** Socket.IO Client
- **Push Notifications:** React Native Firebase
- **Biometric Auth:** React Native Biometrics
- **Storage:** AsyncStorage / MMKV

### Target Platforms

- **iOS:** 13.0+
- **Android:** API Level 24+ (Android 7.0+)

---

## Setup and Installation

### Prerequisites

```bash
# Install Node.js 18+
# Install Watchman (macOS)
brew install watchman

# Install Xcode (macOS) - for iOS development
# Install Android Studio - for Android development

# Install React Native CLI
npm install -g @react-native-community/cli
```

### Create Project

```bash
cd frontend
npx @react-native-community/cli init ProTrader5Mobile --template react-native-template-typescript
cd ProTrader5Mobile
```

### Install Dependencies

```bash
# Core dependencies
npm install @reduxjs/toolkit react-redux
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-paper react-native-vector-icons
npm install axios socket.io-client
npm install @react-native-async-storage/async-storage
npm install react-native-chart-kit react-native-svg
npm install @react-native-firebase/app @react-native-firebase/messaging
npm install react-native-biometrics
npm install react-native-mmkv

# Development dependencies
npm install --save-dev @types/react @types/react-native
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install --save-dev jest @testing-library/react-native
npm install --save-dev detox
```

### iOS Setup

```bash
cd ios
pod install
cd ..
```

### Android Setup

Update `android/build.gradle`:

```gradle
buildscript {
    ext {
        buildToolsVersion = "33.0.0"
        minSdkVersion = 24
        compileSdkVersion = 33
        targetSdkVersion = 33
    }
}
```

---

## Project Structure

```
ProTrader5Mobile/
├── android/                 # Android native code
├── ios/                     # iOS native code
├── src/
│   ├── api/                # API client and services
│   │   ├── client.ts
│   │   ├── auth.api.ts
│   │   ├── trading.api.ts
│   │   └── market.api.ts
│   ├── components/         # Reusable components
│   │   ├── common/
│   │   ├── trading/
│   │   └── charts/
│   ├── navigation/         # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── screens/            # Screen components
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── trading/
│   │   ├── portfolio/
│   │   └── settings/
│   ├── store/              # Redux store
│   │   ├── index.ts
│   │   ├── slices/
│   │   └── middleware/
│   ├── services/           # Business logic services
│   │   ├── websocket.service.ts
│   │   ├── notification.service.ts
│   │   └── biometric.service.ts
│   ├── utils/              # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── types/              # TypeScript types
│   │   ├── api.types.ts
│   │   ├── navigation.types.ts
│   │   └── models.types.ts
│   └── theme/              # Theme configuration
│       ├── colors.ts
│       ├── typography.ts
│       └── spacing.ts
├── __tests__/              # Test files
├── App.tsx                 # Root component
├── package.json
└── tsconfig.json
```

---

## Core Features

### 1. Authentication

```typescript
// src/screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { login } from '../../store/slices/authSlice';

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await dispatch(login({ email, password })).unwrap();
      navigation.replace('Main');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        ProTrader5
      </Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        style={styles.button}
      >
        Login
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.navigate('Register')}
      >
        Don't have an account? Register
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    marginBottom: 8,
  },
});
```

### 2. Dashboard

```typescript
// src/screens/dashboard/DashboardScreen.tsx
import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPortfolio } from '../../store/slices/portfolioSlice';
import { LineChart } from 'react-native-chart-kit';

export const DashboardScreen = () => {
  const dispatch = useDispatch();
  const { balance, pnl, positions } = useSelector((state) => state.portfolio);

  useEffect(() => {
    dispatch(fetchPortfolio());
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Account Balance</Text>
          <Text variant="headlineLarge">${balance.toFixed(2)}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Today's P&L</Text>
          <Text
            variant="headlineLarge"
            style={{ color: pnl >= 0 ? 'green' : 'red' }}
          >
            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Open Positions</Text>
          <Text variant="headlineLarge">{positions.length}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Portfolio Performance" />
        <Card.Content>
          <LineChart
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
              datasets: [{ data: [10000, 10500, 10200, 11000, 11500] }],
            }}
            width={350}
            height={220}
            chartConfig={{
              backgroundColor: '#1E2923',
              backgroundGradientFrom: '#08130D',
              backgroundGradientTo: '#1E2923',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
            }}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
});
```

### 3. Trading Screen

```typescript
// src/screens/trading/TradingScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { placeOrder } from '../../store/slices/tradingSlice';
import { TradingChart } from '../../components/charts/TradingChart';
import { OrderBook } from '../../components/trading/OrderBook';

export const TradingScreen = ({ route }) => {
  const { symbol } = route.params;
  const dispatch = useDispatch();
  const { currentPrice } = useSelector((state) => state.market);

  const [side, setSide] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  const handlePlaceOrder = async () => {
    try {
      await dispatch(placeOrder({
        symbol,
        side,
        type: orderType,
        quantity: parseFloat(quantity),
        price: orderType === 'limit' ? parseFloat(price) : undefined,
      })).unwrap();
      
      setQuantity('');
      setPrice('');
    } catch (error) {
      console.error('Order failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TradingChart symbol={symbol} />
      
      <View style={styles.orderForm}>
        <SegmentedButtons
          value={side}
          onValueChange={setSide}
          buttons={[
            { value: 'buy', label: 'Buy' },
            { value: 'sell', label: 'Sell' },
          ]}
          style={styles.segmented}
        />

        <SegmentedButtons
          value={orderType}
          onValueChange={setOrderType}
          buttons={[
            { value: 'market', label: 'Market' },
            { value: 'limit', label: 'Limit' },
          ]}
          style={styles.segmented}
        />

        <TextInput
          label="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />

        {orderType === 'limit' && (
          <TextInput
            label="Price"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
        )}

        <Button
          mode="contained"
          onPress={handlePlaceOrder}
          style={[
            styles.button,
            { backgroundColor: side === 'buy' ? 'green' : 'red' }
          ]}
        >
          {side === 'buy' ? 'Buy' : 'Sell'} {symbol}
        </Button>
      </View>

      <OrderBook symbol={symbol} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orderForm: {
    padding: 16,
  },
  segmented: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});
```

---

## API Integration

```typescript
// src/api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://api.protrader5.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        await AsyncStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        // Navigate to login screen
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

## State Management

```typescript
// src/store/slices/tradingSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tradingApi } from '../../api/trading.api';

export const placeOrder = createAsyncThunk(
  'trading/placeOrder',
  async (orderData: any) => {
    const response = await tradingApi.placeOrder(orderData);
    return response.data;
  }
);

export const fetchOrders = createAsyncThunk(
  'trading/fetchOrders',
  async () => {
    const response = await tradingApi.getOrders();
    return response.data;
  }
);

const tradingSlice = createSlice({
  name: 'trading',
  initialState: {
    orders: [],
    loading: false,
    error: null,
  },
  reducers: {
    updateOrder: (state, action) => {
      const index = state.orders.findIndex(o => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.push(action.payload);
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { updateOrder } = tradingSlice.actions;
export default tradingSlice.reducer;
```

---

## Navigation

```typescript
// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

```typescript
// src/navigation/MainNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { TradingScreen } from '../screens/trading/TradingScreen';
import { PortfolioScreen } from '../screens/portfolio/PortfolioScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator();

export const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'view-dashboard';
          else if (route.name === 'Trading') iconName = 'chart-line';
          else if (route.name === 'Portfolio') iconName = 'briefcase';
          else if (route.name === 'Settings') iconName = 'cog';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Trading" component={TradingScreen} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};
```

---

## Real-time Data

```typescript
// src/services/websocket.service.ts
import io from 'socket.io-client';
import { store } from '../store';
import { updateMarketData } from '../store/slices/marketSlice';
import { updateOrder } from '../store/slices/tradingSlice';

class WebSocketService {
  private socket: any;

  connect(token: string) {
    this.socket = io('wss://ws.protrader5.com', {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('market-data', (data: any) => {
      store.dispatch(updateMarketData(data));
    });

    this.socket.on('order-update', (data: any) => {
      store.dispatch(updateOrder(data));
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  }

  subscribe(symbol: string) {
    this.socket.emit('subscribe', { symbol });
  }

  unsubscribe(symbol: string) {
    this.socket.emit('unsubscribe', { symbol });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new WebSocketService();
```

---

## Push Notifications

```typescript
// src/services/notification.service.ts
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

class NotificationService {
  async requestPermission() {
    const authStatus = await messaging().requestPermission();
    return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
           authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  }

  async getFCMToken() {
    const token = await messaging().getToken();
    await AsyncStorage.setItem('fcmToken', token);
    return token;
  }

  async registerToken() {
    const token = await this.getFCMToken();
    await apiClient.post('/notifications/register', { token });
  }

  setupNotificationListeners() {
    // Foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification:', remoteMessage);
      // Show in-app notification
    });

    // Background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background notification:', remoteMessage);
    });

    // Notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      // Navigate to relevant screen
    });
  }
}

export default new NotificationService();
```

---

## Biometric Authentication

```typescript
// src/services/biometric.service.ts
import ReactNativeBiometrics from 'react-native-biometrics';

class BiometricService {
  private rnBiometrics = new ReactNativeBiometrics();

  async isBiometricAvailable() {
    const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();
    return { available, biometryType };
  }

  async authenticate() {
    const { success } = await this.rnBiometrics.simplePrompt({
      promptMessage: 'Authenticate to access ProTrader5',
    });
    return success;
  }

  async createKeys() {
    const { publicKey } = await this.rnBiometrics.createKeys();
    return publicKey;
  }

  async createSignature(payload: string) {
    const { success, signature } = await this.rnBiometrics.createSignature({
      promptMessage: 'Sign transaction',
      payload,
    });
    return { success, signature };
  }
}

export default new BiometricService();
```

---

## Testing

```typescript
// __tests__/LoginScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '../src/store';
import { LoginScreen } from '../src/screens/auth/LoginScreen';

describe('LoginScreen', () => {
  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    );

    expect(getByText('ProTrader5')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('handles login', async () => {
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      // Assert navigation or success state
    });
  });
});
```

---

## Build and Deployment

### iOS Build

```bash
# Development build
cd ios
xcodebuild -workspace ProTrader5Mobile.xcworkspace \
  -scheme ProTrader5Mobile \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 14'

# Production build
xcodebuild -workspace ProTrader5Mobile.xcworkspace \
  -scheme ProTrader5Mobile \
  -configuration Release \
  -archivePath ProTrader5Mobile.xcarchive \
  archive

# Upload to App Store
xcodebuild -exportArchive \
  -archivePath ProTrader5Mobile.xcarchive \
  -exportPath ./build \
  -exportOptionsPlist ExportOptions.plist
```

### Android Build

```bash
# Development build
cd android
./gradlew assembleDebug

# Production build
./gradlew bundleRelease

# Sign APK
jarsigner -verbose -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore protrader5.keystore \
  app/build/outputs/bundle/release/app-release.aab \
  protrader5
```

### Fastlane Setup

```ruby
# fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Build and upload to TestFlight"
  lane :beta do
    increment_build_number
    build_app(scheme: "ProTrader5Mobile")
    upload_to_testflight
  end

  desc "Build and upload to App Store"
  lane :release do
    increment_build_number
    build_app(scheme: "ProTrader5Mobile")
    upload_to_app_store
  end
end

platform :android do
  desc "Build and upload to Play Store Beta"
  lane :beta do
    gradle(task: "bundleRelease")
    upload_to_play_store(track: "beta")
  end

  desc "Build and upload to Play Store"
  lane :release do
    gradle(task: "bundleRelease")
    upload_to_play_store
  end
end
```

---

## Development Checklist

- [ ] Project initialized with TypeScript
- [ ] Dependencies installed
- [ ] Navigation configured
- [ ] Redux store set up
- [ ] API client configured
- [ ] Authentication screens implemented
- [ ] Dashboard screen implemented
- [ ] Trading screen implemented
- [ ] Portfolio screen implemented
- [ ] Settings screen implemented
- [ ] WebSocket integration complete
- [ ] Push notifications configured
- [ ] Biometric authentication implemented
- [ ] Unit tests written
- [ ] E2E tests written
- [ ] iOS build successful
- [ ] Android build successful
- [ ] App Store submission
- [ ] Play Store submission

---

## Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Week 1-2 | Setup | Project setup, navigation, API integration |
| Week 3-4 | Auth & Dashboard | Login, register, dashboard screens |
| Week 5-6 | Trading | Trading screen, order placement, charts |
| Week 7-8 | Portfolio | Portfolio screen, positions, P&L tracking |
| Week 9-10 | Features | Copy trading, algo trading, notifications |
| Week 11-12 | Polish | Testing, bug fixes, performance optimization |
| Week 13-14 | Deployment | App Store and Play Store submission |

**Total:** 14 weeks (3.5 months)

---

## Cost Estimate

| Item | Cost |
|------|------|
| Apple Developer Account | $99/year |
| Google Play Developer Account | $25 one-time |
| Firebase (Blaze Plan) | $50/month |
| CodePush (for OTA updates) | $0 (free tier) |
| **Total** | **$724/year** |

---

## Support

For mobile app development:
- Email: mobile@protrader5.com
- GitHub: https://github.com/AMITTHAKKAR3/protrader5-v2

## License

MIT License - See LICENSE file for details
