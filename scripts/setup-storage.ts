import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { createServerSupabase } from '../lib/supabaseServer';

/**
 * Sets up the Supabase storage bucket for review screenshots
 */
async function setupStorage() {
  const supabase = createServerSupabase();

  try {
    console.log('Setting up Supabase storage for review screenshots...');

    // Create the storage bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('review-screenshots', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png'],
      fileSizeLimit: 5242880, // 5MB limit
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Storage bucket "review-screenshots" already exists');
      } else {
        console.error('❌ Error creating storage bucket:', bucketError);
        return false;
      }
    } else {
      console.log('✅ Storage bucket "review-screenshots" created successfully');
    }

    // Set up RLS policies for public read access
    console.log('Setting up public access policies...');

    // Note: The bucket is already set to public: true, so files should be publicly accessible
    // If you need more granular control, you can add RLS policies here

    console.log('✅ Storage setup completed successfully!');
    console.log('📷 Screenshots will be stored at: review-screenshots/screenshots/');

    return true;

  } catch (error) {
    console.error('❌ Error setting up storage:', error);
    return false;
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupStorage()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

export { setupStorage };