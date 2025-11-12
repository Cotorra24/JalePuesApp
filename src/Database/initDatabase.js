// src/Database/initDatabase.js
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Datos de ejemplo para usuarios
const sampleUsers = [
    {
        fullName: "María González",
        email: "maria@example.com",
        phone: "+506 8888-1234",
        rating: 4.8,
        completedJobs: 12,
        activePublications: 2,
        bio: "Plomera profesional con más de 5 años de experiencia. Especializada en reparaciones urgentes."
    },
    {
        fullName: "Carlos Ramírez",
        email: "carlos@example.com",
        phone: "+506 8888-5678",
        rating: 4.5,
        completedJobs: 8,
        activePublications: 1,
        bio: "Electricista certificado. Instalaciones y reparaciones eléctricas residenciales."
    },
    {
        fullName: "Ana Solís",
        email: "ana@example.com",
        phone: "+506 8888-9012",
        rating: 5.0,
        completedJobs: 15,
        activePublications: 3,
        bio: "Servicio de limpieza profesional. Atención al detalle y puntualidad garantizada."
    }
];

// Datos de ejemplo para trabajos
const sampleJobs = [
    {
        title: "Reparación de tubería en cocina",
        description: "Necesito un plomero para reparar una fuga en la tubería del fregadero. Es urgente ya que está goteando bastante.",
        category: "Plomería",
        price: 15000,
        location: "San José Centro",
        images: [],
        userName: "María González",
        userRating: 4.8,
        userJobsCompleted: 12,
        status: "active",
        preferredDate: "Lo antes posible",
        jobType: "one-time"
    },
    {
        title: "Instalación de lámpara exterior",
        description: "Busco electricista para instalar lámpara en el jardín trasero. Incluye conexión eléctrica nueva.",
        category: "Electricidad",
        price: 20000,
        location: "Escazú",
        images: [],
        userName: "Carlos Ramírez",
        userRating: 4.5,
        userJobsCompleted: 8,
        status: "active",
        preferredDate: "Fin de semana",
        jobType: "one-time"
    },
    {
        title: "Limpieza profunda de casa",
        description: "Necesito servicio de limpieza profunda para casa de 3 habitaciones. Incluye ventanas y baños.",
        category: "Limpieza",
        price: 25000,
        location: "Santa Ana",
        images: [],
        userName: "Ana Solís",
        userRating: 5.0,
        userJobsCompleted: 15,
        status: "active",
        preferredDate: "Próxima semana",
        jobType: "one-time"
    },
    {
        title: "Instalación de estantes en sala",
        description: "Necesito instalar 3 estantes en la sala. Los materiales ya están comprados.",
        category: "Carpintería",
        price: 18000,
        location: "Curridabat",
        images: [],
        userName: "Juan Pérez",
        userRating: 4.2,
        userJobsCompleted: 6,
        status: "active",
        preferredDate: "Lo antes posible",
        jobType: "one-time"
    },
    {
        title: "Pintura de habitación",
        description: "Busco pintor para pintar una habitación de aproximadamente 12m². La pintura está incluida.",
        category: "Pintura",
        price: 30000,
        location: "Heredia",
        images: [],
        userName: "Pedro Jiménez",
        userRating: 4.7,
        userJobsCompleted: 10,
        status: "active",
        preferredDate: "Esta semana",
        jobType: "one-time"
    },
    {
        title: "Mantenimiento de jardín mensual",
        description: "Necesito servicio de jardinería mensual. Incluye poda, limpieza y mantenimiento general.",
        category: "Jardinería",
        price: 35000,
        location: "Alajuela",
        images: [],
        userName: "Laura Mora",
        userRating: 4.9,
        userJobsCompleted: 20,
        status: "active",
        preferredDate: "Primer día de cada mes",
        jobType: "recurring"
    }
];

// Datos de ejemplo para calificaciones
const sampleRatings = [
    {
        ratedUserId: "user1",
        raterUserId: "user2",
        raterName: "Pedro Jiménez",
        rating: 5,
        comment: "Excelente trabajo, muy profesional y puntual.",
        jobTitle: "Reparación de tubería",
        jobId: "job1"
    },
    {
        ratedUserId: "user1",
        raterUserId: "user3",
        raterName: "Laura Mora",
        rating: 4,
        comment: "Buen servicio, resolvió el problema rápidamente.",
        jobTitle: "Instalación de lavamanos",
        jobId: "job2"
    }
];

/**
 * Inicializa la base de datos con datos de ejemplo
 */
export const initializeDatabase = async () => {
    try {
        console.log('🔄 Iniciando generación de base de datos...');

        const batch = writeBatch(db);
        const userIds = [];
        const jobIds = [];

        // 1. Crear usuarios de ejemplo
        console.log('👥 Creando usuarios...');
        for (const userData of sampleUsers) {
            const userRef = doc(collection(db, 'users'));
            userIds.push(userRef.id);

            batch.set(userRef, {
                ...userData,
                createdAt: serverTimestamp()
            });
        }

        // 2. Crear trabajos de ejemplo
        console.log('💼 Creando trabajos...');
        for (let i = 0; i < sampleJobs.length; i++) {
            const jobRef = doc(collection(db, 'jobs'));
            jobIds.push(jobRef.id);

            batch.set(jobRef, {
                ...sampleJobs[i],
                userId: userIds[i % userIds.length] || 'demo-user',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        // 3. Crear calificaciones de ejemplo
        console.log('⭐ Creando calificaciones...');
        for (const ratingData of sampleRatings) {
            const ratingRef = doc(collection(db, 'ratings'));

            batch.set(ratingRef, {
                ...ratingData,
                createdAt: serverTimestamp()
            });
        }

        // Ejecutar todas las operaciones
        await batch.commit();

        console.log('✅ Base de datos inicializada correctamente!');
        console.log(`📊 Creados: ${userIds.length} usuarios, ${jobIds.length} trabajos, ${sampleRatings.length} calificaciones`);

        return {
            success: true,
            message: 'Base de datos inicializada correctamente',
            stats: {
                users: userIds.length,
                jobs: jobIds.length,
                ratings: sampleRatings.length
            }
        };

    } catch (error) {
        console.error('❌ Error inicializando base de datos:', error);
        throw error;
    }
};

/**
 * Crea las colecciones vacías (solo estructura)
 */
export const createDatabaseStructure = async () => {
    try {
        console.log('🏗️ Creando estructura de base de datos...');

        // Crear documento placeholder en cada colección
        const collections = [
            { name: 'users', data: { _placeholder: true } },
            { name: 'jobs', data: { _placeholder: true } },
            { name: 'conversations', data: { _placeholder: true } },
            { name: 'ratings', data: { _placeholder: true } },
            { name: 'notifications', data: { _placeholder: true } }
        ];

        for (const col of collections) {
            await addDoc(collection(db, col.name), {
                ...col.data,
                createdAt: serverTimestamp()
            });
            console.log(`✅ Colección "${col.name}" creada`);
        }

        console.log('✅ Estructura de base de datos creada!');
        return { success: true };

    } catch (error) {
        console.error('❌ Error creando estructura:', error);
        throw error;
    }
};

/**
 * Limpia toda la base de datos (¡CUIDADO!)
 */
export const clearDatabase = async () => {
    console.warn('⚠️ Esta función eliminará todos los datos. No implementada por seguridad.');
    // No implementamos esto para evitar borrados accidentales
    return { success: false, message: 'Función no implementada por seguridad' };
};