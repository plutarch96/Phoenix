// Environment variable validation utility
// Ensures critical environment variables are set before server starts

const requiredEnvVars = [
  {
    name: 'JWT_SECRET',
    description: 'Secret key for JWT token signing',
    validate: (value) => value && value !== 'your-secret-key-change-this' && value.length >= 32,
    errorMsg: 'JWT_SECRET must be set to a strong random string (min 32 characters) in production'
  },
  {
    name: 'NODE_ENV',
    description: 'Node environment (development/production)',
    validate: (value) => ['development', 'production', 'test'].includes(value),
    errorMsg: 'NODE_ENV must be one of: development, production, test',
    required: false // Optional, defaults to development
  }
];

const optionalEnvVars = [
  { name: 'PORT', default: 5000 },
  { name: 'JWT_EXPIRES_IN', default: '7d' },
  { name: 'CORS_ORIGINS', default: 'http://localhost:3000' },
  { name: 'MAX_FILE_SIZE', default: '524288000' },
  { name: 'RATE_LIMIT_WINDOW_MS', default: '900000' },
  { name: 'RATE_LIMIT_MAX_REQUESTS', default: '100' }
];

function validateEnvironment() {
  const errors = [];
  const warnings = [];
  const isProduction = process.env.NODE_ENV === 'production';

  console.log('\n🔍 Validating environment variables...\n');

  // Check required variables
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name];

    if (!value && envVar.required !== false) {
      errors.push(`❌ ${envVar.name} is required but not set. ${envVar.description}`);
    } else if (value && envVar.validate && !envVar.validate(value)) {
      if (isProduction) {
        errors.push(`❌ ${envVar.errorMsg}`);
      } else {
        warnings.push(`⚠️  ${envVar.errorMsg} (development mode - allowed for now)`);
      }
    } else if (value) {
      console.log(`✓ ${envVar.name} is set`);
    }
  }

  // Set defaults for optional variables
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar.name]) {
      process.env[envVar.name] = String(envVar.default);
      console.log(`ℹ ${envVar.name} not set, using default: ${envVar.default}`);
    } else {
      console.log(`✓ ${envVar.name} is set`);
    }
  }

  // Production-specific checks
  if (isProduction) {
    console.log('\n🔒 Production mode - running additional security checks...\n');

    // Warn if using default admin password
    if (process.env.DEFAULT_ADMIN_PASSWORD &&
        process.env.DEFAULT_ADMIN_PASSWORD === 'changeme123') {
      errors.push('❌ DEFAULT_ADMIN_PASSWORD must not be "changeme123" in production');
    }

    // Warn about CORS
    if (process.env.CORS_ORIGINS && process.env.CORS_ORIGINS.includes('localhost')) {
      warnings.push('⚠️  CORS_ORIGINS includes localhost in production - update to your domain');
    }

    // Check database path is set
    if (!process.env.DB_PATH) {
      warnings.push('⚠️  DB_PATH not set - using default location');
    }
  }

  // Print warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    warnings.forEach(warn => console.log(warn));
  }

  // Print errors and exit if any
  if (errors.length > 0) {
    console.log('\n🚨 FATAL ERRORS:\n');
    errors.forEach(err => console.log(err));
    console.log('\n💡 Fix these issues and restart the server.\n');
    process.exit(1);
  }

  console.log('\n✅ Environment validation passed!\n');
}

module.exports = { validateEnvironment };
