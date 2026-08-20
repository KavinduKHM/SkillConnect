import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const AssignmentsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assignments</Text>
      <Text>Under Construction by Member 3</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  }
});
