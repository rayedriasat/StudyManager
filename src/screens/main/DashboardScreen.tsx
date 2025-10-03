import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../context/AuthContext';
import { Task } from '../../types';
import TaskService from '../../services/taskService';
import CanvasService from '../../services/canvasService';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [completedToday, setCompletedToday] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadDashboardData();
    animateContent();
  }, [user]);

  const animateContent = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [allTasks, upcoming] = await Promise.all([
        TaskService.getAllTasks(user.id),
        TaskService.getUpcomingTasks(user.id, 7),
      ]);

      setTasks(allTasks);
      setUpcomingTasks(upcoming);

      // Calculate completed tasks today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const completedTodayCount = allTasks.filter(task => {
        if (task.status !== 'completed') return false;
        const updatedDate = new Date(task.updated_at);
        updatedDate.setHours(0, 0, 0, 0);
        return updatedDate.getTime() === today.getTime();
      }).length;

      setCompletedToday(completedTodayCount);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'pending': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color, onPress }: any) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statCardContent}>
        <View style={styles.statCardLeft}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
        <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
          <Icon name={icon} size={24} color={color} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const TaskCard = ({ task, index }: { task: Task; index: number }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.taskCard,
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.taskCardContent}
          onPress={() => navigation.navigate('TaskDetail', { task })}
          activeOpacity={0.7}
        >
          <View style={styles.taskCardHeader}>
            <View style={styles.taskCardTitleContainer}>
              <Text style={styles.taskCardTitle} numberOfLines={2}>
                {task.title}
              </Text>
              <View style={styles.taskCardMeta}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                  <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                    {task.priority.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            <Icon
              name={task.source === 'canvas' ? 'school' : task.source === 'google_calendar' ? 'event' : 'assignment'}
              size={20}
              color="#6B7280"
            />
          </View>
          
          {task.due_date && (
            <View style={styles.taskCardFooter}>
              <Icon name="schedule" size={16} color="#6B7280" />
              <Text style={styles.dueDate}>
                Due {new Date(task.due_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#6366F1']}
          tintColor="#6366F1"
        />
      }
    >
      <Animated.View
        style={[
          styles.animatedContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'Student'}</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddTask')}
          >
            <Icon name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Tasks"
            value={tasks.length}
            subtitle={`${tasks.filter(t => t.status === 'pending').length} pending`}
            icon="assignment"
            color="#6366F1"
            onPress={() => navigation.navigate('Tasks')}
          />
          <StatCard
            title="Completed Today"
            value={completedToday}
            subtitle="Great progress!"
            icon="check-circle"
            color="#10B981"
            onPress={() => navigation.navigate('Tasks', { filter: 'completed' })}
          />
        </View>

        <View style={styles.statsContainer}>
          <StatCard
            title="Due This Week"
            value={upcomingTasks.length}
            subtitle="Stay on track"
            icon="schedule"
            color="#F59E0B"
            onPress={() => navigation.navigate('Tasks', { filter: 'upcoming' })}
          />
          <StatCard
            title="Canvas Synced"
            value={tasks.filter(t => t.source === 'canvas').length}
            subtitle="Assignments"
            icon="school"
            color="#8B5CF6"
            onPress={() => navigation.navigate('Canvas')}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('AddTask')}
            >
              <Icon name="add-task" size={24} color="#6366F1" />
              <Text style={styles.quickActionText}>Add Task</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Canvas')}
            >
              <Icon name="school" size={24} color="#6366F1" />
              <Text style={styles.quickActionText}>Sync Canvas</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Calendar')}
            >
              <Icon name="event" size={24} color="#6366F1" />
              <Text style={styles.quickActionText}>Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <View style={styles.upcomingTasksContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {upcomingTasks.slice(0, 3).map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
          </View>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="assignment" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No tasks yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Add your first task or sync with Canvas to get started
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('AddTask')}
            >
              <Text style={styles.emptyStateButtonText}>Add First Task</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  animatedContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCardLeft: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 12,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 8,
  },
  upcomingTasksContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  taskCard: {
    marginBottom: 12,
  },
  taskCardContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskCardTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  taskCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  taskCardMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  taskCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dueDate: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyStateButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DashboardScreen;
