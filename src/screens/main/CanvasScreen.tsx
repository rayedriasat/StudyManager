import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  RefreshControl,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../context/AuthContext';
import { CanvasAssignment, CanvasCourse } from '../../types';
import CanvasService from '../../services/canvasService';
import TaskService from '../../services/taskService';

const CanvasScreen = ({ navigation }: any) => {
  const { user, updateUserProfile } = useAuth();
  const [canvasUrl, setCanvasUrl] = useState(user?.canvas_url || '');
  const [accessToken, setAccessToken] = useState(user?.canvas_token || '');
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [assignments, setAssignments] = useState<CanvasAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    checkConnection();
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

  const checkConnection = async () => {
    if (user?.canvas_token && user?.canvas_url) {
      try {
        const canvasService = new CanvasService(user.canvas_url, user.canvas_token);
        const isValid = await canvasService.validateToken();
        setIsConnected(isValid);
        
        if (isValid) {
          loadCanvasData();
        }
      } catch (error) {
        console.error('Error checking Canvas connection:', error);
        setIsConnected(false);
      }
    }
  };

  const loadCanvasData = async () => {
    if (!user?.canvas_token || !user?.canvas_url) return;

    try {
      setLoading(true);
      const canvasService = new CanvasService(user.canvas_url, user.canvas_token);
      
      const [coursesData, assignmentsData] = await Promise.all([
        canvasService.getCourses(),
        canvasService.getUpcomingAssignments(30),
      ]);

      setCourses(coursesData);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading Canvas data:', error);
      Alert.alert('Error', 'Failed to load Canvas data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCanvasData();
    setRefreshing(false);
  };

  const setupCanvas = async () => {
    if (!canvasUrl || !accessToken) {
      Alert.alert('Error', 'Please fill in both Canvas URL and Access Token');
      return;
    }

    try {
      setLoading(true);
      const canvasService = new CanvasService(canvasUrl, accessToken);
      const isValid = await canvasService.validateToken();

      if (isValid) {
        await updateUserProfile({
          canvas_url: canvasUrl,
          canvas_token: accessToken,
        });

        setIsConnected(true);
        setShowSetupModal(false);
        Alert.alert('Success', 'Canvas has been connected successfully!');
        await loadCanvasData();
      } else {
        Alert.alert('Error', 'Invalid Canvas URL or Access Token. Please check your credentials.');
      }
    } catch (error) {
      console.error('Error setting up Canvas:', error);
      Alert.alert('Error', 'Failed to connect to Canvas. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const syncAssignmentToTask = async (assignment: CanvasAssignment) => {
    try {
      await TaskService.createTask({
        user_id: user!.id,
        title: assignment.name,
        description: assignment.description || '',
        due_date: assignment.due_at ? new Date(assignment.due_at).toISOString() : undefined,
        priority: 'medium',
        status: 'pending',
        source: 'canvas',
        canvas_assignment_id: assignment.id.toString(),
      });

      Alert.alert('Success', 'Assignment synced to tasks successfully!');
    } catch (error) {
      console.error('Error syncing assignment:', error);
      Alert.alert('Error', 'Failed to sync assignment to tasks');
    }
  };

  const syncAllAssignments = async () => {
    if (assignments.length === 0) return;

    Alert.alert(
      'Sync All Assignments',
      `This will create ${assignments.length} new tasks. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          onPress: async () => {
            try {
              setLoading(true);
              
              for (const assignment of assignments) {
                await TaskService.createTask({
                  user_id: user!.id,
                  title: assignment.name,
                  description: assignment.description || '',
                  due_date: assignment.due_at ? new Date(assignment.due_at).toISOString() : undefined,
                  priority: 'medium',
                  status: 'pending',
                  source: 'canvas',
                  canvas_assignment_id: assignment.id.toString(),
                });
              }

              Alert.alert('Success', `${assignments.length} assignments synced successfully!`);
              navigation.navigate('Tasks');
            } catch (error) {
              console.error('Error syncing all assignments:', error);
              Alert.alert('Error', 'Failed to sync some assignments');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const AssignmentCard = ({ assignment, index }: { assignment: CanvasAssignment; index: number }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    const isOverdue = assignment.due_at && new Date(assignment.due_at) < new Date();
    const dueIn = assignment.due_at ? Math.ceil((new Date(assignment.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

    return (
      <Animated.View
        style={[
          styles.assignmentCard,
          isOverdue && styles.overdueCard,
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
        <View style={styles.assignmentHeader}>
          <View style={styles.assignmentInfo}>
            <Text style={styles.assignmentTitle} numberOfLines={2}>
              {assignment.name}
            </Text>
            <Text style={styles.courseName}>
              Course ID: {assignment.course_id}
            </Text>
          </View>
          
          <View style={styles.assignmentActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('CanvasWebView', { 
                url: assignment.html_url,
                title: assignment.name,
              })}
            >
              <Icon name="open-in-browser" size={20} color="#6366F1" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => syncAssignmentToTask(assignment)}
            >
              <Icon name="add-task" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>

        {assignment.due_at && (
          <View style={styles.assignmentMeta}>
            <Icon name="schedule" size={16} color={isOverdue ? '#EF4444' : '#6B7280'} />
            <Text style={[styles.dueDate, isOverdue && styles.overdueDueDate]}>
              {isOverdue 
                ? `Overdue by ${Math.abs(dueIn!)} days`
                : dueIn! <= 0 
                  ? 'Due today'
                  : `Due in ${dueIn} days`
              }
            </Text>
            {assignment.points_possible && (
              <>
                <Icon name="star" size={16} color="#F59E0B" style={{ marginLeft: 16 }} />
                <Text style={styles.points}>{assignment.points_possible} pts</Text>
              </>
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  const SetupModal = () => (
    <Modal
      visible={showSetupModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSetupModal(false)}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#FFFFFF', width: '90%', maxWidth: 500, borderRadius: 20, maxHeight: '90%', minHeight: 400, flexDirection: 'column', overflow: 'hidden', alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>Canvas Setup</Text>
            <TouchableOpacity
              onPress={() => setShowSetupModal(false)}
              style={{ padding: 4 }}
            >
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 20 }}>
              To connect Canvas, you'll need your Canvas URL and an Access Token.
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#1F2937', marginBottom: 8 }}>Canvas URL</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#FFFFFF' }}
                placeholder="https://your-school.instructure.com"
                value={canvasUrl}
                onChangeText={setCanvasUrl}
                autoCapitalize="none"
                autoComplete="url"
                keyboardType="url"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#1F2937', marginBottom: 8 }}>Access Token</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#FFFFFF' }}
                placeholder="Enter your Canvas access token"
                value={accessToken}
                onChangeText={setAccessToken}
                secureTextEntry={true}
              />
            </View>

            <View style={{ backgroundColor: '#F8FAFC', borderRadius: 8, padding: 16, marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>How to get your Access Token:</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 18 }}>
                1. Log into Canvas{'\n'}
                2. Go to Account → Settings{'\n'}
                3. Scroll to "Approved Integrations"{'\n'}
                4. Click "+ New Access Token"{'\n'}
                5. Copy the generated token
              </Text>
            </View>

            <TouchableOpacity
              style={{ backgroundColor: '#6366F1', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20, opacity: loading ? 0.7 : 1 }}
              onPress={setupCanvas}
              disabled={loading}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                {loading ? 'Connecting...' : 'Connect Canvas'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.setupContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Icon name="school" size={80} color="#D1D5DB" />
          <Text style={styles.setupTitle}>Connect Canvas</Text>
          <Text style={styles.setupSubtitle}>
            Sync your assignments and stay on top of your coursework
          </Text>
          
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => setShowSetupModal(true)}
          >
            <Icon name="link" size={20} color="#FFFFFF" />
            <Text style={styles.connectButtonText}>Connect to Canvas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.learnMoreButton}
            onPress={() => navigation.navigate('CanvasSetup')}
          >
            <Text style={styles.learnMoreText}>Learn More</Text>
          </TouchableOpacity>
        </Animated.View>

        <SetupModal />
      </View>
    );
  }

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
            <Text style={styles.title}>Canvas</Text>
            <View style={styles.connectionStatus}>
              <Icon name="check-circle" size={16} color="#10B981" />
              <Text style={styles.connectionText}>Connected</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowSetupModal(true)}
            >
              <Icon name="settings" size={20} color="#6B7280" />
            </TouchableOpacity>
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
          contentContainerStyle={styles.scrollContent}
        >
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{courses.length}</Text>
              <Text style={styles.statLabel}>Active Courses</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{assignments.length}</Text>
              <Text style={styles.statLabel}>Upcoming Assignments</Text>
            </View>
          </View>

          {/* Sync Actions */}
          {assignments.length > 0 && (
            <View style={styles.syncContainer}>
              <TouchableOpacity
                style={styles.syncAllButton}
                onPress={syncAllAssignments}
              >
                <Icon name="sync" size={20} color="#FFFFFF" />
                <Text style={styles.syncAllText}>Sync All Assignments</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Assignments */}
          <View style={styles.assignmentsSection}>
            <Text style={styles.sectionTitle}>Upcoming Assignments</Text>
            
            {assignments.length > 0 ? (
              assignments.map((assignment, index) => (
                <AssignmentCard key={`assignment-${assignment.id}`} assignment={assignment} index={index} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="assignment-turned-in" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateTitle}>No upcoming assignments</Text>
                <Text style={styles.emptyStateSubtitle}>
                  All caught up! Check back later for new assignments.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
      <SetupModal />
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
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
  },
  setupSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  learnMoreButton: {
    paddingVertical: 8,
  },
  learnMoreText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '500',
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
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  connectionText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  syncContainer: {
    marginBottom: 20,
  },
  syncAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    justifyContent: 'center',
  },
  syncAllText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  assignmentsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assignmentInfo: {
    flex: 1,
    marginRight: 12,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 12,
    color: '#6B7280',
  },
  assignmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  overdueDueDate: {
    color: '#EF4444',
    fontWeight: '500',
  },
  points: {
    fontSize: 12,
    color: '#F59E0B',
    marginLeft: 4,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '90%',
    maxWidth: 500,
    borderRadius: 20,
    maxHeight: '90%',
    minHeight: 400,
    flexDirection: 'column',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  setupInstructions: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  helpContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  setupButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  setupButtonDisabled: {
    opacity: 0.7,
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CanvasScreen;
