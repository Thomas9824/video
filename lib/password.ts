import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Configuration sécurisée pour bcrypt
const BCRYPT_ROUNDS = 12; // Recommandé par OWASP pour 2024+

// Politique de mot de passe sécurisée selon OWASP
export const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  forbiddenPasswords: [
    'password', 'password123', '123456789', 'qwerty', 'admin', 'user',
    'dublin', 'thomas', 'mionnet', 'video', 'vlog'
  ]
};

/**
 * Valide un mot de passe selon les politiques de sécurité
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Vérification de la longueur
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Le mot de passe doit contenir au moins ${PASSWORD_POLICY.minLength} caractères`);
  }
  
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Le mot de passe ne peut pas dépasser ${PASSWORD_POLICY.maxLength} caractères`);
  }

  // Vérification des caractères
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }

  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }

  if (PASSWORD_POLICY.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  if (PASSWORD_POLICY.requireSpecialChars && !new RegExp(`[${PASSWORD_POLICY.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }

  // Vérification des mots de passe interdits
  const lowerPassword = password.toLowerCase();
  for (const forbidden of PASSWORD_POLICY.forbiddenPasswords) {
    if (lowerPassword.includes(forbidden.toLowerCase())) {
      errors.push('Le mot de passe ne peut pas contenir de mots courants');
      break;
    }
  }

  // Vérification des patterns répétitifs
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Le mot de passe ne peut pas contenir plus de 2 caractères identiques consécutifs');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Hache un mot de passe de manière sécurisée
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Validation du mot de passe avant hachage
    const validation = validatePassword(password);
    if (!validation.isValid) {
      throw new Error(`Mot de passe invalide: ${validation.errors.join(', ')}`);
    }

    // Génération du salt et hachage
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    return hashedPassword;
  } catch (error) {
    throw new Error(`Erreur lors du hachage du mot de passe: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Vérifie un mot de passe contre son hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Erreur lors de la vérification du mot de passe:', error);
    return false;
  }
}

/**
 * Génère un mot de passe temporaire sécurisé
 */
export function generateTemporaryPassword(): string {
  const length = 16;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  let password = '';
  
  // Assurer au moins un caractère de chaque type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Compléter avec des caractères aléatoires
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mélanger les caractères pour éviter les patterns prévisibles
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Génère un token sécurisé pour la réinitialisation de mot de passe
 */
export function generatePasswordResetToken(): {
  token: string;
  hashedToken: string;
  expiresAt: Date;
} {
  // Générer un token aléatoire de 32 bytes
  const token = crypto.randomBytes(32).toString('hex');
  
  // Hacher le token pour le stockage en base
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  // Token valide pendant 1 heure
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  
  return {
    token, // Token en clair à envoyer à l'utilisateur
    hashedToken, // Token haché à stocker en base
    expiresAt
  };
}

/**
 * Vérifie un token de réinitialisation
 */
export function verifyPasswordResetToken(token: string, hashedToken: string): boolean {
  try {
    const computedHash = crypto.createHash('sha256').update(token).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hashedToken));
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return false;
  }
}

/**
 * Évalue la force d'un mot de passe (0-100)
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];
  
  // Longueur
  if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 15;
  else feedback.push('Augmentez la longueur');
  
  // Complexité des caractères
  if (/[a-z]/.test(password)) score += 15;
  else feedback.push('Ajoutez des minuscules');
  
  if (/[A-Z]/.test(password)) score += 15;
  else feedback.push('Ajoutez des majuscules');
  
  if (/[0-9]/.test(password)) score += 15;
  else feedback.push('Ajoutez des chiffres');
  
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  else feedback.push('Ajoutez des caractères spéciaux');
  
  // Diversité
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.8) score += 10;
  else if (uniqueChars >= password.length * 0.6) score += 5;
  else feedback.push('Variez plus les caractères');
  
  return { score: Math.min(score, 100), feedback };
}