import { View, Text, StyleSheet } from "react-native";

export default function ShoppingListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shopping List</Text>
      <Text style={styles.empty}>
        Create a meal plan first, then generate your shopping list.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9f9f9" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  empty: { color: "#888", textAlign: "center", marginTop: 40 },
});
