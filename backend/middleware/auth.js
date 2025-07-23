// backend/middleware/auth.js

import { auth } from '../server.js'; // Importuj instancję auth z server.js

/**
 * Middleware do weryfikacji tokena Firebase ID.
 * Sprawdza nagłówek Authorization i dekoduje token JWT.
 * Dodaje zdekodowany token (req.user) do obiektu request.
 */
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Sprawdź, czy nagłówek Authorization istnieje i ma poprawny format Bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Błąd autoryzacji: Brak tokena lub nieprawidłowy format.');
    return res.status(401).json({ error: 'Brak tokena uwierzytelniającego lub nieprawidłowy format.' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Weryfikuj token ID za pomocą Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken; // Dodaj zdekodowany token do obiektu request
    next(); // Przejdź do następnego middleware/handlera
  } catch (error) {
    console.error('Błąd weryfikacji tokena Firebase:', error.message);
    // Zwróć błąd, jeśli token jest nieprawidłowy lub wygasły
    return res.status(401).json({ error: 'Nieprawidłowy lub wygasły token uwierzytelniający.' });
  }
};

export default verifyFirebaseToken;
