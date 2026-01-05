import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { useEffect, useState } from "react";
import { scoreboardApi, Challenge, ScoreboardEntry } from "./lib/scoreboardApi";
import { useAuth } from "./context/AuthContext";
import { Ionicons } from '@expo/vector-icons';

type TabType = "challenges" | "badgeScoreboard" | "challengeScoreboard";

export default function ScoreboardsAndChallenges() {
  console.log("[ScoreboardsAndChallenges] component render start");
  console.log("[ScoreboardsAndChallenges] auth getters available:", { getUserId: !!useAuth()?.getUserId, getToken: !!useAuth()?.getToken });
   
  const { getUserId, getToken } = useAuth();
  const currentUserId = getUserId();
  console.log("[ScoreboardsAndChallenges] currentUserId:", currentUserId);

  const [activeTab, setActiveTab] = useState<TabType>("challenges");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [badgeScoreboard, setBadgeScoreboard] = useState<ScoreboardEntry[]>([]);
  const [challengeScoreboard, setChallengeScoreboard] = useState<ScoreboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[ScoreboardsAndChallenges] useEffect activeTab changed:", activeTab);
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    console.log("[loadData] start", { activeTab, currentUserId });
    if (!currentUserId) {
      console.warn("[loadData] no currentUserId, aborting");
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      console.log("[loadData] fetching data for tab:", activeTab);
      setLoading(true);
      setError(null);

      if (activeTab === "challenges") {
        console.log("[loadData] calling scoreboardApi.getChallenges");
        const challengesData = await scoreboardApi.getChallenges(currentUserId, getToken);
        console.log("[loadData] received challenges:", challengesData);
        setChallenges(challengesData);
      } else if (activeTab === "badgeScoreboard") {
        console.log("[loadData] calling getChallengeScoreboard to build user list");
        // Get challenge scoreboard first to get user IDs
        const challengeData = await scoreboardApi.getChallengeScoreboard(undefined, undefined, 20, getToken);
        console.log("[loadData] challengeScoreboard:", challengeData);
        const userIds = challengeData.map(entry => entry.userId);
        
        // Add current user if not in list
        if (!userIds.includes(currentUserId)) {
          console.log("[loadData] adding currentUserId to userIds");
          userIds.push(currentUserId);
        }

        console.log("[loadData] calling scoreboardApi.getBadgeScoreboard with userIds:", userIds);
        const badgeData = await scoreboardApi.getBadgeScoreboard(userIds, undefined, undefined, getToken);
        console.log("[loadData] received badgeScoreboard:", badgeData);
        setBadgeScoreboard(badgeData);
      } else if (activeTab === "challengeScoreboard") {
        console.log("[loadData] calling getChallengeScoreboard");
        const scoreboardData = await scoreboardApi.getChallengeScoreboard(undefined, undefined, 20, getToken);
        console.log("[loadData] received challengeScoreboard:", scoreboardData);
        setChallengeScoreboard(scoreboardData);
      }
    } catch (err) {
      console.error("[loadData] error:", err);
      setError("Failed to load data");
    } finally {
      console.log("[loadData] finished");
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    console.log("[onRefresh] triggered");
    setRefreshing(true);
    loadData();
  };

  const handleCompleteChallenge = async (challengeId: number) => {
    console.log("[handleCompleteChallenge] called", { challengeId, currentUserId });
    if (!currentUserId) return;

    try {
      console.log("[handleCompleteChallenge] calling scoreboardApi.completeChallenge", { userId: currentUserId, challengeId });
      await scoreboardApi.completeChallenge(currentUserId, challengeId, getToken);
      console.log("[handleCompleteChallenge] completeChallenge API call succeeded");
      // Reload challenges to update the UI
      console.log("[handleCompleteChallenge] reloading challenges after completion");
      const challengesData = await scoreboardApi.getChallenges(currentUserId, getToken);
      console.log("[handleCompleteChallenge] reloaded challenges:", challengesData);
      setChallenges(challengesData);
    } catch (err) {
      console.error("[handleCompleteChallenge] Failed to complete challenge:", err);
      alert("Failed to mark challenge as completed");
    }
  };

  const renderChallenge = ({ item }: { item: Challenge }) => (
    <View style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <Text style={styles.challengeTitle}>{item.title}</Text>
        {item.completed ? (
          <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
        ) : (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => {
              console.log("[renderChallenge] Complete pressed", { id: item.id, title: item.title });
              handleCompleteChallenge(item.id);
            }}
          >
            <Text style={styles.completeButtonText}>Complete</Text>
          </TouchableOpacity>
        )}
      </View>
      {item.description && (
        <Text style={styles.challengeDescription}>{item.description}</Text>
      )}
      <Text style={styles.challengeDate}>
        {new Date().toLocaleString('default', { month: 'long' })} {item.year}
      </Text>
    </View>
  );

  const renderScoreboardEntry = ({ item, index }: { item: ScoreboardEntry; index: number }) => {
    const isCurrentUser = item.userId === currentUserId;
    const score = item.badgeCount !== undefined ? item.badgeCount : item.completedChallenges || 0;
    const label = item.badgeCount !== undefined ? "badges" : "challenges";

    return (
      <View style={[styles.scoreboardEntry, isCurrentUser && styles.currentUserEntry]}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
        <View style={styles.scoreboardInfo}>
          <Text style={[styles.userIdText, isCurrentUser && styles.currentUserText]}>
            User {item.userId} {isCurrentUser && "(You)"}
          </Text>
          <Text style={styles.scoreText}>
            {score} {label}
          </Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "challenges" && styles.activeTab]}
          onPress={() => setActiveTab("challenges")}
        >
          <Text style={[styles.tabText, activeTab === "challenges" && styles.activeTabText]}>
            Challenges
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "badgeScoreboard" && styles.activeTab]}
          onPress={() => setActiveTab("badgeScoreboard")}
        >
          <Text style={[styles.tabText, activeTab === "badgeScoreboard" && styles.activeTabText]}>
            Badge Board
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "challengeScoreboard" && styles.activeTab]}
          onPress={() => setActiveTab("challengeScoreboard")}
        >
          <Text style={[styles.tabText, activeTab === "challengeScoreboard" && styles.activeTabText]}>
            Challenge Board
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === "challenges" && (
          <View>
            <Text style={styles.sectionTitle}>Monthly Challenges</Text>
            <Text style={styles.sectionSubtitle}>
              Complete challenges to climb the leaderboard!
            </Text>
            {challenges.length === 0 ? (
              <Text style={styles.emptyText}>No challenges available</Text>
            ) : (
              <FlatList
                data={challenges}
                renderItem={renderChallenge}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            )}
          </View>
        )}

        {activeTab === "badgeScoreboard" && (
          <View>
            <Text style={styles.sectionTitle}>Badge Scoreboard</Text>
            <Text style={styles.sectionSubtitle}>
              Top users by badges earned this month
            </Text>
            {badgeScoreboard.length === 0 ? (
              <Text style={styles.emptyText}>No data available</Text>
            ) : (
              <FlatList
                data={badgeScoreboard}
                renderItem={renderScoreboardEntry}
                keyExtractor={(item, index) => `badge-${item.userId}-${index}`}
                scrollEnabled={false}
              />
            )}
          </View>
        )}

        {activeTab === "challengeScoreboard" && (
          <View>
            <Text style={styles.sectionTitle}>Challenge Scoreboard</Text>
            <Text style={styles.sectionSubtitle}>
              Top users by challenges completed this month
            </Text>
            {challengeScoreboard.length === 0 ? (
              <Text style={styles.emptyText}>No data available</Text>
            ) : (
              <FlatList
                data={challengeScoreboard}
                renderItem={renderScoreboardEntry}
                keyExtractor={(item, index) => `challenge-${item.userId}-${index}`}
                scrollEnabled={false}
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  challengeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  challengeDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  challengeDate: {
    fontSize: 12,
    color: "#999",
  },
  completeButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  scoreboardEntry: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserEntry: {
    backgroundColor: "#E3F2FD",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  rankContainer: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
  },
  scoreboardInfo: {
    flex: 1,
    justifyContent: "center",
  },
  userIdText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  currentUserText: {
    color: "#007AFF",
  },
  scoreText: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#999",
    marginTop: 32,
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
    textAlign: "center",
  },
});
