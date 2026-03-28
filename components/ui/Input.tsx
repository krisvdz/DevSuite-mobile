import { useState } from 'react'
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native'
import { Colors, Radius, Typography, Spacing } from '../../constants/theme'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
        placeholderTextColor={Colors.textPlaceholder}
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  label: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  inputFocused: {
    borderColor: 'rgba(139,92,246,0.5)',
  },
  inputError: {
    borderColor: 'rgba(244,63,94,0.5)',
  },
  error: {
    fontSize: Typography.xs,
    color: Colors.rose,
  },
})
