// src/components/JobCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice } from '../constants/nicaraguaConstants';

export default function JobCard({ job, onPress, isRecommended }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const jobDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now - jobDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return name[0];
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(job.userName)}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{job.userName}</Text>
            <Text style={styles.time}>{formatTime(job.createdAt)}</Text>
          </View>
        </View>
        {job.userRating > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFA500" />
            <Text style={styles.rating}>{job.userRating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>{job.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {job.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            C$ {job.price.toLocaleString()}
          </Text>
        </View>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.location}>{job.location}</Text>
        </View>
      </View>

      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{job.category}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
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
});