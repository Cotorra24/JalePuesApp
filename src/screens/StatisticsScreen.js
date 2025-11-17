// src/screens/StatisticsScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Dimensions, Platform } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../Database/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import * as XLSX from 'xlsx';
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { Buffer } from "buffer";



const { width } = Dimensions.get('window');

export default function StatisticsScreen({ navigation }) {
    const [ratings, setRatings] = useState([]);
    const [stats, setStats] = useState({
        totalJobs: 0,
        averageRating: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0,
    });
    const [loading, setLoading] = useState(true);
    const viewShotRef = useRef(null);

    useEffect(() => {
        loadStatistics();
    }, []);

    const loadStatistics = async () => {
        try {
            const currentUser = auth.currentUser;

            // Obtener todas las calificaciones del usuario
            const q = query(
                collection(db, 'ratings'),
                where('ratedUserId', '==', currentUser.uid)
            );

            const querySnapshot = await getDocs(q);
            const ratingsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setRatings(ratingsData);
            calculateStats(ratingsData);
        } catch (error) {
            console.error('Error loading statistics:', error);
            Alert.alert('Error', 'No se pudieron cargar las estadísticas');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (ratingsData) => {
        const totalJobs = ratingsData.length;

        if (totalJobs === 0) {
            setStats({
                totalJobs: 0,
                averageRating: 0,
                fiveStars: 0,
                fourStars: 0,
                threeStars: 0,
                twoStars: 0,
                oneStar: 0,
            });
            return;
        }

        const sum = ratingsData.reduce((acc, r) => acc + r.rating, 0);
        const averageRating = (sum / totalJobs).toFixed(2);

        const fiveStars = ratingsData.filter(r => r.rating === 5).length;
        const fourStars = ratingsData.filter(r => r.rating === 4).length;
        const threeStars = ratingsData.filter(r => r.rating === 3).length;
        const twoStars = ratingsData.filter(r => r.rating === 2).length;
        const oneStar = ratingsData.filter(r => r.rating === 1).length;

        setStats({
            totalJobs,
            averageRating: parseFloat(averageRating),
            fiveStars,
            fourStars,
            threeStars,
            twoStars,
            oneStar,
        });
    };

    const exportToExcel = async () => {
        try {
            // Preparar datos
            const excelData = ratings.map(rating => ({
                'Trabajo': rating.jobTitle,
                'Calificación': rating.rating,
                'Comentario': rating.comment || 'Sin comentario',
                'Calificado por': rating.raterName,
                'Fecha':
                    rating.createdAt?.toDate?.()?.toLocaleDateString('es-NI') || 'N/A'
            }));

            excelData.push({});
            excelData.push({ 'Trabajo': 'RESUMEN' });
            excelData.push({ 'Trabajo': 'Total de trabajos', 'Calificación': stats.totalJobs });
            excelData.push({ 'Trabajo': 'Promedio de calificación', 'Calificación': stats.averageRating });
            excelData.push({ 'Trabajo': '5 Estrellas', 'Calificación': stats.fiveStars });
            excelData.push({ 'Trabajo': '4 Estrellas', 'Calificación': stats.fourStars });
            excelData.push({ 'Trabajo': '3 Estrellas', 'Calificación': stats.threeStars });
            excelData.push({ 'Trabajo': '2 Estrellas', 'Calificación': stats.twoStars });
            excelData.push({ 'Trabajo': '1 Estrella', 'Calificación': stats.oneStar });

            // Crear libro
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Estadísticas');

            // Generar binary string
            const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });

            // Convertir binary string → Uint8Array
            const buffer = Buffer.from(wbout, 'binary'); // <--- SOLUCIÓN REAL

            // Convertir Uint8Array → Base64
            const base64 = buffer.toString("base64");

            // Guardar archivo
            const fileName = `estadisticas_${Date.now()}.xlsx`;
            const fileUri = FileSystem.documentDirectory + fileName;

            await FileSystem.writeAsStringAsync(fileUri, base64, {
                encoding: "base64",
            });


            // Compartir
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert("Error", "No se puede compartir en este dispositivo");
            }

            Alert.alert("Éxito", "Archivo Excel generado correctamente");

        } catch (error) {
            console.error("Error exporting to Excel:", error);
            Alert.alert("Error", "No se pudo exportar a Excel");
        }
    };



    const exportToPDF = async () => {
        try {
            Alert.alert('Generando PDF', 'Capturando gráficos...');

            // Capturar la vista como imagen
            const uri = await viewShotRef.current.capture();

            Alert.alert(
                'PDF Generado',
                'Se ha guardado una imagen de tus estadísticas',
                [
                    {
                        text: 'Compartir',
                        onPress: async () => {
                            if (await Sharing.isAvailableAsync()) {
                                await Sharing.shareAsync(uri);
                            }
                        }
                    },
                    { text: 'OK', style: 'cancel' }
                ]
            );
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            Alert.alert('Error', 'No se pudo generar el PDF');
        }
    };

    const chartConfig = {
        backgroundGradientFrom: '#fff',
        backgroundGradientTo: '#fff',
        color: (opacity = 1) => `rgba(0, 102, 204, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.7,
        useShadowColorFromDataset: false,
    };

    const pieData = [
        {
            name: '5★',
            population: stats.fiveStars,
            color: '#4CAF50',
            legendFontColor: '#333',
            legendFontSize: 14,
        },
        {
            name: '4★',
            population: stats.fourStars,
            color: '#8BC34A',
            legendFontColor: '#333',
            legendFontSize: 14,
        },
        {
            name: '3★',
            population: stats.threeStars,
            color: '#FFC107',
            legendFontColor: '#333',
            legendFontSize: 14,
        },
        {
            name: '2★',
            population: stats.twoStars,
            color: '#FF9800',
            legendFontColor: '#333',
            legendFontSize: 14,
        },
        {
            name: '1★',
            population: stats.oneStar,
            color: '#F44336',
            legendFontColor: '#333',
            legendFontSize: 14,
        },
    ];

    const barData = {
        labels: ['5★', '4★', '3★', '2★', '1★'],
        datasets: [{
            data: [
                stats.fiveStars,
                stats.fourStars,
                stats.threeStars,
                stats.twoStars,
                stats.oneStar,
            ],
        }],
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Cargando estadísticas...</Text>
            </View>
        );
    }

    if (stats.totalJobs === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Estadísticas</Text>
                    <View style={styles.placeholder} />
                </View>

                <View style={styles.emptyContainer}>
                    <Ionicons name="stats-chart-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>No hay estadísticas aún</Text>
                    <Text style={styles.emptySubtext}>
                        Completa trabajos para ver tus estadísticas
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mis Estadísticas</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content}>
                <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                    <View style={styles.statsCard}>
                        <Text style={styles.cardTitle}>Resumen General</Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Ionicons name="briefcase" size={32} color="#0066CC" />
                                <Text style={styles.statNumber}>{stats.totalJobs}</Text>
                                <Text style={styles.statLabel}>Trabajos</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="star" size={32} color="#FFA500" />
                                <Text style={styles.statNumber}>{stats.averageRating}</Text>
                                <Text style={styles.statLabel}>Promedio</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.chartCard}>
                        <Text style={styles.cardTitle}>Distribución de Calificaciones</Text>
                        <PieChart
                            data={pieData}
                            width={width - 32}
                            height={220}
                            chartConfig={chartConfig}
                            accessor="population"
                            backgroundColor="transparent"
                            paddingLeft="15"
                            absolute
                        />
                    </View>

                    <View style={styles.chartCard}>
                        <Text style={styles.cardTitle}>Cantidad por Estrellas</Text>
                        <BarChart
                            data={barData}
                            width={width - 32}
                            height={220}
                            chartConfig={chartConfig}
                            style={styles.chart}
                            showValuesOnTopOfBars
                            fromZero
                        />
                    </View>

                    <View style={styles.detailsCard}>
                        <Text style={styles.cardTitle}>Detalles</Text>
                        {ratings.map((rating, index) => (
                            <View key={rating.id} style={styles.ratingItem}>
                                <View style={styles.ratingHeader}>
                                    <Text style={styles.ratingTitle}>{rating.jobTitle}</Text>
                                    <View style={styles.starsContainer}>
                                        {[...Array(5)].map((_, i) => (
                                            <Ionicons
                                                key={i}
                                                name="star"
                                                size={14}
                                                color={i < rating.rating ? '#FFA500' : '#E0E0E0'}
                                            />
                                        ))}
                                    </View>
                                </View>
                                {rating.comment && (
                                    <Text style={styles.ratingComment}>"{rating.comment}"</Text>
                                )}
                                <Text style={styles.ratingInfo}>
                                    Por: {rating.raterName} • {rating.createdAt?.toDate?.()?.toLocaleDateString('es-NI')}
                                </Text>
                            </View>
                        ))}
                    </View>
                </ViewShot>

                <View style={styles.exportButtons}>
                    <TouchableOpacity style={styles.exportButton} onPress={exportToPDF}>
                        <Ionicons name="document-text" size={24} color="white" />
                        <Text style={styles.exportButtonText}>Exportar PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.exportButton, styles.excelButton]}
                        onPress={exportToExcel}
                    >
                        <Ionicons name="grid" size={24} color="white" />
                        <Text style={styles.exportButtonText}>Exportar Excel</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    content: {
        flex: 1,
    },
    statsCard: {
        backgroundColor: 'white',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0066CC',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    chartCard: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    detailsCard: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    ratingItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    ratingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    starsContainer: {
        flexDirection: 'row',
    },
    ratingComment: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 4,
    },
    ratingInfo: {
        fontSize: 12,
        color: '#999',
    },
    exportButtons: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    exportButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF3B30',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    excelButton: {
        backgroundColor: '#00C853',
    },
    exportButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
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