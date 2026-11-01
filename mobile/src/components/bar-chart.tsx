import { useState } from 'react';
import { Text, View } from 'react-native';
import { Card, Copy, SectionTitle, TextButton, usePalette } from '@/components/tankuj-ui';

export type BarPoint = {
  key: string;
  label: string;
  value: number;
  valueLabel: string;
  detail: string;
};

const PAGE_SIZE = 6;

export function BarChart({
  title,
  description,
  points,
  scaleLabel,
  emptyMessage,
}: {
  title: string;
  description: string;
  points: readonly BarPoint[];
  scaleLabel: (maximum: number) => string;
  emptyMessage: string;
}) {
  const c = usePalette();
  const [offset, setOffset] = useState(0);
  const maximum = points.reduce((max, point) => Math.max(max, point.value), 0);
  const newestFirst = [...points].reverse();
  const start = Math.min(offset, Math.max(0, Math.ceil(points.length / PAGE_SIZE) - 1) * PAGE_SIZE);
  const visible = newestFirst.slice(start, start + PAGE_SIZE);
  return (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      <Copy small muted>{description}</Copy>
      {points.length ? (
        <>
          <Copy small muted>{scaleLabel(maximum)} Najnovšie údaje sú hore.</Copy>
          {points.length > PAGE_SIZE ? (
            <Copy small muted>
              {`Zobrazené ${start + 1}–${start + visible.length} z ${points.length}.`}
            </Copy>
          ) : null}
          {visible.map((point) => (
            <View
              key={point.key}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`${point.label}. ${point.valueLabel}. ${point.detail}`}
              style={{ gap: 8, paddingVertical: 8 }}
            >
              <View style={{
                flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8,
              }}>
                <Copy small>{point.label}</Copy>
                <Text style={{
                  color: c.text, fontSize: 18, fontWeight: '600', fontVariant: ['tabular-nums'],
                }}>
                  {point.valueLabel}
                </Text>
              </View>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{ height: 10, backgroundColor: c.soft, borderRadius: 5, overflow: 'hidden' }}
              >
                <View style={{
                  height: '100%',
                  width: `${maximum > 0 ? point.value / maximum * 100 : 0}%`,
                  backgroundColor: c.green,
                }} />
              </View>
              <Copy small muted>{point.detail}</Copy>
            </View>
          ))}
          {points.length > PAGE_SIZE ? (
            <View style={{
              flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12,
            }}>
              <TextButton
                title="Novšie údaje"
                disabled={start === 0}
                onPress={() => setOffset(Math.max(0, start - PAGE_SIZE))}
              />
              <TextButton
                title="Staršie údaje"
                disabled={start + PAGE_SIZE >= points.length}
                onPress={() => setOffset(start + PAGE_SIZE)}
              />
            </View>
          ) : null}
        </>
      ) : <Copy small>{emptyMessage}</Copy>}
    </Card>
  );
}
