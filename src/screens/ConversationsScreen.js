// src/screens/ConversationsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../Database/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function ConversationsScreen({ navigation }) {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', currentUser.uid),
            orderBy('lastMessageAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const conversationsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setConversations(conversationsData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching conversations:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const getOtherUserName = (conversation) => {
        const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
        return conversation[`user_${otherUserId}_name`] || 'Usuario';
    };

    const renderConversation = ({ item }) => {
        const otherUserName = getOtherUserName(item);
        const hasUnread = item.lastSenderId !== currentUser.uid && !item.lastMessageRead;

        return (
            <TouchableOpacity
                style={[styles.conversationCard, hasUnread && styles.conversationUnread]}
                onPress={() => navigation.navigate('Chat', {
                    conversationId: item.id,
                    jobTitle: item.jobTitle || 'Trabajo',
                    otherUserName,
                    jobId: item.jobId
                })}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {otherUserName[0]?.toUpperCase() || '?'}
                    </Text>
                </View>

                <View style={styles.conversationInfo}>
                    <View style={styles.conversationHeader}>
                        <Text style={styles.conversationName}>{otherUserName}</Text>
                        <Text style={styles.conversationTime}>
                            {item.lastMessageAt?.toDate?.().toLocaleDateString('es-NI', {
                                day: 'numeric',
                                month: 'short'
                            }) || ''}
                        </Text>
                    </View>

                    <Text style={styles.conversationJob}>{item.jobTitle}</Text>

                    <View style={styles.lastMessageContainer}>
                        <Text
                            style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
                            numberOfLines={1}
                        >
                            {item.lastMessage || 'Sin mensajes'}
                        </Text>
                        {hasUnread && <View style={styles.unreadDot} />}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066CC" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mensajes</Text>
            </View>

            <FlatList
                data={conversations}
                renderItem={renderConversation}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
                        <Text style={styles.emptyText}>No tienes conversaciones</Text>
                        <Text style={styles.emptySubtext}>
                            Empieza a contactar trabajadores o empleadores
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: 'white',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    list: {
        paddingTop: 8,
    },
    conversationCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    conversationUnread: {
        backgroundColor: '#E3F2FD',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#0066CC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    conversationInfo: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    conversationName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    conversationTime: {
        fontSize: 12,
        color: '#999',
    },
    conversationJob: {
        fontSize: 13,
        color: '#0066CC',
        marginBottom: 4,
    },
    lastMessageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lastMessage: {
        flex: 1,
        fontSize: 14,
        color: '#666',
    },
    lastMessageUnread: {
        fontWeight: '600',
        color: '#333',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#0066CC',
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#999',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
});