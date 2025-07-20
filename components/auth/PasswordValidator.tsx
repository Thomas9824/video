'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';

interface PasswordValidationRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
  severity: 'error' | 'warning';
}

interface PasswordValidatorProps {
  password: string;
  onValidationChange?: (isValid: boolean, score: number) => void;
  showStrengthMeter?: boolean;
  showRules?: boolean;
}

const VALIDATION_RULES: PasswordValidationRule[] = [
  {
    id: 'length',
    label: 'Au moins 12 caractères',
    test: (password) => password.length >= 12,
    severity: 'error'
  },
  {
    id: 'uppercase',
    label: 'Au moins une majuscule (A-Z)',
    test: (password) => /[A-Z]/.test(password),
    severity: 'error'
  },
  {
    id: 'lowercase',
    label: 'Au moins une minuscule (a-z)',
    test: (password) => /[a-z]/.test(password),
    severity: 'error'
  },
  {
    id: 'number',
    label: 'Au moins un chiffre (0-9)',
    test: (password) => /[0-9]/.test(password),
    severity: 'error'
  },
  {
    id: 'special',
    label: 'Au moins un caractère spécial (!@#$%^&*)',
    test: (password) => /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    severity: 'error'
  },
  {
    id: 'no-common',
    label: 'Pas de mots courants',
    test: (password) => {
      const forbidden = ['password', 'password123', '123456789', 'qwerty', 'admin', 'user'];
      return !forbidden.some(word => password.toLowerCase().includes(word.toLowerCase()));
    },
    severity: 'warning'
  },
  {
    id: 'no-repetition',
    label: 'Pas de caractères répétitifs',
    test: (password) => !/(.)\1{2,}/.test(password),
    severity: 'warning'
  }
];

export default function PasswordValidator({ 
  password, 
  onValidationChange, 
  showStrengthMeter = true, 
  showRules = true 
}: PasswordValidatorProps) {
  const [validationResults, setValidationResults] = useState<{[key: string]: boolean}>({});
  const [strength, setStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const results: {[key: string]: boolean} = {};
    let score = 0;
    let validRules = 0;

    VALIDATION_RULES.forEach(rule => {
      const isValid = rule.test(password);
      results[rule.id] = isValid;
      
      if (isValid) {
        validRules++;
        if (rule.severity === 'error') {
          score += 15;
        } else {
          score += 10;
        }
      }
    });

    // Bonus pour la longueur
    if (password.length > 16) score += 10;
    if (password.length > 20) score += 5;

    // Bonus pour la diversité des caractères
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.8) score += 10;

    const finalScore = Math.min(score, 100);
    const isValid = VALIDATION_RULES.filter(r => r.severity === 'error').every(r => results[r.id]);

    setValidationResults(results);
    setStrength(finalScore);
    
    if (onValidationChange) {
      onValidationChange(isValid, finalScore);
    }
  }, [password, onValidationChange]);

  const getStrengthColor = (score: number) => {
    if (score < 40) return 'bg-red-500';
    if (score < 70) return 'bg-orange-500';
    if (score < 90) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = (score: number) => {
    if (score < 40) return 'Très faible';
    if (score < 70) return 'Faible';
    if (score < 90) return 'Moyen';
    return 'Fort';
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      {/* Indicateur de force */}
      {showStrengthMeter && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Force du mot de passe
            </span>
            <span className={`text-sm font-medium ${
              strength < 40 ? 'text-red-600' :
              strength < 70 ? 'text-orange-600' :
              strength < 90 ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {getStrengthLabel(strength)} ({strength}%)
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strength)}`}
              style={{ width: `${strength}%` }}
            />
          </div>
        </div>
      )}

      {/* Règles de validation */}
      {showRules && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">
            Exigences du mot de passe
          </span>
          
          <div className="space-y-1">
            {VALIDATION_RULES.map(rule => {
              const isValid = validationResults[rule.id];
              const Icon = isValid ? CheckCircle : AlertTriangle;
              
              return (
                <div key={rule.id} className="flex items-center space-x-2">
                  <Icon className={`h-4 w-4 ${
                    isValid 
                      ? 'text-green-600' 
                      : rule.severity === 'error' 
                        ? 'text-red-600' 
                        : 'text-orange-600'
                  }`} />
                  <span className={`text-sm ${
                    isValid 
                      ? 'text-green-600' 
                      : rule.severity === 'error' 
                        ? 'text-red-600' 
                        : 'text-orange-600'
                  }`}>
                    {rule.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Composant d'input de mot de passe avec validation intégrée
interface SecurePasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, score: number) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  showStrengthMeter?: boolean;
  showRules?: boolean;
}

export function SecurePasswordInput({
  value,
  onChange,
  onValidationChange,
  placeholder = "Entrez un mot de passe sécurisé...",
  className = "",
  required = false,
  disabled = false,
  showStrengthMeter = true,
  showRules = true
}: SecurePasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full px-3 py-2 pr-10 border border-black focus:outline-none focus:border-[#FA9819] transition-colors ${className}`}
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-black transition-colors"
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
      
      <PasswordValidator
        password={value}
        onValidationChange={onValidationChange}
        showStrengthMeter={showStrengthMeter}
        showRules={showRules}
      />
    </div>
  );
}