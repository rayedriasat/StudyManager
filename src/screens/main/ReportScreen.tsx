import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import TaskService from '../../services/taskService';
import { Task } from '../../types';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const SCREEN_WIDTH = Dimensions.get('window').width;

const ReportScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const allTasks = await TaskService.getAllTasks(user.id);
            setTasks(allTasks);
        } catch (error) {
            console.error('Error loading report data:', error);
            Alert.alert('Error', 'Failed to load progress data');
        } finally {
            setLoading(false);
        }
    };

    // --- Statistics Calculation ---
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const completionRate = tasks.length > 0
        ? Math.round((completedTasks.length / tasks.length) * 100)
        : 0;

    const upcomingTasks = pendingTasks
        .filter(t => t.due_date && new Date(t.due_date) > new Date())
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
        .slice(0, 5);

    // --- Heatmap Logic ---
    const getDaysArray = (start: Date, end: Date) => {
        const arr = [];
        for (
            let dt = new Date(start);
            dt <= end;
            dt.setDate(dt.getDate() + 1)
        ) {
            arr.push(new Date(dt));
        }
        return arr;
    };

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 89); // Last 90 days roughly

    const days = getDaysArray(startDate, endDate);

    // Group completions by date (YYYY-MM-DD)
    const activityMap: Record<string, number> = {};
    completedTasks.forEach(t => {
        const date = new Date(t.updated_at).toISOString().split('T')[0];
        activityMap[date] = (activityMap[date] || 0) + 1;
    });

    const getIntensityColor = (count: number) => {
        if (count === 0) return '#E5E7EB'; // Gray-200
        if (count <= 2) return '#C7D2FE'; // Indigo-200
        if (count <= 4) return '#818CF8'; // Indigo-400
        if (count <= 6) return '#6366F1'; // Indigo-500
        return '#4338CA'; // Indigo-700
    };

    // --- HTML Generation for PDF ---
    const generateHtml = () => {
        const heatmapHtml = days.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const count = activityMap[dateStr] || 0;
            let color = '#E5E7EB';
            if (count > 0 && count <= 2) color = '#C7D2FE';
            else if (count > 4 && count <= 6) color = '#818CF8';
            else if (count > 6) color = '#6366F1';
            else if (count > 2) color = '#4338CA'; // Fix logic slightly to match TS

            // Correct logic for HTML string to match TS
            if (count === 0) color = '#efefef';
            else if (count <= 2) color = '#C7D2FE';
            else if (count <= 4) color = '#818CF8';
            else if (count <= 6) color = '#6366F1';
            else color = '#4338CA';

            return `<div style="width: 12px; height: 12px; background-color: ${color}; border-radius: 2px; margin: 2px;" title="${dateStr}: ${count} tasks"></div>`;
        }).join('');

        const upcomingRows = upcomingTasks.map(t => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px;">${t.title}</td>
        <td style="padding: 10px; color: #666;">${t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date'}</td>
        <td style="padding: 10px;">
            <span style="background-color: ${t.priority === 'high' ? '#fee2e2' : t.priority === 'medium' ? '#fef3c7' : '#d1fae5'}; 
                         color: ${t.priority === 'high' ? '#b91c1c' : t.priority === 'medium' ? '#b45309' : '#047857'};
                         padding: 4px 8px; border-radius: 9999px; font-size: 12px;">
                ${t.priority.toUpperCase()}
            </span>
        </td>
      </tr>
    `).join('');

        return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica', sans-serif; color: #333; padding: 20px; }
            h1 { color: #4338CA; text-align: center; margin-bottom: 40px; }
            .stats-container { display: flex; justify-content: space-around; margin-bottom: 40px; }
            .stat-card { text-align: center; padding: 15px; background: #f9fafb; border-radius: 8px; width: 30%; }
            .stat-value { font-size: 24px; font-weight: bold; color: #4338CA; }
            .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px; }
            .heatmap-container { display: flex; flex-wrap: wrap; max-width: 600px; margin: 0 auto; gap: 2px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 10px; color: #666; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #eee; }
          </style>
        </head>
        <body>
          <h1>StudyManager Progress Report</h1>
          
          <div class="stats-container">
            <div class="stat-card">
              <div class="stat-value">${completedTasks.length}</div>
              <div class="stat-label">Tasks Completed</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${completionRate}%</div>
              <div class="stat-label">Completion Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${upcomingTasks.length}</div>
              <div class="stat-label">Upcoming Tasks</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Activity Heatmap (Last 90 Days)</div>
            <div class="heatmap-container" style="display: flex; flex-wrap: wrap; justify-content: center;">
                ${heatmapHtml}
            </div>
            <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #888;">
                Darker squares indicate more completed tasks.
            </div>
          </div>

           <div class="section">
            <div class="section-title">Upcoming Schedule</div>
             <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                ${upcomingRows || '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #888;">No upcoming tasks scheduled</td></tr>'}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 50px; text-align: center; color: #999; font-size: 12px;">
            Generated by StudyManager on ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;
    };

    const generateAndSharePdf = async () => {
        try {
            setGeneratingPdf(true);
            const html = generateHtml();

            const { uri } = await Print.printToFileAsync({
                html,
                base64: false,
            });

            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Failed to generate PDF report');
        } finally {
            setGeneratingPdf(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.title}>Progress Report</Text>
                <TouchableOpacity
                    disabled={generatingPdf}
                    style={styles.exportButton}
                    onPress={generateAndSharePdf}
                >
                    {generatingPdf ? (
                        <ActivityIndicator size="small" color="#6366F1" />
                    ) : (
                        <Icon name="picture-as-pdf" size={24} color="#6366F1" />
                    )}
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{completedTasks.length}</Text>
                            <Text style={styles.statLabel}>Completed</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{completionRate}%</Text>
                            <Text style={styles.statLabel}>Success Rate</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{pendingTasks.length}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </View>
                    </View>

                    {/* Heatmap Section */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Activity Heatmap</Text>
                        <Text style={styles.sectionSubtitle}>Last 90 Days</Text>

                        <View style={styles.heatmapGrid}>
                            {days.map((date, index) => {
                                const dateStr = date.toISOString().split('T')[0];
                                const count = activityMap[dateStr] || 0;
                                return (
                                    <View
                                        key={index}
                                        style={[
                                            styles.heatmapBox,
                                            { backgroundColor: getIntensityColor(count) }
                                        ]}
                                    />
                                );
                            })}
                        </View>
                        <View style={styles.legendContainer}>
                            <Text style={styles.legendText}>Less</Text>
                            <View style={[styles.legendBox, { backgroundColor: '#E5E7EB' }]} />
                            <View style={[styles.legendBox, { backgroundColor: '#C7D2FE' }]} />
                            <View style={[styles.legendBox, { backgroundColor: '#818CF8' }]} />
                            <View style={[styles.legendBox, { backgroundColor: '#6366F1' }]} />
                            <View style={[styles.legendBox, { backgroundColor: '#4338CA' }]} />
                            <Text style={styles.legendText}>More</Text>
                        </View>
                    </View>

                    {/* Upcoming Schedule */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
                        {upcomingTasks.length > 0 ? (
                            upcomingTasks.map(task => (
                                <View key={task.id} style={styles.taskRow}>
                                    <View style={styles.taskInfo}>
                                        <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                                        <Text style={styles.taskDate}>
                                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.priorityBadge,
                                        task.priority === 'high' ? styles.bgRed :
                                            task.priority === 'medium' ? styles.bgYellow : styles.bgGreen
                                    ]}>
                                        <Text style={[
                                            styles.priorityText,
                                            task.priority === 'high' ? styles.textRed :
                                                task.priority === 'medium' ? styles.textYellow : styles.textGreen
                                        ]}>
                                            {task.priority.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No upcoming tasks scheduled.</Text>
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    exportButton: {
        padding: 8,
        marginRight: -8,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6366F1',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    sectionContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
    },
    heatmapGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        justifyContent: 'center', // Center the grid
    },
    heatmapBox: {
        width: (Dimensions.get('window').width - 80) / 15, // Approx 15 items per row
        height: (Dimensions.get('window').width - 80) / 15,
        borderRadius: 4,
    },
    legendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 16,
        gap: 6,
    },
    legendText: {
        fontSize: 12,
        color: '#6B7280',
    },
    legendBox: {
        width: 12,
        height: 12,
        borderRadius: 2,
    },
    taskRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    taskInfo: {
        flex: 1,
        marginRight: 12,
    },
    taskTitle: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '500',
        marginBottom: 2,
    },
    taskDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    priorityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    emptyText: {
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    bgRed: { backgroundColor: '#FEE2E2' },
    bgYellow: { backgroundColor: '#FEF3C7' },
    bgGreen: { backgroundColor: '#D1FAE5' },
    textRed: { color: '#B91C1C' },
    textYellow: { color: '#B45309' },
    textGreen: { color: '#047857' },
});

export default ReportScreen;
