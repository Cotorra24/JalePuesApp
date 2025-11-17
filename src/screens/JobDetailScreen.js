// src/screens/JobDetailScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../Database/firebaseConfig';
import { formatPrice } from '../constants/nicaraguaConstants';

const { width } = Dimensions.get('window');

export default function JobDetailScreen({ route, navigation }) {
    const { job } = route.params;
    const [jobData, setJobData] = useState(job);
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(false);
    const currentUser = auth.currentUser;

    useEffect(() => {
        setIsOwner(job.userId === currentUser?.uid);
    }, []);

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-NI', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleContact = async () => {
        if (job.userId === currentUser?.uid) {
            Alert.alert('Aviso', 'No puedes contactarte contigo mismo');
            return;
        }

        try {
            setLoading(true);

            // Verificar si ya existe una conversación
            const q = query(
                collection(db, 'conversations'),
                where('jobId', '==', job.id),
                where('participants', 'array-contains', currentUser.uid)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Ya existe conversación, ir a ella
                const conversationData = querySnapshot.docs[0];
                navigation.navigate('Chat', {
                    conversationId: conversationData.id,
                    jobTitle: job.title,
                    otherUserName: job.userName,
                    jobId: job.id
                });
            } else {
                // Crear nueva conversación
                const conversationRef = await addDoc(collection(db, 'conversations'), {
                    jobId: job.id,
                    jobTitle: job.title,
                    participants: [currentUser.uid, job.userId],
                    [`user_${currentUser.uid}_name`]: currentUser.displayName || 'Usuario',
                    [`user_${job.userId}_name`]: job.userName,
                    lastMessage: '',
                    lastMessageAt: serverTimestamp(),
                    createdAt: serverTimestamp(),
                    hired: false
                });

                navigation.navigate('Chat', {
                    conversationId: conversationRef.id,
                    jobTitle: job.title,
                    otherUserName: job.userName,
                    jobId: job.id
                });
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            Alert.alert('Error', 'No se pudo iniciar la conversación');
        } finally {
            setLoading(false);
        }
    };

    const handleHire = async (workerId, workerName) => {
        Alert.alert(
            'Contratar trabajador',
            `¿Deseas contratar a ${workerName} para este trabajo?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Contratar',
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, 'jobs', job.id), {
                                status: 'in-progress',
                                hiredWorkerId: workerId,
                                hiredWorkerName: workerName,
                                hiredAt: serverTimestamp()
                            });
                            Alert.alert('Éxito', 'Trabajador contratado exitosamente');
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error hiring worker:', error);
                            Alert.alert('Error', 'No se pudo contratar al trabajador');
                        }
                    }
                }
            ]
        );
    };

    const handleMarkCompleted = async () => {
        Alert.alert(
            'Completar trabajo',
            '¿El trabajo ha sido completado?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Completar',
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, 'jobs', job.id), {
                                status: 'completed',
                                completedAt: serverTimestamp()
                            });
                            Alert.alert('Éxito', 'Trabajo marcado como completado. Ahora puedes calificar al trabajador.');
                            navigation.navigate('RateWorker', {
                                jobId: job.id,
                                workerId: jobData.hiredWorkerId,
                                workerName: jobData.hiredWorkerName,
                                jobTitle: job.title
                            });
                        } catch (error) {
                            console.error('Error completing job:', error);
                            Alert.alert('Error', 'No se pudo completar el trabajo');
                        }
                    }
                }
            ]
        );
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const names = name.split(' ');
        if (names.length >= 2) {
            return names[0][0] + names[1][0];
        }
        return name[0];
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                    <Text style={styles.backText}>Volver</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.userSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(job.userName)}</Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{job.userName}</Text>
                        {job.userRating > 0 && (
                            <View style={styles.ratingContainer}>
                                <Ionicons name="star" size={16} color="#FFA500" />
                                <Text style={styles.rating}>{job.userRating.toFixed(1)}</Text>
                                <Text style={styles.jobsCount}>• {job.userJobsCompleted || 0} trabajos</Text>
                            </View>
                        )}
                    </View>
                </View>

                <Text style={styles.title}>{job.title}</Text>
                <Text style={styles.price}>{formatPrice(job.price)}</Text>

                <View style={styles.infoRow}>
                    <Ionicons name="location" size={20} color="#0066CC" />
                    <Text style={styles.infoText}>{job.location}</Text>
                </View>

                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                        {job.status === 'active' ? '🟢 Disponible' :
                            job.status === 'in-progress' ? '🟡 En proceso' : '✅ Completado'}
                    </Text>
                </View>

                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{job.category}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Descripción</Text>
                    <Text style={styles.description}>{job.description}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detalles adicionales</Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Fecha de publicación</Text>
                        <Text style={styles.detailValue}>
                            {formatDate(job.createdAt)}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Fecha preferida</Text>
                        <Text style={styles.detailValue}>
                            {job.preferredDate || 'Lo antes posible'}
                        </Text>
                    </View>

                    {job.status === 'in-progress' && job.hiredWorkerName && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Trabajador contratado</Text>
                            <Text style={styles.detailValueSuccess}>{job.hiredWorkerName}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                {!isOwner && job.status === 'active' && (
                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={handleContact}
                        disabled={loading}
                    >
                        <Ionicons name="chatbubble-outline" size={20} color="white" />
                        <Text style={styles.contactButtonText}>
                            {loading ? 'Cargando...' : 'Contactar'}
                        </Text>
                    </TouchableOpacity>
                )}

                {isOwner && job.status === 'active' && (
                    <Text style={styles.ownerMessage}>
                        Esperando postulantes para este trabajo
                    </Text>
                )}

                {isOwner && job.status === 'in-progress' && (
                    <TouchableOpacity
                        style={styles.completeButton}
                        onPress={handleMarkCompleted}
                    >
                        <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                        <Text style={styles.contactButtonText}>Marcar como completado</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 8,
    },
    content: {
        flex: 1,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#0066CC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginLeft: 4,
    },
    jobsCount: {
        fontSize: 13,
        color: '#666',
        marginLeft: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        paddingHorizontal: 16,
        paddingTop: 16,
        marginBottom: 8,
    },
    price: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0066CC',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    infoText: {
        fontSize: 15,
        color: '#666',
        marginLeft: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 16,
        marginBottom: 12,
    },
    statusText: {
        fontSize: 14,
        color: '#2E7D32',
        fontWeight: '600',
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 16,
        marginBottom: 24,
    },
    categoryText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    section: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        color: '#666',
        lineHeight: 24,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    detailLabel: {
        fontSize: 15,
        color: '#666',
    },
    detailValue: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    detailValueSuccess: {
        fontSize: 15,
        color: '#00C853',
        fontWeight: '600',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    contactButton: {
        backgroundColor: '#0066CC',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
    },
    completeButton: {
        backgroundColor: '#00C853',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
    },
    contactButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    ownerMessage: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
        fontStyle: 'italic',
    },
});