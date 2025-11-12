// src/screens/SettingsScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../Database/firebaseConfig';

export default function SettingsScreen({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Congelar cuenta',
      'Esta función pausará temporalmente tu cuenta. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pausar',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Funcionalidad en desarrollo', 'Esta función estará disponible pronto');
          }
        }
      ]
    );
  };

  const MenuItem = ({ icon, title, onPress, showArrow = true, rightComponent }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={24} color="#333" />
        <Text style={styles.menuItemText}>{title}</Text>
      </View>
      {rightComponent || (showArrow && <Ionicons name="chevron-forward" size={24} color="#999" />)}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias</Text>

          <MenuItem
            icon="notifications-outline"
            title="Notificaciones"
            showArrow={false}
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E5E5E5', true: '#0066CC' }}
                thumbColor="white"
              />
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>

          <MenuItem
            icon="shield-outline"
            title="Privacidad"
            onPress={() => Alert.alert('Funcionalidad en desarrollo', 'Esta función estará disponible pronto')}
          />

          <MenuItem
            icon="lock-closed-outline"
            title="Seguridad"
            onPress={() => Alert.alert('Funcionalidad en desarrollo', 'Esta función estará disponible pronto')}
          />

          <MenuItem
            icon="snow-outline"
            title="Congelar cuenta"
            onPress={handleDeleteAccount}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>

          <MenuItem
            icon="help-circle-outline"
            title="Ayuda y soporte"
            onPress={() => Alert.alert('Ayuda', 'Contacta con nosotros en soporte@jalepues.com')}
          />

          <MenuItem
            icon="document-text-outline"
            title="Términos y condiciones"
            onPress={() => Alert.alert('Términos y condiciones', 'Esta sección mostrará los términos y condiciones de la aplicación')}
          />

          <MenuItem
            icon="shield-checkmark-outline"
            title="Política de privacidad"
            onPress={() => Alert.alert('Política de privacidad', 'Esta sección mostrará la política de privacidad de la aplicación')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sesión</Text>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>JalePues v1.0.0</Text>
      </ScrollView>
    </View>
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
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 12,
    fontWeight: '500',
  },
  version: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 30,
    marginBottom: 40,
  },
});