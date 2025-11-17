// src/screens/ChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../Database/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen({ route, navigation }) {
    const { conversationId, jobTitle, otherUserName, jobId } = route.params;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [jobData, setJobData] = useState(null);
    const [conversationData, setConversationData] = useState(null);
    const [otherUserId, setOtherUserId] = useState(null);
    const flatListRef = useRef(null);
    const currentUser = auth.currentUser;

    useEffect(() => {
        loadJobData();
        loadConversationData();
    }, []);

    const loadJobData = async () => {
        if (!jobId) return;
        try {
            const jobDoc = await getDoc(doc(db, 'jobs', jobId));
            if (jobDoc.exists()) {
                setJobData({ id: jobDoc.id, ...jobDoc.data() });
            }
        } catch (error) {
            console.error('Error loading job:', error);
        }
    };

    const loadConversationData = async () => {
        try {
            const convDoc = await getDoc(doc(db, 'conversations', conversationId));
            if (convDoc.exists()) {
                const data = convDoc.data();
                setConversationData(data);

                // Encontrar el ID del otro usuario
                const otherUser = data.participants.find(id => id !== currentUser.uid);
                setOtherUserId(otherUser);
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    };

    useEffect(() => {
        const q = query(
            collection(db, 'conversations', conversationId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(messagesData);

            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });

        return () => unsubscribe();
    }, [conversationId]);

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
                text: newMessage.trim(),
                senderId: currentUser.uid,
                senderName: currentUser.displayName || 'Usuario',
                createdAt: serverTimestamp(),
                read: false
            });

            await updateDoc(doc(db, 'conversations', conversationId), {
                lastMessage: newMessage.trim(),
                lastMessageAt: serverTimestamp(),
                lastSenderId: currentUser.uid
            });

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleHire = async () => {
        Alert.alert(
            'Contratar trabajador',
            `¿Deseas contratar a ${otherUserName} para este trabajo?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Contratar',
                    onPress: async () => {
                        try {
                            // Actualizar el trabajo
                            await updateDoc(doc(db, 'jobs', jobId), {
                                status: 'in-progress',
                                hiredWorkerId: otherUserId,
                                hiredWorkerName: otherUserName,
                                hiredAt: serverTimestamp()
                            });

                            // Actualizar la conversación
                            await updateDoc(doc(db, 'conversations', conversationId), {
                                hired: true,
                                hiredAt: serverTimestamp()
                            });

                            // Enviar mensaje automático
                            await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
                                text: `✅ ${currentUser.displayName} te ha contratado para este trabajo.`,
                                senderId: 'system',
                                senderName: 'Sistema',
                                createdAt: serverTimestamp(),
                                read: false,
                                isSystemMessage: true
                            });

                            Alert.alert('¡Éxito!', 'Has contratado a este trabajador');
                            loadJobData(); // Recargar datos
                            loadConversationData();
                        } catch (error) {
                            console.error('Error hiring:', error);
                            Alert.alert('Error', 'No se pudo contratar al trabajador');
                        }
                    }
                }
            ]
        );
    };

    const handleReject = async () => {
        Alert.alert(
            'Rechazar propuesta',
            `¿Deseas rechazar la propuesta de ${otherUserName}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Rechazar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Enviar mensaje automático
                            await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
                                text: `❌ ${currentUser.displayName} ha rechazado tu propuesta para este trabajo.`,
                                senderId: 'system',
                                senderName: 'Sistema',
                                createdAt: serverTimestamp(),
                                read: false,
                                isSystemMessage: true
                            });

                            Alert.alert('Propuesta rechazada', 'Se ha notificado al trabajador');
                        } catch (error) {
                            console.error('Error rejecting:', error);
                            Alert.alert('Error', 'No se pudo rechazar la propuesta');
                        }
                    }
                }
            ]
        );
    };

    const handleCompleteJob = async () => {
        Alert.alert(
            'Completar trabajo',
            '¿El trabajo ha sido completado satisfactoriamente?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Completar',
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, 'jobs', jobId), {
                                status: 'completed',
                                completedAt: serverTimestamp()
                            });

                            // Enviar mensaje automático
                            await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
                                text: `✅ Trabajo marcado como completado. Por favor, califica al trabajador.`,
                                senderId: 'system',
                                senderName: 'Sistema',
                                createdAt: serverTimestamp(),
                                read: false,
                                isSystemMessage: true
                            });

                            Alert.alert(
                                'Trabajo completado',
                                'Ahora puedes calificar al trabajador',
                                [
                                    {
                                        text: 'Calificar ahora',
                                        onPress: () => navigation.navigate('RateWorker', {
                                            jobId: jobId,
                                            workerId: otherUserId,
                                            workerName: otherUserName,
                                            jobTitle: jobTitle
                                        })
                                    },
                                    { text: 'Más tarde', style: 'cancel' }
                                ]
                            );
                        } catch (error) {
                            console.error('Error completing job:', error);
                            Alert.alert('Error', 'No se pudo completar el trabajo');
                        }
                    }
                }
            ]
        );
    };

    const isJobOwner = jobData?.userId === currentUser.uid;
    const isHired = conversationData?.hired || jobData?.status === 'in-progress';
    const isCompleted = jobData?.status === 'completed';
    const canShowHireButtons = isJobOwner && !isHired && !isCompleted && jobData?.status === 'active';
    const canCompleteJob = isJobOwner && isHired && !isCompleted;

    const renderMessage = ({ item }) => {
        const isMyMessage = item.senderId === currentUser.uid;
        const isSystemMessage = item.isSystemMessage || item.senderId === 'system';

        if (isSystemMessage) {
            return (
                <View style={styles.systemMessageContainer}>
                    <View style={styles.systemMessageBubble}>
                        <Text style={styles.systemMessageText}>{item.text}</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={[
                styles.messageContainer,
                isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
            ]}>
                {!isMyMessage && (
                    <Text style={styles.senderName}>{item.senderName}</Text>
                )}
                <View style={[
                    styles.messageBubble,
                    isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
                ]}>
                    <Text style={[
                        styles.messageText,
                        isMyMessage ? styles.myMessageText : styles.otherMessageText
                    ]}>
                        {item.text}
                    </Text>
                </View>
                <Text style={styles.messageTime}>
                    {item.createdAt?.toDate?.().toLocaleTimeString('es-NI', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }) || ''}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{otherUserName}</Text>
                    <Text style={styles.headerJobTitle}>
                        {jobTitle}
                        {isHired && ' • 🟡 En proceso'}
                        {isCompleted && ' • ✅ Completado'}
                    </Text>
                </View>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-vertical" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Botones de acción para el empleador */}
            {canShowHireButtons && (
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
                        <Ionicons name="close-circle" size={20} color="white" />
                        <Text style={styles.actionButtonText}>Rechazar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.hireButton} onPress={handleHire}>
                        <Ionicons name="checkmark-circle" size={20} color="white" />
                        <Text style={styles.actionButtonText}>Contratar</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Botón para completar trabajo */}
            {canCompleteJob && (
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity style={styles.completeButton} onPress={handleCompleteJob}>
                        <Ionicons name="checkmark-done-circle" size={20} color="white" />
                        <Text style={styles.actionButtonText}>Marcar como completado</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                    onPress={sendMessage}
                    disabled={loading || !newMessage.trim()}
                >
                    <Ionicons name="send" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    headerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    headerJobTitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        gap: 12,
    },
    hireButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00C853',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    rejectButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF3B30',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    completeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0066CC',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    messagesList: {
        padding: 16,
    },
    messageContainer: {
        marginBottom: 16,
        maxWidth: '80%',
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    otherMessageContainer: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
    },
    systemMessageContainer: {
        alignSelf: 'center',
        marginVertical: 12,
        maxWidth: '90%',
    },
    systemMessageBubble: {
        backgroundColor: '#FFF9E6',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFD54F',
    },
    systemMessageText: {
        fontSize: 13,
        color: '#F57C00',
        textAlign: 'center',
        fontWeight: '500',
    },
    senderName: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        marginLeft: 12,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 18,
        maxWidth: '100%',
    },
    myMessageBubble: {
        backgroundColor: '#0066CC',
        borderBottomRightRadius: 4,
    },
    otherMessageBubble: {
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: 'white',
    },
    otherMessageText: {
        color: '#333',
    },
    messageTime: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
        marginHorizontal: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 8,
        maxHeight: 100,
        fontSize: 15,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0066CC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
});