import { StyleSheet, TextInput, View, Text, type TextInputProps } from 'react-native';
import { colors } from '../theme/colors';

type Props = TextInputProps & {
  label: string;
  /** `accent` = light blue field (email, password) */
  variant?: 'default' | 'accent';
};

export function TextField({ label, style, variant = 'default', ...rest }: Props) {
  const inputStyles =
    variant === 'accent' ? [styles.input, styles.inputAccent, style] : [styles.input, style];

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={inputStyles}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputAccent: {
    backgroundColor: colors.inputBgBlue,
    borderColor: colors.inputBorderBlue,
  },
});
