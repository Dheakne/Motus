import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CheckIcon } from './Icons';
import { useWeeklyChallenge } from '../hooks/useWeeklyChallenge';

const WEEK_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const WEEK_COLUMNS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function WeeklyProgressCard({ readOnly = false }) {
  const { progress, todayColumn, completedCount, toggleToday, loading, error } = useWeeklyChallenge();

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator color="#1066E7" />
      </View>
    );
  }

  const todayDone = progress[todayColumn];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Progresso semanal</Text>
        <Text style={styles.count}>{completedCount}/7</Text>
      </View>

      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${(completedCount / 7) * 100}%` }]} />
      </View>

      <View style={styles.circlesRow}>
        {WEEK_COLUMNS.map((col, i) => (
          <View
            key={col}
            style={[styles.circle, progress[col] && styles.circleDone]}
          >
            {progress[col]
              ? <CheckIcon size={16} color="#FFFFFF" />
              : <Text style={[styles.circleLabel, col === todayColumn && styles.circleLabelToday]}>
                  {WEEK_LABELS[i]}
                </Text>
            }
          </View>
        ))}
      </View>

      {!readOnly && (
        <>
          <TouchableOpacity style={styles.button} onPress={toggleToday} activeOpacity={0.8}>
            <Text style={styles.buttonText}>
              {todayDone ? 'Desmarcar hoje' : 'Marcar hoje como concluído'}
            </Text>
          </TouchableOpacity>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F0F1F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Whyte-Regular',
    color: '#1C1C1E',
  },
  count: {
    fontSize: 14,
    fontFamily: 'Whyte-Medium',
    color: '#1066E7',
  },
  barBg: {
    height: 8,
    backgroundColor: '#DCDDE3',
    borderRadius: 4,
    marginBottom: 14,
  },
  barFill: {
    height: 8,
    backgroundColor: '#1066E7',
    borderRadius: 4,
  },
  circlesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCDDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: {
    backgroundColor: '#1066E7',
  },
  circleLabel: {
    fontSize: 14,
    fontFamily: 'Whyte-Medium',
    color: '#6E6E73',
  },
  circleLabelToday: {
    color: '#1066E7',
    fontFamily: 'Whyte-Bold',
  },
  button: {
    backgroundColor: '#1066E7',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Whyte-Medium',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    fontFamily: 'Whyte-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
});
