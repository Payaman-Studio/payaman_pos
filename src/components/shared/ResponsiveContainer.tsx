import { View, StyleSheet } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';

function ResponsiveContainer({
  children,
  maxWidth = 560,
}: {
  children: React.ReactNode;
  maxWidth?: number;
}) {
  const { isTablet } = useResponsive();
  if (!isTablet) return <>{children}</>;
  return (
    <View style={styles.centerWrapper}>
      <View style={[styles.inner, { maxWidth }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
  },
});

export default ResponsiveContainer;
