import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack"];

export default function MealPlanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This Week's Meal Plan</Text>
      <View style={styles.grid}>
        {DAYS.map((day) => (
          <View key={day} style={styles.dayColumn}>
            <Text style={styles.dayLabel}>{day}</Text>
            {SLOTS.map((slot) => (
              <TouchableOpacity key={slot} style={styles.slot}>
                <Text style={styles.slotLabel}>{slot}</Text>
                <Text style={styles.slotPlaceholder}>+ Add meal</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.aiButton}>
        <Text style={styles.aiButtonText}>Generate AI Meal Plan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9f9f9" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  grid: { flexDirection: "row", flex: 1, gap: 4 },
  dayColumn: { flex: 1 },
  dayLabel: { fontWeight: "600", textAlign: "center", marginBottom: 8, fontSize: 12 },
  slot: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
    minHeight: 60,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  slotLabel: { fontSize: 10, color: "#888" },
  slotPlaceholder: { fontSize: 11, color: "#2E7D32", marginTop: 4 },
  aiButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  aiButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
