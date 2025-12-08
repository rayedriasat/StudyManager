import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GoogleSignin, statusCodes, isSuccessResponse, isExpoGo } from '../../utils/googleSignInConfig';
import { useAuth } from '../../context/AuthContext';
import { Task } from '../../types';
import TaskService from '../../services/taskService';
import GoogleCalendarService from '../../services/googleCalendarService';

const CalendarScreen = ({ navigation }: any) => {
  const { user, updateUserProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [dayTasks, setDayTasks] = useState<Task[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadData();
    checkGoogleConnection();
    animateContent();
  }, [user]);

  useEffect(() => {
    updateDayTasks();
  }, [selectedDate, tasks]);

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

  const loadData = async () => {
    if (!user) return;

    try {
      const allTasks = await TaskService.getAllTasks(user.id);
      setTasks(allTasks);
      generateMarkedDates(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const checkGoogleConnection = async () => {
    try {
      // Use hasPreviousSignIn() and getCurrentUser() instead of isSignedIn()
      const hasPreviousSignIn = GoogleSignin.hasPreviousSignIn();
      const currentUser = GoogleSignin.getCurrentUser();
      setIsGoogleConnected(hasPreviousSignIn && currentUser !== null);
    } catch (error) {
      console.error('Error checking Google connection:', error);
    }
  };

  const generateMarkedDates = (taskList: Task[]) => {
    const dates: any = {};

    // Mark today
    const today = new Date().toISOString().split('T')[0];
    dates[today] = {
      selected: selectedDate === today,
      selectedColor: selectedDate === today ? '#6366F1' : undefined,
      marked: true,
      dotColor: '#10B981',
    };

    // Mark dates with tasks
    taskList.forEach(task => {
      if (task.due_date) {
        const date = new Date(task.due_date).toISOString().split('T')[0];
        const isSelected = date === selectedDate;
        const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'completed';

        dates[date] = {
          ...dates[date],
          selected: isSelected,
          selectedColor: isSelected ? '#6366F1' : undefined,
          marked: true,
          dotColor: isOverdue ? '#EF4444' : task.status === 'completed' ? '#10B981' : '#F59E0B',
        };
      }
    });

    setMarkedDates(dates);
  };

  const updateDayTasks = () => {
    const tasksForDay = tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date).toISOString().split('T')[0];
      return taskDate === selectedDate;
    });

    setDayTasks(tasksForDay);
  };

  const connectGoogleCalendar = async () => {
    // Show helpful message if running in Expo Go
    if (isExpoGo) {
      Alert.alert(
        'Feature Not Available',
        'Google Calendar integration requires a development build or release build.\n\n' +
        'To test this feature:\n' +
        '1. Create a development build: eas build --profile development\n' +
        '2. Or create a release build: eas build --profile production\n\n' +
        'All other features work in Expo Go!',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Configure Google Sign-In first
      GoogleSignin.configure({
        webClientId: '976507010885-j8tmbqobv8pdigr81me7mj3bciuphkn2.apps.googleusercontent.com', // Replace with actual
        offlineAccess: true,
        hostedDomain: '',
        accountName: '',
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
        ],
      });

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      await updateUserProfile({
        google_calendar_token: tokens.accessToken,
      });

      setIsGoogleConnected(true);
      Alert.alert('Success', 'Google Calendar connected successfully!');
    } catch (error: any) {
      console.error('Google Calendar connection error:', error);

      // Better error handling
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Cancelled', 'Sign in was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('In Progress', 'Sign in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Play Services not available or outdated');
      } else {
        Alert.alert('Error', `Failed to connect Google Calendar: ${error.message}`);
      }
    }
  };


  const syncToGoogleCalendar = async (task: Task) => {
    // Show helpful message if running in Expo Go
    if (isExpoGo) {
      Alert.alert(
        'Feature Not Available',
        'Google Calendar sync requires a development build or release build. See EXPO_GO_TESTING.md for details.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!isGoogleConnected || !user?.google_calendar_token) {
      Alert.alert('Error', 'Please connect Google Calendar first');
      return;
    }

    try {
      const googleService = new GoogleCalendarService(user.google_calendar_token);

      const event = {
        summary: task.title,
        description: task.description || '',
        start: {
          dateTime: task.due_date || new Date().toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: task.due_date
            ? new Date(new Date(task.due_date).getTime() + 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          timeZone: 'UTC',
        },
      };

      await googleService.createEvent('primary', event);
      Alert.alert('Success', 'Task synced to Google Calendar!');
    } catch (error) {
      console.error('Error syncing to Google Calendar:', error);
      Alert.alert('Error', 'Failed to sync task to Google Calendar');
    }
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

  const TaskCard = ({ task, index }: { task: Task; index: number }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

    return (
      <Animated.View
        style={[
          styles.taskCard,
          isOverdue && styles.overdueTaskCard,
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
        >
          <View style={styles.taskCardHeader}>
            <Text style={styles.taskTitle} numberOfLines={2}>
              {task.title}
            </Text>

            <View style={styles.taskBadges}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                <Text style={[styles.badgeText, { color: getPriorityColor(task.priority) }]}>
                  {task.priority.toUpperCase()}
                </Text>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(task.status) }]}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.taskCardFooter}>
            <View style={styles.taskTime}>
              <Icon name="schedule" size={16} color="#6B7280" />
              <Text style={styles.timeText}>
                {new Date(task.due_date!).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.syncButton}
              onPress={() => syncToGoogleCalendar(task)}
            >
              <Icon name="sync" size={16} color="#6366F1" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Calendar</Text>
            <Text style={styles.subtitle}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {!isGoogleConnected ? (
              <TouchableOpacity
                style={styles.connectButton}
                onPress={connectGoogleCalendar}
              >
                <Icon name="event" size={16} color="#FFFFFF" />
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.connectedIndicator}>
                <Icon name="check-circle" size={16} color="#10B981" />
                <Text style={styles.connectedText}>Connected</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6366F1']}
              tintColor="#6366F1"
            />
          }
        >
          {/* Calendar */}
          <View style={styles.calendarContainer}>
            <Calendar
              current={selectedDate}
              onDayPress={(day: any) => {
                setSelectedDate(day.dateString);
                generateMarkedDates(tasks);
              }}
              markedDates={markedDates}
              theme={{
                backgroundColor: '#FFFFFF',
                calendarBackground: '#FFFFFF',
                textSectionTitleColor: '#6B7280',
                selectedDayBackgroundColor: '#6366F1',
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: '#6366F1',
                dayTextColor: '#1F2937',
                textDisabledColor: '#D1D5DB',
                dotColor: '#6366F1',
                selectedDotColor: '#FFFFFF',
                arrowColor: '#6366F1',
                disabledArrowColor: '#D1D5DB',
                monthTextColor: '#1F2937',
                indicatorColor: '#6366F1',
                textDayFontFamily: 'System',
                textMonthFontFamily: 'System',
                textDayHeaderFontFamily: 'System',
                textDayFontWeight: '500',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              style={styles.calendar}
            />
          </View>

          {/* Tasks for Selected Day */}
          <View style={styles.tasksSection}>
            <View style={styles.tasksSectionHeader}>
              <Text style={styles.tasksSectionTitle}>
                Tasks for {new Date(selectedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
              <Text style={styles.tasksCount}>
                {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {dayTasks.length > 0 ? (
              dayTasks.map((task, index) => (
                <TaskCard key={`task-${task.id}-${index}`} task={task} index={index} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="event-available" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateTitle}>No tasks for this day</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Select a different date or add a new task
                </Text>
                <TouchableOpacity
                  style={styles.addTaskButton}
                  onPress={() => navigation.navigate('AddTask', { selectedDate })}
                >
                  <Text style={styles.addTaskButtonText}>Add Task</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  headerActions: {
    alignItems: 'center',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  connectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  calendar: {
    borderRadius: 16,
  },
  tasksSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  tasksCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  taskCard: {
    marginBottom: 12,
  },
  overdueTaskCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
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
    shadowRadius: 8,
    elevation: 3,
  },
  taskCardHeader: {
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  taskBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  syncButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  addTaskButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addTaskButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CalendarScreen;
