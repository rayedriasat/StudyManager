import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../context/AuthContext';
import { Task } from '../../types';
import TaskService from '../../services/taskService';

const TaskDetailScreen = ({ navigation, route }: any) => {
  const { task: initialTask } = route.params;
  const [task, setTask] = useState<Task>(initialTask);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    animateContent();
  }, []);

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

  const updateTaskStatus = async (status: Task['status']) => {
    setLoading(true);
    try {
      const updatedTask = await TaskService.updateTask(task.id, { status });
      setTask(updatedTask);
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating task status:', error);
      Alert.alert('Error', 'Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = () => {
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
              await TaskService.deleteTask(task.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
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

  const statuses = [
    { key: 'pending', label: 'Pending', icon: 'schedule', color: '#6B7280' },
    { key: 'in_progress', label: 'In Progress', icon: 'timelapse', color: '#3B82F6' },
    { key: 'completed', label: 'Completed', icon: 'check-circle', color: '#10B981' },
  ];

  const StatusModal = () => (
    <Modal
      visible={showStatusModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowStatusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.statusModal}>
          <Text style={styles.modalTitle}>Update Status</Text>
          
          {statuses.map((status) => (
            <TouchableOpacity
              key={status.key}
              style={[
                styles.statusOption,
                task.status === status.key && styles.selectedStatusOption,
              ]}
              onPress={() => updateTaskStatus(status.key as Task['status'])}
              disabled={loading}
            >
              <Icon name={status.icon} size={24} color={status.color} />
              <Text style={styles.statusOptionText}>{status.label}</Text>
              {task.status === status.key && (
                <Icon name="check" size={20} color="#6366F1" />
              )}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowStatusModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Task Details</Text>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={deleteTask}
          >
            <Icon name="delete" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Task Card */}
          <View style={[styles.taskCard, isOverdue && styles.overdueTaskCard]}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            
            {task.description && (
              <Text style={styles.taskDescription}>{task.description}</Text>
            )}

            <View style={styles.taskMeta}>
              <View style={styles.badges}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                  <Text style={[styles.badgeText, { color: getPriorityColor(task.priority) }]}>
                    {task.priority.toUpperCase()} PRIORITY
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}
                  onPress={() => setShowStatusModal(true)}
                >
                  <Text style={[styles.badgeText, { color: getStatusColor(task.status) }]}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Icon name="edit" size={12} color={getStatusColor(task.status)} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>

              {task.due_date && (
                <View style={styles.dueDateContainer}>
                  <Icon name="schedule" size={16} color={isOverdue ? '#EF4444' : '#6B7280'} />
                  <Text style={[styles.dueDateText, isOverdue && styles.overdueDateText]}>
                    Due {new Date(task.due_date).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Source Information */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon
                name={
                  task.source === 'canvas' ? 'school' :
                  task.source === 'google_calendar' ? 'event' : 'edit'
                }
                size={20}
                color="#6366F1"
              />
              <Text style={styles.infoTitle}>
                {task.source === 'canvas' ? 'Canvas Assignment' :
                 task.source === 'google_calendar' ? 'Google Calendar Event' : 'Manual Task'}
              </Text>
            </View>
            
            <Text style={styles.infoDescription}>
              {task.source === 'canvas' 
                ? 'This task was synced from Canvas LMS'
                : task.source === 'google_calendar'
                  ? 'This task was synced from Google Calendar'
                  : 'This task was created manually'
              }
            </Text>

            {task.canvas_assignment_id && (
              <TouchableOpacity
                style={styles.viewInCanvasButton}
                onPress={() => navigation.navigate('CanvasWebView', {
                  url: `${task.canvas_assignment_id}`, // You'll need to construct the full URL
                  title: task.title,
                })}
              >
                <Icon name="open-in-browser" size={16} color="#6366F1" />
                <Text style={styles.viewInCanvasText}>View in Canvas</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Task Timeline */}
          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Task Timeline</Text>
            
            <View style={styles.timelineItem}>
              <View style={styles.timelineIcon}>
                <Icon name="add-circle" size={16} color="#10B981" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineItemTitle}>Task Created</Text>
                <Text style={styles.timelineItemTime}>
                  {new Date(task.created_at).toLocaleString()}
                </Text>
              </View>
            </View>

            {task.updated_at !== task.created_at && (
              <View style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <Icon name="update" size={16} color="#3B82F6" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineItemTitle}>Last Updated</Text>
                  <Text style={styles.timelineItemTime}>
                    {new Date(task.updated_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {task.status === 'completed' && (
              <View style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <Icon name="check-circle" size={16} color="#10B981" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineItemTitle}>Task Completed</Text>
                  <Text style={styles.timelineItemTime}>
                    {new Date(task.updated_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <StatusModal />
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  deleteButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  overdueTaskCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  taskDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  taskMeta: {
    gap: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueDateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  overdueDateText: {
    color: '#EF4444',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  viewInCanvasButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  viewInCanvasText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  timelineItemTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModal: {
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  selectedStatusOption: {
    backgroundColor: '#EEF2FF',
  },
  statusOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  modalCancelButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
});

export default TaskDetailScreen;
