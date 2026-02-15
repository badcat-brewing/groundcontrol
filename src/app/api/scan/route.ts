import { exec } from 'child_process';
import { NextResponse } from 'next/server';

export async function POST() {
  return new Promise<NextResponse>((resolve) => {
    exec('npm run scan', { cwd: process.cwd(), env: process.env }, (error, stdout, stderr) => {
      if (error) {
        resolve(NextResponse.json({ error: stderr || error.message }, { status: 500 }));
      } else {
        resolve(NextResponse.json({ output: stdout }));
      }
    });
  });
}
