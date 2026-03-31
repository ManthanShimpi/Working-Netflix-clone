import axios from 'axios';

const API_KEY = '999fe20e59736d70bbb7d7a2ac12da01';

const api = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: {
    api_key: API_KEY,
  },
});

export default api;

export const requests = {
  fetchNetflixOriginals: '/discover/tv?with_networks=213',
  fetchTrending: '/trending/all/week',
  fetchTopRated: '/movie/top_rated',
  fetchActionMovies: '/discover/movie?with_genres=28',
  fetchComedyMovies: '/discover/movie?with_genres=35',
  fetchHorrorMovies: '/discover/movie?with_genres=27',
  fetchRomanceMovies: '/discover/movie?with_genres=10749',
  fetchDocumentaries: '/discover/movie?with_genres=99',
};

/**
 * Fetches the official "Clear Logo" for a movie or show.
 * Prioritizes English PNGs for the best transparency.
 */
export const fetchLogo = async (type, id) => {
  try {
    const res = await api.get(`/${type}/${id}/images?include_image_language=en,null`);
    const logos = res.data.logos || [];
    // Prefer English, then first available
    const logo = logos.find(l => l.iso_639_1 === 'en') || logos[0];
    return logo ? `https://image.tmdb.org/t/p/w500${logo.file_path}` : null;
  } catch (err) {
    console.error('Logo fetch error:', err);
    return null;
  }
};
