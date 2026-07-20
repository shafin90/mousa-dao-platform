const cityRepository = require('../repositories/city.repository');
const stationRepository = require('../repositories/station.repository');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Lists all cities for a company, optionally filtered by country/search.
 *
 * @param {string} companyId
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
const getAllCities = async (companyId, filters = {}) => {
  return await cityRepository.findAll(companyId, filters);
};

/**
 * Fetches a single city by ID within company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getCityById = async (id, companyId) => {
  return await cityRepository.findById(id, companyId);
};

/**
 * Creates a city.
 *
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createCity = async (companyId, data, userId) => {
  const dup = await cityRepository.findByNameAndCountry(companyId, data.name, data.country);
  if (dup) throw new AppError(`City "${data.name}" already exists in ${data.country}`, 409, ErrorCodes.CONFLICT);

  const cityData = { ...data, companyId, createdBy: userId };
  const city = await cityRepository.create(cityData);

  if (!city.location?.lat || !city.location?.lng) {
    await geocodeAndSave(city, companyId);
  }

  return city;
};

/**
 * Updates a city.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
const updateCity = async (id, companyId, data) => {
  return await cityRepository.updateOne(id, companyId, data);
};

/**
 * Deletes a city.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteCity = async (id, companyId) => {
  return await cityRepository.deleteOne(id, companyId);
};

const geocodeAndSave = async (city, companyId) => {
  try {
    const q = encodeURIComponent(`${city.name}, ${city.country}`);
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
      headers: { 'User-Agent': 'TransportAdmin/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    const json = await resp.json();
    if (json[0]) {
      const location = { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
      city.location = location;
      await cityRepository.updateOne(city._id, companyId, { location });
    }
  } catch {
    // geocoding failed silently
  }
};

const calculateDistance = async (fromId, toId, companyId) => {
  let fromCity = await cityRepository.findById(fromId, companyId);
  let toCity = await cityRepository.findById(toId, companyId);
  if (!fromCity || !toCity) throw new AppError('City not found', 404, ErrorCodes.NOT_FOUND);

  const allStations = await stationRepository.findAll(companyId);
  const fromIdStr = String(fromId);
  const toIdStr = String(toId);
  const fromStation = allStations.find((s) => {
    const cid = typeof s.cityId === 'string' ? s.cityId : String(s.cityId?._id ?? '');
    return cid === fromIdStr;
  });
  const toStation = allStations.find((s) => {
    const cid = typeof s.cityId === 'string' ? s.cityId : String(s.cityId?._id ?? '');
    return cid === toIdStr;
  });

  let lat1, lon1, lat2, lon2;

  if (fromStation && toStation) {
    lat1 = fromStation.location.lat;
    lon1 = fromStation.location.lng;
    lat2 = toStation.location.lat;
    lon2 = toStation.location.lng;
  } else {
    if (fromCity.location?.lat == null || fromCity.location?.lng == null) {
      fromCity = await geocodeCity(fromCity._id, companyId);
    }
    if (toCity.location?.lat == null || toCity.location?.lng == null) {
      toCity = await geocodeCity(toCity._id, companyId);
    }
    if (fromCity.location?.lat != null && fromCity.location?.lng != null && toCity.location?.lat != null && toCity.location?.lng != null) {
      lat1 = fromCity.location.lat;
      lon1 = fromCity.location.lng;
      lat2 = toCity.location.lat;
      lon2 = toCity.location.lng;
    } else {
      throw new AppError('No stations or city coordinates found for one or both cities.', 400, ErrorCodes.VALIDATION_ERROR);
    }
  }

  const distanceKm = Math.round(haversineKm(lat1, lon1, lat2, lon2));
  const estimatedTimeMinutes = Math.round((distanceKm / 45) * 60);

  return { distanceKm, estimatedTimeMinutes };
};

const geocodeCity = async (id, companyId) => {
  const city = await cityRepository.findById(id, companyId);
  if (!city) throw new AppError('City not found', 404, ErrorCodes.NOT_FOUND);
  if (city.location?.lat != null && city.location?.lng != null) return city;

  try {
    const q = encodeURIComponent(`${city.name}, ${city.country}`);
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
      headers: { 'User-Agent': 'TransportAdmin/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    const json = await resp.json();
    if (json[0]) {
      city.location = { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
      return await cityRepository.updateOne(id, companyId, { location: city.location });
    }
    throw new AppError('Could not geocode city', 400, ErrorCodes.VALIDATION_ERROR);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Geocoding service unavailable', 502, ErrorCodes.EXTERNAL_SERVICE_ERROR);
  }
};

module.exports = { getAllCities, getCityById, createCity, updateCity, deleteCity, calculateDistance, geocodeCity };
