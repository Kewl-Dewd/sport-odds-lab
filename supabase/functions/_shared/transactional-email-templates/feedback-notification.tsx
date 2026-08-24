/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface FeedbackNotificationProps {
  category?: string
  message?: string
  submittedAt?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Something isn't working",
  missing: 'Missing feature',
  suggestion: 'Suggestion',
  other: 'Other',
}

export const FeedbackNotification = ({
  category = 'other',
  message = 'No message provided.',
  submittedAt = '',
}: FeedbackNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New feedback from Sports Market Lab</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New anonymous feedback</Heading>
        <Text style={label}>Category</Text>
        <Text style={text}>{CATEGORY_LABELS[category] || category}</Text>
        <Hr style={hr} />
        <Text style={label}>Message</Text>
        <Text style={{ ...text, whiteSpace: 'pre-wrap' as const }}>{message}</Text>
        {submittedAt ? (
          <>
            <Hr style={hr} />
            <Text style={footer}>Submitted {submittedAt}</Text>
          </>
        ) : null}
        <Text style={footer}>
          Sent from Sports Market Lab. Feedback is anonymous — do not reply.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FeedbackNotification,
  subject: (data: Record<string, any>) =>
    `New feedback: ${CATEGORY_LABELS[data?.category] || 'Sports Market Lab'}`,
  displayName: 'Feedback notification',
  to: 'support@avasonsystems.com',
  previewData: {
    category: 'bug',
    message: 'The leaderboard did not refresh after settlement.',
    submittedAt: 'Aug 24, 2026',
  },
} satisfies TemplateEntry

export default FeedbackNotification

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#000000',
  margin: '0 0 20px',
}
const label = {
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: '#999999',
  margin: '0 0 4px',
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.5',
  margin: '0 0 20px',
}
const hr = { borderColor: '#eaeaea', margin: '16px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 0' }
