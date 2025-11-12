// src/screens/MyPostsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../Database/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function MyPostsScreen({ navigation }) {
  const [activeJobs, setActiveJobs] = useState([]);
  const [inProgressJobs, setInProgressJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [selectedTab, setSelectedTab] = useState('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'jobs'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setActiveJobs(jobs.filter(job => job.status === 'active'));
      setInProgressJobs(jobs.filter(job => job.status === 'in-progress'));
      setCompletedJobs(jobs.filter(job => job.status === 'completed'));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteJob = (jobId) => {
    Alert.alert(
      'Eliminar publicación',
      '¿Estás seguro de que deseas eliminar esta publicación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'jobs', jobId));
              Alert.alert('Éxito', 'Publicación eliminada');
            } catch (error) {
              console.error('Error deleting job:', error);
              Alert.alert('Error', 'No se pudo eliminar la publicación');
            }
          }
        }
      ]
    );
  };

  const handleMarkAsCompleted = (jobId) => {
    Alert.alert(
      'Marcar como completado',
      '¿Deseas marcar este trabajo como completado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'jobs', jobId), {
                status: 'completed',
                completedAt: new Date()
              });
              Alert.alert('Éxito', 'Trabajo marcado como completado');
            } catch (error) {
              console.error('Error updating job:', error);
              Alert.alert('Error', 'No se pudo actualizar el trabajo');
            }
          }
        }
      ]
    );
  };

  const renderJobItem = ({ item }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {item.status === 'active' ? 'Activa' :
              item.status === 'in-progress' ? 'En progreso' : 'Completada'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteJob(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <Text style={styles.jobTitle}>{item.title}</Text>
      <Text style={styles.jobDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.jobFooter}>
        <View style={styles.priceLocation}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.jobLocation}>{item.location}</Text>
          </View>
        </View>

        {item.status === 'active' && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleMarkAsCompleted(item.id)}
          >
            <Text style={styles.completeButtonText}>Completar</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{item.category}</Text>
      </View>
    </View>
  );

  const getCurrentJobs = () => {
    switch (selectedTab) {
      case 'active':
        return activeJobs;
      case 'in-progress':
        return inProgressJobs;
      case 'completed':
        return completedJobs;
      default:
        return [];
    }
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Publicaciones</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
          onPress={() => setSelectedTab('active')}
        >
          <Text style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>
            Activas ({activeJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'in-progress' && styles.tabActive]}
          onPress={() => setSelectedTab('in-progress')}
        >
          <Text style={[styles.tabText, selectedTab === 'in-progress' && styles.tabTextActive]}>
            En Progreso ({inProgressJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'completed' && styles.tabActive]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text style={[styles.tabText, selectedTab === 'completed' && styles.tabTextActive]}>
            Completadas ({completedJobs.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={getCurrentJobs()}
        renderItem={renderJobItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>No tienes publicaciones</Text>
            <Text style={styles.emptySubtext}>
              Publica un trabajo para comenzar
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0066CC',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#0066CC',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  jobCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#00C853',
    fontWeight: '600',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  jobDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLocation: {
    flex: 1,
  },
  jobPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobLocation: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  completeButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});