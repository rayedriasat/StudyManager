import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Task } from '../../types';
import TaskService from '../../services/taskService';

// Helper functions moved outside to be accessible to TaskItem
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

const getNextStatus = (currentStatus: Task['status']) => {
  switch (currentStatus) {
    case 'pending': return 'in_progress';
    case 'in_progress': return 'completed';
    case 'completed': return 'pending';
    default: return 'pending';
  }
};

const getStatusIcon = (status: Task['status']) => {
  switch (status) {
    case 'completed': return 'check-circle';
    case 'in_progress': return 'timelapse';
    case 'pending': return 'radio-button-unchecked';
    default: return 'radio-button-unchecked';
  }
};

// Moved TaskItem outside of TasksScreen to prevent invalid hook call error
const TaskItem = ({
  item,
  index,
  navigation,
  updateTaskStatus,
  deleteTask
}: {
  item: Task;
  index: number;
  navigation: any;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  deleteTask: (taskId: string) => void;
}) => {
  const itemAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(itemAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.taskItem,
        {
          opacity: itemAnim,
          transform: [
            { scale: scaleAnim },
            {
              translateY: itemAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.taskContent}
        onPress={() => {
          animatePress();
          navigation.navigate('TaskDetail', { task: item });
        }}
        activeOpacity={0.8}
      >
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => updateTaskStatus(item.id, getNextStatus(item.status))}
        >
          <Icon
            name={getStatusIcon(item.status)}
            size={24}
            color={getStatusColor(item.status)}
          />
        </TouchableOpacity>

        <View style={styles.taskDetails}>
          <Text style={[styles.taskTitle, item.status === 'completed' && styles.completedTask]}>
            {item.title}
          </Text>

          <View style={styles.taskMeta}>
            <View style={styles.badges}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                <Text style={[styles.badgeText, { color: getPriorityColor(item.priority) }]}>
                  {item.priority.toUpperCase()}
                </Text>
              </View>

              <View style={styles.sourceBadge}>
                <Icon
                  name={item.source === 'canvas' ? 'school' : item.source === 'google_calendar' ? 'event' : 'edit'}
                  size={12}
                  color="#6B7280"
                />
              </View>
            </View>

            {item.due_date && (
              <View style={styles.dueDateContainer}>
                <Icon name="schedule" size={14} color="#6B7280" />
                <Text style={styles.dueDateText}>
                  {new Date(item.due_date).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => deleteTask(item.id)}
        >
          <Icon name="delete" size={20} color="#EF4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const TasksScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const filters = [
    { key: 'all', label: 'All Tasks', icon: 'list' },
    { key: 'pending', label: 'Pending', icon: 'schedule' },
    { key: 'in_progress', label: 'In Progress', icon: 'timelapse' },
    { key: 'completed', label: 'Completed', icon: 'check-circle' },
    { key: 'upcoming', label: 'Due Soon', icon: 'alarm' },
    { key: 'canvas', label: 'Canvas', icon: 'school' },
    { key: 'manual', label: 'Manual', icon: 'edit' },
  ];

  useEffect(() => {
    loadTasks();
    animateContent();
  }, [user]);

  // Listen for refresh parameter from AddTaskScreen
  useEffect(() => {
    if (route.params?.refresh) {
      loadTasks();
      // Clear the refresh parameter so it doesn't trigger again
      navigation.setParams({ refresh: false });
    }
  }, [route.params?.refresh]);

  useEffect(() => {
    if (route.params?.filter) {
      setSelectedFilter(route.params.filter);
    }
  }, [route.params]);

  useEffect(() => {
    applyFilter();
  }, [tasks, selectedFilter]);

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

  const loadTasks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allTasks = await TaskService.getAllTasks(user.id);
      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const applyFilter = () => {
    let filtered = [...tasks];

    switch (selectedFilter) {
      case 'pending':
        filtered = tasks.filter(task => task.status === 'pending');
        break;
      case 'in_progress':
        filtered = tasks.filter(task => task.status === 'in_progress');
        break;
      case 'completed':
        filtered = tasks.filter(task => task.status === 'completed');
        break;
      case 'upcoming':
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        filtered = tasks.filter(task => {
          if (!task.due_date || task.status === 'completed') return false;
          return new Date(task.due_date) <= sevenDaysFromNow;
        });
        break;
      case 'canvas':
        filtered = tasks.filter(task => task.source === 'canvas');
        break;
      case 'manual':
        filtered = tasks.filter(task => task.source === 'manual');
        break;
      default:
        break;
    }

    // Sort by due date and priority
    filtered.sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    setFilteredTasks(filtered);
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      await TaskService.updateTask(taskId, { status });
      await loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const deleteTask = async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await TaskService.deleteTask(taskId);
              await loadTasks();
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Tasks</Text>
            <TouchableOpacity
              onPress={() => setShowFilterModal(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterOptions}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterOption,
                  selectedFilter === filter.key && styles.selectedFilterOption,
                ]}
                onPress={() => {
                  setSelectedFilter(filter.key);
                  setShowFilterModal(false);
                }}
              >
                <Icon
                  name={filter.icon}
                  size={20}
                  color={selectedFilter === filter.key ? '#6366F1' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedFilter === filter.key && styles.selectedFilterOptionText,
                  ]}
                >
                  {filter.label}
                </Text>
                {selectedFilter === filter.key && (
                  <Icon name="check" size={20} color="#6366F1" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const currentFilter = filters.find(f => f.key === selectedFilter);

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
            <Text style={styles.title}>Tasks</Text>
            <Text style={styles.subtitle}>
              {filteredTasks.length} {currentFilter?.label.toLowerCase() || 'tasks'}
            </Text>
          </View>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Icon name="filter-list" size={20} color="#6366F1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddTask')}
            >
              <Icon name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Indicator */}
        {selectedFilter !== 'all' && (
          <View style={styles.activeFilterContainer}>
            <View style={styles.activeFilter}>
              <Icon name={currentFilter?.icon || 'filter-list'} size={16} color="#6366F1" />
              <Text style={styles.activeFilterText}>{currentFilter?.label}</Text>
              <TouchableOpacity
                onPress={() => setSelectedFilter('all')}
                style={styles.clearFilterButton}
              >
                <Icon name="close" size={16} color="#6366F1" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tasks List */}
        <FlatList
          data={filteredTasks}
          renderItem={({ item, index }) => (
            <TaskItem
              item={item}
              index={index}
              navigation={navigation}
              updateTaskStatus={updateTaskStatus}
              deleteTask={deleteTask}
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6366F1']}
              tintColor="#6366F1"
            />
          }
          contentContainerStyle={[
            styles.listContent,
            filteredTasks.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyState}>
                <Icon name="assignment" size={64} color="#D1D5DB" />
                <Text style={styles.emptyStateTitle}>
                  {selectedFilter === 'all' ? 'No tasks yet' : `No ${currentFilter?.label.toLowerCase()}`}
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  {selectedFilter === 'all'
                    ? 'Create your first task or sync with Canvas'
                    : `Try a different filter or create a new task`
                  }
                </Text>
                {selectedFilter === 'all' && (
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => navigation.navigate('AddTask')}
                  >
                    <Text style={styles.emptyStateButtonText}>Add Task</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }
        />
      </Animated.View>

      <FilterModal />
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
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  activeFilterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  activeFilterText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
    marginLeft: 6,
    marginRight: 6,
  },
  clearFilterButton: {
    padding: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  taskItem: {
    marginBottom: 12,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  statusButton: {
    padding: 4,
    marginRight: 12,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  sourceBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  moreButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  filterOptions: {
    gap: 4,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  selectedFilterOption: {
    backgroundColor: '#EEF2FF',
  },
  filterOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  selectedFilterOptionText: {
    color: '#6366F1',
    fontWeight: '600',
  },
});

export default TasksScreen;