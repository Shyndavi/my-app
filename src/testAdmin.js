```js
import { supabase } from './supabaseClient';

let lastCheckedUserId = null;

async function testAdminAccess(session) {
  const user = session?.user;

  if (!user) {
    console.log('No signed-in user. Please sign in first.');
    lastCheckedUserId = null;
    return;
  }

  // Avoid running the same check repeatedly for the same user.
  if (lastCheckedUserId === user.id) {
    return;
  }

  lastCheckedUserId = user.id;

  console.log('Signed-in email:', user.email);

  const { data, error } = await supabase.rpc('is_app_admin');

  if (error) {
    console.error('Admin check failed:', error.message);
    lastCheckedUserId = null;
    return;
  }

  if (data === true) {
    console.log('Is admin: true');
    console.log('Admin access verified.');
  } else {
    console.log('Is admin: false');
    console.log('This account does not currently have admin access.');
  }
}

async function initializeAdminTest() {
  // Check whether a session already exists.
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Unable to retrieve session:', error.message);
  } else {
    await testAdminAccess(data.session);
  }

  // Check again whenever authentication changes.
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      // Defer the RPC call to avoid doing additional Supabase work
      // directly inside the auth-state callback.
      setTimeout(() => {
        testAdminAccess(session);
      }, 0);
    } else if (event === 'SIGNED_OUT') {
      lastCheckedUserId = null;
      console.log('Signed out.');
    }
  });

  // Clean up the listener when the page is closed or reloaded.
  window.addEventListener(
    'beforeunload',
    () => subscription.unsubscribe(),
    { once: true }
  );
}

initializeAdminTest();
```