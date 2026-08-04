// src/services/geoService.js
const { getFirestore } = require('../config/firebase');
const ngeohash = require('ngeohash');
const { logger } = require('../utils/logger');

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function choosePrecisionForRadiusKm(radiusKm) {
  // Geohash precision -> approximate width/height
  // 6 -> ~0.61km, 5 -> ~2.4km, 4 -> ~20km, 3 -> ~78km
  if (radiusKm <= 0.8) return 6;
  if (radiusKm <= 5) return 5;
  if (radiusKm <= 20) return 4;
  if (radiusKm <= 80) return 3;
  return 2;
}

async function findProfessionalsNearby({ latitude, longitude, category, excludeUserId }, radiusKm = 10, limit = 50) {
  if (!latitude || !longitude) return [];
  try {
    const precision = choosePrecisionForRadiusKm(radiusKm);
    const centerHash = ngeohash.encode(latitude, longitude, precision);
    const neighbors = ngeohash.neighbors(centerHash) || [];
    const prefixes = [centerHash, ...neighbors];

    const db = getFirestore();
    const unique = new Map();

    for (const prefix of prefixes) {
      const start = prefix;
      const end = prefix + '\uf8ff';
      let query = db.collection('users')
          .where('userType', 'in', ['professional', 'Professional', 'both', 'Both'])
        .where('geoHash', '>=', start)
        .where('geoHash', '<=', end);

      if (category) {
        query = query.where('category', '==', category);
      }

      const snap = await query.get();
      for (const doc of snap.docs) {
        if (unique.has(doc.id)) continue;
        if (excludeUserId && doc.id === excludeUserId) continue;
        const data = doc.data();
        if (!data.latitude || !data.longitude) continue;
        if (data.isSuspended === true) continue;
        const distance = haversineDistanceKm(latitude, longitude, data.latitude, data.longitude);
        if (distance <= radiusKm) {
          unique.set(doc.id, { id: doc.id, data, distance });
        }
      }
      if (unique.size >= limit) break;
    }

    const results = Array.from(unique.values())
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map(r => ({ id: r.id, ...r.data, distanceKm: r.distance }));

    return results;
  } catch (error) {
    logger.error('findProfessionalsNearby error:', error);
    return [];
  }
}

module.exports = { findProfessionalsNearby, haversineDistanceKm };
