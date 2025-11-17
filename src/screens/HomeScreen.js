// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, onSnapshot, where, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../Database/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import JobCard from '../components/JobCard';
import { CATEGORIES, LOCATIONS } from '../constants/nicaraguaConstants';

const ALL_CATEGORIES = [
    { id: 'all', name: 'Todos' },
    ...CATEGORIES.map(cat => ({ id: cat, name: cat }))
];

export default function HomeScreen({ navigation }) {
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [userCategories, setUserCategories] = useState([]);
    const [location, setLocation] = useState('Managua, Nicaragua');

    // Cargar categorías de interés del usuario
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserCategories(userData.categories || []);
                    }
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };
        loadUserData();
    }, []);

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

            // Ordenar trabajos por relevancia
            const sortedJobs = sortJobsByRelevance(jobsData, userCategories);
            setJobs(sortedJobs);
            setFilteredJobs(sortedJobs);
            setLoading(false);
            setRefreshing(false);
        }, (error) => {
            console.error('Error fetching jobs:', error);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, [userCategories]);

    // Algoritmo para ordenar trabajos por relevancia
    const sortJobsByRelevance = (jobsList, userCats) => {
        if (!userCats || userCats.length === 0) {
            return jobsList;
        }

        return jobsList.sort((a, b) => {
            const aMatch = userCats.includes(a.category) ? 1 : 0;
            const bMatch = userCats.includes(b.category) ? 1 : 0;

            // Priorizar trabajos que coincidan con categorías de interés
            if (aMatch !== bMatch) {
                return bMatch - aMatch;
            }

            // Si ambos coinciden o no coinciden, ordenar por fecha
            const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return bDate - aDate;
        });
    };

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

    const renderCategoryItem = ({ item }) => {
        const isRelevant = userCategories.includes(item.id) && item.id !== 'all';

        return (
            <TouchableOpacity
                style={[
                    styles.categoryChip,
                    selectedCategory === item.id && styles.categoryChipActive,
                    isRelevant && styles.categoryChipRelevant
                ]}
                onPress={() => setSelectedCategory(item.id)}
            >
                {isRelevant && (
                    <Ionicons name="star" size={12} color="#FFA500" style={styles.starIcon} />
                )}
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

            {userCategories.length > 0 && (
                <View style={styles.suggestedBanner}>
                    <Ionicons name="bulb" size={16} color="#FFA500" />
                    <Text style={styles.suggestedText}>
                        Trabajos recomendados según tus intereses ⭐
                    </Text>
                </View>
            )}

            <View style={styles.categoriesContainer}>
                <FlatList
                    horizontal
                    data={ALL_CATEGORIES}
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
                        isRecommended={userCategories.includes(item.category)}
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
    suggestedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#FFA500',
    },
    suggestedText: {
        fontSize: 13,
        color: '#F57C00',
        fontWeight: '600',
        marginLeft: 8,
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
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryChipActive: {
        backgroundColor: '#0066CC',
    },
    categoryChipRelevant: {
        borderWidth: 1,
        borderColor: '#FFA500',
    },
    categoryChipText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    categoryChipTextActive: {
        color: 'white',
    },
    starIcon: {
        marginRight: 4,
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