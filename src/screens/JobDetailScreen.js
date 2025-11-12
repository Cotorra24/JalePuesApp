// src/screens/JobDetailScreen.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../Database/firebaseConfig';

export default function JobDetailScreen({ route, navigation }) {
    const { job } = route.params;

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleContact = () => {
        if (job.userId === auth.currentUser?.uid) {
            Alert.alert('Aviso', 'No puedes contactarte contigo mismo');
            return;
        }
        Alert.alert(
            'Contactar',
            '¿Deseas contactar a este usuario?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Contactar', onPress: () => {
                        // Aquí implementarías la funcionalidad de mensajería
                        Alert.alert('Funcionalidad en desarrollo', 'Pronto podrás enviar mensajes');
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
                                <Text style={styles.jobsCount}>• {job.userJobsCompleted || 12} trabajos</Text>
                            </View>
                        )}
                    </View>
                </View>

                <Text style={styles.title}>{job.title}</Text>
                <Text style={styles.price}>C$ {job.price.toLocaleString()}</Text>

                <View style={styles.infoRow}>
                    <Ionicons name="location" size={20} color="#0066CC" />
                    <Text style={styles.infoText}>{job.location}</Text>
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
                        <Text style={styles.detailLabel}>Tipo de trabajo</Text>
                        <Text style={styles.detailValue}>
                            {job.jobType === 'one-time' ? 'Puntual' : 'Recurrente'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Fecha preferida</Text>
                        <Text style={styles.detailValue}>
                            {job.preferredDate || 'Lo antes posible'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Disponibilidad</Text>
                        <Text style={styles.detailValueAvailable}>Disponible</Text>
                    </View>
                </View>

                {job.reviews && job.reviews.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Calificaciones del publicador</Text>
                        {job.reviews.slice(0, 2).map((review, index) => (
                            <View key={index} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Text style={styles.reviewAuthor}>{review.author}</Text>
                                    <View style={styles.reviewRating}>
                                        {[...Array(5)].map((_, i) => (
                                            <Ionicons
                                                key={i}
                                                name="star"
                                                size={12}
                                                color={i < review.rating ? '#FFA500' : '#E0E0E0'}
                                            />
                                        ))}
                                    </View>
                                </View>
                                <Text style={styles.reviewText}>{review.text}</Text>
                                <Text style={styles.reviewDate}>{review.date}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
                    <Ionicons name="chatbubble-outline" size={20} color="white" />
                    <Text style={styles.contactButtonText}>Contactar</Text>
                </TouchableOpacity>
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
    detailValueAvailable: {
        fontSize: 15,
        color: '#00C853',
        fontWeight: '600',
    },
    reviewCard: {
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewAuthor: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    reviewRating: {
        flexDirection: 'row',
    },
    reviewText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 4,
    },
    reviewDate: {
        fontSize: 12,
        color: '#999',
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
    contactButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});