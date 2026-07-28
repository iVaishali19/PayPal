import { config } from 'dotenv';
import { join } from 'path';

// Load the repo-root .env into process.env before the app module is evaluated.
config({ path: join(__dirname, '..', '..', '..', '.env') });
config();
