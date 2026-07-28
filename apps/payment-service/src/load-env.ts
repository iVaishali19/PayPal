import { config } from 'dotenv';
import { join } from 'path';

// Load the repo-root .env into process.env BEFORE the app module is evaluated
// (SequelizeModule.forRoot reads process.env at module-definition time).
// From src/ (ts-node) or dist/ (compiled) the root is three levels up.
config({ path: join(__dirname, '..', '..', '..', '.env') });
// Also try current working directory as a fallback.
config();
