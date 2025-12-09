import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import DatePicker from 'react-native-date-picker';
import { useAuth } from '../../context/AuthContext';
import { Task } from '../../types';
import TaskService from '../../services/taskService';

const AddTaskScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const { selectedDate } = route.params || {};

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date());
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const priorities = [
    { key: 'low', label: 'Low Priority', color: '#10B981', icon: 'keyboard-arrow-down' },
    { key: 'medium', label: 'Medium Priority', color: '#F59E0B', icon: 'remove' },
    { key: 'high', label: 'High Priority', color: '#EF4444', icon: 'keyboard-arrow-up' },
  ];

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      await TaskService.createTask({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate.toISOString(),
        priority,
        status: 'pending',
        source: 'manual',
      });

      // Navigate back to Tasks screen with refresh parameter
      navigation.navigate('MainTabs', {
        screen: 'Tasks',
        params: { refresh: true },
      });
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const PriorityModal = () => (
    <Modal
      visible={showPriorityModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPriorityModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={styles.priorityModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Priority</Text>
            <TouchableOpacity
              onPress={() => setShowPriorityModal(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.priorityOptions}>
            {priorities.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.priorityOption,
                  priority === item.key && styles.selectedPriorityOption,
                ]}
                onPress={() => {
                  setPriority(item.key as Task['priority']);
                  setShowPriorityModal(false);
                }}
              >
                <View style={[styles.priorityIndicator, { backgroundColor: item.color }]}>
                  <Icon name={item.icon} size={16} color="#FFFFFF" />
                </View>
                <Text
                  style={[
                    styles.priorityOptionText,
                    priority === item.key && styles.selectedPriorityOptionText,
                  ]}
                >
                  {item.label}
                </Text>
                {priority === item.key && (
                  <Icon name="check" size={20} color="#6366F1" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const selectedPriority = priorities.find(p => p.key === priority);

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

          <Text style={styles.headerTitle}>Add Task</Text>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Task Title *</Text>
            <View style={styles.inputContainer}>
              <Icon name="assignment" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter task title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#9CA3AF"
                autoFocus
              />
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Description</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <Icon name="notes" size={20} color="#6B7280" style={styles.textAreaIcon} />
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Add task description..."
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Due Date */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Due Date</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="schedule" size={20} color="#6B7280" style={styles.inputIcon} />
              <Text style={styles.dateText}>
                {dueDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Icon name="keyboard-arrow-right" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Priority */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Priority</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowPriorityModal(true)}
            >
              <View style={[styles.priorityIndicator, { backgroundColor: selectedPriority?.color }]}>
                <Icon name={selectedPriority?.icon || 'remove'} size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.priorityText}>
                {selectedPriority?.label}
              </Text>
              <Icon name="keyboard-arrow-right" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Task Source Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="info" size={20} color="#6366F1" />
              <Text style={styles.infoTitle}>Manual Task</Text>
            </View>
            <Text style={styles.infoDescription}>
              This task will be created manually and can be synced with your calendar later.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Icon name="add-task" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {loading ? 'Creating...' : 'Create Task'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Date Picker */}
        <DatePicker
          modal
          open={showDatePicker}
          date={dueDate}
          mode="datetime"
          onConfirm={(date) => {
            setShowDatePicker(false);
            setDueDate(date);
          }}
          onCancel={() => {
            setShowDatePicker(false);
          }}
          title="Select Due Date"
          confirmText="Confirm"
          cancelText="Cancel"
        />

        <PriorityModal />
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
  saveButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 16,
    minHeight: 120,
  },
  inputIcon: {
    marginRight: 12,
  },
  textAreaIcon: {
    marginTop: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    textAlignVertical: 'top',
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  priorityIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  priorityText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  infoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginLeft: 8,
  },
  infoDescription: {
    fontSize: 12,
    color: '#6366F1',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 40,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityModal: {
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
  priorityOptions: {
    gap: 4,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  selectedPriorityOption: {
    backgroundColor: '#EEF2FF',
  },
  priorityOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  selectedPriorityOptionText: {
    color: '#6366F1',
    fontWeight: '600',
  },
});

export default AddTaskScreen;