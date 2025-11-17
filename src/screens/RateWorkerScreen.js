// src/screens/RateWorkerScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, serverTimestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../Database/firebaseConfig';

export default function RateWorkerScreen({ route, navigation }) {
    const { jobId, workerId, workerName, jobTitle } = route.params;
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmitRating = async () => {
        if (rating === 0) {
            Alert.alert('Error', 'Por favor selecciona una calificación');
            return;
        }

        setLoading(true);
        try {
            const currentUser = auth.currentUser;

            // Guardar la calificación
            await addDoc(collection(db, 'ratings'), {
                jobId,
                jobTitle,
                ratedUserId: workerId,
                raterUserId: currentUser.uid,
                raterName: currentUser.displayName || 'Usuario',
                rating,
                comment: comment.trim(),
                createdAt: serverTimestamp()
            });

            // Obtener datos actuales del trabajador
            const userDoc = await getDoc(doc(db, 'users', workerId));
            const userData = userDoc.data();

            const currentRating = userData.rating || 0;
            const currentCompletedJobs = userData.completedJobs || 0;

            // Calcular nuevo promedio
            // Fórmula: (promedio_actual * trabajos_completados + nueva_calificación) / (trabajos_completados + 1)
            const newTotalRating = (currentRating * currentCompletedJobs) + rating;
            const newCompletedJobs = currentCompletedJobs + 1;
            const newAverageRating = newTotalRating / newCompletedJobs;

            // Actualizar perfil del trabajador
            await updateDoc(doc(db, 'users', workerId), {
                rating: parseFloat(newAverageRating.toFixed(2)), // Redondear a 2 decimales
                completedJobs: newCompletedJobs
            });

            // Actualizar contador del empleador
            await updateDoc(doc(db, 'users', currentUser.uid), {
                activePublications: increment(-1)
            });

            Alert.alert(
                '¡Gracias por tu calificación!',
                'El trabajador ha sido calificado exitosamente',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('HomeTabs')
                    }
                ]
            );
        } catch (error) {
            console.error('Error submitting rating:', error);
            Alert.alert('Error', 'No se pudo enviar la calificación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Calificar trabajador</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
                <View style={styles.workerInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {workerName[0]?.toUpperCase() || '?'}
                        </Text>
                    </View>
                    <Text style={styles.workerName}>{workerName}</Text>
                    <Text style={styles.jobTitle}>{jobTitle}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>¿Cómo fue tu experiencia?</Text>
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setRating(star)}
                                style={styles.starButton}
                            >
                                <Ionicons
                                    name={star <= rating ? 'star' : 'star-outline'}
                                    size={50}
                                    color={star <= rating ? '#FFA500' : '#ccc'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.ratingText}>
                        {rating === 0 ? 'Selecciona tu calificación' :
                            rating === 1 ? 'Muy malo' :
                                rating === 2 ? 'Malo' :
                                    rating === 3 ? 'Regular' :
                                        rating === 4 ? 'Bueno' : 'Excelente'}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Comentario (opcional)</Text>
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Cuéntanos más sobre tu experiencia..."
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        numberOfLines={4}
                        maxLength={500}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{comment.length}/500</Text>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, (loading || rating === 0) && styles.submitButtonDisabled]}
                    onPress={handleSubmitRating}
                    disabled={loading || rating === 0}
                >
                    <Text style={styles.submitButtonText}>
                        {loading ? 'Enviando...' : 'Enviar calificación'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    placeholder: {
        width: 24,
    },
    content: {
        padding: 20,
    },
    workerInfo: {
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#0066CC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    workerName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    jobTitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    section: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 12,
    },
    starButton: {
        padding: 4,
    },
    ratingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0066CC',
        textAlign: 'center',
    },
    commentInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        minHeight: 120,
        marginBottom: 8,
    },
    charCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
    },
    submitButton: {
        backgroundColor: '#0066CC',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});