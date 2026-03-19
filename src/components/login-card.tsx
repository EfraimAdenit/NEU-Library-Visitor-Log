'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import NeuLogo from './neu-logo';
import { Loader2 } from 'lucide-react';

export default function LoginCard() {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <NeuLogo className="h-16 w-16 text-primary" />
        <CardTitle className="font-headline text-2xl">NEU Library Visitor Log</CardTitle>
        <CardDescription>Sign in to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <Button variant="default" onClick={signInWithGoogle} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.5l-62.7 62.7c-27.8-26.4-65.2-42.9-110.2-42.9-84.3 0-152.3 68.2-152.3 152.5s68 152.5 152.3 152.5c98.2 0 130.4-67.4 134.8-103.9H248v-85.3h236.2c2.3 12.7 3.8 25.8 3.8 39.8z"></path>
              </svg>
            )}
            Sign in with Google
          </Button>
          <div className="text-center text-xs">
            <Link href="#" className="underline-offset-4 text-muted-foreground hover:underline" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
