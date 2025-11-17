// src/screens/PublishJobScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../Database/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CATEGORIES, LOCATIONS } from '../constants/nicaraguaConstants';

export default function PublishJobScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Límite alcanzado', 'Puedes subir máximo 5 imágenes');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Por favor ingresa una descripción');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Por favor selecciona una categoría');
      return;
    }
    if (!price || isNaN(price) || Number(price) <= 0) {
      Alert.alert('Error', 'Por favor ingresa un presupuesto válido');
      return;
    }
    if (!location) {
      Alert.alert('Error', 'Por favor selecciona una ubicación');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      const jobData = {
        title: title.trim(),
        description: description.trim(),
        category,
        price: Number(price),
        location,
        images,
        userId: user.uid,
        userName: userData?.fullName || user.displayName || 'Usuario',
        userRating: userData?.rating || 0,
        userJobsCompleted: userData?.completedJobs || 0,
        status: 'active',
        createdAt: serverTimestamp(),
        preferredDate: 'Lo antes posible',
        jobType: 'one-time'
      };

      await addDoc(collection(db, 'jobs'), jobData);

      // Actualizar contador de publicaciones activas del usuario
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        activePublications: (userData?.activePublications || 0) + 1
      });

      Alert.alert(
        '¡Éxito!',
        'Tu trabajo ha sido publicado',
        [
          {
            text: 'OK',
            onPress: () => {
              setTitle('');
              setDescription('');
              setCategory('');
              setPrice('');
              setLocation('');
              setImages([]);
              navigation.navigate('Inicio');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error publishing job:', error);
      Alert.alert('Error', 'No se pudo publicar el trabajo. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Publicar trabajo</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Título del trabajo*</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Reparación de tubería en cocina"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Descripción*</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe detalladamente el trabajo que necesitas..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/500 caracteres</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Categoría*</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              style={styles.picker}
            >
              <Picker.Item label="Selecciona una categoría" value="" />
              {CATEGORIES.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Presupuesto estimado*</Text>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySymbol}>C$</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="15,000"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Ubicación*</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={location}
              onValueChange={setLocation}
              style={styles.picker}
            >
              <Picker.Item label="Selecciona una ubicación" value="" />
              {LOCATIONS.map((loc) => (
                <Picker.Item key={loc} label={loc} value={loc} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Fotos (opcional)</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Ionicons name="cloud-upload-outline" size={40} color="#0066CC" />
            <Text style={styles.uploadText}>Toca para agregar fotos</Text>
            <Text style={styles.uploadSubtext}>Máximo 5 imágenes</Text>
          </TouchableOpacity>

          {images.length > 0 && (
            <View style={styles.imagesContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.publishButton, loading && styles.publishButtonDisabled]}
          onPress={handlePublish}
          disabled={loading}
        >
          <Text style={styles.publishButtonText}>
            {loading ? 'Publicando...' : 'Publicar trabajo'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  cancelButton: {
    fontSize: 16,
    color: '#0066CC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  formGroup: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 15,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingLeft: 15,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 5,
  },
  priceInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 16,
    color: '#0066CC',
    marginTop: 10,
    fontWeight: '500',
  },
  uploadSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  imagePreview: {
    width: 80,
    height: 80,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    position: 'relative',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  publishButton: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  publishButtonDisabled: {
    backgroundColor: '#ccc',
  },
  publishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});