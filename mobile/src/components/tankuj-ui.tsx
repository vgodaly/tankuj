import { router } from 'expo-router';
import type { ComponentRef, ReactNode, Ref } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import type { TextInputProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Refuel } from '@/domain/fuel';

const palettes = {
  light: {
    background: '#F4F5F0',
    paper: '#FFFFFF',
    text: '#17271E',
    muted: '#526457',
    line: '#DDE4DA',
    green: '#286043',
    onGreen: '#FFFFFF',
    soft: '#E6EEE1',
    error: '#A22C27',
    warm: '#F3EBD6',
  },
  dark: {
    background: '#151B17',
    paper: '#202923',
    text: '#EDF3EA',
    muted: '#B2C1B5',
    line: '#39473D',
    green: '#A9D7AC',
    onGreen: '#143820',
    soft: '#2A3E2C',
    error: '#FFB4AB',
    warm: '#3C3522',
  },
};
export const usePalette = () => palettes[useColorScheme() === 'dark' ? 'dark' : 'light'];
export const formatNumber = (value: number, decimals = 2) =>
  new Intl.NumberFormat('sk-SK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
export const money = (cents: number) => formatNumber(cents / 100) + ' €';
export const dateLabel = (date: string) =>
  new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(
    new Date(date + 'T12:00:00'),
  );
export const countLabel = (count: number, one: string, few: string, many: string) =>
  count + ' ' + (count === 1 ? one : count >= 2 && count <= 4 ? few : many);

export function Copy({
  children,
  muted = false,
  small = false,
  error = false,
}: {
  children: ReactNode;
  muted?: boolean;
  small?: boolean;
  error?: boolean;
}) {
  const c = usePalette();
  return (
    <Text
      accessibilityRole={error ? 'alert' : undefined}
      style={{
        color: error ? c.error : muted ? c.muted : c.text,
        fontSize: small ? 14 : 16,
        lineHeight: small ? 21 : 25,
      }}
    >
      {children}
    </Text>
  );
}
export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  const c = usePalette();
  return (
    <View style={{ gap: 8 }}>
      <Text
        accessibilityRole="header"
        style={{
          color: c.text,
          fontSize: 32,
          lineHeight: 38,
          fontWeight: '600',
          letterSpacing: -1,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Copy muted small>
          {subtitle}
        </Copy>
      ) : null}
    </View>
  );
}
export function SectionTitle({ children }: { children: ReactNode }) {
  const c = usePalette();
  return (
    <Text
      accessibilityRole="header"
      style={{ color: c.text, fontSize: 20, fontWeight: '600', lineHeight: 28 }}
    >
      {children}
    </Text>
  );
}
export function Card({
  children,
  soft = false,
  warning = false,
}: {
  children: ReactNode;
  soft?: boolean;
  warning?: boolean;
}) {
  const c = usePalette();
  return (
    <View
      style={{
        padding: 20,
        borderRadius: 20,
        gap: 12,
        backgroundColor: warning ? c.warm : soft ? c.soft : c.paper,
      }}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  busy = false,
  disabled = false,
  testID,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  busy?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => ({
        backgroundColor: secondary ? c.soft : c.green,
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: disabled || busy ? 0.6 : pressed ? 0.75 : 1,
      })}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? c.green : c.onGreen} />
      ) : (
        <Text
          style={{
            color: secondary ? c.green : c.onGreen,
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
export function TextButton({ title, onPress }: { title: string; onPress: () => void }) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ minHeight: 44, justifyContent: 'center', paddingVertical: 8 }}
    >
      <Text style={{ color: c.green, fontSize: 15, fontWeight: '500' }}>{title}</Text>
    </Pressable>
  );
}
export function Amount({ value, unit }: { value: string; unit?: string }) {
  const c = usePalette();
  return (
    <Text
      style={{
        color: c.text,
        fontSize: 40,
        fontWeight: '500',
        letterSpacing: -1.5,
        fontVariant: ['tabular-nums'],
      }}
    >
      {value}
      {unit ? <Text style={{ fontSize: 23 }}>{' ' + unit}</Text> : null}
    </Text>
  );
}
export function Metric({ label, value }: { label: string; value: string }) {
  const c = usePalette();
  return (
    <View
      style={{
        gap: 4,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: c.line,
      }}
    >
      <Copy small muted>
        {label}
      </Copy>
      <Text style={{ color: c.text, fontSize: 18, fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  );
}
export function Field({
  label,
  error,
  help,
  inputRef,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  help?: string;
  inputRef?: Ref<ComponentRef<typeof TextInput>>;
}) {
  const c = usePalette();
  return (
    <View style={{ gap: 7 }}>
      <Text style={{ fontSize: 16, color: c.text, fontWeight: '500' }}>{label}</Text>
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        accessibilityHint={error || help}
        autoCorrect={false}
        autoCapitalize="none"
        placeholderTextColor={c.muted}
        {...props}
        style={[
          {
            borderColor: error ? c.error : c.line,
            borderWidth: 1,
            borderRadius: 12,
            backgroundColor: c.paper,
            color: c.text,
            padding: 14,
            minHeight: 54,
            fontSize: 18,
          },
          props.style,
        ]}
      />
      {error ? (
        <Copy small error>
          {error}
        </Copy>
      ) : help ? (
        <Copy small muted>
          {help}
        </Copy>
      ) : null}
    </View>
  );
}
export function RecordRow({ record }: { record: Refuel }) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        dateLabel(record.date) +
        ', ' +
        money(record.amountCents) +
        ', ' +
        formatNumber(record.volumeMl / 1000) +
        ' litrov. Detail tankovania.'
      }
      onPress={() => router.push({ pathname: '/record', params: { id: record.id } })}
      style={({ pressed }) => ({
        backgroundColor: c.paper,
        padding: 18,
        borderRadius: 18,
        gap: 6,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}
      >
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>
          {dateLabel(record.date)}
        </Text>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '500' }}>
          {money(record.amountCents)}
        </Text>
      </View>
      <Copy small muted>
        {formatNumber(record.odometerKm, 0)} km · {formatNumber(record.volumeMl / 1000)} l
      </Copy>
      <Text style={{ color: c.green, fontSize: 13 }}>
        {record.full ? 'Plná nádrž' : 'Čiastočné tankovanie'}
      </Text>
    </Pressable>
  );
}
export function Page({
  children,
  tab,
  brand = true,
}: {
  children: ReactNode;
  tab?: 'overview' | 'history' | 'stats';
  brand?: boolean;
}) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: c.background }}
      edges={tab ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 30,
            gap: 22,
            width: '100%',
            maxWidth: 620,
            alignSelf: 'center',
            flexGrow: 1,
          }}
        >
          {brand ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <Text
                accessibilityLabel="Tankuj"
                style={{ color: c.green, fontSize: 28, fontWeight: '600', letterSpacing: -1.5 }}
              >
                tankuj.
              </Text>
              <TextButton title="Nastavenia" onPress={() => router.push('/settings')} />
            </View>
          ) : null}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      {tab ? (
        <View
          style={{
            paddingHorizontal: 12,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: c.paper,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: c.line,
            flexDirection: 'row',
            gap: 4,
          }}
        >
          {(
            [
              { key: 'overview', href: '/', title: 'Prehľad' },
              { key: 'history', href: '/history', title: 'História' },
              { key: 'stats', href: '/stats', title: 'Štatistiky' },
            ] as const
          ).map((item) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === item.key }}
              key={item.key}
              onPress={() => {
                if (tab !== item.key) router.replace(item.href);
              }}
              style={{
                flex: 1,
                minHeight: 48,
                padding: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: tab === item.key ? c.soft : 'transparent',
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: tab === item.key ? c.green : c.muted,
                  fontWeight: tab === item.key ? '600' : '400',
                }}
              >
                {item.title}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </SafeAreaView>
  );
}
