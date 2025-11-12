// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../Database/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import JobCard from '../components/JobCard';

const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'Plomería', name: 'Plomería' },
    { id: 'Electricidad', name: 'Electricidad' },
    { id: 'Limpieza', name: 'Limpieza' },
    { id: 'Jardinería', name: 'Jardinería' },
    { id: 'Carpintería', name: 'Carpintería' },
    { id: 'Pintura', name: 'Pintura' },
];

export default function HomeScreen({ navigation }) {
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [location, setLocation] = useState('Chontales, Nicaragua');

    useEffect(() => {
        const q = query(
            collection(db, 'jobs'),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setJobs(jobsData);
            setFilteredJobs(jobsData);
            setLoading(false);
            setRefreshing(false);
        }, (error) => {
            console.error('Error fetching jobs:', error);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        filterJobs();
    }, [searchQuery, selectedCategory, jobs]);

    const filterJobs = () => {
        let filtered = [...jobs];

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(job => job.category === selectedCategory);
        }

        if (searchQuery) {
            filtered = filtered.filter(job =>
                job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredJobs(filtered);
    };

    const onRefresh = () => {
        setRefreshing(true);
    };

    const renderCategoryItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(item.id)}
        >
            <Text
                style={[
                    styles.categoryChipText,
                    selectedCategory === item.id && styles.categoryChipTextActive
                ]}
            >
                {item.name}
            </Text>
        </TouchableOpacity>
    );

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
                <View>
                    <Text style={styles.appName}>JalePues</Text>
                    <TouchableOpacity style={styles.locationContainer}>
                        <Ionicons name="location" size={16} color="#0066CC" />
                        <Text style={styles.locationText}>{location}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar trabajos..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="options-outline" size={24} color="#0066CC" />
                </TouchableOpacity>
            </View>

            <View style={styles.categoriesContainer}>
                <FlatList
                    horizontal
                    data={categories}
                    renderItem={renderCategoryItem}
                    keyExtractor={item => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesList}
                />
            </View>

            <Text style={styles.jobCount}>
                {filteredJobs.length} trabajo{filteredJobs.length !== 1 ? 's' : ''} disponible{filteredJobs.length !== 1 ? 's' : ''}
            </Text>

            <FlatList
                data={filteredJobs}
                renderItem={({ item }) => (
                    <JobCard
                        job={item}
                        onPress={() => navigation.navigate('JobDetail', { job: item })}
                    />
                )}
                keyExtractor={item => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="briefcase-outline" size={80} color="#ccc" />
                        <Text style={styles.emptyText}>No hay trabajos disponibles</Text>
                        <Text style={styles.emptySubtext}>
                            Intenta cambiar los filtros o vuelve más tarde
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
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    locationText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        margin: 16,
        borderRadius: 12,
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
    },
    filterButton: {
        padding: 8,
    },
    categoriesContainer: {
        backgroundColor: 'white',
        paddingVertical: 12,
    },
    categoriesList: {
        paddingHorizontal: 16,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginRight: 8,
    },
    categoryChipActive: {
        backgroundColor: '#0066CC',
    },
    categoryChipText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    categoryChipTextActive: {
        color: 'white',
    },
    jobCount: {
        fontSize: 14,
        color: '#666',
        paddingHorizontal: 16,
        paddingVertical: 12,
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
        textAlign: 'center',
    },
});