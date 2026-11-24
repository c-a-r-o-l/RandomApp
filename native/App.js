import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

// ── where the web app lives ──────────────────────────────────
// Point this at your deployed Vercel URL. To test against the local
// Vite dev server instead, use http://<your-computer's-lan-ip>:5173
const APP_URL = 'https://REPLACE-ME.vercel.app';

// paper colour from the web app's design system (src/ui.jsx SK.paper)
const PAPER = '#f5efe0';

export default function App() {
  const webRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  // Android back button: step back through the site's history first,
  // then let the system close the app as usual.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        {failed ? (
          <View style={styles.center}>
            <Text style={styles.oops}>couldn't reach the scrapbook ♡</Text>
            <Text style={styles.hint}>check that you're online, then try again</Text>
            <TouchableOpacity
              style={styles.retry}
              onPress={() => {
                setFailed(false);
                setLoading(true);
                webRef.current?.reload();
              }}>
              <Text style={styles.retryText}>try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <WebView
              ref={webRef}
              source={{ uri: APP_URL }}
              style={{ flex: 1 }}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => setFailed(true)}
              onNavigationStateChange={(s) => setCanGoBack(s.canGoBack)}
              // keep the app inside the wrapper instead of bouncing to a browser
              setSupportMultipleWindows={false}
              allowFileAccess={false}
              allowsBackForwardNavigationGestures
            />
            {loading && (
              <View style={styles.loader} pointerEvents="none">
                <ActivityIndicator size="large" color="#856139" />
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAPER,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  oops: {
    fontSize: 24,
    fontWeight: '700',
    color: '#56463a',
    textAlign: 'center',
  },
  hint: {
    marginTop: 8,
    fontSize: 15,
    color: '#8a7867',
    textAlign: 'center',
  },
  retry: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#856139',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#56463a',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
