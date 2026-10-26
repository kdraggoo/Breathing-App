import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { BREATH_COUNTS, colors, PHASE_LIMITS, PRESETS, type PhaseDurations } from '@/constants/theme';
import { updateSettings, useSettings } from '@/lib/settings';

const PHASE_ROWS: { phase: keyof PhaseDurations; label: string }[] = [
  { phase: 'inhale', label: 'Breathe in' },
  { phase: 'hold', label: 'Hold' },
  { phase: 'exhale', label: 'Blow out' },
];

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes} min${rest ? ` ${rest} sec` : ''}`;
}

export default function SettingsScreen() {
  const settings = useSettings();
  const preset = PRESETS.find(
    (p) =>
      p.durations.inhale === settings.inhale &&
      p.durations.hold === settings.hold &&
      p.durations.exhale === settings.exhale,
  );
  const breathSeconds = settings.inhale + settings.hold + settings.exhale;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <Section title="Breaths per session">
        <Segmented
          options={BREATH_COUNTS.map((n) => ({ value: n, label: String(n) }))}
          value={settings.breaths}
          onChange={(breaths) => updateSettings({ breaths })}
        />
      </Section>

      <Section title="Breath timing">
        <Segmented
          options={[
            ...PRESETS.map((p) => ({ value: p.label, label: p.label })),
            ...(preset ? [] : [{ value: 'Custom', label: 'Custom' }]),
          ]}
          value={preset?.label ?? 'Custom'}
          onChange={(label) => {
            const match = PRESETS.find((p) => p.label === label);
            if (match) updateSettings(match.durations);
          }}
        />
        {PHASE_ROWS.map(({ phase, label }) => (
          <Stepper
            key={phase}
            label={label}
            value={settings[phase]}
            {...PHASE_LIMITS[phase]}
            onChange={(seconds) => updateSettings({ [phase]: seconds })}
          />
        ))}
        <Text style={styles.hint}>
          One breath takes {breathSeconds} seconds. A session is about {formatDuration(breathSeconds * settings.breaths)}.
        </Text>
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

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const valueText = value === 0 ? 'Off' : `${value} sec`;
  const step = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)));
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: valueText }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.stepper}>
        <StepButton symbol="−" disabled={value <= min} onPress={() => step(-1)} />
        <Text style={styles.stepValue}>{valueText}</Text>
        <StepButton symbol="+" disabled={value >= max} onPress={() => step(1)} />
      </View>
    </View>
  );
}

function StepButton({ symbol, disabled, onPress }: { symbol: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed, disabled && styles.stepButtonDisabled]}
    >
      <Text style={styles.stepSymbol}>{symbol}</Text>
    </Pressable>
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
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3EAF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPressed: { backgroundColor: '#CFD9E2' },
  stepButtonDisabled: { opacity: 0.35 },
  stepSymbol: { fontSize: 22, fontWeight: '600', color: colors.ink, lineHeight: 26 },
  stepValue: { fontSize: 17, fontWeight: '600', color: colors.ink, minWidth: 56, textAlign: 'center' },
  segmented: { flexDirection: 'row', backgroundColor: '#E3EAF0', borderRadius: 12, padding: 4, gap: 4 },
  segment: { flex: 1, paddingVertical: 12, borderRadius: 9, alignItems: 'center' },
  segmentSelected: { backgroundColor: '#FFFFFF' },
  segmentText: { fontSize: 17, color: colors.inkSoft, fontWeight: '600' },
  segmentTextSelected: { color: colors.ink },
});
