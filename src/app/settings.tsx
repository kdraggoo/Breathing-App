import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { BREATH_COUNTS, colors, PACES, type PaceId } from '@/constants/theme';
import { updateSettings, useSettings } from '@/lib/settings';

export default function SettingsScreen() {
  const settings = useSettings();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <Section title="Breaths per session">
        <Segmented
          options={BREATH_COUNTS.map((n) => ({ value: n, label: String(n) }))}
          value={settings.breaths}
          onChange={(breaths) => updateSettings({ breaths })}
        />
      </Section>

      <Section title="Pace">
        <Segmented
          options={(Object.keys(PACES) as PaceId[]).map((id) => ({ value: id, label: PACES[id].label }))}
          value={settings.pace}
          onChange={(pace) => updateSettings({ pace })}
        />
        <Text style={styles.hint}>{PACES[settings.pace].detail} seconds</Text>
      </Section>

      <Section title="Feedback">
        <ToggleRow label="Sounds" value={settings.sound} onChange={(sound) => updateSettings({ sound })} />
        <ToggleRow label="Vibration" value={settings.haptics} onChange={(haptics) => updateSettings({ haptics })} />
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} trackColor={{ true: colors.button }} />
    </View>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F8FB' },
  content: { padding: 20, gap: 28 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 },
  hint: { fontSize: 15, color: colors.inkSoft },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowLabel: { fontSize: 17, color: colors.ink },
  segmented: { flexDirection: 'row', backgroundColor: '#E3EAF0', borderRadius: 12, padding: 4, gap: 4 },
  segment: { flex: 1, paddingVertical: 12, borderRadius: 9, alignItems: 'center' },
  segmentSelected: { backgroundColor: '#FFFFFF' },
  segmentText: { fontSize: 17, color: colors.inkSoft, fontWeight: '600' },
  segmentTextSelected: { color: colors.ink },
});
