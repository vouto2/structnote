import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function IndexPage() {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();

  console.log('IndexPage: Session:', session); // Add this log

  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
