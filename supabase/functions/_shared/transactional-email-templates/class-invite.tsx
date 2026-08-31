/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface ClassInviteProps {
  className?: string
  instructorName?: string
  joinCode?: string
  inviteUrl?: string
}

export const ClassInvite = ({
  className = 'your class',
  instructorName = 'Your instructor',
  joinCode = '------',
  inviteUrl = 'https://sportsmarketlab.com/join',
}: ClassInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're invited to {className} on Sports Market Lab</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You&apos;re invited to {className}</Heading>
        <Text style={text}>
          {instructorName} invited you to join <strong>{className}</strong> on Sports Market Lab —
          a classroom sportsbook simulation using real market odds.
        </Text>
        <Button style={button} href={inviteUrl}>Join the class</Button>
        <Text style={text}>
          Or sign in and enter this course code:
        </Text>
        <Text style={code}>{joinCode}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          Sports Market Lab · No real money is wagered. If you weren&apos;t expecting this
          invitation you can ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

const main = { backgroundColor: '#f6f7f9', fontFamily: 'system-ui, -apple-system, sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '32px', maxWidth: '560px', borderRadius: '12px' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#334155' }
const button = { backgroundColor: '#15803d', color: '#ffffff', padding: '12px 22px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', display: 'inline-block', margin: '12px 0' }
const code = { fontSize: '28px', fontWeight: 700, letterSpacing: '8px', fontFamily: 'monospace', color: '#0f172a', margin: '4px 0 16px' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#64748b', lineHeight: '18px' }

export const template: TemplateEntry = {
  component: ClassInvite,
  subject: (data) => `You're invited to ${data.className ?? 'a class'} on Sports Market Lab`,
  displayName: 'Class invitation',
  previewData: {
    className: 'SPMT 340 — Fall 2026',
    instructorName: 'Kurt Spady',
    joinCode: 'K7XQ2M',
    inviteUrl: 'https://sportsmarketlab.com/join/K7XQ2M',
  },
}

export default ClassInvite
