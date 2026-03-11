import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configure nodemailer for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json();

    
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Save message to Supabase
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          name,
          email,
          message,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'mcoding543@gmail.com',
        subject: `New Message from ${name}`,
        html: `
          <h2>New Message Received</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
      });
    } catch (emailError) {
      console.log('Email sending failed (non-blocking):', emailError);
    }

    return NextResponse.json(
      { success: true, message: 'Message sent successfully!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
