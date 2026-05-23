import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme } from '@/constants/theme';

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AppText variant="h3" weight="700">
          Wallet
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: HomeTheme.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
