import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ActivityComposer } from "../../components/activity-composer";
import { ResultBanner } from "../../components/result-banner";
import type { LogActivitiesResponse } from "../../lib/activities-api";
import { logout } from "../../lib/auth-api";
import { useAuth } from "../../lib/auth";

/**
 * Req 2 — the home screen. One job: get activities written down and sent.
 *
 * <p>The last outcome stays on screen after the sheet closes, because "did that actually go
 * through?" is the question this screen exists to answer.
 */
export default function Log() {
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [lastResult, setLastResult] = useState<LogActivitiesResponse | null>(null);

  const onSignOut = async () => {
    setSigningOut(true);
    // Revoke server-side first, then drop the local token — but `logout` swallows its own
    // failures, so a user offline still ends up signed out.
    await logout();
    await signOut();
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Log Activities</Text>
        <Text style={styles.subtitle}>Write a brief summary of what you did, and make sure to include a time period.</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add activities"
          onPress={() => setComposerOpen(true)}
          style={({ pressed }) => [styles.addButton, pressed ? styles.addButtonPressed : null]}
        >
          <Text style={styles.addButtonPlus}>+</Text>
          <Text style={styles.addButtonText}>Add activities</Text>
        </Pressable>

        <LastResult result={lastResult} />
      </ScrollView>

      {/* Two taps, asked in place. It sits just above the tab bar, so a thumb reaching for "Log"
          could sign someone out in one — which beta users reported as being booted at random.
          In place rather than `Alert.alert`, which react-native-web implements as a no-op. */}
      {confirmingSignOut ? (
        <View style={styles.confirm}>
          <Text style={styles.confirmText}>Sign out of OTJ Log?</Text>
          <View style={styles.confirmRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmingSignOut(false)}
              disabled={signingOut}
              style={({ pressed }) => [styles.confirmButton, pressed ? styles.signOutPressed : null]}
            >
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: signingOut, busy: signingOut }}
              onPress={onSignOut}
              disabled={signingOut}
              style={({ pressed }) => [
                styles.confirmButton,
                styles.confirmSignOut,
                pressed ? styles.signOutPressed : null,
              ]}
            >
              <Text style={styles.confirmSignOutText}>
                {signingOut ? "Signing out…" : "Sign out"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setConfirmingSignOut(true)}
          style={({ pressed }) => [styles.signOut, pressed ? styles.signOutPressed : null]}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      )}

      <ActivityComposer
        visible={composerOpen}
        onClose={() => setComposerOpen(false)}
        onLogged={setLastResult}
      />
    </View>
  );
}

/** The one-line version of what the composer showed in full. */
function LastResult({ result }: { result: LogActivitiesResponse | null }) {
  if (!result) return null;

  const failed = result.parseErrors?.length ?? 0;
  const tone = result.rowsAdded === 0 ? "error" : failed > 0 ? "warning" : "success";

  return (
    <ResultBanner
      tone={tone}
      title={
        result.rowsAdded === 0
          ? "Last attempt logged nothing"
          : `Last submission logged ${result.rowsAdded} ${
              result.rowsAdded === 1 ? "activity" : "activities"
            }`
      }
      detail={
        failed > 0
          ? `${failed} ${failed === 1 ? "entry" : "entries"} could not be read. Reopen to fix ${
              failed === 1 ? "it" : "them"
            }.`
          : null
      }
      style={styles.banner}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    padding: 24,
    paddingTop: 32,
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: "#6b7280",
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: "#208AEF",
    borderRadius: 14,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addButtonPressed: {
    backgroundColor: "#1a6fbf",
  },
  addButtonPlus: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "300",
    lineHeight: 40,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "700",
  },
  banner: {
    marginTop: 24,
  },
  signOut: {
    alignItems: "center",
    paddingVertical: 14,
  },
  signOutPressed: {
    opacity: 0.6,
  },
  signOutText: {
    color: "#dc2626",
    fontSize: 15,
    fontWeight: "600",
  },
  confirm: {
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  confirmRow: {
    flexDirection: "row",
    gap: 10,
  },
  /** 44pt minimum, the same floor as every other button in the app. */
  confirmButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
  },
  confirmSignOut: {
    borderColor: "#dc2626",
    backgroundColor: "#dc2626",
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  confirmSignOutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
});
